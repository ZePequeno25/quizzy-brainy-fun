const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const googleAuthController = require('../controllers/googleAuthController');

//rota funcionando com sucesso
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/google-auth', googleAuthController.handleGoogleAuth);
router.post('/verify_user_for_password_reset', authController.verifyUserForPasswordResetHandler);
router.post('/reset_password', authController.resetPassword);

module.exports = router;