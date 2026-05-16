-- Add abandonReason column to projects table
-- Run this in Supabase SQL Editor

ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS abandonReason TEXT DEFAULT NULL;

COMMENT ON COLUMN projects.abandonReason IS 'Raison pour laquelle le projet a été abandonné (si status = Abandonné)';

-- Verify
SELECT 
  'Column abandonReason added to projects table' as status;
