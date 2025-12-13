-- Adds optional gallery support to timeline events without breaking existing API usage.
-- Run this once against your database: psql < scripts/13-add-timeline-gallery.sql

ALTER TABLE timeline_events
  ADD COLUMN IF NOT EXISTS gallery_media_ids TEXT[] DEFAULT '{}';

COMMENT ON COLUMN timeline_events.gallery_media_ids IS 'Optional array of media IDs attached to this timeline event (primary remains media_id).';

CREATE INDEX IF NOT EXISTS idx_timeline_events_gallery_media_ids ON timeline_events USING gin (gallery_media_ids);







