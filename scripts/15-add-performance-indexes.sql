-- Performance optimization: Add indexes for frequently queried fields
-- This script adds indexes that will improve query performance for common operations

-- Index for media file_type filtering (used in galleries)
CREATE INDEX IF NOT EXISTS idx_media_file_type ON media(file_type);

-- Index for media created_at ordering (used for sorting media chronologically)
CREATE INDEX IF NOT EXISTS idx_media_created_at ON media(created_at DESC);

-- Index for tributes created_at ordering (used for displaying recent tributes)
CREATE INDEX IF NOT EXISTS idx_tributes_created_at ON tributes(created_at DESC);

-- Index for memorials is_public filtering (used for public memorial listings)
CREATE INDEX IF NOT EXISTS idx_memorials_is_public ON memorials(is_public) WHERE is_public = true;

-- Composite index for memorials by status and creation date (for admin queries)
CREATE INDEX IF NOT EXISTS idx_memorials_status_created_at ON memorials(status, created_at DESC);

-- Index for timeline events by date (for chronological ordering)
CREATE INDEX IF NOT EXISTS idx_timeline_events_event_date ON timeline_events(event_date DESC);

-- Index for timeline events by category (for filtering by event type)
CREATE INDEX IF NOT EXISTS idx_timeline_events_category ON timeline_events(category);