import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { gmailAuthRouter } from './api/auth/gmail.js';
import { outlookAuthRouter } from './api/auth/outlook.js';
import { emailsRouter } from './api/emails/index.js';

dotenv.config();

const app = express();
app.use(cors({ origin: process.env.FRONTEND_URL || '*', credentials: true }));
app.use(express.json());

app.use('/auth/gmail', gmailAuthRouter);
app.use('/auth/outlook', outlookAuthRouter);
app.use('/emails', emailsRouter);

app.get('/health', (req, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
