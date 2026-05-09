-- Add completedDate column to projects table
-- Run this in Supabase SQL Editor

ALTER TABLE projects 
ADD COLUMN completedDate DATE;

COMMENT ON COLUMN projects.completedDate IS 'Date actuelle de complétion du projet (rempli quand statut = Terminé)';
