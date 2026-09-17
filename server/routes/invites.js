const express = require('express');
const router = express.Router();
const ControllerInvite = require('../controllers/controllerInvite');

router.post('/', ControllerInvite.create);
router.get('/', ControllerInvite.getAll);
router.patch('/:id/accept', ControllerInvite.accept);
router.patch('/:id/reject', ControllerInvite.reject);

module.exports = router;
