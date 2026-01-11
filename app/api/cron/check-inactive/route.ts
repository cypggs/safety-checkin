import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import CryptoJS from 'crypto-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const resendApiKey = process.env.RESEND_API_KEY;
const cronSecret = process.env.CRON_SECRET;
const encryptionKey = process.env.NEXT_PUBLIC_ENCRYPTION_KEY || 'safety-checkin-default-key';

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const resend = resendApiKey ? new Resend(resendApiKey) : null;

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret if set
    const authHeader = request.headers.get('authorization');
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Find users who haven't checked in for 2+ days
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

    const { data: inactiveUsers, error: usersError } = await supabase
      .from('safety_users')
      .select('*')
      .or(`last_checkin_at.is.null,last_checkin_at.lt.${twoDaysAgo.toISOString()}`);

    if (usersError) {
      console.error('Error fetching inactive users:', usersError);
      return NextResponse.json(
        { error: 'Failed to fetch inactive users' },
        { status: 500 }
      );
    }

    if (!inactiveUsers || inactiveUsers.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No inactive users found',
        alertsSent: 0,
      });
    }

    // Check for users who haven't been alerted in the last 24 hours
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);

    const alertsToSend = [];

    for (const user of inactiveUsers) {
      // Check if alert already sent recently
      const { data: recentAlerts } = await supabase
        .from('safety_alerts')
        .select('*')
        .eq('user_id', user.id)
        .gte('sent_at', oneDayAgo.toISOString())
        .limit(1);

      if (recentAlerts && recentAlerts.length > 0) {
        // Already alerted recently, skip
        continue;
      }

      alertsToSend.push(user);
    }

    if (alertsToSend.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No new alerts to send',
        alertsSent: 0,
      });
    }

    // Send alerts
    const results = await Promise.allSettled(
      alertsToSend.map(user => sendAlert(user))
    );

    const successCount = results.filter(r => r.status === 'fulfilled').length;

    return NextResponse.json({
      success: true,
      message: `Sent ${successCount} alerts out of ${alertsToSend.length} inactive users`,
      alertsSent: successCount,
      totalInactive: inactiveUsers.length,
    });
  } catch (error) {
    console.error('Cron job error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function sendAlert(user: any) {
  try {
    // Decrypt emergency email and user name
    const emergencyEmail = CryptoJS.AES.decrypt(user.emergency_email, encryptionKey).toString(CryptoJS.enc.Utf8);
    const userName = CryptoJS.AES.decrypt(user.name, encryptionKey).toString(CryptoJS.enc.Utf8);
    const lastCheckin = user.last_checkin_at
      ? new Date(user.last_checkin_at).toLocaleString(user.language === 'zh' ? 'zh-CN' : 'en-US')
      : user.language === 'zh' ? '从未签到' : 'Never checked in';

    // Email content based on language
    const emailContent = user.language === 'zh'
      ? {
          subject: `安全提醒：${userName}已连续2天未签到`,
          html: `
            <h2>安全提醒</h2>
            <p>您好，</p>
            <p><strong>${userName}</strong> 在"平安签到"应用中已连续2天未进行安全签到。</p>
            <p><strong>最后签到时间：</strong>${lastCheckin}</p>
            <p>建议您联系 ${userName} 确认其安全状况。</p>
            <hr />
            <p style="color: #666; font-size: 0.9em;">此邮件由"平安签到"安全监测系统自动发送。</p>
          `,
        }
      : {
          subject: `Safety Alert: ${userName} hasn't checked in for 2 days`,
          html: `
            <h2>Safety Alert</h2>
            <p>Hello,</p>
            <p><strong>${userName}</strong> hasn't checked in on the "Safety Check-in" app for 2 consecutive days.</p>
            <p><strong>Last check-in:</strong> ${lastCheckin}</p>
            <p>We recommend contacting ${userName} to confirm they are safe.</p>
            <hr />
            <p style="color: #666; font-size: 0.9em;">This email was sent automatically by the Safety Check-in monitoring system.</p>
          `,
        };

    let delivered = false;
    let errorMessage = null;

    // Send email via Resend if configured
    if (resend) {
      try {
        await resend.emails.send({
          from: 'Safety Check-in <onboarding@resend.dev>', // Use Resend's verified test address
          to: emergencyEmail,
          subject: emailContent.subject,
          html: emailContent.html,
        });
        delivered = true;
      } catch (emailError: any) {
        console.error('Error sending email via Resend:', emailError);
        errorMessage = emailError.message;
      }
    } else {
      // Log email content (for development/testing)
      console.log('Email would be sent:', emailContent);
      console.log('To:', emergencyEmail);
      errorMessage = 'Resend API key not configured';
    }

    // Record alert in database (store decrypted email for audit)
    await supabase.from('safety_alerts').insert({
      user_id: user.id,
      method: 'email',
      delivered,
      recipient_email: emergencyEmail,
      error_message: errorMessage,
    });

    return { success: delivered, userId: user.id };
  } catch (error: any) {
    console.error('Error in sendAlert:', error);
    throw error;
  }
}
