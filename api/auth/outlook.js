import { Router } from 'express';
import { ConfidentialClientApplication } from '@azure/msal-node';

export const outlookAuthRouter = Router();

function getMsalClient() {
  return new ConfidentialClientApplication({
    auth: {
      clientId: process.env.OUTLOOK_CLIENT_ID,
      clientSecret: process.env.OUTLOOK_CLIENT_SECRET,
      authority: `https://login.microsoftonline.com/common`,
    },
  });
}

const SCOPES = ['Mail.Read', 'Mail.Send', 'User.Read', 'offline_access'];

// Step 1: Redirect to Microsoft login
outlookAuthRouter.get('/login', async (req, res) => {
  const { accountId } = req.query;
  const msalClient = getMsalClient();
  try {
    const url = await msalClient.getAuthCodeUrl({
      scopes: SCOPES,
      redirectUri: process.env.OUTLOOK_REDIRECT_URI,
      state: accountId || 'default',
    });
    res.redirect(url);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Step 2: Handle callback from Microsoft
outlookAuthRouter.get('/callback', async (req, res) => {
  const { code, state } = req.query;
  const msalClient = getMsalClient();
  try {
    const result = await msalClient.acquireTokenByCode({
      code,
      scopes: SCOPES,
      redirectUri: process.env.OUTLOOK_REDIRECT_URI,
    });
    const tokens = {
      accessToken: result.accessToken,
      account: result.account,
    };
    const redirectUrl = `${process.env.FRONTEND_URL}/auth/callback?provider=outlook&tokens=${encodeURIComponent(JSON.stringify(tokens))}&accountId=${state}`;
    res.redirect(redirectUrl);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
