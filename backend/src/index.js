// src/index.js  — Main entry point
require('dotenv').config();
// Local development overrides (for example, a developer-specific database).
require('dotenv').config({ path: '.env.local', override: true });

const express    = require('express');
const cors       = require('cors');
const helmet     = require('helmet');
const morgan     = require('morgan');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const hpp        = require('hpp');
const path       = require('path');
const fs         = require('fs');

const logger    = require('./config/logger');
const { pool }  = require('./config/database');
const { errorHandler, notFound } = require('./middleware/errorHandler');
const { apiLimiter } = require('./middleware/common');

// ── Route imports ─────────────────────────────────────────────
const authRoutes         = require('./routes/auth');
const { router: usersRouter, rolesRouter, permissionsRouter } = require('./routes/users');
const cmsRoutes          = require('./routes/cms');
const { router: servicesRouter, industriesRouter, solutionsRouter } = require('./routes/services');
const portfolioRoutes    = require('./routes/portfolio');
const blogRoutes         = require('./routes/blog');
const crmRoutes          = require('./routes/crm');
const { router: projectsRouter, tasksRouter, sprintsRouter, timeRouter } = require('./routes/projects');
const financeRoutes      = require('./routes/finance');
const clientsRoutes      = require('./routes/clients');
const supportRoutes      = require('./routes/support');
const hrRoutes           = require('./routes/hr');
const mediaRoutes        = require('./routes/media');
const { router: notificationsRouter } = require('./routes/notifications');
const dashboardRoutes    = require('./routes/dashboard');
const analyticsRoutes    = require('./routes/analytics');
const systemRoutes       = require('./routes/system');
const marketingRoutes    = require('./routes/marketing');
const aiRoutes           = require('./routes/ai');

// ── App init ──────────────────────────────────────────────────
const app    = express();
const PREFIX = process.env.API_PREFIX || '/api/v1';

// ── Security middleware ───────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: false, // Configure per your frontend needs
}));

app.use(cors({
  origin: (origin, cb) => {
    const allowed = [
      process.env.FRONTEND_URL,
      process.env.ADMIN_URL,
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:5173',
    ].filter(Boolean);

    if (!origin || allowed.includes(origin)) return cb(null, true);
    cb(new Error(`CORS blocked: ${origin}`));
  },
  credentials: true,
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization','X-Requested-With','X-Browser','X-OS'],
}));

app.use(hpp());       // Prevent HTTP parameter pollution
app.use(compression()); // Gzip responses

// ── Logging ───────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined', {
    stream: { write: (msg) => logger.info(msg.trim()) },
    skip: (req) => req.path === `${PREFIX}/system/health`,
  }));
}

// ── Body parsing ──────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// ── Static uploads (local dev only) ──────────────────────────
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
app.use('/uploads', express.static(uploadsDir));

// ── Global rate limiter ───────────────────────────────────────
app.use(PREFIX, apiLimiter);

// ── Trust proxy (for rate limiting by IP behind nginx/load balancer)
app.set('trust proxy', 1);

// ═══════════════════════════════════════════════════════════
//  MOUNT ROUTES
// ═══════════════════════════════════════════════════════════

// Auth & Users
app.use(`${PREFIX}/auth`,        authRoutes);
app.use(`${PREFIX}/users`,       usersRouter);
app.use(`${PREFIX}/roles`,       rolesRouter);
app.use(`${PREFIX}/permissions`, permissionsRouter);

// CMS / Content
app.use(`${PREFIX}/cms`,         cmsRoutes);
app.use(`${PREFIX}/media`,       mediaRoutes);

// Services & Products
app.use(`${PREFIX}/services`,    servicesRouter);
app.use(`${PREFIX}/industries`,  industriesRouter);
app.use(`${PREFIX}/solutions`,   solutionsRouter);

// Portfolio
app.use(`${PREFIX}/portfolio`,   portfolioRoutes);

// Blog & Resources
app.use(`${PREFIX}/blog`,        blogRoutes);

// CRM
app.use(`${PREFIX}/crm`,         crmRoutes);

// Projects & Work Management
app.use(`${PREFIX}/projects`,    projectsRouter);
app.use(`${PREFIX}/tasks`,       tasksRouter);
app.use(`${PREFIX}/sprints`,     sprintsRouter);
app.use(`${PREFIX}/time-entries`, timeRouter);
app.use(`${PREFIX}/time-tracking`, timeRouter);

// Finance
app.use(`${PREFIX}/finance`,     financeRoutes);

// Clients / Portal
app.use(`${PREFIX}/clients`,     clientsRoutes);

// Support
app.use(`${PREFIX}/support`,     supportRoutes);

// HR / Recruitment
app.use(`${PREFIX}/hr`,          hrRoutes);

// Notifications
app.use(`${PREFIX}/notifications`, notificationsRouter);

// Dashboard
app.use(`${PREFIX}/dashboard`,   dashboardRoutes);
app.use('/api/dashboard',        dashboardRoutes);

// Analytics
app.use(`${PREFIX}/analytics`,   analyticsRoutes);
app.use('/api/analytics',        analyticsRoutes);

// Marketing
app.use(`${PREFIX}/marketing`,   marketingRoutes);

// AI
app.use(`${PREFIX}/ai`,          aiRoutes);

// System / Admin
app.use(`${PREFIX}/system`,      systemRoutes);

// ── Convenience redirect ─────────────────────────────────────
app.get('/', (_req, res) =>
  res.json({
    name:    'Enterprise Platform API',
    version: '1.0.0',
    docs:    `${PREFIX}/docs`,
    health:  `${PREFIX}/system/health`,
  })
);

// ── 404 & Error handlers ──────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ── Start server ──────────────────────────────────────────────
const PORT = parseInt(process.env.PORT || '5000');

const startServer = async () => {
  // Test DB connection
  try {
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
    logger.info('✅ PostgreSQL connected successfully');
  } catch (err) {
    logger.error('❌ PostgreSQL connection failed:', err.message);
    logger.warn('Server starting without confirmed DB connection — check your .env');
  }

  app.listen(PORT, () => {
    logger.info(`🚀 Server running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
    logger.info(`📍 API base: http://localhost:${PORT}${PREFIX}`);
    logger.info(`❤️  Health:  http://localhost:${PORT}${PREFIX}/system/health`);
  });
};

startServer();

// ── Graceful shutdown ─────────────────────────────────────────
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received — shutting down gracefully');
  await pool.end();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received — shutting down gracefully');
  await pool.end();
  process.exit(0);
});

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled Rejection:', reason);
});

process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', err);
  process.exit(1);
});

module.exports = app; // for testing
