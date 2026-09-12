import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { logger } from './lib/logger';

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: process.env.VITE_API_BASE_URL
      ? [process.env.VITE_API_BASE_URL.replace('/api/v1', '')]
      : '*',
    credentials: true,
  }),
);
app.use(express.json());
app.use(cookieParser());

// Request logging middleware
app.use((req, res, next) => {
  logger.info({ method: req.method, url: req.url }, 'Incoming request');
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Routes will be mounted here

export default app;
