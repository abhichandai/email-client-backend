import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { gmailAuthRouter } from './api/auth/gmail.js';
import { outlookAuthRouter } from './api/auth/outlook.js';
import { emailsRouter } from './api/emails/index.js';

dotenv.config();

const app = express();
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'https://app.mailmfer.com',
  'https://mailmfer.com',
  'http://localhost:3000',
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) callback(null, true);
    else callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));
app.use(express.json());

app.use('/auth/gmail', gmailAuthRouter);
app.use('/auth/outlook', outlookAuthRouter);
app.use('/emails', emailsRouter);

app.get('/health', (req, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
