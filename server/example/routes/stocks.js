const express = require('express');
const router = express.Router();
const { StockController } = require('../controllers/stockController');

router.get('/', StockController.getAll);
router.get('/:symbol', StockController.getBySymbol);
router.get('/:symbol/history', StockController.getHistory);
router.get('/:symbol/news', StockController.getNews);
router.get('/:symbol/insight', StockController.getInsight);

module.exports = router;
