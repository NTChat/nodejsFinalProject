import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FaBell, FaCheck, FaTrash, FaCheckDouble, FaFilter } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { toast } from 'react-toastify';

const NotificationsPage = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, unread, order, promotion, system

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    fetchNotifications();
  }, [isAuthenticated, navigate]);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await api.get('/notifications');
      console.log('🔔 Frontend received:', res.data);
      if (res.data?.notifications) {
        console.log('🔔 Setting notifications:', res.data.notifications.length);
        setNotifications(res.data.notifications);
        return; // Return để không chạy vào fallback
      }
    } catch (err) {
      console.error('🔔 Error fetching notifications:', err);
      // Lấy từ đơn hàng của user
      try {
        const orderRes = await api.get('/orders/my-orders');
        const orders = orderRes.data?.orders || orderRes.data || [];
        
        // Chuyển đổi đơn hàng thành thông báo
        const orderNotifications = orders.map(order => {
          const statusMessages = {
            'Pending': 'đang chờ xác nhận',
            'Confirmed': 'đã được xác nhận',
            'Shipping': 'đang được giao',
            'Delivered': 'đã giao thành công',
            'Cancelled': 'đã bị hủy'
          };
          const statusTitles = {
            'Pending': 'Đơn hàng đang chờ xử lý',
            'Confirmed': 'Đơn hàng đã xác nhận',
            'Shipping': 'Đơn hàng đang giao',
            'Delivered': 'Giao hàng thành công',
            'Cancelled': 'Đơn hàng đã hủy'
          };
          
          return {
            _id: `order-${order._id}`,
            orderId: order._id,
            title: statusTitles[order.status] || 'Cập nhật đơn hàng',
            message: `Đơn hàng #${order._id.slice(-6)} ${statusMessages[order.status] || 'có cập nhật mới'}`,
            type: 'order',
            isRead: false,
            createdAt: order.updatedAt || order.createdAt,
            actionUrl: `/order/${order._id}`
          };
        });

        // Thêm một số thông báo mẫu khác
        const otherNotifications = [
          {
            _id: 'promo-1',
            title: 'Khuyến mãi đặc biệt',
            message: 'Giảm 20% cho tất cả sản phẩm điện tử trong tuần này! Nhanh tay mua sắm ngay.',
            type: 'promotion',
            isRead: true,
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
            actionUrl: '/products'
          },
          {
            _id: 'system-1',
            title: 'Chào mừng bạn đến với PhoneWorld',
            message: 'Cảm ơn bạn đã đăng ký tài khoản. Hãy khám phá các sản phẩm tuyệt vời của chúng tôi!',
            type: 'system',
            isRead: true,
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
            actionUrl: '/products'
          }
        ];

        setNotifications([...orderNotifications, ...otherNotifications].sort((a, b) => 
          new Date(b.createdAt) - new Date(a.createdAt)
        ));
      } catch (orderErr) {
        console.error('Error fetching orders for notifications:', orderErr);
        setNotifications([]);
      }
    } finally {
      setLoading(false);
    }
  };

  // Xử lý click vào thông báo để xem chi tiết
  const handleNotificationClick = (notification) => {
    // Đánh dấu là đã đọc
    if (!notification.isRead) {
      markAsRead(notification._id);
    }
    
    // Navigate đến trang chi tiết
    if (notification.actionUrl) {
      navigate(notification.actionUrl);
    } else if (notification.orderId) {
      navigate(`/orders/${notification.orderId}`);
    } else if (notification.type === 'order' && notification._id.startsWith('order-')) {
      const orderId = notification._id.replace('order-', '');
      navigate(`/orders/${orderId}`);
    } else if (notification.type === 'promotion') {
      navigate('/products');
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await api.put(`/notifications/${notificationId}/read`);
    } catch (err) {
      // Fallback for mock
    }
    setNotifications(prev =>
      prev.map(n => n._id === notificationId ? { ...n, isRead: true } : n)
    );
  };

  const markAllAsRead = async () => {
    try {
      await api.put('/notifications/read-all');
    } catch (err) {
      // Fallback for mock
    }
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    toast.success('Đã đánh dấu tất cả là đã đọc');
  };

  const deleteNotification = async (notificationId) => {
    try {
      await api.delete(`/notifications/${notificationId}`);
    } catch (err) {
      // Fallback for mock
    }
    setNotifications(prev => prev.filter(n => n._id !== notificationId));
    toast.success('Đã xóa thông báo');
  };

  const deleteAllRead = async () => {
    try {
      await api.delete('/notifications/read');
    } catch (err) {
      // Fallback for mock
    }
    setNotifications(prev => prev.filter(n => !n.isRead));
    toast.success('Đã xóa các thông báo đã đọc');
  };

  const formatTimeAgo = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Vừa xong';
    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    if (diffDays < 7) return `${diffDays} ngày trước`;
    return date.toLocaleDateString('vi-VN');
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'order': return '📦';
      case 'promotion': return '🎉';
      case 'system': return '⚙️';
      default: return '🔔';
    }
  };

  const getTypeLabel = (type) => {
    switch (type) {
      case 'order': return 'Đơn hàng';
      case 'promotion': return 'Khuyến mãi';
      case 'system': return 'Hệ thống';
      default: return 'Khác';
    }
  };

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'all') return true;
    if (filter === 'unread') return !n.isRead;
    return n.type === filter;
  });

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4 max-w-3xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
              <FaBell className="text-accent" />
              Thông báo
              {unreadCount > 0 && (
                <span className="bg-red-500 text-white text-sm rounded-full px-2 py-0.5">
                  {unreadCount} mới
                </span>
              )}
            </h1>
            <p className="text-text-secondary text-sm mt-1">
              Quản lý tất cả thông báo của bạn
            </p>
          </div>
          
          <div className="flex gap-2">
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="btn-secondary text-sm flex items-center gap-2"
              >
                <FaCheckDouble /> Đọc tất cả
              </button>
            )}
            {notifications.some(n => n.isRead) && (
              <button
                onClick={deleteAllRead}
                className="btn-secondary text-sm flex items-center gap-2 text-red-500 hover:bg-red-50"
              >
                <FaTrash /> Xóa đã đọc
              </button>
            )}
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-2">
          <FaFilter className="text-text-secondary shrink-0" />
          {[
            { value: 'all', label: 'Tất cả' },
            { value: 'unread', label: 'Chưa đọc' },
            { value: 'order', label: '📦 Đơn hàng' },
            { value: 'promotion', label: '🎉 Khuyến mãi' },
            { value: 'system', label: '⚙️ Hệ thống' }
          ].map(tab => (
            <button
              key={tab.value}
              onClick={() => setFilter(tab.value)}
              className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors ${
                filter === tab.value
                  ? 'bg-accent text-white'
                  : 'bg-surface text-text-secondary hover:bg-gray-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Notifications List */}
        <div className="bg-surface rounded-lg shadow-md overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="text-center py-12">
              <FaBell className="h-12 w-12 mx-auto text-gray-300 mb-4" />
              <p className="text-text-secondary">
                {filter === 'all' 
                  ? 'Không có thông báo nào' 
                  : `Không có thông báo ${filter === 'unread' ? 'chưa đọc' : getTypeLabel(filter).toLowerCase()}`
                }
              </p>
            </div>
          ) : (
            <AnimatePresence>
              {filteredNotifications.map((notification, index) => (
                <motion.div
                  key={notification._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => handleNotificationClick(notification)}
                  className={`p-4 border-b border-gray-100 last:border-b-0 cursor-pointer ${
                    !notification.isRead ? 'bg-accent/[.05]' : ''
                  } hover:bg-gray-50 transition-colors`}
                >
                  <div className="flex items-start gap-4">
                    <span className="text-2xl">{getNotificationIcon(notification.type)}</span>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className={`font-medium ${
                          !notification.isRead ? 'text-text-primary' : 'text-text-secondary'
                        }`}>
                          {notification.title}
                        </h3>
                        {!notification.isRead && (
                          <span className="w-2 h-2 bg-accent rounded-full"></span>
                        )}
                        <span className="text-xs text-text-secondary bg-gray-100 px-2 py-0.5 rounded">
                          {getTypeLabel(notification.type)}
                        </span>
                      </div>
                      
                      <p className="text-sm text-text-secondary mb-2">
                        {notification.message}
                      </p>
                      
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-text-secondary/70">
                          {formatTimeAgo(notification.createdAt)}
                        </p>
                        {/* Nút xem chi tiết */}
                        {(notification.type === 'order' || notification.actionUrl) && (
                          <span className="text-xs text-accent hover:underline">
                            Xem chi tiết →
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                      {!notification.isRead && (
                        <button
                          onClick={() => markAsRead(notification._id)}
                          className="p-2 text-accent hover:bg-accent/10 rounded-full transition-colors"
                          title="Đánh dấu đã đọc"
                        >
                          <FaCheck className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        onClick={() => deleteNotification(notification._id)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors"
                        title="Xóa"
                      >
                        <FaTrash className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationsPage;
