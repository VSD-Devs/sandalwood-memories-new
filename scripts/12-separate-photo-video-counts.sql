-- Add separate photo and video count columns to memorial_usage table
ALTER TABLE memorial_usage 
ADD COLUMN IF NOT EXISTS photo_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS video_count INTEGER DEFAULT 0;

-- Migrate existing media_count to photo_count (assuming existing entries are photos)
-- Note: This migration assumes existing media are photos. For more accurate migration,
-- you would need to check the media table and count by file_type
UPDATE memorial_usage 
SET photo_count = media_count 
WHERE photo_count = 0 AND media_count > 0;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_memorial_usage_photo_count ON memorial_usage(photo_count);
CREATE INDEX IF NOT EXISTS idx_memorial_usage_video_count ON memorial_usage(video_count);

-- Note: We keep media_count for backwards compatibility and as a total count
-- It should equal photo_count + video_count






