require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

app.get('/', (_req, res) => {
  res.json({
    message: 'CivicReport Admin API — Workflow 2',
    version: '1.0.0',
    endpoints: '/api/admin, /api/admin/issues, /api/status-logs, /api/notifications',
  });
});

app.get('/api/health', (_req, res) => {
  res.json({ status: 'Server is running', timestamp: new Date().toISOString() });
});

app.use('/api/admin',         require('./routes/admin'));
app.use('/api/admin/issues',  require('./routes/Adminissues'));
app.use('/api/status-logs',   require('./routes/statusLogs'));
app.use('/api/notifications', require('./routes/notifications'));

app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.use((err, _req, res, _next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`[Workflow 2] Admin API running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
});
