const express = require('express');
const router = express.Router();
const { AuthController } = require('../controllers/authController');
const { authentication } = require('../middlewares/authMiddleware');

router.post('/register', AuthController.register);
router.post('/login', AuthController.login);
router.post('/google', AuthController.googleLogin);
router.get('/me', authentication, AuthController.getMe);
router.put('/me', authentication, AuthController.updateProfile);

module.exports = router;
