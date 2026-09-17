const express = require('express');
const router = express.Router();
const authRouter = require('./auth');
const pathwaysRouter = require('./pathways');
const invitesRouter = require('./invites');
const conversationsRouter = require('./conversations');
const authentication = require('../middlewares/authentication');

// Auth publik, sisanya butuh Bearer token — sama seperti app.use(authentication) lama.
router.use('/auth', authRouter);
router.use('/pathways', authentication, pathwaysRouter);
router.use('/invites', authentication, invitesRouter);
router.use('/conversations', authentication, conversationsRouter);

module.exports = router;
