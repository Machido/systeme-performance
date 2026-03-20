import { sendMessage } from '../lib/telegram.js';
import { chat, extractActionsFromResponse } from '../lib/claude.js';
import {
  getSession, saveSession,
  createTask, getTomorrowsTasks, getOverdueTasks, getAllProjects,
  createJournalEntry, getRecentJournal,
  createProject,
  createObjective, getAllObjectives,
  createKpi,
} from '../lib/supabase.js';

const ACTION_LABELS = {
  create_task: '✅ Tâche créée',
  create_journal: '📝 Entrée journal créée',
  create_project: '📁 Projet créé',
  create_objective: '🎯 Objectif créé',
  create_kpi: '📊 KPI créé',
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  try {
    const { message } = req.body;
    if (!message?.text) return res.status(200).json({ ok: true });

    const chatId = message.chat.id.toString();
    const userText = message.text.trim();
    const history = await getSession(chatId);

    // ── Commands ──
    if (userText === '/start') {
      await sendMessage(chatId,
        `👋 *Bonjour Martin !*\n\nJe suis ton assistant Système Performance.\n\nJe peux créer et consulter :\n• ✅ Tâches\n• 📝 Entrées journal (notes, idées, obstacles)\n• 📁 Projets\n• 🎯 Objectifs\n• 📊 KPIs\n\nCommandes rapides :\n/taches — tâches de demain\n/retards — tâches en retard\n/projets — projets actifs\n/journal — dernières entrées\n\nOu dis-moi simplement ce dont tu as besoin !`
      );
      return res.status(200).json({ ok: true });
    }

    if (userText === '/taches') {
      const tasks = await getTomorrowsTasks();
      if (!tasks.length) {
        await sendMessage(chatId, '📋 Aucune tâche planifiée pour demain.');
      } else {
        const lines = tasks.map(t => {
          const icon = { Haute: '🔴', Moyenne: '🟡', Basse: '🟢' }[t.priority] || '🟡';
          return `${icon} ${t.name} _(${t.dept})_`;
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
        const lines = overdue.map(t => `🔴 *${t.name}* — due le ${t.due} _(${t.dept})_`);
        await sendMessage(chatId, `⚠️ *Tâches en retard :*\n\n${lines.join('\n')}`);
      }
      return res.status(200).json({ ok: true });
    }

    if (userText === '/projets') {
      const projects = await getAllProjects();
      if (!projects.length) {
        await sendMessage(chatId, '🗂 Aucun projet actif.');
      } else {
        const lines = projects.map(p => `📁 *${p.name}* _(${p.dept})_${p.endDate ? `\n   📅 ${p.endDate}` : ''}`);
        await sendMessage(chatId, `🗂 *Projets actifs :*\n\n${lines.join('\n\n')}`);
      }
      return res.status(200).json({ ok: true });
    }

    if (userText === '/journal') {
      const entries = await getRecentJournal(5);
      if (!entries.length) {
        await sendMessage(chatId, '📝 Aucune entrée journal récente.');
      } else {
        const lines = entries.map(j => `${j.type.split(' ')[0]} *${j.title}* — ${j.date}`);
        await sendMessage(chatId, `📝 *Journal récent :*\n\n${lines.join('\n')}`);
      }
      return res.status(200).json({ ok: true });
    }

    // ── AI response ──
    const aiResponse = await chat(userText, history);
    const actions = extractActionsFromResponse(aiResponse);
    const cleanResponse = aiResponse.replace(/```json[\s\S]*?```/g, '').trim();

    if (actions.length > 0) {
      const results = [];
      for (const action of actions) {
        try {
          let created;
          if (action.action === 'create_task') {
            created = await createTask(action);
            results.push(`${ACTION_LABELS.create_task}: *${created.name}*`);
          } else if (action.action === 'create_journal') {
            created = await createJournalEntry(action);
            results.push(`${ACTION_LABELS.create_journal}: *${created.title}*`);
          } else if (action.action === 'create_project') {
            created = await createProject(action);
            results.push(`${ACTION_LABELS.create_project}: *${created.name}*`);
          } else if (action.action === 'create_objective') {
            created = await createObjective(action);
            results.push(`${ACTION_LABELS.create_objective}: *${created.name}*`);
          } else if (action.action === 'create_kpi') {
            created = await createKpi(action);
            results.push(`${ACTION_LABELS.create_kpi}: *${created.label}*`);
          }
        } catch (err) {
          console.error(`Action ${action.action} failed:`, err);
          results.push(`⚠️ Erreur lors de la création (${action.action})`);
        }
      }
      const confirmMsg = results.join('\n');
      await sendMessage(chatId, `${cleanResponse}\n\n${confirmMsg}`);
    } else {
      await sendMessage(chatId, cleanResponse || aiResponse);
    }

    const updatedHistory = [
      ...history,
      { role: 'user', content: userText },
      { role: 'assistant', content: aiResponse },
    ];
    await saveSession(chatId, updatedHistory);

    return res.status(200).json({ ok: true });

  } catch (error) {
    console.error('Webhook error:', error);
    return res.status(200).json({ ok: true });
  }
}
