import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `Tu es l'assistant personnel de Martin, intégré dans son système de productivité "Système Performance".
Tu l'aides à planifier ses tâches, gérer ses projets et optimiser son temps.

Ses 4 départements sont :
- Opérations
- Ventes & Marketing
- Production
- Résilience

Règles :
- Réponds toujours en français
- Sois concis et pratique — c'est un assistant Telegram, pas un email
- Utilise les emojis avec modération pour améliorer la lisibilité
- Quand tu identifies une tâche dans un email, précise le département probable
- Pour créer une tâche, réponds avec un JSON structuré dans un bloc \`\`\`json ... \`\`\` suivi du message visible
- Format des dates : DD/MM/YYYY`;

export async function chat(userMessage, conversationHistory = []) {
  const messages = [
    ...conversationHistory,
    { role: 'user', content: userMessage },
  ];
  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages,
  });
  return response.content[0].text;
}

export async function generateDailySummary({ tasks, events, emails, overdue }) {
  const prompt = `Génère un briefing quotidien pour Martin pour demain.

## Tâches prévues demain :
${tasks.length ? tasks.map(t => `- [${t.priority}] ${t.title} (${t.department_name || 'non classé'})`).join('\n') : 'Aucune tâche planifiée'}

## Événements agenda demain :
${events.length ? events.map(e => `- ${formatTime(e.start)} : ${e.title}`).join('\n') : 'Aucun événement'}

## Tâches en retard :
${overdue.length ? overdue.map(t => `- ${t.title} (due ${t.due_date})`).join('\n') : 'Aucune tâche en retard'}

## Emails récents potentiellement actionnables :
${emails.length ? emails.map(e => `- De: ${e.from}\n  Sujet: ${e.subject}\n  Aperçu: ${e.snippet}`).join('\n\n') : 'Aucun email actionnable'}

Génère un briefing structuré et motivant. Inclure :
1. Résumé de la journée à venir
2. Tâches prioritaires
3. Alertes retard si applicable
4. Suggestions basées sur les emails (avec département probable)
5. Une phrase d'encouragement courte

Sois concis — c'est pour lire sur mobile.`;

  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1500,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: prompt }],
  });
  return response.content[0].text;
}

export async function generateWeeklySummary({ timeByDepartment, projects, completedTasks }) {
  const totalMinutes = Object.values(timeByDepartment).reduce((a, b) => a + b, 0);

  const prompt = `Génère un résumé hebdomadaire de productivité pour Martin.

## Temps passé par département cette semaine :
${Object.entries(timeByDepartment).map(([dept, mins]) => {
  const pct = totalMinutes ? Math.round((mins / totalMinutes) * 100) : 0;
  return `- ${dept}: ${Math.floor(mins / 60)}h${(mins % 60).toString().padStart(2, '0')} (${pct}%)`;
}).join('\n') || 'Aucun temps enregistré'}

## Tâches complétées cette semaine :
${completedTasks.length ? completedTasks.map(t => `- ✅ ${t.title} (${t.department_name})`).join('\n') : 'Aucune tâche complétée'}

## Projets actifs :
${projects.map(p => `- ${p.name} (${p.dept}) — échéance: ${p.endDate || 'non définie'}`).join('\n') || 'Aucun projet actif'}

Génère un résumé hebdomadaire motivant avec :
1. Bilan du temps par département (avec commentaire sur l'équilibre)
2. Victoires de la semaine
3. Points d'attention sur les projets actifs
4. Recommandations pour la semaine prochaine
5. Score de productivité sur 10 avec justification`;

  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1500,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: prompt }],
  });
  return response.content[0].text;
}

export function extractTaskFromResponse(text) {
  const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/);
  if (!jsonMatch) return null;
  try {
    return JSON.parse(jsonMatch[1]);
  } catch {
    return null;
  }
}

function formatTime(dateStr) {
  if (!dateStr) return '';
  try {
    return new Date(dateStr).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return dateStr;
  }
}
