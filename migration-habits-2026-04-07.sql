-- ============================================
-- Habit Tracker Feature Migration
-- Created: 2026-04-07
-- ============================================

-- Create habits table
CREATE TABLE IF NOT EXISTS habits (
  id TEXT PRIMARY KEY DEFAULT ('H' || EXTRACT(EPOCH FROM NOW() * 1000)::BIGINT),
  user_id TEXT DEFAULT 'default',
  department_id TEXT, -- links to existing DEPTS (ops, sales, prod, res)
  name TEXT NOT NULL,
  description TEXT,
  habit_type TEXT NOT NULL CHECK (habit_type IN ('acquire', 'eliminate')),
  icon TEXT DEFAULT '✅', -- emoji or icon identifier
  target_frequency TEXT DEFAULT 'daily', -- 'daily', 'weekly', custom goal
  target_days INTEGER DEFAULT 60, -- goal: number of days to build the habit
  allowed_misses INTEGER DEFAULT 0, -- optional: days off allowed without breaking streak
  archived BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create habit_logs table
CREATE TABLE IF NOT EXISTS habit_logs (
  id TEXT PRIMARY KEY DEFAULT ('HL' || EXTRACT(EPOCH FROM NOW() * 1000)::BIGINT),
  habit_id TEXT REFERENCES habits(id) ON DELETE CASCADE NOT NULL,
  user_id TEXT DEFAULT 'default',
  logged_at TIMESTAMPTZ DEFAULT NOW(), -- when the habit occurred (supports backdating)
  completed BOOLEAN DEFAULT TRUE, -- true = did it, false = missed (negative logging)
  note TEXT, -- optional context
  time_spent_minutes INTEGER, -- optional duration
  temp INTEGER CHECK (temp BETWEEN 1 AND 10), -- optional mood/energy score
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_habit_logs_habit_id ON habit_logs(habit_id);
CREATE INDEX IF NOT EXISTS idx_habit_logs_user_id ON habit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_habit_logs_logged_at ON habit_logs(logged_at);
CREATE INDEX IF NOT EXISTS idx_habits_user_id ON habits(user_id);
CREATE INDEX IF NOT EXISTS idx_habits_archived ON habits(archived);

-- Enable RLS
ALTER TABLE habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE habit_logs ENABLE ROW LEVEL SECURITY;

-- Allow all operations (single-user app, same as other tables)
CREATE POLICY "Allow all on habits" ON habits FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on habit_logs" ON habit_logs FOR ALL USING (true) WITH CHECK (true);
