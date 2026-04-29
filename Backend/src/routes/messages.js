const express  = require('express');
const router   = express.Router();
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');
const {
  sendMessage,  sendMessageRules,
  getConversation,
  getConversations,
  getUnreadCount,
} = require('../controllers/messageController');

router.use(protect);

router.get('/conversations',     getConversations);
router.get('/unread-count',      getUnreadCount);
router.get('/:userId',           getConversation);
router.post('/', sendMessageRules, validate, sendMessage);

module.exports = router;
