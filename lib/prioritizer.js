import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Priority rules the user has taught us
let userPriorityRules = {
  importantSenders: [],
  importantDomains: [],
  importantKeywords: [],
  unimportantSenders: [],
};

export function updatePriorityRules(rules) {
  userPriorityRules = { ...userPriorityRules, ...rules };
}

export function getPriorityRules() {
  return userPriorityRules;
}

export async function prioritizeEmails(emails) {
  if (!emails.length) return [];

  const emailSummaries = emails.map((e, i) => ({
    index: i,
    from: e.from,
    subject: e.subject,
    snippet: e.snippet,
    date: e.date,
  }));

  const prompt = `You are an email prioritization assistant. 

User's priority rules:
- Important senders: ${userPriorityRules.importantSenders.join(', ') || 'none set yet'}
- Important domains: ${userPriorityRules.importantDomains.join(', ') || 'none set yet'}
- Important keywords: ${userPriorityRules.importantKeywords.join(', ') || 'none set yet'}
- Unimportant/spam senders: ${userPriorityRules.unimportantSenders.join(', ') || 'none set yet'}

General priority rules:
- HIGH: Direct personal emails, client emails, urgent matters, action required, financial/legal
- MEDIUM: Team updates, newsletters from known contacts, follow-ups
- LOW: Marketing, bulk mail, automated notifications, newsletters

Rate each email. Respond with ONLY a JSON array:
[{"index": 0, "priority": "HIGH|MEDIUM|LOW", "reason": "brief reason"}]

Emails to rate:
${JSON.stringify(emailSummaries, null, 2)}`;

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = response.content[0].text.trim();
    const parsed = JSON.parse(text.replace(/```json|```/g, '').trim());

    // Merge priority back into emails
    return emails.map((email, i) => {
      const rating = parsed.find((r) => r.index === i);
      return {
        ...email,
        priority: rating?.priority || 'MEDIUM',
        priorityReason: rating?.reason || '',
      };
    }).sort((a, b) => {
      const order = { HIGH: 0, MEDIUM: 1, LOW: 2 };
      return order[a.priority] - order[b.priority];
    });
  } catch (err) {
    console.error('AI prioritization failed:', err);
    return emails.map((e) => ({ ...e, priority: 'MEDIUM', priorityReason: '' }));
  }
}
