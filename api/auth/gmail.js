import { Router } from 'express';
import { google } from 'googleapis';

export const gmailAuthRouter = Router();

function getOAuthClient() {
  return new google.auth.OAuth2(
    process.env.GMAIL_CLIENT_ID,
    process.env.GMAIL_CLIENT_SECRET,
    process.env.GMAIL_REDIRECT_URI
  );
}

// Step 1: Redirect user to Google login
gmailAuthRouter.get('/login', (req, res) => {
  const { accountId } = req.query;
  const oauth2Client = getOAuthClient();
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: [
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/gmail.send',
      'https://www.googleapis.com/auth/userinfo.email',
    ],
    state: accountId || 'default',
  });
  res.redirect(url);
});

// Step 2: Handle callback from Google
gmailAuthRouter.get('/callback', async (req, res) => {
  const { code, state } = req.query;
  const oauth2Client = getOAuthClient();
  try {
    const { tokens } = await oauth2Client.getToken(code);
    // In production, store tokens securely (DB). For now, send to frontend.
    const redirectUrl = `${process.env.FRONTEND_URL}/auth/callback?provider=gmail&tokens=${encodeURIComponent(JSON.stringify(tokens))}&accountId=${state}`;
    res.redirect(redirectUrl);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get user info (to display account email)
gmailAuthRouter.post('/userinfo', async (req, res) => {
  const { tokens } = req.body;
  const oauth2Client = getOAuthClient();
  oauth2Client.setCredentials(tokens);
  try {
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const { data } = await oauth2.userinfo.get();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
