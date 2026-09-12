import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import pinoHttp from 'pino-http';
import { logger } from './lib/logger';
import { errorHandler } from './middleware/errorHandler';
import authRoutes from './modules/auth/auth.routes';
import usersRoutes from './modules/users/users.routes';
import locationsRoutes from './modules/locations/locations.routes';
import categoriesRoutes from './modules/categories/categories.routes';
import itemsRoutes from './modules/items/items.routes';
import batchesRoutes from './modules/batches/batches.routes';
import inventoryRoutes from './modules/inventory/inventory.routes';

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
app.use(pinoHttp({ logger }));

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Routes will be mounted here
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', usersRoutes);
app.use('/api/v1/locations', locationsRoutes);
app.use('/api/v1/categories', categoriesRoutes);
app.use('/api/v1/items', itemsRoutes);
app.use('/api/v1/batches', batchesRoutes);
app.use('/api/v1/inventory', inventoryRoutes);

// Global Error Handler
app.use(errorHandler);

export default app;
