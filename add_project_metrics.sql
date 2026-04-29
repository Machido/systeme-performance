-- Add metric fields to projects table for KPI tracking

ALTER TABLE projects ADD COLUMN IF NOT EXISTS metric_label TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS metric_unit TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS metric_start DECIMAL;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS metric_target DECIMAL;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS metric_final DECIMAL;

-- Example data structure after migration:
-- {
--   id: "P001",
--   name: "Lose weight Q2",
--   dept: "res",
--   metric_label: "Weight",
--   metric_unit: "kg",
--   metric_start: 85,
--   metric_target: 75,
--   metric_final: 78  -- filled when project completed
-- }
