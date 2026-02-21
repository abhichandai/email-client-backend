import { google } from 'googleapis';

function getOAuthClient(tokens) {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GMAIL_CLIENT_ID,
    process.env.GMAIL_CLIENT_SECRET,
    process.env.GMAIL_REDIRECT_URI
  );
  oauth2Client.setCredentials(tokens);
  return oauth2Client;
}

export async function fetchGmailEmails(tokens, maxResults = 50) {
  const auth = getOAuthClient(tokens);
  const gmail = google.gmail({ version: 'v1', auth });

  const listRes = await gmail.users.messages.list({
    userId: 'me',
    maxResults,
    labelIds: ['INBOX'],
  });

  const messages = listRes.data.messages || [];

  const emails = await Promise.all(
    messages.map(async (msg) => {
      const detail = await gmail.users.messages.get({
        userId: 'me',
        id: msg.id,
        format: 'metadata',
        metadataHeaders: ['From', 'Subject', 'Date'],
      });

      const headers = detail.data.payload.headers;
      const get = (name) => headers.find((h) => h.name === name)?.value || '';

      return {
        id: msg.id,
        provider: 'gmail',
        from: get('From'),
        subject: get('Subject'),
        date: get('Date'),
        snippet: detail.data.snippet,
        isRead: !detail.data.labelIds?.includes('UNREAD'),
        threadId: detail.data.threadId,
      };
    })
  );

  return emails;
}

export async function sendGmailEmail(tokens, { to, subject, body, threadId }) {
  const auth = getOAuthClient(tokens);
  const gmail = google.gmail({ version: 'v1', auth });

  const raw = btoa(
    `To: ${to}\r\nSubject: ${subject}\r\nContent-Type: text/plain; charset=utf-8\r\n\r\n${body}`
  ).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

  await gmail.users.messages.send({
    userId: 'me',
    requestBody: {
      raw,
      ...(threadId ? { threadId } : {}),
    },
  });
}
