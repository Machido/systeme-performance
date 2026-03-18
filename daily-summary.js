import { sendToOwner } from '../lib/telegram.js';
import { generateDailySummary } from '../lib/claude.js';
import { getTomorrowsTasks, getOverdueTasks } from '../lib/supabase.js';
import { getTomorrowsEvents, getRecentActionableEmails } from '../lib/google.js';

export default async function handler(req, res) {
  // Secure the cron endpoint
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // Gather all data in parallel
    const [tasks, overdue, events, emails] = await Promise.all([
      getTomorrowsTasks(),
      getOverdueTasks(),
      getTomorrowsEvents(),
      getRecentActionableEmails(),
    ]);

    // Generate AI summary
    const summary = await generateDailySummary({ tasks, events, emails, overdue });

    // Send to Telegram
    await sendToOwner(`🌅 *Briefing du ${new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}*\n\n${summary}`);

    return res.status(200).json({ ok: true, tasks: tasks.length, events: events.length, emails: emails.length });

  } catch (error) {
    console.error('Daily summary error:', error);
    await sendToOwner(`⚠️ Erreur lors de la génération du briefing quotidien.\n\`${error.message}\``);
    return res.status(500).json({ error: error.message });
  }
}
