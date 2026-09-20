const express  = require('express');
const router   = express.Router();
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { authLimiter } = require('../middleware/rateLimiters');
const {
  register, registerRules,
  login,    loginRules,
  logout,
  getMe,
  forgotPassword,
  resetPassword,
} = require('../controllers/authController');

// Public routes — rate-limited against brute force
router.post('/register',        authLimiter, registerRules, validate, register);
router.post('/login',           authLimiter, loginRules,    validate, login);
router.post('/forgot-password', authLimiter, forgotPassword);
router.post('/reset-password',  authLimiter, resetPassword);

// Protected routes — NOT rate-limited the same way; these fire routinely
// during normal use (session checks on every page load, logging out)
router.post('/logout', protect, logout);
router.get('/me',      protect, getMe);

module.exports = router;