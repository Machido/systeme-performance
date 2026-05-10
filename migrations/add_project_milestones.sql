-- Migration: Add project_milestones table and migrate existing metrics
-- Run this in Supabase SQL Editor

-- 1. Create project_milestones table
CREATE TABLE IF NOT EXISTS project_milestones (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('count', 'currency', 'metric')),
  unit TEXT DEFAULT '',
  start_value NUMERIC NOT NULL DEFAULT 0,
  target_value NUMERIC NOT NULL,
  current_value NUMERIC,
  target_date DATE,
  completed_date DATE,
  order_index INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_project_milestones_project ON project_milestones(project_id);

COMMENT ON TABLE project_milestones IS 'Milestones/objectives for projects';
COMMENT ON COLUMN project_milestones.type IS 'count | currency | metric';
COMMENT ON COLUMN project_milestones.target_date IS 'Date cible pour atteindre ce milestone';
COMMENT ON COLUMN project_milestones.completed_date IS 'Date réelle d''atteinte du milestone';

-- 2. Migrate existing metrics to milestones
INSERT INTO project_milestones (id, project_id, label, type, unit, start_value, target_value, current_value, target_date, order_index)
SELECT 
  'M' || p.id || '_migrated',
  p.id,
  p.metric_label,
  CASE 
    WHEN p.metric_unit IN ('€', '$', '£', 'EUR', 'USD', 'GBP') THEN 'currency'
    WHEN p.metric_unit IN ('#', '', 'count', 'units') OR p.metric_unit IS NULL THEN 'count'
    ELSE 'metric'
  END,
  COALESCE(p.metric_unit, ''),
  COALESCE(p.metric_start, 0),
  p.metric_target,
  p.metric_final,
  p.endDate,  -- Use project end date as milestone target
  0
FROM projects p
WHERE p.metric_label IS NOT NULL AND p.metric_label != '' AND p.metric_target IS NOT NULL
ON CONFLICT (id) DO NOTHING;

-- 3. Drop old metric columns from projects table
-- (Commented out for safety - uncomment after verifying migration worked)
-- ALTER TABLE projects DROP COLUMN IF EXISTS metric_label;
-- ALTER TABLE projects DROP COLUMN IF EXISTS metric_unit;
-- ALTER TABLE projects DROP COLUMN IF EXISTS metric_start;
-- ALTER TABLE projects DROP COLUMN IF EXISTS metric_target;
-- ALTER TABLE projects DROP COLUMN IF EXISTS metric_final;

-- 4. Verify migration
SELECT 
  'Migrated ' || COUNT(*) || ' metrics to milestones' as status
FROM project_milestones
WHERE id LIKE '%_migrated';
