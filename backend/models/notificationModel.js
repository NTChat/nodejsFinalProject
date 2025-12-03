const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  message: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['order', 'promotion', 'system', 'other'],
    default: 'other'
  },
  isRead: {
    type: Boolean,
    default: false
  },
  // Tham chiếu đến đối tượng liên quan (đơn hàng, sản phẩm, v.v.)
  relatedId: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'relatedModel'
  },
  relatedModel: {
    type: String,
    enum: ['Order', 'Product', 'Discount', null],
    default: null
  },
  // Đường dẫn khi click vào thông báo
  actionUrl: {
    type: String,
    default: null
  },
  // Dữ liệu bổ sung cho notification
  data: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// Index để query nhanh hơn
notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ createdAt: -1 });

// Static method tạo thông báo mới
notificationSchema.statics.createNotification = async function(data) {
  const notification = new this(data);
  return await notification.save();
};

// Static method tạo thông báo đơn hàng
notificationSchema.statics.createOrderNotification = async function(userId, orderId, title, message, orderNumber = null) {
  // Xác định user role để tạo actionUrl phù hợp
  const User = mongoose.model('User');
  const user = await User.findById(userId);
  
  // Sử dụng orderNumber nếu có, nếu không thì dùng orderId
  const orderIdentifier = orderNumber || orderId;
  const actionUrl = user?.role === 'admin' ? `/admin/orders/${orderIdentifier}` : `/orders/${orderIdentifier}`;
  
  return await this.createNotification({
    userId,
    title,
    message,
    type: 'order',
    relatedId: orderId,
    relatedModel: 'Order',
    actionUrl: actionUrl
  });
};

// Static method tạo thông báo khuyến mãi
notificationSchema.statics.createPromotionNotification = async function(userId, title, message, discountId = null) {
  return await this.createNotification({
    userId,
    title,
    message,
    type: 'promotion',
    relatedId: discountId,
    relatedModel: discountId ? 'Discount' : null,
    actionUrl: discountId ? `/redeem-vouchers` : '/products'
  });
};

// Static method tạo thông báo hệ thống
notificationSchema.statics.createSystemNotification = async function(userId, title, message) {
  return await this.createNotification({
    userId,
    title,
    message,
    type: 'system'
  });
};

// Static method tạo thông báo cho tất cả users
notificationSchema.statics.broadcastNotification = async function(title, message, type = 'system') {
  const User = mongoose.model('User');
  const users = await User.find({ isActive: { $ne: false } }).select('_id');
  
  const notifications = users.map(user => ({
    userId: user._id,
    title,
    message,
    type
  }));
  
  return await this.insertMany(notifications);
};

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;
