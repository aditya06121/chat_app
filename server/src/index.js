const express = require('express');
const http = require('http');
const cors = require('cors');
const dotenv = require('dotenv');
const { connectToDatabase } = require('./config/db');
const { attachSocketServer } = require('./socket');

dotenv.config();

const app = express();
const server = http.createServer(app);

// Middleware
const allowedOrigins = (process.env.CLIENT_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map((s) => s.trim());
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  })
);
app.use(express.json());

// Health
app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/conversations', require('./routes/conversations'));
app.use('/api/messages', require('./routes/messages'));

// Start
const PORT = process.env.PORT || 2000;
connectToDatabase()
  .then(() => {
    attachSocketServer(server);
    server.listen(PORT, () => {
      console.log(`Server listening on ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to start server', err);
    process.exit(1);
  });


