const express  = require('express');
const router   = express.Router();
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');
const {
  register, registerRules,
  login,    loginRules,
  logout,
  getMe,
  forgotPassword,
  resetPassword,
} = require('../controllers/authController');

// Public routes
router.post('/register', registerRules, validate, register);
router.post('/login',    loginRules,    validate, login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password',  resetPassword);

// Protected routes
router.post('/logout', protect, logout);
router.get('/me',      protect, getMe);

module.exports = router;
