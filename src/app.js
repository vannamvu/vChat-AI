const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const connectDB = require('./config/database');
const messengerRoutes = require('./routes/messenger');
const dashboardRoutes = require('./routes/dashboard');
const leadRoutes = require('./routes/leads');

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());
app.use(cors());

// Logging middleware
app.use(morgan('combined'));

// Body parsing middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Static files
app.use(express.static('public'));

// Database connection
connectDB();

// Routes
app.use('/webhook', messengerRoutes);
app.use('/dashboard', dashboardRoutes);
app.use('/api/leads', leadRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: '🤖 vChat-AI Facebook Messenger Bot',
    author: 'Vũ Văn Nam Việt - Nam Việt IT',
    version: '1.0.0',
    endpoints: [
      'GET /health - Health check',
      'GET /dashboard - Dashboard interface',
      'POST /webhook - Facebook Messenger webhook',
      'GET /api/leads - Get leads list'
    ]
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`🚀 vChat-AI Server running on port ${PORT}`);
  console.log(`📊 Dashboard: http://localhost:${PORT}/dashboard`);
  console.log(`🔗 Webhook: http://localhost:${PORT}/webhook`);
});

module.exports = app;