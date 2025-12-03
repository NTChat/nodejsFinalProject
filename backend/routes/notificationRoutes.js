const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { protect, admin } = require('../middleware/authMiddleware');

// User routes - cần đăng nhập
router.get('/', protect, notificationController.getNotifications);
router.get('/unread-count', protect, notificationController.getUnreadCount);
router.put('/:id/read', protect, notificationController.markAsRead);
router.put('/read-all', protect, notificationController.markAllAsRead);
router.delete('/read', protect, notificationController.deleteReadNotifications);
router.delete('/:id', protect, notificationController.deleteNotification);

// Admin routes - cần quyền admin
router.post('/send', protect, admin, notificationController.sendNotificationToUser);
router.post('/broadcast', protect, admin, notificationController.broadcastNotification);

module.exports = router;
