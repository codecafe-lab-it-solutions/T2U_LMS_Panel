require('dotenv').config();
const express = require('express');
const cors = require('cors');
const crypto = require('crypto');

const authRoutes = require('./routes/auth');
const usersRoutes = require('./routes/users');
const coursesRoutes = require('./routes/courses');
const assignmentsRoutes = require('./routes/assignments');
const liveClassesRoutes = require('./routes/liveClasses');
const kycRoutes = require('./routes/kyc');
const withdrawalsRoutes = require('./routes/withdrawals');
const mlmRoutes = require('./routes/mlm');
const cmsRoutes = require('./routes/cms');
const reportsRoutes = require('./routes/reports');
const settingsRoutes = require('./routes/settings');
const certificatesRoutes = require('./routes/certificates');
const quizzesRoutes = require('./routes/quizzes');
const batchesRoutes = require('./routes/batches');
const { router: zoomAccountsRoutes } = require('./routes/zoomAccounts');
const uploadRoutes = require('./routes/upload');
const leadsRoutes = require('./routes/leads');
const packagesRoutes = require('./routes/packages');
const notificationsRoutes = require('./routes/notifications');
const rewardsRoutes = require('./routes/rewards');
const ordersRoutes = require('./routes/orders');
const supportRoutes = require('./routes/support');
const invoicesRoutes = require('./routes/invoices');
const gstCategoriesRoutes = require('./routes/gstCategories');
const incomeSourcesRoutes = require('./routes/incomeSources');
const zoomRoutes = require('./zoom/routes/index');
const { startScheduler } = require('./scheduler');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1')) {
      return callback(null, true);
    }
    const allowed = process.env.FRONTEND_URL;
    if (allowed && origin === allowed) return callback(null, true);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));

// Capture raw body for Zoom webhook HMAC signature verification.
// Must come BEFORE express.json() so we see the unmodified bytes.
app.use((req, res, next) => {
  if (req.path === '/api/zoom/webhooks') {
    let data = '';
    req.on('data', chunk => { data += chunk; });
    req.on('end', () => {
      req.rawBody = data;
      try { req.body = JSON.parse(data); } catch { req.body = {}; }
      next();
    });
  } else {
    next();
  }
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/courses', coursesRoutes);
app.use('/api/assignments', assignmentsRoutes);
app.use('/api/live-classes', liveClassesRoutes);
app.use('/api/kyc', kycRoutes);
app.use('/api/withdrawals', withdrawalsRoutes);
app.use('/api/mlm', mlmRoutes);
app.use('/api/cms', cmsRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/certificates', certificatesRoutes);
app.use('/api/quizzes', quizzesRoutes);
app.use('/api/batches', batchesRoutes);
app.use('/api/zoom-accounts', zoomAccountsRoutes);
app.use('/api/zoom', zoomRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/leads', leadsRoutes);
app.use('/api/packages', packagesRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/rewards', rewardsRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/invoices', invoicesRoutes);
app.use('/api/gst-categories', gstCategoriesRoutes);
app.use('/api/income-sources', incomeSourcesRoutes);

// 404 handler
app.use((req, res) => res.status(404).json({ error: 'Route not found' }));

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`T2U LMS Server running on port ${PORT}`);
  startScheduler();
});

module.exports = app;
