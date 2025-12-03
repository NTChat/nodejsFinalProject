import { useState, useEffect, useCallback } from 'react';
import { Bell, Package, Users, ShoppingCart, MessageSquare, ArrowRight, CheckCircle, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const AdminNotifications = () => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const navigate = useNavigate();

    // Fetch notifications from API (same as Header)
    const fetchNotifications = useCallback(async () => {
        try {
            setLoading(true);

            const token = sessionStorage.getItem('token');
            if (token) {
                try {
                    const payload = JSON.parse(atob(token.split('.')[1]));
                } catch (e) {
                    console.log('⚠️ Could not decode token');
                }
            }
            
            // Use same API service as Header (handles token automatically from sessionStorage)
            const response = await api.get('/notifications');

            if (response.data?.notifications) {
                const apiNotifications = response.data.notifications.map(n => ({
                    id: n._id,
                    title: n.title,
                    message: n.message,
                    isRead: n.isRead,
                    time: new Date(n.createdAt),
                    type: n.type,
                    data: n.data || {},
                    relatedId: n.relatedId,
                    actionUrl: n.actionUrl
                }));
                setNotifications(apiNotifications);
                console.log('✅ AdminNotifications loaded:', apiNotifications.length);
            }
        } catch (error) {
            console.error('❌ AdminNotifications fetch error:', error);
            if (error.response?.status === 401) {
                console.warn('⚠️ AdminNotifications: User not authenticated');
                setNotifications([]);
            }
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchNotifications();
        
        // Setup socket for real-time updates
        const setupSocket = async () => {
            try {
                const { initSocket } = await import('../controllers/ChatController');
                const socket = initSocket();
                
                if (socket) {
                    console.log('🔌 AdminNotifications socket connected');
                    
                    const handleNewOrder = () => {
                        console.log('🔔 AdminNotifications received newOrder, refreshing...');
                        setTimeout(fetchNotifications, 1000); // Refresh after 1 second
                    };
                    
                    socket.on('newOrder', handleNewOrder);
                    socket.on('adminNotification', handleNewOrder);
                    
                    return () => {
                        socket.off('newOrder', handleNewOrder);
                        socket.off('adminNotification', handleNewOrder);
                    };
                }
            } catch (error) {
                console.error('❌ AdminNotifications socket error:', error);
            }
        };
        
        const socketCleanup = setupSocket();
        
        return () => {
            if (socketCleanup && typeof socketCleanup === 'function') {
                socketCleanup();
            }
        };
    }, [fetchNotifications]);

    const markAsRead = async (id) => {
        // Update UI immediately
        setNotifications(prev => prev.map(notif =>
            notif.id === id ? { ...notif, isRead: true } : notif
        ));
        
        // Call API to persist
        try {
            await api.put(`/notifications/${id}/read`);
            console.log('✅ Notification marked as read:', id);
        } catch (error) {
            console.error('❌ Error marking notification as read:', error);
            // Revert UI change
            setNotifications(prev => prev.map(notif =>
                notif.id === id ? { ...notif, isRead: false } : notif
            ));
        }
    };

    const markAllAsRead = async () => {
        const originalNotifications = [...notifications];
        setNotifications(prev => prev.map(notif => ({ ...notif, isRead: true })));
        
        try {
            await api.put('/notifications/read-all');
            console.log('✅ All notifications marked as read');
        } catch (error) {
            console.error('❌ Error marking all notifications as read:', error);
            setNotifications(originalNotifications);
        }
    };

    const deleteNotification = (id) => {
        setNotifications(prev => prev.filter(notif => notif.id !== id));
    };

    const handleNotificationClick = async (notif) => {
        console.log('🔔 Notification clicked:', notif);
        console.log('🔔 Notification data:', notif.data);
        console.log('🔔 Notification actionUrl:', notif.actionUrl);
        console.log('🔔 Notification relatedId:', notif.relatedId);
        
        // Mark as read if not already
        if (!notif.isRead) {
            markAsRead(notif.id);
        }
        
        // Navigate based on notification type and data
        if (notif.type === 'order') {
            // Try multiple ways to get order identifier
            const orderIdentifier = notif.data?.orderNumber || 
                                  notif.data?.orderId || 
                                  notif.relatedId ||
                                  (notif.message && notif.message.match(/#([A-Z0-9-]+)/)?.[1]) ||
                                  (notif.message && notif.message.match(/PW\d+/)?.[0]);
            
            console.log('🎯 Order identifier found:', orderIdentifier);
            
            if (orderIdentifier) {
                console.log('🎯 Navigating to admin order:', orderIdentifier);
                navigate(`/admin/orders/${orderIdentifier}`);
            } else {
                console.log('⚠️ No order identifier found, navigating to orders list');
                navigate('/admin/orders');
            }
        } else if (notif.actionUrl) {
            // Use custom action URL if provided
            console.log('🎯 Using actionUrl:', notif.actionUrl);
            navigate(notif.actionUrl);
        } else {
            // Default fallback based on type
            switch (notif.type) {
                case 'order':
                    navigate('/admin/orders');
                    break;
                case 'user':
                    navigate('/admin/users');
                    break;
                case 'chat':
                    navigate('/admin/chat');
                    break;
                default:
                    console.log('ℹ️ No specific navigation for type:', notif.type);
            }
        }
    };

    const getNotificationIcon = (type) => {
        switch (type) {
            case 'order': return '📦';
            case 'user': return '👤';
            case 'product': return '📱';
            case 'chat': return '💬';
            default: return '🔔';
        }
    };

    const filteredNotifications = notifications.filter(notif => {
        if (filter === 'all') return true;
        return notif.type === filter;
    });

    const formatTime = (date) => {
        const now = new Date();
        const diff = Math.floor((now - date) / 1000);

        if (diff < 60) return 'Vừa xong';
        if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
        if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
        return date.toLocaleDateString('vi-VN');
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    const unreadCount = notifications.filter(n => !n.isRead).length;

    return (
        <div className="max-w-5xl mx-auto p-6 space-y-6">
            {/* Header */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-blue-100 rounded-lg">
                            <Bell className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-800">Thông báo</h1>
                            <p className="text-sm text-gray-500">
                                {unreadCount > 0
                                    ? `Bạn có ${unreadCount} thông báo chưa đọc`
                                    : 'Tất cả thông báo đã được đọc'}
                            </p>
                        </div>
                    </div>
                    {unreadCount > 0 && (
                        <button
                            onClick={markAllAsRead}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                        >
                            <CheckCircle className="w-4 h-4" />
                            Đánh dấu tất cả đã đọc
                        </button>
                    )}
                </div>
            </div>

            {/* Filters */}
            <div className="flex gap-2 overflow-x-auto pb-2">
                {[
                    { value: 'all', label: 'Tất cả', icon: Bell },
                    { value: 'order', label: 'Đơn hàng', icon: Package },
                    { value: 'user', label: 'Người dùng', icon: Users },
                    { value: 'product', label: 'Sản phẩm', icon: ShoppingCart },
                    { value: 'chat', label: 'Chat', icon: MessageSquare },
                ].map(({ value, label, icon: Icon }) => {
                    const count = value === 'all'
                        ? unreadCount
                        : notifications.filter(n => !n.isRead && n.type === value).length;

                    return (
                        <button
                            key={value}
                            onClick={() => setFilter(value)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all whitespace-nowrap ${filter === value
                                    ? 'bg-blue-600 text-white shadow-md'
                                    : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                                }`}
                        >
                            <Icon className="w-4 h-4" />
                            {label}
                            {count > 0 && (
                                <span className="px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
                                    {count}
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Notifications List */}
            <div className="space-y-3">
                {filteredNotifications.length === 0 ? (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
                        <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500">Không có thông báo nào</p>
                    </div>
                ) : (
                    filteredNotifications.map((notif) => (
                        <div
                            key={notif.id}
                            className={`bg-white rounded-xl shadow-sm border transition-all hover:shadow-md cursor-pointer ${notif.isRead ? 'border-gray-100' : 'border-blue-200 bg-blue-50/30'
                                }`}
                            onClick={() => handleNotificationClick(notif)}
                        >
                            <div className="p-4">
                                <div className="flex items-start gap-4">
                                    {/* Icon */}
                                    <div className={`p-3 rounded-lg ${notif.isRead ? 'bg-gray-100 text-gray-600' : 'bg-blue-100 text-blue-600'
                                        }`}>
                                        <span className="text-lg">{getNotificationIcon(notif.type)}</span>
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2 mb-1">
                                            <div className="flex-1">
                                                <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                                                    {notif.title}
                                                    {/* Show status indicator for order notifications */}
                                                    {notif.type === 'order' && notif.data?.action === 'cancelled' && (
                                                        <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded">
                                                            Đã hủy
                                                        </span>
                                                    )}
                                                    {notif.type === 'order' && notif.data?.action !== 'cancelled' && notif.title.includes('hủy') && (
                                                        <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded">
                                                            Đã hủy
                                                        </span>
                                                    )}
                                                </h3>
                                            </div>
                                            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                                {!notif.isRead && (
                                                    <button
                                                        onClick={() => markAsRead(notif.id)}
                                                        className="text-blue-600 hover:text-blue-700 text-sm font-medium whitespace-nowrap"
                                                    >
                                                        Đánh dấu đã đọc
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => deleteNotification(notif.id)}
                                                    className="p-1 hover:bg-red-50 rounded-lg transition-colors"
                                                >
                                                    <X className="w-4 h-4 text-gray-400 hover:text-red-600" />
                                                </button>
                                            </div>
                                        </div>
                                        <p className="text-gray-600 text-sm mb-3">
                                            {notif.message}
                                            {/* Show cancellation reason if available */}
                                            {notif.type === 'order' && notif.data?.reason && (
                                                <span className="block mt-1 text-red-600 text-xs">
                                                    Lý do hủy: {notif.data.reason}
                                                </span>
                                            )}
                                        </p>

                                        
                                        <div className="flex items-center justify-between gap-3">
                                            <span className="text-xs text-gray-400">
                                                {formatTime(notif.time)}
                                            </span>
                                            <ArrowRight className="w-4 h-4 text-gray-400" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default AdminNotifications;