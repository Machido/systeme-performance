-- Add milestone_id column to tasks table to link tasks with project milestones
-- Run this in Supabase SQL Editor

ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS milestone_id TEXT DEFAULT NULL;

-- Add foreign key constraint (optional but recommended)
-- Note: This assumes project_milestones table exists
ALTER TABLE tasks 
ADD CONSTRAINT fk_tasks_milestone 
FOREIGN KEY (milestone_id) 
REFERENCES project_milestones(id) 
ON DELETE SET NULL;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_tasks_milestone ON tasks(milestone_id);

-- Add comment
COMMENT ON COLUMN tasks.milestone_id IS 'ID of the project milestone this task contributes to (optional)';

-- Verify
SELECT 
  'Column milestone_id added to tasks table' as status,
  'Tasks can now be linked to project milestones' as description;
