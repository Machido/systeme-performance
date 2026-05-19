-- Add abandonedDate column to tasks table
-- Run this in Supabase SQL Editor

ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS abandonedDate TEXT DEFAULT NULL;

COMMENT ON COLUMN tasks.abandonedDate IS 'Date à laquelle la tâche a été abandonnée (si status = Abandonné)';

-- Verify
SELECT 
  'Column abandonedDate added to tasks table' as status;
