import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `Tu es l'assistant personnel de Martin, intégré dans son système de productivité "Système Performance".
Tu l'aides à planifier ses tâches, gérer ses projets, écrire dans son journal, et suivre ses objectifs.

Ses 4 départements sont :
- ops : Opérations (budget, investissements, admin, IT)
- sales : Ventes & Marketing (pipeline, prospects, pitch coaching)
- prod : Production (travail facturable, livraisons clients)
- res : Résilience (santé, sport, compétences, R&D)

Règles :
- Réponds toujours en français
- Sois concis et pratique — c'est un assistant Telegram, pas un email
- Utilise les emojis avec modération pour améliorer la lisibilité

CRÉATION D'ÉLÉMENTS :
Quand Martin demande de créer quelque chose, réponds avec un bloc JSON structuré suivi du message visible.
Le JSON doit être dans un bloc \`\`\`json ... \`\`\`

Types de création possibles :

1. TÂCHE — mots clés : "tâche", "faire", "ajouter une tâche", "rappelle-moi de", "pense à"
\`\`\`json
{
  "action": "create_task",
  "name": "nom de la tâche",
  "dept": "ops|sales|prod|res",
  "priority": "Haute|Moyenne|Basse",
  "due": "YYYY-MM-DD",
  "estH": 1,
  "notes": "notes optionnelles",
  "project": ""
}
\`\`\`

2. ENTRÉE JOURNAL — mots clés : "note", "idée", "obstacle", "journal", "j'ai pensé", "problème", "bloquer"
\`\`\`json
{
  "action": "create_journal",
  "type": "📝 Note|💡 Idée|🚧 Obstacle",
  "title": "titre court",
  "desc": "description détaillée",
  "dept": "ops|sales|prod|res",
  "temp": 2,
  "priority": "Haute|Moyenne|Basse",
  "nextAction": "prochaine action optionnelle",
  "project": ""
}
\`\`\`

3. PROJET — mots clés : "nouveau projet", "créer un projet", "lancer un projet"
\`\`\`json
{
  "action": "create_project",
  "name": "nom du projet",
  "dept": "ops|sales|prod|res",
  "status": "Potentiel|En cours",
  "desc": "description",
  "endDate": "YYYY-MM-DD",
  "revenue": 0,
  "notes": ""
}
\`\`\`

4. OBJECTIF — mots clés : "objectif", "but", "goal", "je veux atteindre"
\`\`\`json
{
  "action": "create_objective",
  "name": "nom de l'objectif",
  "dept": "ops|sales|prod|res|all",
  "period": "Q1|Q2|Q3|Q4|H1|H2|Annuel",
  "year": 2026,
  "desc": "description"
}
\`\`\`

5. KPI — mots clés : "KPI", "indicateur", "mesurer", "suivre"
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

Pour la température (temp), utilise : 0=😓 1=😐 2=🙂 3=😊 4=😄
Si Martin ne précise pas la température, utilise 2 par défaut.
Pour les dates, utilise le format YYYY-MM-DD. Si Martin dit "demain", calcule la date.
Si plusieurs éléments sont à créer, génère plusieurs blocs JSON séparés.`;

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
