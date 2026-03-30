-- ============================================
-- Système Performance — Supabase Schema
-- Run this in Supabase SQL Editor (one time)
-- ============================================

-- Projects
create table if not exists projects (
  id text primary key,
  name text not null,
  dept text not null,
  status text not null default 'Potentiel',
  "desc" text default '',
  "startDate" text default '',
  "endDate" text default '',
  "estHours" numeric default 0,
  revenue numeric default 0,
  notes text default ''
);

-- Tasks
create table if not exists tasks (
  id text primary key,
  name text not null,
  project text default '',
  dept text not null,
  status text not null default 'À faire',
  priority text not null default 'Moyenne',
  due text default '',
  "estH" numeric default 0,
  "passedH" numeric default 0,
  temp integer default 2,
  notes text default '',
  "completedDate" text default null
);

-- Journal
create table if not exists journal (
  id text primary key,
  date text not null,
  type text not null default '📝 Note',
  temp integer default 5,
  title text not null,
  description text default '',
  project text default '',
  dept text not null,
  priority text default 'Moyenne',
  "linkedTask" text default null
);

-- Objectives
create table if not exists objectives (
  id text primary key,
  name text not null,
  dept text not null default 'all',
  period text not null default 'Q1',
  year integer not null default 2026,
  "desc" text default ''
);

-- KPIs
create table if not exists kpis (
  id text primary key,
  "objectifRef" text default '',
  label text not null,
  type text not null default 'manuel',
  "autoKey" text default '',
  dept text not null default 'all',
  unit text default '€',
  target numeric,
  actual numeric,
  period text not null default 'Q1',
  year integer not null default 2026
);

-- ============================================
-- Row Level Security (RLS) — DISABLED for now
-- Since this is a single-user app, we disable
-- RLS to keep things simple. Enable later if
-- you add authentication.
-- ============================================
alter table projects enable row level security;
alter table tasks enable row level security;
alter table journal enable row level security;
alter table objectives enable row level security;
alter table kpis enable row level security;

-- Allow all operations with anon key (single user)
create policy "Allow all on projects" on projects for all using (true) with check (true);
create policy "Allow all on tasks" on tasks for all using (true) with check (true);
create policy "Allow all on journal" on journal for all using (true) with check (true);
create policy "Allow all on objectives" on objectives for all using (true) with check (true);
create policy "Allow all on kpis" on kpis for all using (true) with check (true);
