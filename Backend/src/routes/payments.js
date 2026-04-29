const express  = require('express');
const router   = express.Router();
const { protect } = require('../middleware/auth');
const {
  createPaymentIntent,
  stripeWebhook,
  getConfig,
} = require('../controllers/paymentController');

// Webhook must be BEFORE the protect middleware and uses raw body
router.post('/webhook', stripeWebhook);

// All other routes require auth
router.use(protect);
router.get('/config',         getConfig);
router.post('/create-intent', createPaymentIntent);

module.exports = router;
