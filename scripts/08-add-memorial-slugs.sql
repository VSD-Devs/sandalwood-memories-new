-- Add slug field to memorials table for custom URLs
ALTER TABLE memorials ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;

-- Create index for fast slug lookups
CREATE INDEX IF NOT EXISTS idx_memorials_slug ON memorials(slug);

-- Function to generate slug from full_name
CREATE OR REPLACE FUNCTION generate_slug(input_text TEXT) 
RETURNS TEXT AS $$
DECLARE
    slug_text TEXT;
BEGIN
    -- Convert to lowercase, replace spaces and special chars with hyphens
    slug_text := lower(regexp_replace(input_text, '[^a-zA-Z0-9\s]', '', 'g'));
    slug_text := regexp_replace(slug_text, '\s+', '-', 'g');
    slug_text := trim(both '-' from slug_text);
    
    -- Ensure it's not empty
    IF slug_text = '' THEN
        slug_text := 'memorial';
    END IF;
    
    RETURN slug_text;
END;
$$ LANGUAGE plpgsql;

-- Generate slugs for existing memorials that don't have them
DO $$
DECLARE
    memorial_record RECORD;
    base_slug TEXT;
    final_slug TEXT;
    counter INTEGER;
BEGIN
    FOR memorial_record IN 
        SELECT id, full_name 
        FROM memorials 
        WHERE slug IS NULL 
    LOOP
        base_slug := generate_slug(memorial_record.full_name);
        final_slug := base_slug;
        counter := 1;
        
        -- Handle duplicates by appending a number
        WHILE EXISTS (SELECT 1 FROM memorials WHERE slug = final_slug) LOOP
            final_slug := base_slug || '-' || counter;
            counter := counter + 1;
        END LOOP;
        
        -- Update the memorial with the unique slug
        UPDATE memorials 
        SET slug = final_slug 
        WHERE id = memorial_record.id;
    END LOOP;
END;
$$;
