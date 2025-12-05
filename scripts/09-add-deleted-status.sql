-- Update the status constraint to include 'deleted' option
ALTER TABLE memorials DROP CONSTRAINT IF EXISTS memorials_status_check;
ALTER TABLE memorials ADD CONSTRAINT memorials_status_check 
  CHECK (status IN ('active', 'pending', 'archived', 'deleted'));
