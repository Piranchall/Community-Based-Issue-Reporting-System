const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Add this to server.js before the routes
app.get('/', (req, res) => {
  res.json({ 
    message: 'CivicReport API Server',
    version: '1.0.0',
    endpoints: '/api/users, /api/issues, /api/upvotes, /api/comments'
  });
});

// Import routes
const userRoutes = require('./routes/users');
const issueRoutes = require('./routes/issues');
const upvoteRoutes = require('./routes/upvotes');
const commentRoutes = require('./routes/comments');

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'Server is running', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/users', userRoutes);
app.use('/api/issues', issueRoutes);
app.use('/api/upvotes', upvoteRoutes);
app.use('/api/comments', commentRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
});
