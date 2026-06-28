require('dotenv').config();
const express = require('express');
const cors = require('cors');

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

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
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

// 404 handler
app.use((req, res) => res.status(404).json({ error: 'Route not found' }));

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`T2U LMS Server running on port ${PORT}`);
});

module.exports = app;
