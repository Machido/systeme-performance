const TELEGRAM_API = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}`;

export async function sendMessage(chatId, text, options = {}) {
  const response = await fetch(`${TELEGRAM_API}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: 'Markdown',
      ...options,
    }),
  });
  const data = await response.json();
  if (!data.ok) console.error('Telegram sendMessage error:', data);
  return data;
}

export async function sendToOwner(text) {
  return sendMessage(process.env.TELEGRAM_CHAT_ID, text);
}

export async function setWebhook(url) {
  const response = await fetch(`${TELEGRAM_API}/setWebhook`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  });
  return response.json();
}

export function formatTask(task) {
  const priority = { urgent: '🔴', high: '🟠', medium: '🟡', low: '🟢' };
  const icon = priority[task.priority] || '🟡';
  const dept = task.department_name || '';
  return `${icon} *${task.title}*\n   📁 ${dept}${task.description ? `\n   ${task.description}` : ''}`;
}

export function formatDate(dateStr) {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
}

export function minutesToHours(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}min`;
  if (m === 0) return `${h}h`;
  return `${h}h${m.toString().padStart(2, '0')}`;
}
