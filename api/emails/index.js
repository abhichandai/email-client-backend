import { Router } from 'express';
import { fetchGmailEmails, sendGmailEmail } from '../../lib/gmail.js';
import { fetchOutlookEmails, sendOutlookEmail } from '../../lib/outlook.js';
import { prioritizeEmails, updatePriorityRules, getPriorityRules } from '../../lib/prioritizer.js';

export const emailsRouter = Router();

// Fetch and prioritize emails from all connected accounts
emailsRouter.post('/inbox', async (req, res) => {
  const { accounts } = req.body;

  try {
    let allEmails = [];

    for (const account of accounts) {
      try {
        if (account.provider === 'gmail') {
          const emails = await fetchGmailEmails(account.tokens);
          allEmails = allEmails.concat(emails.map(e => ({ ...e, accountEmail: account.email })));
        } else if (account.provider === 'outlook') {
          const emails = await fetchOutlookEmails(account.tokens);
          allEmails = allEmails.concat(emails.map(e => ({ ...e, accountEmail: account.email })));
        }
      } catch (accountErr) {
        console.error(`Error fetching emails for ${account.email}:`, accountErr.message);
        return res.status(500).json({ 
          error: `Gmail API error for ${account.email}: ${accountErr.message}`,
          emails: []
        });
      }
    }

    allEmails.sort((a, b) => new Date(b.date) - new Date(a.date));
    const prioritized = await prioritizeEmails(allEmails);
    res.json({ emails: prioritized });
  } catch (err) {
    console.error('Inbox error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Send email
emailsRouter.post('/send', async (req, res) => {
  const { provider, tokens, to, subject, body, threadId } = req.body;
  try {
    if (provider === 'gmail') {
      await sendGmailEmail(tokens, { to, subject, body, threadId });
    } else if (provider === 'outlook') {
      await sendOutlookEmail(tokens, { to, subject, body, threadId });
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update priority rules (user teaches the system)
emailsRouter.post('/priority-rules', (req, res) => {
  updatePriorityRules(req.body);
  res.json({ success: true, rules: getPriorityRules() });
});

// Get current priority rules
emailsRouter.get('/priority-rules', (req, res) => {
  res.json(getPriorityRules());
});
