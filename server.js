require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const path    = require('path');

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/', (_req, res) => {
  res.json({
    message: 'CivicReport API — All Workflows',
    version: '3.0.0',
    endpoints: {
      citizen:   '/api/users, /api/issues, /api/upvotes, /api/comments',
      admin:     '/api/admin, /api/admin/issues, /api/status-logs, /api/notifications',
      analytics: '/api/analytics, /api/reports',
    },
  });
});

app.get('/api/health', (_req, res) => {
  res.json({ status: 'Server is running', timestamp: new Date().toISOString() });
});

// Workflow 1
app.use('/api/users',    require('./routes/users'));
app.use('/api/issues',   require('./routes/issues'));
app.use('/api/upvotes',  require('./routes/upvotes'));
app.use('/api/comments', require('./routes/comments'));

// Workflow 2
app.use('/api/admin',         require('./routes/admin'));
app.use('/api/admin/issues',  require('./routes/Adminissues'));
app.use('/api/status-logs',   require('./routes/statusLogs'));
app.use('/api/notifications', require('./routes/notifications'));

// Workflow 3
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/reports',   require('./routes/reports'));

app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.use((err, _req, res, _next) => {
  console.error(err.stack);
  res.status(500).json({
    error:   'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`[CivicReport] Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
});