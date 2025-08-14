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
  created_by TEXT REFERENCES neon_auth.users_sync(id),
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
  file_type TEXT NOT NULL CHECK (file_type IN ('image', 'video')),
  title TEXT,
  description TEXT,
  uploaded_by TEXT REFERENCES neon_auth.users_sync(id),
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
