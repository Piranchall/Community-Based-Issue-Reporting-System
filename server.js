require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const path    = require('path');

// Initialize Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
// Serve uploaded issue images as static files
// e.g. GET /uploads/issues/issue-1712001234567-839271234.jpg
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/', (_req, res) => {
  res.json({
    message: 'CivicReport API — Workflow 1',
    version: '1.0.0',
    endpoints: '/api/users, /api/issues, /api/upvotes, /api/comments',
  });
});

app.get('/api/health', (_req, res) => {
  res.json({ status: 'Server is running', timestamp: new Date().toISOString() });
});

app.use('/api/users',    require('./routes/users'));
app.use('/api/issues',   require('./routes/issues'));
app.use('/api/upvotes',  require('./routes/upvotes'));
app.use('/api/comments', require('./routes/comments'));

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

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`[Workflow 1] Server running on port ${PORT}`);
});