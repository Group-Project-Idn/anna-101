const express = require('express');
const router = express.Router();
const ControllerPathways = require('../controllers/controllerPathway');

router.get('/', ControllerPathways.read);
router.get('/:id/lessons', ControllerPathways.readStatus);

module.exports = router;
