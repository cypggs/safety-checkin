import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function POST(request: NextRequest) {
  try {
    const { deviceFingerprint } = await request.json();

    if (!deviceFingerprint) {
      return NextResponse.json(
        { error: 'Device fingerprint is required' },
        { status: 400 }
      );
    }

    // First, get the user
    const { data: user, error: userError } = await supabase
      .from('safety_users')
      .select('*')
      .eq('device_fingerprint', deviceFingerprint)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Create a check-in record
    const { data: checkin, error: checkinError } = await supabase
      .from('safety_checkins')
      .insert({
        user_id: user.id,
        user_agent: request.headers.get('user-agent'),
        ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
      })
      .select()
      .single();

    if (checkinError) {
      console.error('Error creating check-in:', checkinError);
      return NextResponse.json(
        { error: 'Failed to create check-in' },
        { status: 500 }
      );
    }

    // Update user's last_checkin_at and calculate streak
    const now = new Date();
    const lastCheckin = user.last_checkin_at ? new Date(user.last_checkin_at) : null;

    let newStreak = user.checkin_streak || 0;

    if (lastCheckin) {
      const diffDays = Math.floor(
        (now.getTime() - lastCheckin.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (diffDays === 0) {
        // Same day check-in, keep streak
        newStreak = user.checkin_streak;
      } else if (diffDays === 1) {
        // Consecutive day check-in, increment streak
        newStreak = user.checkin_streak + 1;
      } else {
        // Streak broken, reset to 1
        newStreak = 1;
      }
    } else {
      // First check-in
      newStreak = 1;
    }

    // Update user
    const { error: updateError } = await supabase
      .from('safety_users')
      .update({
        last_checkin_at: now.toISOString(),
        checkin_streak: newStreak,
        updated_at: now.toISOString(),
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('Error updating user after check-in:', updateError);
      // Don't fail the check-in if update fails
    }

    return NextResponse.json({
      success: true,
      checkin,
      streak: newStreak,
    });
  } catch (error) {
    console.error('Check-in error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Get check-in history for a user
export async function GET(request: NextRequest) {
  try {
    const deviceFingerprint = request.nextUrl.searchParams.get('deviceFingerprint');
    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '30');

    if (!deviceFingerprint) {
      return NextResponse.json(
        { error: 'Device fingerprint is required' },
        { status: 400 }
      );
    }

    // Get the user
    const { data: user, error: userError } = await supabase
      .from('safety_users')
      .select('id')
      .eq('device_fingerprint', deviceFingerprint)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get check-in history
    const { data: checkins, error: checkinsError } = await supabase
      .from('safety_checkins')
      .select('*')
      .eq('user_id', user.id)
      .order('checked_in_at', { ascending: false })
      .limit(limit);

    if (checkinsError) {
      console.error('Error fetching check-ins:', checkinsError);
      return NextResponse.json(
        { error: 'Failed to fetch check-ins' },
        { status: 500 }
      );
    }

    return NextResponse.json({ checkins });
  } catch (error) {
    console.error('Check-in history error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
