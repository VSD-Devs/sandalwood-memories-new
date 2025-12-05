-- Fix memorial ownership and user references
-- This script updates the memorial table to properly reference the users table instead of neon_auth.users_sync

BEGIN;

-- First, ensure we have the owner_user_id column for new ownership model
ALTER TABLE memorials ADD COLUMN IF NOT EXISTS owner_user_id UUID;

-- Update the foreign key constraint for created_by to reference the correct users table
-- Drop the old constraint if it exists
DO $$
BEGIN
    -- Try to drop the old foreign key constraint
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name LIKE '%memorials_created_by_fkey%' 
        AND table_name = 'memorials'
    ) THEN
        ALTER TABLE memorials DROP CONSTRAINT memorials_created_by_fkey;
    END IF;
EXCEPTION WHEN others THEN
    -- Ignore errors if constraint doesn't exist
    NULL;
END $$;

-- Change created_by to UUID type to match users.id
DO $$
BEGIN
    -- First check if created_by is currently TEXT type
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'memorials' 
        AND column_name = 'created_by' 
        AND data_type = 'text'
    ) THEN
        -- If there are existing records with text IDs, we need to handle them
        -- For now, set invalid text IDs to NULL (they'll need to be re-associated)
        UPDATE memorials 
        SET created_by = NULL 
        WHERE created_by IS NOT NULL 
        AND created_by !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
        
        -- Now alter the column type
        ALTER TABLE memorials ALTER COLUMN created_by TYPE UUID USING created_by::UUID;
    END IF;
EXCEPTION WHEN others THEN
    -- If conversion fails, just make it nullable UUID
    ALTER TABLE memorials ALTER COLUMN created_by DROP NOT NULL;
    ALTER TABLE memorials ALTER COLUMN created_by TYPE UUID USING NULL;
END $$;

-- Add the proper foreign key constraint to the users table
ALTER TABLE memorials 
ADD CONSTRAINT memorials_created_by_fkey 
FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;

-- Add foreign key for owner_user_id as well
ALTER TABLE memorials 
ADD CONSTRAINT memorials_owner_user_id_fkey 
FOREIGN KEY (owner_user_id) REFERENCES users(id) ON DELETE SET NULL;

-- For memorials that have created_by, set owner_user_id to the same value
-- This ensures backwards compatibility
UPDATE memorials 
SET owner_user_id = created_by 
WHERE created_by IS NOT NULL AND owner_user_id IS NULL;

-- Update media table to reference users table correctly
DO $$
BEGIN
    -- Drop old constraint if exists
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name LIKE '%media_uploaded_by_fkey%' 
        AND table_name = 'media'
    ) THEN
        ALTER TABLE media DROP CONSTRAINT media_uploaded_by_fkey;
    END IF;
EXCEPTION WHEN others THEN
    NULL;
END $$;

-- Change uploaded_by to UUID type
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'media' 
        AND column_name = 'uploaded_by' 
        AND data_type = 'text'
    ) THEN
        -- Clear invalid text IDs
        UPDATE media 
        SET uploaded_by = NULL 
        WHERE uploaded_by IS NOT NULL 
        AND uploaded_by !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
        
        ALTER TABLE media ALTER COLUMN uploaded_by TYPE UUID USING uploaded_by::UUID;
    END IF;
EXCEPTION WHEN others THEN
    ALTER TABLE media ALTER COLUMN uploaded_by TYPE UUID USING NULL;
END $$;

-- Add proper foreign key for media.uploaded_by
ALTER TABLE media 
ADD CONSTRAINT media_uploaded_by_fkey 
FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_memorials_owner_user_id ON memorials(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_media_uploaded_by ON media(uploaded_by);

COMMIT;



