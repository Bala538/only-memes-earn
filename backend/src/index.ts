import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Configure CORS
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['https://onlymemesearn.store', 'https://www.onlymemesearn.store', 'http://localhost:3000', 'http://localhost:5173'];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, or postman)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1 || allowedOrigins.includes('*')) {
      return callback(null, true);
    } else {
      return callback(new Error('Not allowed by CORS'), false);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization']
}));

// Parse incoming request body
app.use(express.json());

// Main base/health routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/diagnostic', (req, res) => {
  res.json({
    status: 'ok',
    serverTime: new Date().toISOString(),
    uptime: process.uptime(),
    nodeVersion: process.version,
    env: process.env.NODE_ENV || 'development',
    allowedOrigins,
    headers: {
      host: req.headers.host,
      origin: req.headers.origin,
      'user-agent': req.headers['user-agent']
    }
  });
});

// Auth & OTP verification endpoints
app.use('/api/auth', authRoutes);

// Catch-all route for unmatched paths
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Boot port 3000 / configured port
app.listen(PORT, () => {
  console.log(`🚀 Standalone OnlyMemes Earn backend running on port ${PORT}`);
});
