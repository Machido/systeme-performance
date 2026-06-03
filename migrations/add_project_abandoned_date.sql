-- Add abandonedDate column to projects table
-- Run this in Supabase SQL Editor

ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS abandonedDate TEXT DEFAULT NULL;

-- Add comment
COMMENT ON COLUMN projects.abandonedDate IS 'Date when project was marked as abandoned (YYYY-MM-DD)';

-- Verify
SELECT 
  'Column abandonedDate added to projects table' as status,
  'Projects can now track abandonment date' as description;
