import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Map bot priority values → app values
function mapPriority(p) {
  if (!p) return "Moyenne";
  const lower = p.toLowerCase();
  if (lower === "urgent" || lower === "haute" || lower === "high") return "Haute";
  if (lower === "basse" || lower === "low") return "Basse";
  return "Moyenne";
}

// Map bot status values → app values
function mapStatus(s) {
  if (!s) return "À faire";
  const lower = s.toLowerCase();
  if (lower === "in_progress" || lower === "en cours") return "En cours";
  if (lower === "done" || lower === "terminé") return "Terminé";
  if (lower === "cancelled" || lower === "abandonné") return "Abandonné";
  return "À faire";
}

// Map department name → dept id
function mapDept(d) {
  if (!d) return "ops";
  const lower = d.toLowerCase();
  if (lower.includes("vente") || lower.includes("market") || lower.includes("sales")) return "sales";
  if (lower.includes("prod")) return "prod";
  if (lower.includes("rés") || lower.includes("res") || lower.includes("sil")) return "res";
  return "ops";
}

export async function getTomorrowsTasks() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dateStr = tomorrow.toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('due', dateStr)
    .neq('status', 'Abandonné')
    .order('priority', { ascending: false });

  if (error) throw error;
  return data;
}

export async function getOverdueTasks() {
  const today = new Date().toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .lt('due', today)
    .in('status', ['À faire', 'En cours'])
    .order('due', { ascending: true });

  if (error) throw error;
  return data;
}

export async function getTasksByDateRange(startDate, endDate) {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .gte('due', startDate)
    .lte('due', endDate)
    .neq('status', 'Abandonné')
    .order('due', { ascending: true });

  if (error) throw error;
  return data;
}

export async function createTask(task) {
  // Generate a unique ID
  const { data: existing } = await supabase.from('tasks').select('id');
  const count = existing?.length || 0;
  const id = "T" + String(count + 1).padStart(3, "0") + "_bot";

  const mapped = {
    id,
    name: task.title || task.name || "Tâche sans nom",
    dept: task.dept || mapDept(task.department_name),
    status: mapStatus(task.status),
    priority: mapPriority(task.priority),
    due: task.due_date || task.due || new Date().toISOString().split('T')[0],
    estH: task.estimated_hours || task.estH || 1,
    passedH: 0,
    temp: 2,
    notes: task.description || task.notes || "",
    project: task.project || "",
  };

  const { data, error } = await supabase
    .from('tasks')
    .insert(mapped)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateTaskStatus(taskId, status) {
  const { data, error } = await supabase
    .from('tasks')
    .update({ status: mapStatus(status) })
    .eq('id', taskId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getAllProjects() {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('status', 'En cours')
    .order('endDate', { ascending: true });

  if (error) throw error;
  return data;
}

export async function getWeeklyTimeByDepartment() {
  const today = new Date();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay());

  const { data, error } = await supabase
    .from('tasks')
    .select('passedH, dept')
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

export async function getSession(chatId) {
  const { data } = await supabase
    .from('bot_sessions')
    .select('context')
    .eq('chat_id', chatId)
    .single();
  return data?.context || [];
}

export async function saveSession(chatId, context) {
  const trimmed = context.slice(-10);
  await supabase
    .from('bot_sessions')
    .upsert(
      { chat_id: chatId, context: trimmed, updated_at: new Date().toISOString() },
      { onConflict: 'chat_id' }
    );
}
