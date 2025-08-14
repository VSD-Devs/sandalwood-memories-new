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
