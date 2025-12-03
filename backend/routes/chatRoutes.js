// backend/routes/chatRoutes.js
const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const { protect, admin } = require('../middleware/authMiddleware');
const identifyUser = require('../middleware/identifyUser');

// ============ CUSTOMER ROUTES ============
// Dùng identifyUser để nhận diện user đã login hoặc guest
router.post('/conversation', identifyUser, chatController.getOrCreateConversation);
router.post('/send', identifyUser, chatController.sendMessage);
router.get('/messages/:conversationId', identifyUser, chatController.getMessages);

// ============ ADMIN ROUTES ============
router.get('/admin/conversations', protect, admin, chatController.getAllConversations);
router.post('/admin/send', protect, admin, chatController.adminSendMessage);
router.put('/admin/read/:conversationId', protect, admin, chatController.markAsRead);
router.put('/admin/status/:conversationId', protect, admin, chatController.updateConversationStatus);
router.delete('/admin/:conversationId', protect, admin, chatController.deleteConversation);

module.exports = router;
