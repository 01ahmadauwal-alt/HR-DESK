import 'dotenv/config';
import 'express-async-errors';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import path from 'path';
import fs from 'fs';

import { connectDB } from './utils/db';
import logger from './utils/logger';
import { errorHandler } from './middleware/errorHandler';

import authRoutes from './routes/auth';
import employeeRoutes from './routes/employee';
import managerRoutes from './routes/manager';
import hrRoutes from './routes/hr';
import recruitmentRoutes from './routes/recruitment';
import attendanceRoutes from './routes/attendance';
import documentRoutes from './routes/documents';
import adminRoutes from './routes/admin';
import careersRoutes from './routes/careers';

const app = express();
const PORT = process.env.PORT ?? 5000;

// Ensure upload directories exist
const UPLOAD_DIR = process.env.UPLOAD_DIR ?? 'uploads';
['payslips', 'documents', 'resumes'].forEach((d) =>
  fs.mkdirSync(path.join(UPLOAD_DIR, d), { recursive: true })
);

// ── Security & Parsing ────────────────────────────────────────────────────────
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({
  origin: process.env.FRONTEND_URL ?? 'http://localhost:5173',
  credentials: true,
}));
app.use(compression());
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Static file serving for uploads
app.use('/uploads', express.static(path.resolve(UPLOAD_DIR)));

// Rate limiting
app.use('/api/auth', rateLimit({ windowMs: 15 * 60 * 1000, max: 20, standardHeaders: true }));
app.use('/api', rateLimit({ windowMs: 1 * 60 * 1000, max: 300 }));

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/employee', employeeRoutes);
app.use('/api/manager', managerRoutes);
app.use('/api/hr', hrRoutes);
app.use('/api/recruitment', recruitmentRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/careers', careersRoutes);

app.get('/api/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date() }));

// ── Error handler ─────────────────────────────────────────────────────────────
app.use(errorHandler);

// ── Start ─────────────────────────────────────────────────────────────────────
connectDB().then(() => {
  app.listen(PORT, () => logger.info(`HR-DESK API running on port ${PORT}`));
});

export default app;
