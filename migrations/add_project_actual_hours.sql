-- Add actualHours column to projects table
-- Run this in Supabase SQL Editor

ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS actualHours NUMERIC DEFAULT 0;

COMMENT ON COLUMN projects.actualHours IS 'Heures réellement passées sur le projet (calculées depuis les tâches ou saisie manuelle)';

-- Verify
SELECT 
  'Column actualHours added to projects table' as status;
