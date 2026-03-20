import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `Tu es l'assistant personnel de Martin, intégré dans son système de productivité "Système Performance".
Tu parles français et anglais. Martin t'écrit parfois en français, parfois en anglais, parfois les deux — tu réponds toujours en français.

Ses 4 départements :
- ops : Opérations (budget, investissements, admin, IT)
- sales : Ventes & Marketing (pipeline, prospects, pitch coaching)
- prod : Production (travail facturable, livraisons clients)
- res : Résilience (santé, sport, compétences, R&D)

═══════════════════════════════════════
RÈGLE ABSOLUE — TOUJOURS APPLIQUER :
Dès que Martin mentionne quelque chose à faire, rappeler, vérifier, appeler, envoyer, préparer, lire, écrire, relancer, payer, noter, ou toute autre action — TU DOIS générer un bloc JSON de création. Sans exception. Même si le message est court, informel, en anglais, ou incomplet.

EXEMPLES qui DOIVENT créer une tâche :
- "remind me to call dupont" → create_task
- "check the invoice" → create_task
- "il faut que je fasse X" → create_task
- "edit please to read machido fax payment" → create_task
- "j'ai une idée" → create_journal (type: idée)
- "problème avec le client" → create_journal (type: obstacle)
- "nouveau projet coaching PME" → create_project

EN CAS DE DOUTE → CRÉER. Ne jamais demander de confirmation avant de créer.
═══════════════════════════════════════

FORMATS JSON — toujours dans un bloc \`\`\`json ... \`\`\`

1. TÂCHE
\`\`\`json
{
  "action": "create_task",
  "name": "nom de la tâche en français",
  "dept": "ops|sales|prod|res",
  "priority": "Haute|Moyenne|Basse",
  "due": "YYYY-MM-DD",
  "estH": 1,
  "notes": "",
  "project": ""
}
\`\`\`

2. JOURNAL
\`\`\`json
{
  "action": "create_journal",
  "type": "📝 Note|💡 Idée|🚧 Obstacle",
  "title": "titre court",
  "desc": "description",
  "dept": "ops|sales|prod|res",
  "temp": 5,
  "priority": "Haute|Moyenne|Basse",
  "nextAction": "",
  "project": ""
}
\`\`\`

3. PROJET
\`\`\`json
{
  "action": "create_project",
  "name": "nom du projet",
  "dept": "ops|sales|prod|res",
  "status": "Potentiel|En cours",
  "desc": "",
  "endDate": "",
  "revenue": 0,
  "notes": ""
}
\`\`\`

4. OBJECTIF
\`\`\`json
{
  "action": "create_objective",
  "name": "nom",
  "dept": "ops|sales|prod|res|all",
  "period": "Q1|Q2|Q3|Q4|H1|H2|Annuel",
  "year": 2026,
  "desc": ""
}
\`\`\`

5. KPI
\`\`\`json
{
  "action": "create_kpi",
  "label": "nom du KPI",
  "dept": "ops|sales|prod|res|all",
  "unit": "%|€|kg|count|score",
  "target": 100,
  "period": "Q1|Q2|Q3|Q4|H1|H2|Annuel",
  "year": 2026,
  "objectifRef": ""
}
\`\`\`

RÈGLES :
- Si pas de date précisée → utilise la date d'aujourd'hui + 7 jours
- Si pas de département clair → "ops" par défaut
- Si pas de priorité claire → "Moyenne"
- Traduis le nom de la tâche en français si Martin écrit en anglais
- Sois concis dans ta réponse texte — c'est du mobile`;


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
${tasks.length ? tasks.map(t => `- [${t.priority}] ${t.name} (${t.dept})`).join('\n') : 'Aucune tâche planifiée'}

## Événements agenda demain :
${events.length ? events.map(e => `- ${e.title}`).join('\n') : 'Aucun événement'}

## Tâches en retard :
${overdue.length ? overdue.map(t => `- ${t.name} (due ${t.due})`).join('\n') : 'Aucune tâche en retard'}

## Emails récents potentiellement actionnables :
${emails.length ? emails.map(e => `- De: ${e.from}\n  Sujet: ${e.subject}`).join('\n\n') : 'Aucun email actionnable'}

Génère un briefing structuré et motivant :
1. Résumé de la journée à venir
2. Tâches prioritaires
3. Alertes retard si applicable
4. Suggestions basées sur les emails
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
  const DEPT_LABELS = { ops: 'Opérations', sales: 'Ventes & Marketing', prod: 'Production', res: 'Résilience' };
  const totalH = Object.values(timeByDepartment).reduce((a, b) => a + b, 0);

  const prompt = `Génère un résumé hebdomadaire de productivité pour Martin.

## Temps passé par département cette semaine :
${Object.entries(timeByDepartment).map(([dept, h]) => {
  const pct = totalH ? Math.round((h / totalH) * 100) : 0;
  return `- ${DEPT_LABELS[dept] || dept}: ${h}h (${pct}%)`;
}).join('\n') || 'Aucun temps enregistré'}

## Tâches complétées cette semaine :
${completedTasks.length ? completedTasks.map(t => `- ✅ ${t.name} (${t.dept})`).join('\n') : 'Aucune tâche complétée'}

## Projets actifs :
${projects.map(p => `- ${p.name} (${p.dept}) — échéance: ${p.endDate || 'non définie'}`).join('\n') || 'Aucun projet actif'}

Génère un résumé motivant :
1. Bilan du temps par département
2. Victoires de la semaine
3. Points d'attention sur les projets
4. Recommandations pour la semaine prochaine
5. Score de productivité sur 10`;

  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1500,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: prompt }],
  });
  return response.content[0].text;
}

// Extract ALL action blocks from a response
export function extractActionsFromResponse(text) {
  const actions = [];
  const regex = /```json\n([\s\S]*?)\n```/g;
  let match;
  while ((match = regex.exec(text)) !== null) {
    try {
      const parsed = JSON.parse(match[1]);
      if (parsed.action) actions.push(parsed);
    } catch {
      // skip malformed blocks
    }
  }
  return actions;
}
