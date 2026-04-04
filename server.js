require('dotenv').config();
const express = require('express');
const cors    = require('cors');

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

app.get('/', (_req, res) => {
  res.json({
    message: 'CivicReport API — Workflow 3',
    version: '1.0.0',
    endpoints: '/api/analytics, /api/reports',
  });
});

app.get('/api/health', (_req, res) => {
  res.json({ status: 'Server is running', timestamp: new Date().toISOString() });
});

app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/reports',   require('./routes/reports'));

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

const PORT = process.env.PORT || 5002;
app.listen(PORT, () => {
  console.log(`[Workflow 3] Server running on port ${PORT}`);
});