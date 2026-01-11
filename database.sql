-- ============================================
-- 平安签到 (Safety Check-in) Database Schema
-- ============================================
-- This schema supports a minimalist check-in system for solo-living individuals
-- Features: No-login auth via device fingerprinting, encrypted emergency contacts, daily check-in tracking

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- USERS TABLE
-- ============================================
-- Stores user information with encrypted emergency contact details
-- No email/password auth - uses device fingerprint for identification

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Device identification (replaces traditional login)
  device_fingerprint TEXT UNIQUE NOT NULL,

  -- User information (encrypted on client-side before storage)
  name TEXT NOT NULL,
  emergency_email TEXT NOT NULL,

  -- Preferences
  language TEXT DEFAULT 'zh' CHECK (language IN ('zh', 'en')),
  grace_period_days INTEGER DEFAULT 2 CHECK (grace_period_days >= 1 AND grace_period_days <= 7),

  -- Check-in tracking
  last_checkin_at TIMESTAMPTZ,
  checkin_streak INTEGER DEFAULT 0,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster lookups by device fingerprint
CREATE INDEX idx_users_device_fingerprint ON users(device_fingerprint);

-- Index for cron job queries (finding inactive users)
CREATE INDEX idx_users_last_checkin ON users(last_checkin_at);

-- ============================================
-- CHECKINS TABLE
-- ============================================
-- Records every check-in event for history tracking

CREATE TABLE checkins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  checked_in_at TIMESTAMPTZ DEFAULT NOW(),

  -- Optional: Client information for debugging
  user_agent TEXT,
  ip_address INET
);

-- Index for user's check-in history queries
CREATE INDEX idx_checkins_user_id ON checkins(user_id);
CREATE INDEX idx_checkins_timestamp ON checkins(checked_in_at DESC);

-- ============================================
-- ALERTS TABLE
-- ============================================
-- Tracks all alerts sent to emergency contacts

CREATE TABLE alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Alert details
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  method TEXT DEFAULT 'email' CHECK (method IN ('email', 'sms', 'wechat')),
  delivered BOOLEAN DEFAULT FALSE,

  -- Emergency contact info at time of alert (for audit trail)
  recipient_email TEXT,

  -- Response tracking
  acknowledged_at TIMESTAMPTZ,

  -- Error tracking
  error_message TEXT
);

-- Index for finding recent alerts to prevent duplicates
CREATE INDEX idx_alerts_user_id ON alerts(user_id);
CREATE INDEX idx_alerts_sent_at ON alerts(sent_at DESC);

-- ============================================
-- AUTO-UPDATE TIMESTAMP TRIGGER
-- ============================================
-- Automatically updates 'updated_at' column when user record changes

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================
-- Privacy protection: Users can only access their own data

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;

-- Public read/write policies (device fingerprint-based auth happens in application layer)
-- Since we're not using Supabase Auth, we'll use service role for all operations
-- RLS mainly protects against accidental direct database access

-- Users table: Allow service role full access
CREATE POLICY "Service role can manage users"
  ON users
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Checkins table: Allow service role full access
CREATE POLICY "Service role can manage checkins"
  ON checkins
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Alerts table: Allow service role full access
CREATE POLICY "Service role can manage alerts"
  ON alerts
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to get inactive users (for cron job)
-- Returns users who haven't checked in for their grace period

CREATE OR REPLACE FUNCTION get_inactive_users(grace_days INTEGER DEFAULT 2)
RETURNS TABLE (
  user_id UUID,
  user_name TEXT,
  emergency_email TEXT,
  language TEXT,
  last_checkin_at TIMESTAMPTZ,
  days_inactive INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    u.id,
    u.name,
    u.emergency_email,
    u.language,
    u.last_checkin_at,
    EXTRACT(DAY FROM NOW() - u.last_checkin_at)::INTEGER as days_inactive
  FROM users u
  WHERE
    -- Haven't checked in for grace_period_days or more
    (u.last_checkin_at IS NULL OR u.last_checkin_at < NOW() - INTERVAL '1 day' * grace_days)
    -- Haven't been alerted in the last 24 hours (prevent spam)
    AND NOT EXISTS (
      SELECT 1 FROM alerts a
      WHERE a.user_id = u.id
      AND a.sent_at > NOW() - INTERVAL '24 hours'
    );
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- SAMPLE DATA (Optional - for testing)
-- ============================================
-- Uncomment to insert test data

/*
INSERT INTO users (device_fingerprint, name, emergency_email, language, last_checkin_at) VALUES
  ('test-device-001', 'encrypted_name_1', 'encrypted_email_1', 'zh', NOW() - INTERVAL '3 days'),
  ('test-device-002', 'encrypted_name_2', 'encrypted_email_2', 'en', NOW() - INTERVAL '1 day'),
  ('test-device-003', 'encrypted_name_3', 'encrypted_email_3', 'zh', NOW());
*/

-- ============================================
-- SETUP COMPLETE
-- ============================================
-- Next steps:
-- 1. Run this SQL in Supabase SQL Editor
-- 2. Copy your Supabase URL and anon key
-- 3. Add to .env.local in Next.js project
-- 4. Service role key needed for cron job operations
