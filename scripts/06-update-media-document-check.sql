-- Update media.file_type check constraint to include 'document' for PDF uploads
DO $$
BEGIN
  -- Try dropping the most likely auto-generated constraint name if it exists
  BEGIN
    ALTER TABLE media DROP CONSTRAINT IF EXISTS media_file_type_check;
  EXCEPTION WHEN undefined_object THEN
    -- ignore
    NULL;
  END;

  -- Recreate the constraint allowing 'document'
  BEGIN
    ALTER TABLE media ADD CONSTRAINT media_file_type_check CHECK (file_type IN ('image', 'video', 'document'));
  EXCEPTION WHEN duplicate_object THEN
    -- already exists; ignore
    NULL;
  END;
END
$$;






