-- Add focus column to habits table
-- Run this in Supabase SQL Editor

ALTER TABLE habits 
ADD COLUMN IF NOT EXISTS focus BOOLEAN DEFAULT true;

-- Update existing habits to focus=true by default
UPDATE habits 
SET focus = true 
WHERE focus IS NULL;

-- Add comment
COMMENT ON COLUMN habits.focus IS 'Focus flag to show/hide habit temporarily (true = visible by default)';

-- Verify
SELECT 
  'Column focus added to habits table' as status,
  'Existing habits set to focus=true by default' as description;
