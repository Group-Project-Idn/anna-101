const express = require('express');
const router = express.Router();
const stocksRouter = require('./stocks');
const marketRouter = require('./market');
const authRouter = require('./auth');
const watchlistRouter = require('./watchlist');
const { authentication } = require('../middlewares/authMiddleware');
const { errorHandler } = require('../middlewares/errorHandler');

router.get('/', (req, res) => {
  res.json({ message: 'S&P 500 AI Dashboard API' });
});

router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

router.use('/stocks', stocksRouter);
router.use('/market', marketRouter);
router.use('/auth', authRouter);
router.use('/watchlist', authentication, watchlistRouter);

router.use(errorHandler);

module.exports = router;
