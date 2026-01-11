import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function GET(request: NextRequest) {
  try {
    const deviceFingerprint = request.nextUrl.searchParams.get('deviceFingerprint');

    if (!deviceFingerprint) {
      return NextResponse.json(
        { error: 'Device fingerprint is required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('device_fingerprint', deviceFingerprint)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No user found
        return NextResponse.json({ user: null });
      }
      console.error('Error fetching user:', error);
      return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 });
    }

    return NextResponse.json({ user: data });
  } catch (error) {
    console.error('User fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { deviceFingerprint, name, emergencyEmail, language } = await request.json();

    if (!deviceFingerprint) {
      return NextResponse.json(
        { error: 'Device fingerprint is required' },
        { status: 400 }
      );
    }

    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (name !== undefined) updateData.name = name;
    if (emergencyEmail !== undefined) updateData.emergency_email = emergencyEmail;
    if (language !== undefined) updateData.language = language;

    const { data, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('device_fingerprint', deviceFingerprint)
      .select()
      .single();

    if (error) {
      console.error('Error updating user:', error);
      return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
    }

    return NextResponse.json({ user: data });
  } catch (error) {
    console.error('User update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const deviceFingerprint = request.nextUrl.searchParams.get('deviceFingerprint');

    if (!deviceFingerprint) {
      return NextResponse.json(
        { error: 'Device fingerprint is required' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('users')
      .delete()
      .eq('device_fingerprint', deviceFingerprint);

    if (error) {
      console.error('Error deleting user:', error);
      return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('User delete error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
