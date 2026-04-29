/**
 * server.js — Business Nexus API entry point
 *
 * Stack:  Express + MongoDB (Mongoose) + Socket.IO + Stripe
 * Start:  npm run dev       (development with nodemon)
 *         npm start         (production)
 *         npm run seed      (populate DB with demo data)
 */
require('dotenv').config();
require('express-async-errors');

const express     = require('express');
const http        = require('http');
const { Server }  = require('socket.io');
const cors        = require('cors');
const helmet      = require('helmet');
const morgan      = require('morgan');
const rateLimit   = require('express-rate-limit');
const path        = require('path');

const connectDB      = require('./config/db');
const errorHandler   = require('./middleware/errorHandler');
const initSockets    = require('./sockets/chatSocket');

// ── Route imports ─────────────────────────────────────────────────────────
const authRoutes          = require('./routes/auth');
const userRoutes          = require('./routes/users');
const messageRoutes       = require('./routes/messages');
const collaborationRoutes = require('./routes/collaboration');
const documentRoutes      = require('./routes/documents');
const dealRoutes          = require('./routes/deals');
const notificationRoutes  = require('./routes/notifications');
const paymentRoutes       = require('./routes/payments');

// ── Connect to MongoDB ────────────────────────────────────────────────────
connectDB();

const app    = express();
const server = http.createServer(app);

// ── Socket.IO ─────────────────────────────────────────────────────────────
const io = new Server(server, {
  cors: {
    origin:      process.env.CLIENT_URL || 'http://localhost:5173',
    methods:     ['GET', 'POST'],
    credentials: true,
  },
});

initSockets(io);

app.use((req, _res, next) => {
  req.io = io;
  next();
});

// ── Stripe webhook MUST receive the raw body before any JSON parsing ──────
// Register this route BEFORE express.json() middleware
app.post(
  '/api/payments/webhook',
  express.raw({ type: 'application/json' }),
  (req, _res, next) => {
    // Attach rawBody so the controller can verify the Stripe signature
    req.rawBody = req.body;
    next();
  },
  paymentRoutes
);

// ── Security & logging ────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true }));

if (process.env.NODE_ENV === 'development') app.use(morgan('dev'));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, max: 100,
  message: { success: false, message: 'Too many requests, please try again later' },
});
app.use('/api', limiter);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, max: 20,
  message: { success: false, message: 'Too many authentication attempts' },
});
app.use('/api/auth', authLimiter);

// ── Body parsers ──────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Static uploads ────────────────────────────────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ── Health check ──────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'Business Nexus API is running',
    env:     process.env.NODE_ENV,
    time:    new Date().toISOString(),
  });
});

// ── API routes ────────────────────────────────────────────────────────────
app.use('/api/auth',          authRoutes);
app.use('/api/users',         userRoutes);
app.use('/api/messages',      messageRoutes);
app.use('/api/collaboration',  collaborationRoutes);
app.use('/api/documents',     documentRoutes);
app.use('/api/deals',         dealRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/payments',      paymentRoutes);   // ← NEW in Step 5

// ── 404 ───────────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// ── Global error handler ──────────────────────────────────────────────────
app.use(errorHandler);

// ── Start ─────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`\n🚀  Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  console.log(`📡  API:     http://localhost:${PORT}/api/health`);
  console.log(`🔌  Sockets: ws://localhost:${PORT}`);
  console.log(`💳  Stripe:  ${process.env.STRIPE_SECRET_KEY ? 'configured ✓' : 'NOT configured — set STRIPE_SECRET_KEY'}\n`);
});
