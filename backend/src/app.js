import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { logger } from './lib/logger.js';
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/users.routes.js';
import postRoutes from './routes/posts.routes.js';
import subscriptionRoutes from './routes/subscriptions.routes.js';
import tipRoutes from './routes/tips.routes.js';
import notificationRoutes from './routes/notifications.routes.js';
import exploreRoutes from './routes/explore.routes.js';
import walletRoutes from './routes/wallet.routes.js';
import { startJobs } from './jobs/index.js';

const app = express();
const PORT = process.env.PORT || 4000;

// ── Security ──────────────────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
}));

// ── Body parsing ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// ── Request logging ───────────────────────────────────────────────────────────
app.use((req, _res, next) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/auth',          authRoutes);
app.use('/api/users',         userRoutes);
app.use('/api/posts',         postRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/tips',          tipRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/explore',       exploreRoutes);
app.use('/api/wallet',        walletRoutes);

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => res.json({ status: 'ok', ts: new Date().toISOString() }));

// ── 404 ───────────────────────────────────────────────────────────────────────
app.use((_req, res) => res.status(404).json({ error: 'Not found' }));

// ── Global error handler ──────────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  logger.error(err.stack || err.message);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  logger.info(`LiteSocial API running on port ${PORT}`);
  startJobs();
});

export default app;
