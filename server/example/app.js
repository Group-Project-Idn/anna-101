if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const express = require('express');
const cors = require('cors');
const router = require('./routes');
const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }),
);

// Fix for Google Sign-In popup and COOP issues
app.use((req, res, next) => {
  res.setHeader('Cross-Origin-Opener-Policy', 'unsafe-none');
  res.setHeader('Cross-Origin-Embedder-Policy', 'unsafe-none');
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set('query parser', 'extended');

app.use('/api', router);

// Error handling middleware — registered last so errors thrown by any
// middleware or route above propagate here instead of Express's default
// HTML handler. Exported for unit testing.
function errorHandler(err, req, res, next) {
  console.error('Server error:', err);
  res.status(err.status || 500).json({
    message: err.message || 'Internal server error',
  });
}

app.use(errorHandler);

module.exports = app;
module.exports.errorHandler = errorHandler;
