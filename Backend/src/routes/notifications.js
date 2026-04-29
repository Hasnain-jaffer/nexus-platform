const express  = require('express');
const router   = express.Router();
const { protect } = require('../middleware/auth');
const {
  getNotifications,
  markRead,
  markAllRead,
  getUnreadCount,
} = require('../controllers/notificationController');

router.use(protect);

router.get('/',                   getNotifications);
router.get('/unread-count',       getUnreadCount);
router.patch('/mark-all-read',    markAllRead);
router.patch('/:id/read',         markRead);

module.exports = router;
