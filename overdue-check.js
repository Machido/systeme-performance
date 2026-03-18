import { sendToOwner } from '../lib/telegram.js';
import { getOverdueTasks } from '../lib/supabase.js';

export default async function handler(req, res) {
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const overdue = await getOverdueTasks();

    if (overdue.length === 0) {
      // No message needed if nothing is overdue
      return res.status(200).json({ ok: true, overdue: 0 });
    }

    const lines = overdue.map(t => {
      const daysLate = Math.floor((new Date() - new Date(t.due_date)) / (1000 * 60 * 60 * 24));
      return `🔴 *${t.title}*\n   📁 ${t.departments?.name || 'non classé'} · retard: ${daysLate}j`;
    });

    await sendToOwner(
      `⚠️ *${overdue.length} tâche${overdue.length > 1 ? 's' : ''} en retard :*\n\n${lines.join('\n\n')}\n\nRéponds-moi pour les reprogrammer ou les marquer comme terminées.`
    );

    return res.status(200).json({ ok: true, overdue: overdue.length });

  } catch (error) {
    console.error('Overdue check error:', error);
    return res.status(500).json({ error: error.message });
  }
}
