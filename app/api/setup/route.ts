import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function POST(request: NextRequest) {
  try {
    const { deviceFingerprint, name, emergencyEmail, language } = await request.json();

    if (!deviceFingerprint || !name || !emergencyEmail) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if user already exists with this device fingerprint
    const { data: existingUser } = await supabase
      .from('users')
      .select('*')
      .eq('device_fingerprint', deviceFingerprint)
      .single();

    if (existingUser) {
      // Update existing user
      const { data, error } = await supabase
        .from('users')
        .update({
          name,
          emergency_email: emergencyEmail,
          language: language || 'zh',
          updated_at: new Date().toISOString(),
        })
        .eq('device_fingerprint', deviceFingerprint)
        .select()
        .single();

      if (error) {
        console.error('Error updating user:', error);
        return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
      }

      return NextResponse.json({ user: data });
    }

    // Create new user
    const { data, error } = await supabase
      .from('users')
      .insert({
        device_fingerprint: deviceFingerprint,
        name,
        emergency_email: emergencyEmail,
        language: language || 'zh',
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating user:', error);
      return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
    }

    return NextResponse.json({ user: data });
  } catch (error) {
    console.error('Setup error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
