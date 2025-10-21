-- ============================================================================
-- Food Establishment Permit Application System - Database Schema
-- ============================================================================
--
-- This schema supports the POC for a voice-driven permit application system
-- with synchronized mobile UI.
--
-- Key Features:
-- - Sessions: Track voice+mobile synchronized sessions
-- - Applications: Store permit application data
-- - Support for multiple submission channels (web, voice, voice+mobile)
--
-- Database: PostgreSQL (Vercel Postgres / Neon)
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Drop tables if they exist (for development/reset)
DROP TABLE IF EXISTS applications CASCADE;
DROP TABLE IF EXISTS sessions CASCADE;

-- ============================================================================
-- SESSIONS TABLE
-- ============================================================================
--
-- Stores real-time session data for voice + mobile UI synchronization
-- Each session represents a single application interaction
--
CREATE TABLE sessions (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,

  -- Session Data
  phone_number VARCHAR(20), -- Phone number that called in (optional)
  status VARCHAR(20) NOT NULL DEFAULT 'active', -- active, completed, abandoned
  channel_name VARCHAR(100) NOT NULL, -- Ably channel name for real-time sync

  -- Constraints
  CONSTRAINT sessions_status_check CHECK (status IN ('active', 'completed', 'abandoned'))
);

-- Indexes for sessions
CREATE INDEX idx_sessions_status ON sessions(status);
CREATE INDEX idx_sessions_created_at ON sessions(created_at DESC);
CREATE INDEX idx_sessions_channel_name ON sessions(channel_name);

-- ============================================================================
-- APPLICATIONS TABLE
-- ============================================================================
--
-- Stores permit application submissions
-- Links to sessions if submitted via voice+mobile
--
CREATE TABLE applications (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Tracking and References
  tracking_id VARCHAR(20) UNIQUE NOT NULL, -- Human-readable tracking ID (APP-20251020-XXXX)
  session_id UUID REFERENCES sessions(id) ON DELETE SET NULL, -- Optional: link to session

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  submitted_at TIMESTAMP WITH TIME ZONE, -- When application was finalized
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,

  -- ========================================
  -- Establishment Information
  -- ========================================
  establishment_name VARCHAR(255) NOT NULL,
  street_address TEXT NOT NULL,
  establishment_phone VARCHAR(20) NOT NULL, -- Cleaned format (digits only)
  establishment_email VARCHAR(255) NOT NULL,

  -- ========================================
  -- Owner Information
  -- ========================================
  owner_name VARCHAR(255) NOT NULL,
  owner_phone VARCHAR(20) NOT NULL, -- Cleaned format (digits only)
  owner_email VARCHAR(255) NOT NULL,

  -- ========================================
  -- Operating Information
  -- ========================================
  establishment_type VARCHAR(100) NOT NULL, -- Restaurant, Food Truck, Catering, etc.
  planned_opening_date DATE NOT NULL,

  -- ========================================
  -- Metadata
  -- ========================================
  submission_channel VARCHAR(20) NOT NULL DEFAULT 'web', -- web, voice, voice_mobile
  raw_data JSONB, -- Store full conversation/form data for analysis

  -- Constraints
  CONSTRAINT applications_submission_channel_check
    CHECK (submission_channel IN ('web', 'voice', 'voice_mobile')),
  CONSTRAINT applications_establishment_type_check
    CHECK (establishment_type IN ('Restaurant', 'Food Truck', 'Catering', 'Bakery', 'Cafe', 'Bar', 'Food Cart', 'Other'))
);

-- Indexes for applications
CREATE INDEX idx_applications_tracking_id ON applications(tracking_id);
CREATE INDEX idx_applications_session_id ON applications(session_id);
CREATE INDEX idx_applications_created_at ON applications(created_at DESC);
CREATE INDEX idx_applications_submitted_at ON applications(submitted_at DESC);
CREATE INDEX idx_applications_submission_channel ON applications(submission_channel);
CREATE INDEX idx_applications_establishment_name ON applications(establishment_name);
CREATE INDEX idx_applications_establishment_email ON applications(establishment_email);

-- Full-text search index for establishment names (for admin search)
CREATE INDEX idx_applications_establishment_name_trgm
  ON applications USING gin(establishment_name gin_trgm_ops);

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function to update updated_at timestamp automatically
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_sessions_updated_at
  BEFORE UPDATE ON sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_applications_updated_at
  BEFORE UPDATE ON applications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- COMMENTS (Documentation)
-- ============================================================================

COMMENT ON TABLE sessions IS 'Tracks voice + mobile UI synchronized sessions for real-time form updates';
COMMENT ON TABLE applications IS 'Stores food establishment permit applications';

COMMENT ON COLUMN sessions.channel_name IS 'Ably channel name used for real-time synchronization';
COMMENT ON COLUMN sessions.status IS 'Session lifecycle: active (in progress), completed (application submitted), abandoned (user left)';

COMMENT ON COLUMN applications.tracking_id IS 'Human-readable tracking ID shown to users (e.g., APP-20251020-A3F9)';
COMMENT ON COLUMN applications.session_id IS 'Optional link to session if submitted via voice+mobile channel';
COMMENT ON COLUMN applications.submission_channel IS 'How the application was submitted: web (form only), voice (phone only), voice_mobile (phone + mobile UI)';
COMMENT ON COLUMN applications.raw_data IS 'JSONB field storing full conversation transcript or form interaction data for Braintrust analysis';

-- ============================================================================
-- SAMPLE DATA (for development/testing)
-- ============================================================================

-- Uncomment below to insert sample data for testing

/*
-- Sample Session
INSERT INTO sessions (id, phone_number, status, channel_name) VALUES
  ('550e8400-e29b-41d4-a716-446655440000', '5095551234', 'completed', 'session:550e8400-e29b-41d4-a716-446655440000');

-- Sample Applications
INSERT INTO applications (
  tracking_id,
  session_id,
  establishment_name,
  street_address,
  establishment_phone,
  establishment_email,
  owner_name,
  owner_phone,
  owner_email,
  establishment_type,
  planned_opening_date,
  submission_channel,
  submitted_at
) VALUES
  (
    'APP-20251020-A3F9',
    '550e8400-e29b-41d4-a716-446655440000',
    'Joe''s Pizza',
    '123 Main Street, Wenatchee, WA 98801',
    '5095551234',
    'joe@joespizza.com',
    'Joe Smith',
    '5095555678',
    'joesmith@gmail.com',
    'Restaurant',
    '2025-12-01',
    'voice_mobile',
    CURRENT_TIMESTAMP
  ),
  (
    'APP-20251020-B7K2',
    NULL,
    'Taco Truck Express',
    '456 Apple Lane, East Wenatchee, WA 98802',
    '5095559999',
    'contact@tacotruck.com',
    'Maria Garcia',
    '5095558888',
    'maria@example.com',
    'Food Truck',
    '2025-11-15',
    'web',
    CURRENT_TIMESTAMP
  );
*/

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Uncomment to verify schema after running

/*
-- Check tables were created
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- Check indexes
SELECT tablename, indexname
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- Count records
SELECT 'sessions' as table_name, COUNT(*) FROM sessions
UNION ALL
SELECT 'applications', COUNT(*) FROM applications;
*/

-- ============================================================================
-- NOTES FOR RUNNING THIS SCHEMA
-- ============================================================================
--
-- When Vercel Postgres is available:
--
-- 1. Go to Vercel Dashboard → Your Project → Storage tab
-- 2. Click on your Postgres database
-- 3. Click "Query" tab or ".sql" tab
-- 4. Copy and paste this entire file
-- 5. Click "Run Query"
-- 6. Verify tables were created by running the verification queries above
--
-- Alternatively, use Vercel CLI:
-- 1. Install: npm i -g vercel
-- 2. Run: vercel env pull .env.local
-- 3. Use psql or pg client to run this file:
--    psql $POSTGRES_URL -f sql/schema.sql
--
-- ============================================================================
