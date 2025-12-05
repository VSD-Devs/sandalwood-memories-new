-- Create memorials table
CREATE TABLE IF NOT EXISTS memorials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  full_name TEXT NOT NULL,
  birth_date DATE,
  death_date DATE,
  biography TEXT,
  cover_image_url TEXT,
  profile_image_url TEXT,
  is_alive BOOLEAN DEFAULT false,
  burial_location TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_public BOOLEAN DEFAULT true,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'pending', 'archived'))
);

-- Create timeline_events table
CREATE TABLE IF NOT EXISTS timeline_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  memorial_id UUID REFERENCES memorials(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  event_date DATE,
  category TEXT DEFAULT 'milestone' CHECK (category IN ('milestone', 'achievement', 'memory', 'celebration')),
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create media table
CREATE TABLE IF NOT EXISTS media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  memorial_id UUID REFERENCES memorials(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL CHECK (file_type IN ('image', 'video', 'document')),
  title TEXT,
  description TEXT,
  uploaded_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create tributes table
CREATE TABLE IF NOT EXISTS tributes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  memorial_id UUID REFERENCES memorials(id) ON DELETE CASCADE,
  author_name TEXT NOT NULL,
  author_email TEXT,
  message TEXT NOT NULL,
  is_approved BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_memorials_created_by ON memorials(created_by);
CREATE INDEX IF NOT EXISTS idx_memorials_status ON memorials(status);
CREATE INDEX IF NOT EXISTS idx_timeline_events_memorial_id ON timeline_events(memorial_id);
CREATE INDEX IF NOT EXISTS idx_media_memorial_id ON media(memorial_id);
CREATE INDEX IF NOT EXISTS idx_tributes_memorial_id ON tributes(memorial_id);
CREATE INDEX IF NOT EXISTS idx_tributes_approved ON tributes(is_approved);
-- Create user subscriptions table
CREATE TABLE IF NOT EXISTS user_subscriptions (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) UNIQUE NOT NULL,
    plan_type VARCHAR(50) NOT NULL CHECK (plan_type IN ('free', 'premium', 'fully_managed')),
    stripe_customer_id VARCHAR(255),
    stripe_subscription_id VARCHAR(255),
    status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'past_due', 'incomplete')),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create usage tracking table for free tier limits
CREATE TABLE IF NOT EXISTS memorial_usage (
    id SERIAL PRIMARY KEY,
    memorial_id INTEGER NOT NULL,
    user_id VARCHAR(255) NOT NULL,
    media_count INTEGER DEFAULT 0,
    media_size_mb DECIMAL(10,2) DEFAULT 0,
    timeline_events INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_stripe_customer ON user_subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_memorial_usage_user_id ON memorial_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_memorial_usage_memorial_id ON memorial_usage(memorial_id);
-- Create invitations table
CREATE TABLE IF NOT EXISTS invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  memorial_id UUID NOT NULL REFERENCES memorials(id) ON DELETE CASCADE,
  inviter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'contributor', -- contributor, moderator, admin
  status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, accepted, declined, expired
  invitation_token VARCHAR(255) UNIQUE NOT NULL,
  message TEXT,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create memorial_collaborators table
CREATE TABLE IF NOT EXISTS memorial_collaborators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  memorial_id UUID NOT NULL REFERENCES memorials(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL DEFAULT 'contributor', -- contributor, moderator, admin
  permissions JSONB DEFAULT '{}', -- specific permissions
  invited_by UUID REFERENCES users(id),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(memorial_id, user_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_invitations_memorial_id ON invitations(memorial_id);
CREATE INDEX IF NOT EXISTS idx_invitations_email ON invitations(email);
CREATE INDEX IF NOT EXISTS idx_invitations_token ON invitations(invitation_token);
CREATE INDEX IF NOT EXISTS idx_invitations_status ON invitations(status);
CREATE INDEX IF NOT EXISTS idx_collaborators_memorial_id ON memorial_collaborators(memorial_id);
CREATE INDEX IF NOT EXISTS idx_collaborators_user_id ON memorial_collaborators(user_id);

-- Optional sample data (runs only if both a memorial and a local user exist)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM memorials) AND EXISTS (SELECT 1 FROM users) THEN
    INSERT INTO invitations (memorial_id, inviter_id, email, role, invitation_token, message)
    SELECT 
      m.id,
      (SELECT id FROM users ORDER BY created_at LIMIT 1),
      'family@example.com',
      'moderator',
      'sample-token-' || m.id,
      'Please join us in celebrating the life of ' || m.full_name || '. Your memories and photos would mean so much to our family.'
    FROM memorials m 
    LIMIT 1
    ON CONFLICT (invitation_token) DO NOTHING;
  END IF;
END
$$;
-- Email verification records
CREATE TABLE IF NOT EXISTS email_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '24 hours'),
  verified BOOLEAN NOT NULL DEFAULT FALSE,
  verified_at TIMESTAMPTZ NULL
);

-- For quick lookups
CREATE INDEX IF NOT EXISTS idx_email_verifications_email ON email_verifications (email);


-- Users table for application authentication
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  provider_user_id TEXT UNIQUE,
  email_verified BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Forward-compatible: ensure provider_user_id exists on existing DBs
ALTER TABLE users ADD COLUMN IF NOT EXISTS provider_user_id TEXT UNIQUE;

-- Sessions table for http-only cookie sessions
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_token TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '30 days')
);

CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);


