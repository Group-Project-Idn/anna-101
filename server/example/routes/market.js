const express = require('express');
const router = express.Router();
const { MarketController } = require('../controllers/marketController');

router.get('/movers', MarketController.getMovers);

module.exports = router;
