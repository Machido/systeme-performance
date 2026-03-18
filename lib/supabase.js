import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

export async function getTomorrowsTasks() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dateStr = tomorrow.toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('bot_tasks')
    .select('*')
    .eq('due_date', dateStr)
    .neq('status', 'cancelled')
    .order('priority', { ascending: false });

  if (error) throw error;
  return data;
}

export async function getOverdueTasks() {
  const today = new Date().toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('bot_tasks')
    .select('*')
    .lt('due_date', today)
    .in('status', ['todo', 'in_progress'])
    .order('due_date', { ascending: true });

  if (error) throw error;
  return data;
}

export async function getTasksByDateRange(startDate, endDate) {
  const { data, error } = await supabase
    .from('bot_tasks')
    .select('*')
    .gte('due_date', startDate)
    .lte('due_date', endDate)
    .neq('status', 'cancelled')
    .order('due_date', { ascending: true });

  if (error) throw error;
  return data;
}

export async function createTask(task) {
  const { data, error } = await supabase
    .from('bot_tasks')
    .insert(task)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateTaskStatus(taskId, status) {
  const { data, error } = await supabase
    .from('bot_tasks')
    .update({ status })
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
    .eq('status', 'Actif')
    .order('endDate', { ascending: true });

  if (error) throw error;
  return data;
}

export async function getWeeklyTimeByDepartment() {
  const today = new Date();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay());
  const endOfWeek = new Date(today);

  const { data, error } = await supabase
    .from('time_logs')
    .select('minutes, department_name')
    .gte('logged_date', startOfWeek.toISOString().split('T')[0])
    .lte('logged_date', endOfWeek.toISOString().split('T')[0]);

  if (error) throw error;

  const summary = {};
  for (const log of data) {
    const dept = log.department_name || 'Non classé';
    summary[dept] = (summary[dept] || 0) + log.minutes;
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
