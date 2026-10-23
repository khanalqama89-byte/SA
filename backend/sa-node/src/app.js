const express = require('express');
const cors = require('cors');
const { authMiddleware } = require('./middleware/auth');

const authRoutes = require('./routes/authRoutes');
const toolRoutes = require('./routes/toolRoutes');
const fileRoutes = require('./routes/fileRoutes');
const conversionRoutes = require('./routes/conversionRoutes');
const historyRoutes = require('./routes/historyRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();

// Enable CORS
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body Parsers
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// User Authentication Attachment Middleware
app.use(authMiddleware);

// Health check
const healthHandler = (req, res) => {
  res.json({
    status: 'UP',
    platform: 'SA Online Document Converter Platform (Node.js)',
    timestamp: new Date().toISOString()
  });
};

app.get('/api/health', healthHandler);
app.get('/health', healthHandler);

// Helper function to mount routes both with and without /api prefix
function mountRoutes(prefix = '') {
  app.use(`${prefix}/auth`, authRoutes);
  app.use(`${prefix}/tools`, toolRoutes);
  app.use(`${prefix}/files`, fileRoutes);
  app.use(`${prefix}/conversions`, conversionRoutes);
  app.use(`${prefix}/history`, historyRoutes);
  app.use(`${prefix}/admin`, adminRoutes);
}

// Support both /api/* (standard REST proxy) and direct /* (some Vercel rewrite configurations)
mountRoutes('/api');
mountRoutes('');

// 404 handler for API routes
app.use((req, res, next) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/auth') || req.path.startsWith('/conversions') || req.path.startsWith('/files')) {
    return res.status(404).json({
      success: false,
      message: `API endpoint not found: ${req.method} ${req.originalUrl}`,
      data: null
    });
  }
  next();
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Application Error:', err);
  const status = err.status || err.statusCode || 500;
  return res.status(status).json({
    success: false,
    message: err.message || 'Internal Server Error',
    data: null
  });
});

module.exports = app;
