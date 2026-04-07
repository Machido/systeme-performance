# Habit Tracker Setup Guide

## 📋 Overview
The habit tracker feature has been successfully implemented in Système Performance. This guide will help you complete the setup.

## ✅ Completed
- [x] Database migration file created: `migration-habits-2026-04-07.sql`
- [x] React components integrated into `src/App.jsx`:
  - Habits tab in main navigation
  - Today's Dashboard view for quick logging
  - Habit list grouped by department
  - Quick-check buttons (one-tap logging)
  - Habit creation/edit forms
  - Extended logging modal (with note, time, temp)
  - Streak tracking and 7-day visualization
  - Progress bars toward 60-day goal
- [x] State management for habits and habit_logs
- [x] Supabase integration functions
- [x] Build verification (npm run build successful)

## 🚀 Required Steps

### 1. Apply Database Migration

**Manual application via Supabase Dashboard:**

1. Go to https://supabase.com/dashboard
2. Select your project: `dmjncqubzupaofuzcubn`
3. Navigate to **SQL Editor**
4. Click **New Query**
5. Copy and paste the entire contents of `migration-habits-2026-04-07.sql`
6. Click **Run** (or press Ctrl+Enter)
7. Verify success: Check for "Success. No rows returned" message

**Verification:**
```sql
-- Run this query to verify tables were created
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('habits', 'habit_logs');
```

You should see 2 rows returned.

### 2. Deploy to Vercel

The code is already built and ready. Deploy via:

```bash
# Option 1: Git push (recommended)
git add .
git commit -m "feat: Add habit tracker with daily dashboard and streak tracking"
git push origin main

# Vercel will auto-deploy from main branch
```

Or manually via Vercel CLI:
```bash
vercel --prod
```

### 3. Test the Feature

After deployment:

1. Visit https://systeme-performance.vercel.app/
2. Click the **🎯 Habitudes** tab
3. Click **+ Nouvelle habitude**
4. Create a test habit:
   - Name: "Méditer 10 minutes"
   - Type: 🟢 Acquérir
   - Department: Résilience
   - Target days: 60
   - Click **Enregistrer**
5. Test quick-check on the Today's Dashboard
6. Click **✓ Log** to open the extended form
7. Try backdating a log entry

## 📱 Message Shortcuts (Future Enhancement)

The `/h` command parser is **not yet implemented**. This requires updates to:

- `api/webhook.js` — extend the message handler
- Add pattern matching for `/h [habit] [time]m [temp N]. note`
- Fuzzy matching for habit names

This was deprioritized to focus on the core UI first. If you want this feature, let me know!

## 🎯 Features Implemented

### Core Features (from Brief)
- ✅ One-tap quick-check for logging (minimal friction)
- ✅ 60-day build goal with configurable target
- ✅ Optional "allowed misses" budget
- ✅ Grouped by department (sales, res, ops, prod)
- ✅ Backdating support (datetime picker in extended form)
- ✅ Optional negative logging ("Mark as missed")
- ✅ Streak tracking with visual indicators (🔥)
- ✅ Last 7 days completion grid
- ✅ Progress bars toward goal
- ✅ Today's Dashboard view
- ✅ Extended logging with note, time, and temp

### Optional Fields (When Logging)
- Note (text)
- Time spent (minutes)
- Temp score (1-10, like journal entries)
- Logged at (backdating support)
- Completed status (true/false for negative logging)

### Not Implemented (Future)
- ⏸ Message shortcuts (`/h` commands) — requires webhook.js updates
- ⏸ Habit heatmap (GitHub-style calendar) — would be nice visual upgrade
- ⏸ Habit detail view with full stats and log history — modal or dedicated page
- ⏸ Edit/delete individual logs — currently logs are append-only
- ⏸ Reminders/notifications — out of scope for MVP

## 🔧 Troubleshooting

### "Table doesn't exist" errors
- Make sure you ran the migration in Supabase SQL Editor
- Check RLS policies are enabled (they allow all for this single-user app)

### Habits not saving
- Check browser console for errors
- Verify Supabase anon key in `.env` or `src/supabase.js`
- Check Network tab for 401 errors (auth issue) or 403 (RLS policy issue)

### Build errors
- Run `npm install` if dependencies are missing
- Check `src/App.jsx` for syntax errors
- Verify React version compatibility

## 📊 Database Schema Reference

### `habits` table
```sql
id TEXT PRIMARY KEY
user_id TEXT DEFAULT 'default'
department_id TEXT -- links to DEPTS (ops, sales, prod, res)
name TEXT NOT NULL
description TEXT
habit_type TEXT -- 'acquire' or 'eliminate'
icon TEXT DEFAULT '✅'
target_frequency TEXT DEFAULT 'daily'
target_days INTEGER DEFAULT 60
allowed_misses INTEGER DEFAULT 0
archived BOOLEAN DEFAULT FALSE
created_at TIMESTAMPTZ
updated_at TIMESTAMPTZ
```

### `habit_logs` table
```sql
id TEXT PRIMARY KEY
habit_id TEXT REFERENCES habits(id) ON DELETE CASCADE
user_id TEXT DEFAULT 'default'
logged_at TIMESTAMPTZ -- supports backdating
completed BOOLEAN DEFAULT TRUE -- false = missed
note TEXT
time_spent_minutes INTEGER
temp INTEGER CHECK (temp BETWEEN 1 AND 10)
created_at TIMESTAMPTZ
```

## 🎉 Next Steps

1. Apply the migration (Step 1 above)
2. Deploy to Vercel (Step 2 above)
3. Start tracking your first habit!
4. After a few days of use, consider adding:
   - Habit detail view with full history
   - Heatmap visualization
   - Message shortcuts via webhook

## 📝 Notes

- The habit tracker uses the same RLS policy approach as other tables (allow all for single-user app)
- Habits can be archived (not deleted) to preserve historical data
- Streaks are calculated on-the-fly from `habit_logs` where `completed = true`
- The 7-day grid shows the last 7 days of completion status
- Progress bars show percentage toward `target_days` goal

---

**Implementation completed by:** Virt (OpenClaw subagent)  
**Date:** 2026-04-07  
**Status:** ✅ Ready for deployment (migration pending)
