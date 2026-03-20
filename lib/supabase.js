import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// ── Helpers ──
function mapPriority(p) {
  if (!p) return "Moyenne";
  const lower = p.toLowerCase();
  if (lower === "urgent" || lower === "haute" || lower === "high") return "Haute";
  if (lower === "basse" || lower === "low") return "Basse";
  return "Moyenne";
}

function mapStatus(s) {
  if (!s) return "À faire";
  const lower = s.toLowerCase();
  if (lower === "in_progress" || lower === "en cours") return "En cours";
  if (lower === "done" || lower === "terminé") return "Terminé";
  if (lower === "cancelled" || lower === "abandonné") return "Abandonné";
  return "À faire";
}

function mapProjectStatus(s) {
  if (!s) return "Potentiel";
  const lower = s.toLowerCase();
  if (lower.includes("cours")) return "En cours";
  if (lower.includes("terminé") || lower.includes("done")) return "Terminé";
  if (lower.includes("abandonné")) return "Abandonné";
  return "Potentiel";
}

function mapDept(d) {
  if (!d) return "ops";
  const lower = d.toLowerCase();
  if (lower.includes("vente") || lower.includes("market") || lower.includes("sales")) return "sales";
  if (lower.includes("prod")) return "prod";
  if (lower.includes("rés") || lower.includes("res") || lower.includes("sil")) return "res";
  return "ops";
}

async function generateId(table, prefix) {
  const { data } = await supabase.from(table).select('id');
  const count = data?.length || 0;
  return prefix + String(count + 1).padStart(3, "0") + "_bot";
}

// ── TASKS ──
export async function getTomorrowsTasks() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dateStr = tomorrow.toISOString().split('T')[0];
  const { data, error } = await supabase
    .from('tasks').select('*').eq('due', dateStr).neq('status', 'Abandonné').order('priority', { ascending: false });
  if (error) throw error;
  return data;
}

export async function getOverdueTasks() {
  const today = new Date().toISOString().split('T')[0];
  const { data, error } = await supabase
    .from('tasks').select('*').lt('due', today).in('status', ['À faire', 'En cours']).order('due', { ascending: true });
  if (error) throw error;
  return data;
}

export async function getTasksByDateRange(startDate, endDate) {
  const { data, error } = await supabase
    .from('tasks').select('*').gte('due', startDate).lte('due', endDate).neq('status', 'Abandonné').order('due', { ascending: true });
  if (error) throw error;
  return data;
}

export async function createTask(task) {
  const id = await generateId('tasks', 'T');
  const mapped = {
    id,
    name: task.title || task.name || "Tâche sans nom",
    dept: task.dept ? task.dept : mapDept(task.department_name),
    status: mapStatus(task.status),
    priority: mapPriority(task.priority),
    due: task.due_date || task.due || new Date().toISOString().split('T')[0],
    estH: task.estimated_hours || task.estH || 1,
    passedH: 0,
    temp: 2,
    notes: task.description || task.notes || "",
    project: task.project || "",
  };
  const { data, error } = await supabase.from('tasks').insert(mapped).select().single();
  if (error) throw error;
  return data;
}

export async function updateTaskStatus(taskId, status) {
  const { data, error } = await supabase
    .from('tasks').update({ status: mapStatus(status) }).eq('id', taskId).select().single();
  if (error) throw error;
  return data;
}

// ── PROJECTS ──
export async function getAllProjects() {
  const { data, error } = await supabase
    .from('projects').select('*').eq('status', 'En cours').order('endDate', { ascending: true });
  if (error) throw error;
  return data;
}

export async function createProject(project) {
  const id = await generateId('projects', 'P');
  const mapped = {
    id,
    name: project.name || "Projet sans nom",
    dept: project.dept ? project.dept : mapDept(project.department),
    status: mapProjectStatus(project.status),
    desc: project.desc || project.description || "",
    startDate: project.startDate || project.start_date || new Date().toISOString().split('T')[0],
    endDate: project.endDate || project.end_date || "",
    estHours: project.estHours || project.estimated_hours || 0,
    revenue: project.revenue || 0,
    notes: project.notes || "",
  };
  const { data, error } = await supabase.from('projects').insert(mapped).select().single();
  if (error) throw error;
  return data;
}

// ── JOURNAL ──
export async function getRecentJournal(limit = 5) {
  const { data, error } = await supabase
    .from('journal').select('*').order('date', { ascending: false }).limit(limit);
  if (error) throw error;
  return data;
}

export async function createJournalEntry(entry) {
  const id = await generateId('journal', 'J');
  const typeMap = {
    'note': '📝 Note',
    'idée': '💡 Idée',
    'idee': '💡 Idée',
    'idea': '💡 Idée',
    'obstacle': '🚧 Obstacle',
    'problème': '🚧 Obstacle',
    'probleme': '🚧 Obstacle',
  };
  const rawType = (entry.type || 'note').toLowerCase();
  const mappedType = typeMap[rawType] || entry.type || '📝 Note';

  const mapped = {
    id,
    date: entry.date || new Date().toISOString().split('T')[0],
    type: mappedType,
    title: entry.title || "Entrée sans titre",
    desc: entry.desc || entry.description || "",
    dept: entry.dept ? entry.dept : mapDept(entry.department),
    temp: entry.temp !== undefined ? entry.temp : 2,
    priority: mapPriority(entry.priority),
    nextAction: entry.nextAction || entry.next_action || "",
    project: entry.project || "",
    objectifRef: entry.objectifRef || "",
  };
  const { data, error } = await supabase.from('journal').insert(mapped).select().single();
  if (error) throw error;
  return data;
}

// ── OBJECTIVES ──
export async function getAllObjectives() {
  const { data, error } = await supabase.from('objectives').select('*');
  if (error) throw error;
  return data;
}

export async function createObjective(objective) {
  const id = await generateId('objectives', 'OBJ');
  const mapped = {
    id,
    name: objective.name || "Objectif sans nom",
    dept: objective.dept || "all",
    period: objective.period || "Q1",
    year: objective.year || new Date().getFullYear(),
    desc: objective.desc || objective.description || "",
  };
  const { data, error } = await supabase.from('objectives').insert(mapped).select().single();
  if (error) throw error;
  return data;
}

// ── KPIs ──
export async function createKpi(kpi) {
  const id = await generateId('kpis', 'K');
  const mapped = {
    id,
    label: kpi.label || "KPI sans nom",
    objectifRef: kpi.objectifRef || kpi.objective_ref || "",
    type: kpi.type === "auto" ? "auto" : "manuel",
    autoKey: kpi.autoKey || "",
    dept: kpi.dept || "all",
    unit: kpi.unit || "count",
    target: kpi.target !== undefined ? kpi.target : null,
    actual: kpi.actual !== undefined ? kpi.actual : null,
    period: kpi.period || "Q1",
    year: kpi.year || new Date().getFullYear(),
  };
  const { data, error } = await supabase.from('kpis').insert(mapped).select().single();
  if (error) throw error;
  return data;
}

// ── TIME / WEEKLY ──
export async function getWeeklyTimeByDepartment() {
  const today = new Date();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay());
  const { data, error } = await supabase
    .from('tasks').select('passedH, dept')
    .gte('due', startOfWeek.toISOString().split('T')[0])
    .lte('due', today.toISOString().split('T')[0]);
  if (error) throw error;
  const summary = {};
  for (const task of data || []) {
    const dept = task.dept || 'ops';
    summary[dept] = (summary[dept] || 0) + (task.passedH || 0);
  }
  return summary;
}

// ── SESSIONS ──
export async function getSession(chatId) {
  const { data } = await supabase
    .from('bot_sessions').select('context').eq('chat_id', chatId).single();
  return data?.context || [];
}

export async function saveSession(chatId, context) {
  const trimmed = context.slice(-10);
  await supabase.from('bot_sessions').upsert(
    { chat_id: chatId, context: trimmed, updated_at: new Date().toISOString() },
    { onConflict: 'chat_id' }
  );
}
