-- Update timeline_events to use existing media system instead of direct URLs
-- This migration adds media_id column and removes image_url and youtube_url columns

-- Add media_id column to timeline_events table
ALTER TABLE timeline_events ADD COLUMN IF NOT EXISTS media_id TEXT;

-- Add foreign key constraint to reference media table (if media table exists)
-- Note: This assumes you have a media table - adjust accordingly
-- ALTER TABLE timeline_events ADD CONSTRAINT fk_timeline_media 
--   FOREIGN KEY (media_id) REFERENCES media(id) ON DELETE SET NULL;

-- Create an index on media_id for performance
CREATE INDEX IF NOT EXISTS idx_timeline_events_media_id ON timeline_events(media_id) 
WHERE media_id IS NOT NULL;

-- Add comment to document the column
COMMENT ON COLUMN timeline_events.media_id IS 'Reference to media table for photos/videos associated with timeline events';

-- Remove old columns if they exist (optional - you may want to keep them for data migration)
-- ALTER TABLE timeline_events DROP COLUMN IF EXISTS image_url;
-- ALTER TABLE timeline_events DROP COLUMN IF EXISTS youtube_url;
