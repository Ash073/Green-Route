import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import authRoutes from './authRoutes.js';
import tripRoutes from './tripRoutes.js';
import routesRoutes from './routesRoutes.js';
import emissionRoutes from './emissionRoutes.js';
import vehicleRoutes from './vehicleRoutes.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';
import { globalRateLimiter, authRateLimiter, driverLocationRateLimiter, tripCheckRateLimiter } from './middleware/rateLimit.js';
import analyticsRoutes from './analyticsRoutes.js';
import { setupMorganLogger, createLogger } from './utils/logger.js';
import { requireDB } from './middleware/dbConnection.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';

const logger = createLogger('App');

// CORS
const corsOrigin = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((url) => url.trim())
  : ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002'];

logger.info(`CORS enabled for origins: ${corsOrigin.join(', ')}`);

// HTTP logger
app.use(setupMorganLogger());

// Security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  if (NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  next();
});

app.use(
  cors({
    origin: corsOrigin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Global rate limiter
app.use(globalRateLimiter);

// Health check
app.get('/api/health', (req, res) => {
  const hLogger = createLogger('HealthCheck');
  hLogger.debug('Health check requested');

  res.json({
    success: true,
    status: 'OK',
    message: 'Backend is running',
    port: PORT,
    environment: NODE_ENV,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// DB health check
app.get('/api/health/db', (req, res) => {
  const state = require('mongoose').connection.readyState; // 0=disconnected,1=connected,2=connecting,3=disconnecting
  res.json({
    success: true,
    connectionState: state,
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'GreenRoute API',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      trips: '/api/trips',
      routes: '/api/routes',
      analytics: '/api/analytics',
      emissions: '/api/emissions',
      vehicle: '/api/vehicle',
    },
  });
});

// Routes
logger.debug('Registering routes');
app.use('/api/auth', requireDB, authRateLimiter, authRoutes);
app.use('/api/trips', tripRoutes);
app.use('/api/routes', routesRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/emissions', emissionRoutes);
app.use('/api/vehicle', vehicleRoutes);

// Mock routes endpoint for development
app.get('/api/routes-legacy', (req, res) => {
  const rLogger = createLogger('Routes');
  const { origin, destination, mode } = req.query;

  if (!origin || !destination) {
    rLogger.warn('Routes requested without origin or destination');
    return res.status(400).json({ success: false, message: 'Origin and destination are required' });
  }

  rLogger.debug('Routes requested', { origin, destination, mode });

  const mockRoutes = [
    {
      distance: Math.floor(Math.random() * 50000) + 10000,
      duration: Math.floor(Math.random() * 3600) + 1800,
      emission: Math.random() * 5 + 1,
      ecoScore: Math.floor(Math.random() * 30) + 70,
      mode: mode || 'driving',
    },
    {
      distance: Math.floor(Math.random() * 60000) + 15000,
      duration: Math.floor(Math.random() * 4200) + 2400,
      emission: Math.random() * 6 + 2,
      ecoScore: Math.floor(Math.random() * 25) + 60,
      mode: mode || 'driving',
    },
    {
      distance: Math.floor(Math.random() * 70000) + 20000,
      duration: Math.floor(Math.random() * 4800) + 3000,
      emission: Math.random() * 7 + 3,
      ecoScore: Math.floor(Math.random() * 20) + 50,
      mode: mode || 'driving',
    },
  ];

  mockRoutes.sort((a, b) => a.distance - b.distance);

  res.json({
    success: true,
    message: 'Routes retrieved successfully',
    routes: mockRoutes,
    origin,
    destination,
    mode: mode || 'driving',
  });
});

// SPA Static Files - Serve React build
const __dirname = path.resolve();
const buildPath = path.join(__dirname, "../GreenRo-main/build");
app.use(express.static(buildPath));

// SPA Catch-all route - Redirect all routes to index.html for client-side routing
app.get("*", (req, res) => {
  // Don't redirect API calls
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ success: false, message: 'API endpoint not found' });
  }
  res.sendFile(path.join(buildPath, "index.html"));
});

// 404 and error handling
app.use(notFound);
app.use(errorHandler);

export default app;
