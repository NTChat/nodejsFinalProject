const Notification = require('../models/notificationModel');
const mongoose = require('mongoose');

// Lấy tất cả thông báo của user
exports.getNotifications = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { page = 1, limit = 20, type, unreadOnly } = req.query;

    console.log('🔔 Fetching notifications for userId:', userId);

    // Đảm bảo userId là ObjectId
    const userObjectId = mongoose.Types.ObjectId.isValid(userId) 
      ? new mongoose.Types.ObjectId(userId) 
      : userId;

    const query = { userId: userObjectId };
    
    if (type && ['order', 'promotion', 'system', 'other'].includes(type)) {
      query.type = type;
    }
    
    if (unreadOnly === 'true') {
      query.isRead = false;
    }

    console.log('🔔 Query:', JSON.stringify(query));

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    console.log('🔔 Found notifications:', notifications.length);

    const total = await Notification.countDocuments(query);
    const unreadCount = await Notification.countDocuments({ userId: userObjectId, isRead: false });

    res.json({
      success: true,
      notifications,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      },
      unreadCount
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

// Đánh dấu một thông báo là đã đọc
exports.markAsRead = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { id } = req.params;

    const notification = await Notification.findOneAndUpdate(
      { _id: id, userId },
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy thông báo' });
    }

    res.json({ success: true, notification });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

// Đánh dấu tất cả thông báo là đã đọc
exports.markAllAsRead = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;

    const result = await Notification.updateMany(
      { userId, isRead: false },
      { isRead: true }
    );

    res.json({ 
      success: true, 
      message: `Đã đánh dấu ${result.modifiedCount} thông báo là đã đọc` 
    });
  } catch (error) {
    console.error('Mark all as read error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

// Xóa một thông báo
exports.deleteNotification = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { id } = req.params;

    const notification = await Notification.findOneAndDelete({ _id: id, userId });

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy thông báo' });
    }

    res.json({ success: true, message: 'Đã xóa thông báo' });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

// Xóa tất cả thông báo đã đọc
exports.deleteReadNotifications = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;

    const result = await Notification.deleteMany({ userId, isRead: true });

    res.json({ 
      success: true, 
      message: `Đã xóa ${result.deletedCount} thông báo đã đọc` 
    });
  } catch (error) {
    console.error('Delete read notifications error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

// Đếm số thông báo chưa đọc
exports.getUnreadCount = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    
    const count = await Notification.countDocuments({ userId, isRead: false });

    res.json({ success: true, unreadCount: count });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

// [ADMIN] Gửi thông báo cho một user
exports.sendNotificationToUser = async (req, res) => {
  try {
    const { userId, title, message, type = 'system' } = req.body;

    if (!userId || !title || !message) {
      return res.status(400).json({ success: false, message: 'Thiếu thông tin cần thiết' });
    }

    const notification = await Notification.createNotification({
      userId,
      title,
      message,
      type
    });

    res.status(201).json({ success: true, notification });
  } catch (error) {
    console.error('Send notification error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

// [ADMIN] Gửi thông báo cho tất cả users
exports.broadcastNotification = async (req, res) => {
  try {
    const { title, message, type = 'system' } = req.body;

    if (!title || !message) {
      return res.status(400).json({ success: false, message: 'Thiếu tiêu đề hoặc nội dung' });
    }

    const notifications = await Notification.broadcastNotification(title, message, type);

    res.status(201).json({ 
      success: true, 
      message: `Đã gửi thông báo cho ${notifications.length} người dùng` 
    });
  } catch (error) {
    console.error('Broadcast notification error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};
