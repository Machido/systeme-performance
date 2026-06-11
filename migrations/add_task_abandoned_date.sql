-- Add abandonedDate column to tasks table
-- Run this in Supabase SQL Editor

ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS abandonedDate TEXT DEFAULT NULL;

-- Add comment
COMMENT ON COLUMN tasks.abandonedDate IS 'Date when task was marked as abandoned (YYYY-MM-DD)';

-- Verify
SELECT 
  'Column abandonedDate added to tasks table' as status,
  'Tasks can now track abandonment date' as description;
