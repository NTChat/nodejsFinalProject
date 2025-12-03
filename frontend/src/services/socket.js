// frontend/src/services/socket.js
import { io } from 'socket.io-client';
import { BACKEND_URL } from './api';

// Socket instance (singleton)
let socket = null;

/**
 * Khởi tạo socket connection
 */
export const initSocket = () => {
    if (!socket) {
        socket = io(BACKEND_URL, {
            withCredentials: true,
            transports: ['polling', 'websocket'],
            secure: window.location.protocol === 'https:',
            rejectUnauthorized: false
        });
        
        socket.on('connect', () => {
            console.log('🔌 Socket connected:', socket.id);
        });
        
        socket.on('disconnect', () => {
            console.log('❌ Socket disconnected');
        });
        
        socket.on('connect_error', (error) => {
            console.error('❌ Socket connection error:', error.message);
        });

        socket.on('reconnect', (attemptNumber) => {
            console.log('🔄 Socket reconnected after', attemptNumber, 'attempts');
        });
    }
    return socket;
};

/**
 * Lấy socket instance (tự động init nếu chưa có)
 */
export const getSocket = () => {
    if (!socket) {
        return initSocket();
    }
    return socket;
};

/**
 * Ngắt kết nối socket
 */
export const disconnectSocket = () => {
    if (socket) {
        socket.disconnect();
        socket = null;
        console.log('🔌 Socket manually disconnected');
    }
};

/**
 * Kiểm tra socket đã kết nối chưa
 */
export const isSocketConnected = () => {
    return socket?.connected || false;
};

// ============ CHAT SOCKET EVENTS ============

/**
 * Join admin room để nhận thông báo tin nhắn mới
 */
export const adminJoinRoom = () => {
    const s = getSocket();
    s.emit('admin-join');
    console.log('👤 Admin joined admin-room');
};

/**
 * Customer join conversation room
 */
export const joinConversation = (conversationId) => {
    const s = getSocket();
    s.emit('join-conversation', conversationId);
    console.log('💬 Joined conversation:', conversationId);
};

/**
 * Leave conversation room
 */
export const leaveConversation = (conversationId) => {
    const s = getSocket();
    s.emit('leave-conversation', conversationId);
    console.log('🚪 Left conversation:', conversationId);
};

/**
 * Admin join conversation cụ thể để chat
 */
export const adminJoinConversation = (conversationId) => {
    const s = getSocket();
    s.emit('admin-join-conversation', conversationId);
    console.log('👤 Admin joined conversation:', conversationId);
};

/**
 * Bắt đầu gõ (typing indicator)
 */
export const startTyping = (conversationId, sender, senderName) => {
    const s = getSocket();
    s.emit('typing-start', { conversationId, sender, senderName });
};

/**
 * Ngừng gõ
 */
export const stopTyping = (conversationId, sender) => {
    const s = getSocket();
    s.emit('typing-stop', { conversationId, sender });
};

// ============ SOCKET EVENT LISTENERS ============

/**
 * Lắng nghe tin nhắn mới từ admin (cho customer)
 */
export const onNewAdminMessage = (callback) => {
    const s = getSocket();
    s.on('new-admin-message', callback);
    return () => s.off('new-admin-message', callback);
};

/**
 * Lắng nghe tin nhắn mới từ customer (cho admin)
 */
export const onNewCustomerMessage = (callback) => {
    const s = getSocket();
    s.on('new-customer-message', callback);
    return () => s.off('new-customer-message', callback);
};

/**
 * Lắng nghe typing indicator
 */
export const onUserTyping = (callback) => {
    const s = getSocket();
    s.on('user-typing', callback);
    return () => s.off('user-typing', callback);
};

/**
 * Lắng nghe stop typing
 */
export const onUserStopTyping = (callback) => {
    const s = getSocket();
    s.on('user-stop-typing', callback);
    return () => s.off('user-stop-typing', callback);
};

// ============ ORDER NOTIFICATIONS (có thể mở rộng) ============

/**
 * Lắng nghe thông báo đơn hàng mới (cho admin)
 */
export const onNewOrder = (callback) => {
    const s = getSocket();
    s.on('new-order', callback);
    return () => s.off('new-order', callback);
};

/**
 * Lắng nghe cập nhật trạng thái đơn hàng (cho customer)
 */
export const onOrderStatusUpdate = (callback) => {
    const s = getSocket();
    s.on('order-status-update', callback);
    return () => s.off('order-status-update', callback);
};

// ============ GENERIC EVENT HELPERS ============

/**
 * Emit một event tùy chỉnh
 */
export const emitEvent = (eventName, data) => {
    const s = getSocket();
    s.emit(eventName, data);
};

/**
 * Lắng nghe một event tùy chỉnh
 */
export const onEvent = (eventName, callback) => {
    const s = getSocket();
    s.on(eventName, callback);
    return () => s.off(eventName, callback);
};

/**
 * Xóa listener cho một event
 */
export const offEvent = (eventName, callback) => {
    const s = getSocket();
    if (callback) {
        s.off(eventName, callback);
    } else {
        s.off(eventName);
    }
};

export default {
    // Core
    initSocket,
    getSocket,
    disconnectSocket,
    isSocketConnected,
    // Chat
    adminJoinRoom,
    joinConversation,
    leaveConversation,
    adminJoinConversation,
    startTyping,
    stopTyping,
    onNewAdminMessage,
    onNewCustomerMessage,
    onUserTyping,
    onUserStopTyping,
    // Orders
    onNewOrder,
    onOrderStatusUpdate,
    // Generic
    emitEvent,
    onEvent,
    offEvent
};
