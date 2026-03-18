import { sendToOwner } from '../lib/telegram.js';
import { generateWeeklySummary } from '../lib/claude.js';
import { getWeeklyTimeByDepartment, getAllProjects, getTasksByDateRange } from '../lib/supabase.js';

export default async function handler(req, res) {
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // Get this week's date range
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    const endOfWeek = new Date(today);

    const [timeByDepartment, projects, allTasks] = await Promise.all([
      getWeeklyTimeByDepartment(),
      getAllProjects(),
      getTasksByDateRange(
        startOfWeek.toISOString().split('T')[0],
        endOfWeek.toISOString().split('T')[0]
      ),
    ]);

    const completedTasks = allTasks.filter(t => t.status === 'done');

    const summary = await generateWeeklySummary({ timeByDepartment, projects, completedTasks });

    await sendToOwner(`📊 *Bilan hebdomadaire — Semaine du ${startOfWeek.toLocaleDateString('fr-FR')}*\n\n${summary}`);

    return res.status(200).json({ ok: true });

  } catch (error) {
    console.error('Weekly summary error:', error);
    await sendToOwner(`⚠️ Erreur lors du bilan hebdomadaire.\n\`${error.message}\``);
    return res.status(500).json({ error: error.message });
  }
}
