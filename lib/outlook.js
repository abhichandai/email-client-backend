import axios from 'axios';

const GRAPH_BASE = 'https://graph.microsoft.com/v1.0';

export async function fetchOutlookEmails(tokens, maxResults = 50) {
  const { accessToken } = tokens;
  const headers = { Authorization: `Bearer ${accessToken}` };

  const res = await axios.get(`${GRAPH_BASE}/me/mailFolders/inbox/messages`, {
    headers,
    params: {
      $top: maxResults,
      $select: 'id,subject,from,receivedDateTime,bodyPreview,isRead,conversationId',
      $orderby: 'receivedDateTime desc',
    },
  });

  return res.data.value.map((msg) => ({
    id: msg.id,
    provider: 'outlook',
    from: `${msg.from?.emailAddress?.name} <${msg.from?.emailAddress?.address}>`,
    subject: msg.subject,
    date: msg.receivedDateTime,
    snippet: msg.bodyPreview,
    isRead: msg.isRead,
    threadId: msg.conversationId,
  }));
}

export async function sendOutlookEmail(tokens, { to, subject, body, threadId }) {
  const { accessToken } = tokens;
  const headers = { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' };

  await axios.post(
    `${GRAPH_BASE}/me/sendMail`,
    {
      message: {
        subject,
        body: { contentType: 'Text', content: body },
        toRecipients: [{ emailAddress: { address: to } }],
        ...(threadId ? { conversationId: threadId } : {}),
      },
    },
    { headers }
  );
}
