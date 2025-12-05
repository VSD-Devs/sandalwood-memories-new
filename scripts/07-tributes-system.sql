-- Clean tributes system schema
-- Drop existing table if it has issues
DROP TABLE IF EXISTS tributes CASCADE;

-- Create new tributes table with clean design
CREATE TABLE tributes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  memorial_id UUID NOT NULL REFERENCES memorials(id) ON DELETE CASCADE,
  
  -- Author information
  author_name TEXT NOT NULL,
  author_email TEXT,
  
  -- Content
  message TEXT NOT NULL,
  
  -- Status and metadata
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Moderation info
  moderated_by UUID REFERENCES users(id),
  moderated_at TIMESTAMPTZ,
  
  -- Prevent spam
  ip_address INET,
  user_agent TEXT
);

-- Indexes for performance
CREATE INDEX idx_tributes_memorial_id ON tributes(memorial_id);
CREATE INDEX idx_tributes_status ON tributes(status);
CREATE INDEX idx_tributes_created_at ON tributes(created_at DESC);
CREATE INDEX idx_tributes_memorial_status ON tributes(memorial_id, status);

-- Updated timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_tributes_updated_at 
    BEFORE UPDATE ON tributes 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE tributes IS 'Memorial tributes and messages from visitors';
COMMENT ON COLUMN tributes.status IS 'pending: awaiting approval, approved: visible to public, rejected: hidden';
COMMENT ON COLUMN tributes.moderated_by IS 'User ID of who approved/rejected this tribute';
