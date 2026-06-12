-- Add abandonReason column to tasks table
-- Run this in Supabase SQL Editor

ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS abandonReason TEXT DEFAULT NULL;

-- Add comment
COMMENT ON COLUMN tasks.abandonReason IS 'Reason why task was abandoned (dropdown selection or custom text)';

-- Verify
SELECT 
  'Column abandonReason added to tasks table' as status,
  'Tasks can now track why they were abandoned' as description;
