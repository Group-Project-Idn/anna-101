const express = require('express');
const router = express.Router();
const { WatchlistController } = require('../controllers/watchlistController');

router.get('/', WatchlistController.getAll);
router.post('/', WatchlistController.add);
router.delete('/:stock_id', WatchlistController.remove);

module.exports = router;
