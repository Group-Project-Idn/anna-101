const express = require('express');
const router = express.Router();
const ControllerPathways = require('../controllers/controllerPathway');

router.get('/', ControllerPathways.read);
// Harus di atas '/:id/lessons' supaya 'progress' tidak pernah dianggap :id.
router.get('/progress', ControllerPathways.readProgress);
router.get('/:id/lessons', ControllerPathways.readStatus);

module.exports = router;
