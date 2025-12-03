// frontend/src/controllers/ChatController.jsx
import api from '../services/api';

// Re-export socket functions từ socket service
export {
    initSocket,
    getSocket,
    disconnectSocket,
    adminJoinRoom,
    joinConversation,
    leaveConversation,
    adminJoinConversation,
    startTyping,
    stopTyping,
    onNewAdminMessage,
    onNewCustomerMessage,
    onUserTyping,
    onUserStopTyping
} from '../services/socket';

// ============ CUSTOMER API ============

/**
 * Lấy hoặc tạo cuộc hội thoại cho customer
 */
export const getOrCreateConversation = async (data = {}) => {
    try {
        const response = await api.post('/chat/conversation', data);
        return response.data;
    } catch (error) {
        console.error('getOrCreateConversation error:', error);
        throw error.response?.data || { message: 'Không thể tạo cuộc hội thoại' };
    }
};

/**
 * Gửi tin nhắn (customer)
 */
export const sendMessage = async (conversationId, text, attachments = []) => {
    try {
        const response = await api.post('/chat/send', {
            conversationId,
            text,
            attachments
        });
        return response.data;
    } catch (error) {
        console.error('sendMessage error:', error);
        throw error.response?.data || { message: 'Không thể gửi tin nhắn' };
    }
};

/**
 * Lấy lịch sử tin nhắn
 */
export const getMessages = async (conversationId, page = 1, limit = 50) => {
    try {
        const response = await api.get(`/chat/messages/${conversationId}?page=${page}&limit=${limit}`);
        return response.data;
    } catch (error) {
        console.error('getMessages error:', error);
        throw error.response?.data || { message: 'Không thể tải tin nhắn' };
    }
};

// ============ ADMIN API ============

/**
 * Lấy danh sách tất cả cuộc hội thoại (Admin)
 */
export const getAllConversations = async (status = 'all', page = 1, limit = 20) => {
    try {
        console.log('getAllConversations - calling API...');
        const response = await api.get(`/chat/admin/conversations?status=${status}&page=${page}&limit=${limit}`);
        console.log('getAllConversations - Response:', response.data);
        return response.data;
    } catch (error) {
        console.error('getAllConversations error:', error.response?.data || error.message);
        return { success: false, conversations: [], total: 0, unreadTotal: 0 };
    }
};

/**
 * Admin gửi tin nhắn
 */
export const adminSendMessage = async (conversationId, text, attachments = []) => {
    try {
        const response = await api.post('/chat/admin/send', { conversationId, text, attachments });
        return response.data;
    } catch (error) {
        console.error('adminSendMessage error:', error);
        throw error.response?.data || { message: 'Không thể gửi tin nhắn' };
    }
};

/**
 * Đánh dấu đã đọc (Admin)
 */
export const markAsRead = async (conversationId) => {
    try {
        const response = await api.put(`/chat/admin/read/${conversationId}`, {});
        return response.data;
    } catch (error) {
        console.error('markAsRead error:', error);
        throw error.response?.data || { message: 'Không thể đánh dấu đã đọc' };
    }
};

/**
 * Cập nhật trạng thái cuộc hội thoại (Admin)
 */
export const updateConversationStatus = async (conversationId, data) => {
    try {
        const response = await api.put(`/chat/admin/status/${conversationId}`, data);
        return response.data;
    } catch (error) {
        console.error('updateConversationStatus error:', error);
        throw error.response?.data || { message: 'Không thể cập nhật trạng thái' };
    }
};

/**
 * Xóa cuộc hội thoại (Admin)
 */
export const deleteConversation = async (conversationId) => {
    try {
        const response = await api.delete(`/chat/admin/${conversationId}`);
        return response.data;
    } catch (error) {
        console.error('deleteConversation error:', error);
        throw error.response?.data || { message: 'Không thể xóa cuộc hội thoại' };
    }
};
