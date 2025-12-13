-- Privacy controls: access request workflow for private memorials
CREATE TABLE IF NOT EXISTS memorial_access_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  memorial_id UUID NOT NULL REFERENCES memorials(id) ON DELETE CASCADE,
  requester_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  requester_email TEXT,
  requester_name TEXT,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'declined')),
  decided_by UUID REFERENCES users(id) ON DELETE SET NULL,
  decided_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_access_requests_memorial_id ON memorial_access_requests(memorial_id);
CREATE INDEX IF NOT EXISTS idx_access_requests_user_id ON memorial_access_requests(requester_user_id);
CREATE INDEX IF NOT EXISTS idx_access_requests_status ON memorial_access_requests(status);

-- Prevent duplicate requests from the same signed-in user
CREATE UNIQUE INDEX IF NOT EXISTS uq_access_requests_memorial_user
  ON memorial_access_requests(memorial_id, requester_user_id)
  WHERE requester_user_id IS NOT NULL;

-- Optional helper to keep updated_at fresh
CREATE OR REPLACE FUNCTION set_updated_at_access_requests()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_access_requests_updated_at ON memorial_access_requests;
CREATE TRIGGER trg_access_requests_updated_at
BEFORE UPDATE ON memorial_access_requests
FOR EACH ROW
EXECUTE FUNCTION set_updated_at_access_requests();




