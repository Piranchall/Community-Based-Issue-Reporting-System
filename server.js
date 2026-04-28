require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const path    = require('path');

const app = express();

app.use(cors({
  origin: [
    'http://localhost:5174',
    'http://community-based-issue-reporting-sys-five.vercel.app'
  ],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/', (_req, res) => {
  res.json({
    message: 'CivicReport API — All Workflows',
    version: '3.0.0',
    endpoints: {
      citizen: {
        'POST /api/users/register': 'Register citizen',
        'POST /api/users/login': 'Login with email or phone',
        'POST /api/issues': 'Report an issue',
        'GET /api/issues': 'List all issues',
        'GET /api/issues/nearby': 'Nearby issues',
        'POST /api/upvotes': 'Upvote an issue',
        'POST /api/comments': 'Comment on an issue',
        'GET /api/users/notifications': 'Citizen notifications',
      },
      admin: {
        'POST /api/admin/register': 'Register admin',
        'POST /api/admin/login': 'Admin login',
        'GET /api/admin/issues': 'List all issues',
        'PUT /api/admin/issues/:id': 'Update issue status',
        'GET /api/status-logs/issue/:id': 'Status history',
        'GET /api/notifications': 'Admin notifications',
      },
      analytics: {
        'GET /api/analytics/overview': 'Overview stats',
        'GET /api/analytics/by-category': 'By category',
        'GET /api/analytics/top-categories': 'Top categories',
        'GET /api/analytics/by-area': 'By area',
        'GET /api/analytics/trends': 'Trend data',
        'GET /api/analytics/export': 'CSV export (admin)',
        'POST /api/reports': 'Save report (admin)',
        'GET /api/reports': 'List reports (admin)',
      },
    },
  });
});

app.get('/api/health', (_req, res) => {
  res.json({ status: 'Server is running', timestamp: new Date().toISOString() });
});

// Workflow 1
app.use('/api/auth',     require('./routes/auth'));
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
