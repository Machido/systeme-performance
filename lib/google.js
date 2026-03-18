import { google } from 'googleapis';

function getOAuthClient() {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );
  oauth2Client.setCredentials({
    refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
  });
  return oauth2Client;
}

export async function getRecentActionableEmails() {
  const auth = getOAuthClient();
  const gmail = google.gmail({ version: 'v1', auth });

  const since = new Date();
  since.setHours(since.getHours() - 24);
  const query = `is:unread after:${Math.floor(since.getTime() / 1000)} -category:promotions -category:social -label:newsletter`;

  const listRes = await gmail.users.messages.list({
    userId: 'me',
    q: query,
    maxResults: 20,
  });

  if (!listRes.data.messages?.length) return [];

  const emails = await
