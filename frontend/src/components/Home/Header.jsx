import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaShoppingCart, FaSearch, FaBars, FaTimes,
  FaHome, FaBox, FaInfoCircle, FaPhoneAlt,
  FaSignOutAlt, FaAngleDown,
  FaUserCircle, FaChartBar, FaBell, FaCommentDots, FaUserPlus
} from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { toast } from 'react-toastify';
import api from '../../services/api';

// 👇 IMPORT CONTROLLER THAY VÌ API TRỰC TIẾP
import { ProductController } from '../../controllers/productController';
import { getAllConversations, initSocket } from '../../controllers/ChatController';

// Helper functions
const getOrderTitle = (status) => {
  const titles = {
    'Pending': '🔔 Đơn hàng mới',
    'Confirmed': '✅ Đơn hàng đã xác nhận',
    'Shipping': '🚚 Đang giao hàng',
    'Delivered': '📦 Đã giao hàng',
    'Cancelled': '❌ Đơn hàng đã hủy'
  };
  return titles[status] || '📋 Cập nhật đơn hàng';
};

const formatPrice = (price) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(price || 0);
};

const Header = () => {
  const { isAuthenticated, logout, user } = useAuth();
  const { itemCount } = useCart();
  const navigate = useNavigate();
  const location = useLocation();

  // --- STATE ---
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAvatarMenuOpen, setIsAvatarMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  // State Tìm kiếm
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);

  // Notifications
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0); // Lấy từ API thay vì đếm local
  const [chatNotifications, setChatNotifications] = useState([]);
  const [totalUnreadChats, setTotalUnreadChats] = useState(0);

  // Fetch notifications from API (enhanced with chat support)
  const fetchNotifications = async () => {
    if (!isAuthenticated) return;
    
    try {
      console.log('🔔 Header fetching notifications for user:', user);
      
      let allNotifications = [];
      let apiUnreadCount = 0;
      
      // Both admin and regular users: fetch real notifications from API
      try {
        const res = await api.get('/notifications');
        console.log('🔔 Header API response:', res.data);
        
        if (res.data?.notifications) {
          const realNotifications = res.data.notifications.slice(0, 10).map(n => ({
            id: n._id,
            title: n.title,
            message: n.message,
            isRead: n.isRead,
            time: getTimeAgo(n.createdAt),
            actionUrl: n.actionUrl,
            type: n.type,
            data: n.data || {},
            relatedId: n.relatedId
          }));
          allNotifications = [...realNotifications];
          apiUnreadCount = res.data?.unreadCount || 0;
          console.log('🔔 Header real notifications:', realNotifications.length);
        }
      } catch (apiError) {
        console.error('Error fetching notifications from API:', apiError);
      }

      // Fetch chat notifications for admin
      let chatUnreadTotal = 0;
      
      if (user?.role === 'admin') {
        try {
          const chatData = await getAllConversations('all', 1, 20);
          if (chatData.success) {
            const unreadConversations = chatData.conversations.filter(conv => conv.unreadCount > 0);
            const chatNotifs = unreadConversations.slice(0, 3).map(conv => ({
              id: `chat-${conv._id}`,
              title: '💬 Tin nhắn mới',
              message: `${conv.userId?.name || conv.guestName || 'Khách'}: ${conv.lastMessage?.text || 'Đã gửi tin nhắn'}`,
              isRead: false,
              time: getTimeAgo(conv.updatedAt),
              actionUrl: '/admin/chat',
              type: 'chat',
              unreadCount: conv.unreadCount,
              conversationId: conv._id
            }));
            
            chatUnreadTotal = chatData.unreadTotal || 0;
            setChatNotifications(chatNotifs);
            setTotalUnreadChats(chatUnreadTotal);
            allNotifications = [...allNotifications, ...chatNotifs];
          }
        } catch (chatError) {
          console.error('Error fetching chat notifications:', chatError);
        }
      }

      setNotifications(allNotifications);
      
      // Calculate total unread count: API notifications + chat (for admin only)
      const totalUnread = apiUnreadCount + (user?.role === 'admin' ? chatUnreadTotal : 0);
      setUnreadCount(totalUnread);
      
      console.log('📊 Header notifications:', {
        api: apiUnreadCount,
        chat: chatUnreadTotal,
        total: totalUnread,
        notifications: allNotifications.length
      });
      
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    
    // Setup real-time notifications for admin (NO AUTO REFRESH)
    if (user?.role === 'admin') {
      const socket = initSocket();
      console.log('🔌 Header socket initialized:', socket ? 'SUCCESS' : 'FAILED');
      
      const handleNewMessage = (data) => {
        // Create new chat notification
        const newNotification = {
          id: `chat-${data.conversationId}-${Date.now()}`,
          title: '💬 Tin nhắn mới',
          message: `${data.message.senderName || 'Khách'}: ${data.message.text}`,
          isRead: false,
          time: 'Vừa xong',
          actionUrl: '/admin/chat',
          type: 'chat',
          conversationId: data.conversationId
        };
        
        setNotifications(prev => [newNotification, ...prev.slice(0, 6)]);
        setUnreadCount(prev => prev + 1);
        
        // Show toast notification
        toast(`🔔 Tin nhắn mới từ ${data.message.senderName || 'khách hàng'}`, {
          duration: 4000,
          position: 'top-right'
        });
      };

      const handleNewOrder = (data) => {
        console.log('🔔 Header received new order event:', data);
        
        // Method 1: Add notification directly to state (immediate)
        const newNotification = {
          id: `order-${data.orderId}-${Date.now()}`,
          title: getOrderTitle('Pending'),
          message: `Đơn hàng #${data.orderId} - ${data.customerName} - ${formatPrice(data.totalPrice)}`,
          isRead: false,
          time: 'Vừa xong',
          actionUrl: `/admin/orders/${data.orderId}`,
          type: 'order',
          data: data
        };
        
        setNotifications(prev => [newNotification, ...prev]);
        setUnreadCount(prev => prev + 1);
        
        // Method 2: Also refresh from API to get persistent notification (backup)
        setTimeout(async () => {
          console.log('🔄 Header refreshing notifications after new order...');
          try {
            const res = await api.get('/notifications');
            if (res.data?.notifications) {
              const apiNotifications = res.data.notifications.slice(0, 10).map(n => ({
                id: n._id,
                title: n.title,
                message: n.message,
                isRead: n.isRead,
                time: getTimeAgo(n.createdAt),
                actionUrl: n.actionUrl,
                type: n.type,
                data: n.data
              }));
              setNotifications(prev => {
                // Merge socket notification with API notifications, avoid duplicates
                const socketIds = prev.filter(n => n.id.includes('-' + Date.now())).map(n => n.id);
                const apiOnly = apiNotifications.filter(n => !socketIds.includes(n.id));
                return [...prev.filter(n => socketIds.includes(n.id)), ...apiOnly];
              });
              setUnreadCount(res.data?.unreadCount || 0);
              console.log('✅ Header notifications refreshed from API');
            }
          } catch (error) {
            console.error('❌ Error refreshing notifications:', error);
          }
        }, 2000); // Wait 2 seconds for backend to save notification
        
        // Show toast notification
        toast(`🛍️ Đơn hàng mới: ${data.orderId}`, {
          duration: 4000,
          position: 'top-right'
        });
      };
      
      if (socket) {
        
        // Test socket connection with ping
        socket.emit('ping', 'Header admin connecting...');
        
        socket.on('new-customer-message', handleNewMessage);
        socket.on('newOrder', handleNewOrder);
        socket.on('adminNotification', handleNewOrder);
        
        socket.on('connect', () => {
          console.log('✅ Header socket connected, ID:', socket.id);
        });
        
        socket.on('disconnect', () => {
          console.log('❌ Header socket disconnected');
        });
      } else {
        console.error('❌ Socket initialization failed in Header');
      }
      
      return () => {
        if (socket) {
          socket.off('new-customer-message', handleNewMessage);
          socket.off('newOrder', handleNewOrder);
          socket.off('adminNotification', handleNewOrder);
        }
      };
    }
    // eslint-disable-next-line
  }, [isAuthenticated, user]);

  // Lắng nghe event để refresh notifications (khi đặt hàng thành công)
  useEffect(() => {
    const handleRefreshNotifications = () => {
      console.log('🔔 Header refreshing notifications due to external event...');
      fetchNotifications();
    };

    const handleOrderSuccess = () => {
      console.log('🛍️ Header received order success event, refreshing...');
      // Delay a bit to ensure order is saved to database
      setTimeout(() => {
        fetchNotifications();
      }, 1000);
    };

    window.addEventListener('refreshNotifications', handleRefreshNotifications);
    window.addEventListener('orderCreated', handleOrderSuccess);

    return () => {
      window.removeEventListener('refreshNotifications', handleRefreshNotifications);
      window.removeEventListener('orderCreated', handleOrderSuccess);
    };
    // eslint-disable-next-line
  }, []);

  // Helper function to get time ago
  const getTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Vừa xong';
    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    if (diffDays < 7) return `${diffDays} ngày trước`;
    return date.toLocaleDateString('vi-VN');
  };

  // Refs
  const avatarMenuRef = useRef(null);
  const notificationMenuRef = useRef(null);
  const searchContainerRef = useRef(null);
  const searchTimeoutRef = useRef(null);

  // Detect Scroll
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  // eslint-disable-next-line
  }, []);

  // Click Outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (avatarMenuRef.current && !avatarMenuRef.current.contains(event.target)) {
        setIsAvatarMenuOpen(false);
      }
      if (notificationMenuRef.current && !notificationMenuRef.current.contains(event.target)) {
        setIsNotificationOpen(false);
      }
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsAvatarMenuOpen(false);
    setIsNotificationOpen(false);
    setShowSuggestions(false);
    setIsMobileSearchOpen(false);
    // eslint-disable-next-line
  }, [location]);

  const handleLogout = () => {
    logout();
    navigate('/login');
    toast.info("Đã đăng xuất thành công");
  };

  // --- LOGIC TÌM KIẾM (ĐÃ NÂNG CẤP) ---
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);

    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    if (!value.trim()) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    // Debounce 300ms
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        // 👇 GỌI QUA PRODUCT CONTROLLER
        const products = await ProductController.searchProducts(value);
        setSuggestions(products);
        setShowSuggestions(true);
      } catch (error) {
        console.error("Lỗi tìm kiếm:", error);
      }
    }, 300);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchTerm)}`);
      setShowSuggestions(false);
      setIsMobileSearchOpen(false);
    }
  };

  const handleSuggestionClick = (product) => {
    // Hỗ trợ nhiều kiểu ID/Slug
    const productId = product.slug || product.productId || product._id;
    navigate(`/products/${productId}`);
    setShowSuggestions(false);
    setSearchTerm('');
    setIsMobileSearchOpen(false);
  };

  const markAllAsRead = async () => {
    try {
      // Mark general notifications as read
      await api.put('/notifications/read-all');
      
      // Mark chat notifications as read (could implement API endpoint)
      const updated = notifications.map(n => ({ ...n, isRead: true }));
      setNotifications(updated);
      setUnreadCount(0);
      setTotalUnreadChats(0);
      
      toast.success("Đã đánh dấu tất cả là đã đọc");
    } catch (err) {
      console.error('Error marking all as read:', err);
      toast.error("Lỗi khi đánh dấu đã đọc");
    }
  };
  
  // Handle individual notification click
  const handleNotificationClick = (notification) => {
    console.log('🔔 Header notification clicked:', notification);
    console.log('🔔 Notification type:', notification.type);
    console.log('🔔 Notification data:', notification.data);
    console.log('🔔 Notification actionUrl:', notification.actionUrl);
    
    // Mark as read
    setNotifications(prev => prev.map(n => 
      n.id === notification.id ? { ...n, isRead: true } : n
    ));
    setUnreadCount(prev => Math.max(0, prev - 1));

    // Navigate based on type and available data
    if (notification.type === 'chat') {
      console.log('🎯 Navigating to admin chat');
      navigate('/admin/chat');
      setIsNotificationOpen(false);
    } else if (notification.type === 'order') {
      // Try multiple ways to get order identifier
      const orderIdentifier = notification.data?.orderNumber || 
                            notification.data?.orderId || 
                            notification.relatedId ||
                            (notification.message && notification.message.match(/#([A-Z0-9-]+)/)?.[1]) ||
                            (notification.message && notification.message.match(/PW\d+/)?.[0]);
      
      console.log('🎯 Order identifier found:', orderIdentifier);
      
      if (orderIdentifier) {
        if (user?.role === 'admin') {
          console.log('🎯 Admin navigating to:', `/admin/orders/${orderIdentifier}`);
          navigate(`/admin/orders/${orderIdentifier}`);
        } else {
          console.log('🎯 User navigating to:', `/orders/${orderIdentifier}`);
          navigate(`/orders/${orderIdentifier}`);
        }
        setIsNotificationOpen(false);
      } else {
        // Fallback to orders list
        console.log('⚠️ No order identifier found, going to orders list');
        if (user?.role === 'admin') {
          navigate('/admin/orders');
        } else {
          navigate('/profile');
        }
        setIsNotificationOpen(false);
      }
    } else if (notification.actionUrl) {
      console.log('🎯 Using actionUrl:', notification.actionUrl);
      navigate(notification.actionUrl);
      setIsNotificationOpen(false);
    } else {
      // Fallback: close notification panel
      console.log('⚠️ No navigation rule found, closing panel');
      setIsNotificationOpen(false);
    }
  };
  
  // Get notification icon based on type
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'chat':
        return '💬';
      case 'order':
        return '📦';
      case 'user':
        return '👤';
      case 'product':
        return '📱';
      default:
        return '🔔';
    }
  };
  
  // Format time helper
  const formatNotificationTime = (time) => {
    if (!time) return '';
    const now = new Date();
    const notifTime = new Date(time);
    const diff = now - notifTime;
    
    if (diff < 60000) return 'Vừa xong';
    if (diff < 3600000) return `${Math.floor(diff / 60000)} phút trước`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} giờ trước`;
    return notifTime.toLocaleDateString('vi-VN');
  };

  const isAdmin = user?.role === 'admin';
  const displayName = user?.name || user?.userName || user?.email?.split('@')[0] || "Khách";
  
  // State cho submenu admin
  const [isAdminMenuOpen, setIsAdminMenuOpen] = useState(false);

  // Real-time notification system for admin
  useEffect(() => {
    if (!isAdmin) return;

    const loadInitialNotifications = async () => {
      try {
        // Load chat notifications
        const chatData = await getAllConversations('all', 1, 50);
        if (chatData.success) {
          const unreadConversations = chatData.conversations.filter(conv => conv.unreadCount > 0);
          const chatNotifs = unreadConversations.map(conv => ({
            id: `chat-${conv._id}`,
            title: '💬 Tin nhắn mới',
            message: `${conv.userId?.name || conv.guestName || 'Khách'}: ${conv.lastMessage?.text || 'Đã gửi tin nhắn'}`,
            time: getTimeAgo(conv.updatedAt),
            isRead: false,
            type: 'chat',
            unreadCount: conv.unreadCount,
            conversationId: conv._id
          }));
          
          setChatNotifications(chatNotifs);
          setTotalUnreadChats(chatData.unreadTotal || 0);
          
          // Merge với notifications hiện tại
          setNotifications(prev => {
            const nonChatNotifs = prev.filter(n => n.type !== 'chat');
            return [...nonChatNotifs, ...chatNotifs];
          });
          
          // Update unread count
          const totalUnread = chatNotifs.length + notifications.filter(n => n.type !== 'chat' && !n.isRead).length;
          setUnreadCount(totalUnread);
        }
      } catch (error) {
        console.error('Error loading notifications:', error);
      }
    };

    loadInitialNotifications();

    // Setup real-time updates
    const socket = initSocket();
    
    const handleNewMessage = (data) => {
      // Tạo notification mới
      const newNotification = {
        id: `chat-${data.conversationId}-${Date.now()}`,
        title: '💬 Tin nhắn mới',
        message: `${data.message.senderName || 'Khách'}: ${data.message.text}`,
        time: new Date(),
        isRead: false,
        type: 'chat',
        conversationId: data.conversationId
      };
      
      setNotifications(prev => [newNotification, ...prev.filter(n => n.id !== newNotification.id)]);
      setUnreadCount(prev => prev + 1);
      
      // Show toast notification
      toast(`💬 ${data.message.senderName || 'Khách'} đã gửi tin nhắn mới`, {
        duration: 4000,
        icon: '🔔'
      });
    };
    
    if (socket) {
      socket.on('new-customer-message', handleNewMessage);
    }
    
    // Refresh notifications every 30 seconds
    const interval = setInterval(loadInitialNotifications, 30000);
    
    return () => {
      if (socket) {
        socket.off('new-customer-message', handleNewMessage);
      }
      clearInterval(interval);
    };
  }, [isAdmin, user]);

  const navLinks = [
    { name: 'Trang chủ', path: '/', icon: FaHome },
    { name: 'Sản phẩm', path: '/products', icon: FaBox },
    { name: 'Giới thiệu', path: '/about', icon: FaInfoCircle },
    { name: 'Liên hệ', path: '/contact', icon: FaPhoneAlt },
  ];

  // --- UI GỢI Ý SẢN PHẨM ---
  const SearchSuggestionsList = () => {
    if (!showSuggestions || suggestions.length === 0) return null;
    return (
      <div className="absolute top-full left-0 w-full bg-white shadow-xl rounded-2xl mt-2 border border-gray-100 overflow-hidden z-[60] animate-fade-in-up">
        <div className="p-2 bg-gray-50 border-b border-gray-100 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
          Gợi ý sản phẩm
        </div>
        <div className="max-h-64 overflow-y-auto custom-scrollbar">
          {suggestions.map((product) => {
            // Xử lý ảnh (Dùng helper của Controller nếu cần, hoặc logic tại chỗ)
            const img = Array.isArray(product.images) && product.images.length > 0
              ? product.images[0].url || product.images[0]
              : (product.image || '/placeholder.png');

            // Sử dụng ProductController.getImageUrl để đảm bảo full path nếu cần
            const fullImgUrl = ProductController.getImageUrl(img);

            return (
              <div
                key={product._id || product.productId || product.id || product.slug}
                onClick={() => handleSuggestionClick(product)}
                className="flex items-center gap-3 p-3 hover:bg-indigo-50 cursor-pointer transition-colors border-b border-gray-50 last:border-0"
              >
                <div className="w-10 h-10 rounded-lg bg-white border border-gray-200 flex-shrink-0 overflow-hidden">
                  <img src={fullImgUrl} alt={product.name} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{product.productName || product.name}</p>
                  <p className="text-xs text-indigo-600 font-bold mt-0.5">
                    {(Number(product.price) || 0).toLocaleString()} ₫
                  </p>
                </div>
              </div>
            );
          })}
        </div>
        <div
          onClick={handleSearchSubmit}
          className="p-3 text-center text-xs text-indigo-600 font-bold hover:bg-indigo-50 cursor-pointer border-t border-gray-100 uppercase tracking-wide"
        >
          Xem tất cả kết quả cho "{searchTerm}"
        </div>
      </div>
    );
  };

  return (
    <>
      {/* --- HEADER FIXED --- */}
      <header
        className={`fixed w-full top-0 z-50 transition-all duration-300 border-b
          ${isScrolled
            ? 'bg-white/95 backdrop-blur-md shadow-md border-gray-200/50 py-2'
            : 'bg-white backdrop-blur-sm border-transparent py-3'
          }`}
      >
        <div className="w-full px-4 sm:px-6 lg:px-8 max-w-[1920px] mx-auto relative">

          {/* ⚡ MOBILE SEARCH OVERLAY (Hiện khi bấm kính lúp trên mobile) */}
          <AnimatePresence>
            {isMobileSearchOpen ? (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute inset-0 z-50 bg-white px-4 flex items-center gap-3 h-full shadow-sm md:hidden"
              >
                <form onSubmit={handleSearchSubmit} className="flex-1 relative" ref={searchContainerRef}>
                  <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-indigo-500" />
                  <input
                    autoFocus
                    type="text"
                    placeholder="Tìm kiếm sản phẩm..."
                    className="w-full pl-10 pr-4 py-2 bg-gray-100 border-transparent border focus:bg-white focus:border-indigo-500 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                    value={searchTerm}
                    onChange={handleSearchChange}
                    onFocus={() => { if (searchTerm) setShowSuggestions(true) }}
                  />
                  {/* Gợi ý Mobile */}
                  <SearchSuggestionsList />
                </form>
                <button
                  onClick={() => setIsMobileSearchOpen(false)}
                  className="p-2 text-gray-500 hover:text-red-500 transition-colors font-medium text-sm"
                >
                  Hủy
                </button>
              </motion.div>
            ) : null}
          </AnimatePresence>

          {/* ⚡ HEADER CONTENT (Ẩn khi đang search mobile) */}
          <div className={`flex justify-between items-center h-14 md:h-16 gap-4 ${isMobileSearchOpen ? 'invisible md:visible' : ''}`}>

            {/* 1. LOGO */}
            <div className="flex-shrink-0 flex items-center cursor-pointer gap-3 group" onClick={() => navigate('/')}>
              <div className="bg-gradient-to-br from-indigo-600 to-purple-600 text-white p-2 rounded-xl shadow-lg shadow-indigo-200/50 group-hover:rotate-3 transition-transform duration-300">
                <span className="font-black text-xl tracking-tighter">PW</span>
              </div>
              <div className="hidden lg:block">
                <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-700 to-purple-600 tracking-tight leading-none">
                  PhoneWorld
                </h1>
                <p className="text-[10px] text-gray-500 font-medium tracking-[0.2em] uppercase mt-0.5">Premium Store</p>
              </div>
            </div>

            {/* 2. CENTER: NAV & SEARCH (DESKTOP) */}
            <div className="hidden md:flex flex-1 items-center justify-center max-w-4xl px-8 gap-6">
              {/* Nav Links */}
              <nav className="flex items-center space-x-1 flex-shrink-0">
                {navLinks.map((link) => {
                  const isActive = location.pathname === link.path;
                  return (
                    <Link
                      key={link.name}
                      to={link.path}
                      className={`
                          relative px-3 py-2 rounded-lg text-sm font-bold transition-all duration-200 flex items-center gap-2 whitespace-nowrap
                          ${isActive
                          ? 'text-indigo-600 bg-indigo-50'
                          : 'text-gray-500 hover:text-indigo-600 hover:bg-gray-50'
                        }
                        `}
                    >
                      <link.icon className={`text-lg ${isActive ? 'text-indigo-600' : 'text-gray-400 group-hover:text-indigo-500'}`} />
                      <span className="hidden xl:inline">{link.name}</span>
                    </Link>
                  );
                })}
              </nav>

              {/* SEARCH BAR DESKTOP */}
              <div className="relative flex-1 w-full max-w-md group z-50" ref={searchContainerRef}>
                <form onSubmit={handleSearchSubmit} className="relative">
                  <input
                    type="text"
                    placeholder="Tìm kiếm..."
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-100 border-transparent border focus:bg-white focus:border-indigo-500 rounded-full text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all duration-300"
                    value={searchTerm}
                    onChange={handleSearchChange}
                    onFocus={() => { if (searchTerm) setShowSuggestions(true) }}
                  />
                  <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                </form>
                {/* Gợi ý Desktop */}
                <SearchSuggestionsList />
              </div>
            </div>

            {/* 3. RIGHT ACTIONS */}
            <div className="flex items-center gap-2 sm:gap-3">

              {/* Mobile Search Icon */}
              <button
                className="md:hidden p-2.5 rounded-full text-gray-500 hover:bg-gray-100 transition-colors"
                onClick={() => setIsMobileSearchOpen(true)}
              >
                <FaSearch className="text-lg" />
              </button>

              {/* Notifications */}
              {isAuthenticated && (
                <div className="relative" ref={notificationMenuRef}>
                  <button
                    onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all relative
                              ${isNotificationOpen ? 'bg-indigo-50 text-indigo-600' : 'text-gray-500 hover:bg-gray-100 hover:text-indigo-600'}
                          `}
                  >
                    <FaBell className="text-xl" />
                    {unreadCount > 0 && (
                      <span className="absolute top-0.5 right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white animate-pulse">
                        {unreadCount}
                      </span>
                    )}
                  </button>

                  <AnimatePresence>
                    {isNotificationOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute right-0 top-full mt-4 w-80 sm:w-96 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50 ring-1 ring-black/5"
                      >
                        <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                          <h3 className="font-bold text-gray-800 text-base">Thông báo</h3>
                          <button onClick={markAllAsRead} className="text-xs font-medium text-indigo-600 hover:text-indigo-800 hover:underline">
                            Đánh dấu đã đọc
                          </button>
                        </div>
                        <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                          {notifications.length === 0 ? (
                            <div className="p-8 text-center text-gray-400 flex flex-col items-center">
                              <FaBell className="text-3xl opacity-20 mb-2" />
                              <p className="text-sm font-medium">Không có thông báo mới</p>
                            </div>
                          ) : (
                            <ul className="divide-y divide-gray-50">
                              {notifications.map((item) => (
                                <li 
                                  key={item.id} 
                                  onClick={() => handleNotificationClick(item)}
                                  className={`p-4 hover:bg-indigo-50/50 transition-colors cursor-pointer ${!item.isRead ? 'bg-indigo-50/10 border-l-2 border-indigo-400' : ''}`}
                                >
                                  <div className="flex gap-3">
                                    <div className="flex-shrink-0 mt-1">
                                      <span className="text-lg">{getNotificationIcon(item.type)}</span>
                                      {!item.isRead && (
                                        <div className="w-2 h-2 rounded-full bg-indigo-500 shadow-lg absolute ml-4 -mt-1"></div>
                                      )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex justify-between items-start">
                                        <p className={`text-sm truncate ${!item.isRead ? 'font-bold text-gray-900' : 'font-medium text-gray-600'}`}>
                                          {item.title}
                                        </p>
                                        {item.type === 'chat' && item.unreadCount && (
                                          <span className="bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
                                            {item.unreadCount}
                                          </span>
                                        )}
                                      </div>
                                      <p className="text-xs text-gray-500 mt-1 line-clamp-2 leading-relaxed">{item.message}</p>
                                      <div className="flex justify-between items-center mt-2">
                                        <p className="text-[10px] text-gray-400 font-medium">{item.time instanceof Date ? item.time.toLocaleString('vi-VN') : item.time}</p>
                                        {item.type === 'chat' && (
                                          <span className="text-[10px] text-indigo-600 font-medium">Nhấn để trả lời</span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                        <div className="p-2 border-t border-gray-100 bg-gray-50/50 text-center">
                          <Link to={isAdmin ? "/admin/notifications" : "/notifications"} className="text-xs font-bold text-gray-500 hover:text-indigo-600 transition-colors block py-2">
                            Xem tất cả
                          </Link>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* Cart */}
              <Link to="/cart" className="relative w-10 h-10 rounded-full flex items-center justify-center text-gray-500 hover:bg-indigo-50 hover:text-indigo-600 transition-all group active:scale-95">
                <FaShoppingCart className="text-xl group-hover:scale-110 transition-transform" />
                {itemCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full h-5 w-5 flex items-center justify-center border-2 border-white shadow-sm group-hover:scale-110 transition-transform">
                    {itemCount > 99 ? '99+' : itemCount}
                  </span>
                )}
              </Link>

              {/* User Dropdown */}
              <div className="relative pl-2 border-l border-gray-200 ml-2" ref={avatarMenuRef}>
                {isAuthenticated ? (
                  <div
                    className="flex items-center cursor-pointer group p-1 pr-3 rounded-full hover:bg-gray-100/80 transition-all border border-transparent hover:border-gray-200"
                    onClick={() => setIsAvatarMenuOpen(!isAvatarMenuOpen)}
                  >
                    {/* Avatar */}
                    <div className="relative">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 p-[2px] shadow-md group-hover:shadow-indigo-200 transition-all">
                        <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden">
                          {user?.avatar ? (
                            <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
                          ) : (
                            <span className="font-bold text-indigo-600 text-sm">
                              {displayName.charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full"></div>
                    </div>

                    {/* Info */}
                    <div className="hidden xl:block ml-2.5 text-left">
                      <p className="text-sm font-bold text-gray-800 leading-none max-w-[100px] truncate">{displayName}</p>
                      <p className="text-[10px] font-bold text-indigo-500 mt-1 uppercase tracking-wider bg-indigo-50 inline-block px-1.5 py-0.5 rounded-md">
                        {isAdmin ? 'Admin' : (user?.membershipTier || 'Member')}
                      </p>
                    </div>

                    <FaAngleDown className={`ml-3 text-gray-400 text-xs transition-transform duration-200 ${isAvatarMenuOpen ? 'rotate-180' : ''}`} />

                    {/* Dropdown Content */}
                    <AnimatePresence>
                      {isAvatarMenuOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: 10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 10, scale: 0.95 }}
                          className="absolute right-0 top-full mt-4 w-72 bg-white rounded-2xl shadow-2xl border border-gray-100 py-2 overflow-hidden z-50 ring-1 ring-black/5 origin-top-right"
                        >
                          <div className="px-5 py-4 bg-gradient-to-r from-indigo-50/80 to-purple-50/80 border-b border-indigo-100/50">
                            <p className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-1">Tài khoản</p>
                            <p className="font-bold text-gray-900 text-lg truncate">{displayName}</p>
                            <p className="text-xs text-gray-500 truncate font-medium">{user?.email}</p>
                          </div>

                          <div className="p-2 space-y-1">
                            {isAdmin && (
                              <>
                                {/* Quản trị hệ thống - vào trang tổng quan admin */}
                                <Link to="/admin/dashboard" onClick={() => setIsAvatarMenuOpen(false)} className="flex items-center gap-3 p-3 rounded-xl hover:bg-blue-50 group transition-colors">
                                  <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform shadow-sm">
                                    <FaChartBar className="text-sm" />
                                  </div>
                                  <div>
                                    <p className="font-semibold text-gray-800 text-sm">Quản trị hệ thống</p>
                                    <p className="text-[10px] text-gray-400 font-medium">Sản phẩm, đơn hàng, người dùng</p>
                                  </div>
                                </Link>
                                
                                {/* Chat quản lý */}
                                <Link to="/admin/chat" onClick={() => setIsAvatarMenuOpen(false)} className="flex items-center gap-3 p-3 rounded-xl hover:bg-green-50 group transition-colors">
                                  <div className="w-9 h-9 rounded-lg bg-green-100 flex items-center justify-center text-green-600 group-hover:scale-110 transition-transform shadow-sm relative">
                                    <FaCommentDots className="text-sm" />
                                    {totalUnreadChats > 0 && (
                                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[8px] font-bold rounded-full flex items-center justify-center">
                                        {totalUnreadChats > 9 ? '9+' : totalUnreadChats}
                                      </span>
                                    )}
                                  </div>
                                  <div>
                                    <p className="font-semibold text-gray-800 text-sm">Chat khách hàng</p>
                                    <p className="text-[10px] text-gray-400 font-medium">
                                      {totalUnreadChats > 0 ? `${totalUnreadChats} tin nhắn mới` : 'Hỗ trợ khách hàng'}
                                    </p>
                                  </div>
                                </Link>

                                {/* Quản lý thông báo */}
                                <Link to="/admin/notifications" onClick={() => setIsAvatarMenuOpen(false)} className="flex items-center gap-3 p-3 rounded-xl hover:bg-orange-50 group transition-colors">
                                  <div className="w-9 h-9 rounded-lg bg-orange-100 flex items-center justify-center text-orange-600 group-hover:scale-110 transition-transform shadow-sm relative">
                                    <FaBell className="text-sm" />
                                    {unreadCount > 0 && (
                                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[8px] font-bold rounded-full flex items-center justify-center">
                                        {unreadCount > 9 ? '9+' : unreadCount}
                                      </span>
                                    )}
                                  </div>
                                  <div>
                                    <p className="font-semibold text-gray-800 text-sm">Quản lý thông báo</p>
                                    <p className="text-[10px] text-gray-400 font-medium">
                                      {unreadCount > 0 ? `${unreadCount} thông báo mới` : 'Tất cả thông báo'}
                                    </p>
                                  </div>
                                </Link>
                                
                                <div className="border-t border-gray-100 my-2"></div>
                              </>
                            )}

                            <Link to="/profile" className="flex items-center gap-3 p-3 rounded-xl hover:bg-purple-50 group transition-colors">
                              <div className="w-9 h-9 rounded-lg bg-purple-100 flex items-center justify-center text-purple-600 group-hover:scale-110 transition-transform shadow-sm">
                                <FaUserCircle className="text-sm" />
                              </div>
                              <div>
                                <p className="font-semibold text-gray-800 text-sm">Hồ sơ cá nhân</p>
                                <p className="text-[10px] text-gray-400 font-medium">Thông tin & Đơn hàng</p>
                              </div>
                            </Link>
                          </div>

                          <div className="border-t border-gray-100 mt-1 p-2">
                            <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-colors">
                              <FaSignOutAlt /> Đăng xuất
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 sm:gap-3">
                    <Link to="/login" className="text-gray-600 hover:text-indigo-600 font-bold text-sm px-4 py-2.5 rounded-full hover:bg-gray-100 transition-all border border-gray-200 hover:border-indigo-300">
                      Đăng nhập
                    </Link>
                    <Link to="/register" className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-6 py-2.5 rounded-full text-sm font-bold shadow-md shadow-indigo-200 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 flex items-center gap-2 whitespace-nowrap">
                      <FaUserPlus /> Đăng ký
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ✅ SPACER DIV: Giúp nội dung không bị che mất bởi Header Fixed */}
      <div className="h-[80px] md:h-[80px]" />
    </>
  );
};

export default Header;