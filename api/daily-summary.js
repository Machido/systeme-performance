import { sendToOwner } from '../lib/telegram.js';
import { generateDailySummary } from '../lib/claude.js';
import { getTomorrowsTasks, getOverdueTasks } from '../lib/supabase.js';
import { getTomorrowsEvents, getRecentActionableEmails } from '../lib/google.js';

export default async function handler(req, res) {
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const [tasks, overdue, events, emails] = await Promise.all([
      getTomorrowsTasks(),
      getOverdueTasks(),
      getTomorrowsEvents(),
      getRecentActionableEmails(),
    ]);

    const summary = await generateDailySummary({ tasks, events, emails, overdue });

    await sendToOwner(`🌅 *Briefing du ${new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}*\n\n${summary}`);

    return res.status(200).json({ ok: true, tasks: tasks.length, events: events.
