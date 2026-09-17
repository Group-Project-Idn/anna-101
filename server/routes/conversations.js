const express = require('express');
const router = express.Router();
const ControllerConversation = require('../controllers/controllerConversation');

router.get('/:id', ControllerConversation.read);
router.get('/:id/messages', ControllerConversation.readMessages);

module.exports = router;
