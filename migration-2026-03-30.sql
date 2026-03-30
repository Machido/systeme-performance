-- Migration: 2026-03-30
-- Run this in Supabase SQL Editor

-- Add completedDate to tasks
alter table tasks add column if not exists "completedDate" text default null;

-- Add linkedTask to journal
alter table journal add column if not exists "linkedTask" text default null;

-- Add description column to journal (code uses 'description', schema had 'desc')
alter table journal add column if not exists description text default '';

-- Add description column to projects (code uses 'description', schema had 'desc')
alter table projects add column if not exists description text default '';
