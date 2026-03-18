import { sendMessage } from '../lib/telegram.js';
import { chat, extractTaskFromResponse } from '../lib/claude.js';
import { getSession, saveSession, createTask, getTomorrowsTasks, getOverdueTasks, getAllProjects } from '../lib/supabase.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  try {
    const { message } = req.body;
    if (!message?.text) return res.status(200).json({ ok: true });

    const chatId = message.chat.id.toString();
    const userText = message.text.trim();

    // Load conversation history for context
    const history = await getSession(chatId);

    // Handle special commands
    if (userText === '/start') {
      await sendMessage(chatId,
        `👋 *Bonjour Martin !*\n\nJe suis ton assistant Système Performance.\n\nJe peux :\n• 📋 Gérer tes tâches\n• 📅 Résumer ta journée de demain\n• 🗂 Faire le point sur tes projets\n• ⏰ Te signaler les retards\n\nDis-moi simplement ce dont tu as besoin !`
      );
      return res.status(200).json({ ok: true });
    }

    if (userText === '/taches') {
      const tasks = await getTomorrowsTasks();
      if (!tasks.length) {
        await sendMessage(chatId, '📋 Aucune tâche planifiée pour demain.');
      } else {
        const lines = tasks.map(t => {
          const icon = { urgent: '🔴', high: '🟠', medium: '🟡', low: '🟢' }[t.priority] || '🟡';
          return `${icon} ${t.title} _(${t.departments?.name || 'non classé'})_`;
        });
        await sendMessage(chatId, `📋 *Tâches de demain :*\n\n${lines.join('\n')}`);
      }
      return res.status(200).json({ ok: true });
    }

    if (userText === '/retards') {
      const overdue = await getOverdueTasks();
      if (!overdue.length) {
        await sendMessage(chatId, '✅ Aucune tâche en retard. Bravo !');
      } else {
        const lines = overdue.map(t => `🔴 *${t.title}* — due le ${t.due_date} _(${t.departments?.name || ''})_`);
        await sendMessage(chatId, `⚠️ *Tâches en retard :*\n\n${lines.join('\n')}`);
      }
      return res.status(200).json({ ok: true });
    }

    if (userText === '/projets') {
      const projects = await getAllProjects();
      if (!projects.length) {
        await sendMessage(chatId, '🗂 Aucun projet actif.');
      } else {
        const lines = projects.map(p => `📁 *${p.name}* _(${p.departments?.name || ''})_${p.end_date ? `\n   📅 Échéance: ${p.end_date}` : ''}`);
        await sendMessage(chatId, `🗂 *Projets actifs :*\n\n${lines.join('\n\n')}`);
      }
      return res.status(200).json({ ok: true });
    }

    // Free-form AI conversation
    const aiResponse = await chat(userText, history);

    // Check if AI wants to create a task
    const taskData = extractTaskFromResponse(aiResponse);
    if (taskData) {
      try {
        const created = await createTask({ ...taskData, source: 'telegram' });
        const cleanResponse = aiResponse.replace(/```json[\s\S]*?```/g, '').trim();
        await sendMessage(chatId, `${cleanResponse}\n\n✅ *Tâche créée :* ${created.title}`);
      } catch (err) {
        console.error('Task creation error:', err);
        await sendMessage(chatId, aiResponse.replace(/```json[\s\S]*?```/g, '').trim());
      }
    } else {
      await sendMessage(chatId, aiResponse);
    }

    // Save updated conversation history
    const updatedHistory = [
      ...history,
      { role: 'user', content: userText },
      { role: 'assistant', content: aiResponse },
    ];
    await saveSession(chatId, updatedHistory);

    return res.status(200).json({ ok: true });

  } catch (error) {
    console.error('Webhook error:', error);
    return res.status(200).json({ ok: true }); // Always 200 to Telegram
  }
}
