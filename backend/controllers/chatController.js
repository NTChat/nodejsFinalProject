// backend/controllers/chatController.js
const Conversation = require('../models/chatModel');
const User = require('../models/userModel');

// ============ CUSTOMER ENDPOINTS ============

/**
 * Lấy hoặc tạo cuộc hội thoại cho user/guest
 * POST /api/chat/conversation
 */
exports.getOrCreateConversation = async (req, res) => {
    try {
        const { guestId, guestName, guestEmail } = req.body;
        const userId = req.user?._id; // Từ middleware auth (nếu đã đăng nhập)

        let conversation;

        if (userId) {
            // User đã đăng nhập - tìm conversation theo userId
            conversation = await Conversation.findOne({ 
                userId, 
                status: { $in: ['open', 'pending'] } 
            });

            if (!conversation) {
                // Tạo mới
                const user = await User.findById(userId);
                conversation = await Conversation.create({
                    userId,
                    guestName: user?.name || user?.userName || 'Thành viên',
                    guestEmail: user?.email || '',
                    messages: [{
                        sender: 'admin',
                        senderName: 'PhoneWorld',
                        text: 'Xin chào! PhoneWorld có thể giúp gì cho bạn?'
                    }]
                });
            }
        } else if (guestId) {
            // Khách vãng lai - tìm theo guestId
            conversation = await Conversation.findOne({ 
                guestId, 
                status: { $in: ['open', 'pending'] } 
            });

            if (!conversation) {
                conversation = await Conversation.create({
                    guestId,
                    guestName: guestName || 'Khách',
                    guestEmail: guestEmail || '',
                    messages: [{
                        sender: 'admin',
                        senderName: 'PhoneWorld',
                        text: 'Xin chào! PhoneWorld có thể giúp gì cho bạn?'
                    }]
                });
            }
        } else {
            // Nếu không có cả userId và guestId, tạo một guestId tạm
            const tempGuestId = 'guest_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            conversation = await Conversation.create({
                guestId: tempGuestId,
                guestName: guestName || 'Khách',
                guestEmail: '',
                messages: [{
                    sender: 'admin',
                    senderName: 'PhoneWorld',
                    text: 'Xin chào! PhoneWorld có thể giúp gì cho bạn?'
                }]
            });
        }

        res.json({ 
            success: true, 
            conversation 
        });
    } catch (error) {
        console.error('getOrCreateConversation error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Gửi tin nhắn (Customer)
 * POST /api/chat/send
 */
exports.sendMessage = async (req, res) => {
    try {
        const { conversationId, text, attachments } = req.body;
        const userId = req.user?._id;

        if (!conversationId || !text?.trim()) {
            return res.status(400).json({ 
                success: false, 
                message: 'Thiếu conversationId hoặc nội dung tin nhắn' 
            });
        }

        const conversation = await Conversation.findById(conversationId);
        if (!conversation) {
            return res.status(404).json({ 
                success: false, 
                message: 'Không tìm thấy cuộc hội thoại' 
            });
        }

        // Lấy tên người gửi
        let senderName = 'Khách';
        if (userId) {
            const user = await User.findById(userId);
            senderName = user?.name || user?.userName || 'Thành viên';
        } else {
            senderName = conversation.guestName || 'Khách';
        }

        const newMessage = {
            sender: 'user',
            senderName,
            text: text.trim(),
            attachments: attachments || [],
            isRead: false,
            createdAt: new Date()
        };

        conversation.messages.push(newMessage);
        conversation.lastMessage = {
            text: text.trim(),
            sender: 'user',
            createdAt: new Date()
        };
        conversation.unreadCount += 1;
        conversation.status = 'pending'; // Đánh dấu cần admin xử lý

        await conversation.save();

        // Emit socket event cho admin
        const io = req.app.get('socketio');
        if (io) {
            io.to('admin-room').emit('new-customer-message', {
                conversationId: conversation._id,
                message: newMessage,
                customerName: senderName
            });
        }

        res.json({ 
            success: true, 
            message: newMessage,
            conversation 
        });
    } catch (error) {
        console.error('sendMessage error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Lấy lịch sử tin nhắn của cuộc hội thoại
 * GET /api/chat/messages/:conversationId
 */
exports.getMessages = async (req, res) => {
    try {
        const { conversationId } = req.params;
        const { page = 1, limit = 50 } = req.query;

        const conversation = await Conversation.findById(conversationId);
        if (!conversation) {
            return res.status(404).json({ 
                success: false, 
                message: 'Không tìm thấy cuộc hội thoại' 
            });
        }

        // Phân trang tin nhắn (lấy từ cuối lên)
        const totalMessages = conversation.messages.length;
        const skip = Math.max(0, totalMessages - page * limit);
        const messages = conversation.messages.slice(
            Math.max(0, skip), 
            skip + limit
        );

        res.json({ 
            success: true, 
            messages,
            total: totalMessages,
            hasMore: skip > 0
        });
    } catch (error) {
        console.error('getMessages error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};


// ============ ADMIN ENDPOINTS ============

/**
 * Lấy danh sách tất cả cuộc hội thoại (Admin)
 * GET /api/chat/admin/conversations
 */
exports.getAllConversations = async (req, res) => {
    try {
        const { status, page = 1, limit = 20 } = req.query;

        const filter = {};
        if (status && status !== 'all') {
            filter.status = status;
        }

        const conversations = await Conversation.find(filter)
            .populate('userId', 'name userName email avatar')
            .populate('assignedAdmin', 'name userName')
            .sort({ updatedAt: -1 })
            .skip((page - 1) * limit)
            .limit(Number(limit));

        const total = await Conversation.countDocuments(filter);

        // Đếm số chưa đọc
        const unreadTotal = await Conversation.aggregate([
            { $match: { status: { $in: ['open', 'pending'] } } },
            { $group: { _id: null, total: { $sum: '$unreadCount' } } }
        ]);

        res.json({ 
            success: true, 
            conversations,
            total,
            totalPages: Math.ceil(total / limit),
            unreadTotal: unreadTotal[0]?.total || 0
        });
    } catch (error) {
        console.error('getAllConversations error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Admin gửi tin nhắn
 * POST /api/chat/admin/send
 */
exports.adminSendMessage = async (req, res) => {
    try {
        const { conversationId, text, attachments } = req.body;
        const adminId = req.user?._id;

        if (!conversationId || !text?.trim()) {
            return res.status(400).json({ 
                success: false, 
                message: 'Thiếu conversationId hoặc nội dung tin nhắn' 
            });
        }

        const conversation = await Conversation.findById(conversationId);
        if (!conversation) {
            return res.status(404).json({ 
                success: false, 
                message: 'Không tìm thấy cuộc hội thoại' 
            });
        }

        // Lấy tên admin
        const admin = await User.findById(adminId);
        const senderName = admin?.name || admin?.userName || 'Hỗ trợ viên';

        const newMessage = {
            sender: 'admin',
            senderName,
            text: text.trim(),
            attachments: attachments || [],
            isRead: false,
            createdAt: new Date()
        };

        conversation.messages.push(newMessage);
        conversation.lastMessage = {
            text: text.trim(),
            sender: 'admin',
            createdAt: new Date()
        };
        
        // Gán admin nếu chưa có
        if (!conversation.assignedAdmin) {
            conversation.assignedAdmin = adminId;
        }

        await conversation.save();

        // Emit socket event cho customer
        const io = req.app.get('socketio');
        if (io) {
            // Gửi đến room của conversation
            io.to(`conversation-${conversationId}`).emit('new-admin-message', {
                conversationId: conversation._id,
                message: newMessage
            });
        }

        res.json({ 
            success: true, 
            message: newMessage,
            conversation 
        });
    } catch (error) {
        console.error('adminSendMessage error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Đánh dấu đã đọc (Admin)
 * PUT /api/chat/admin/read/:conversationId
 */
exports.markAsRead = async (req, res) => {
    try {
        const { conversationId } = req.params;

        const conversation = await Conversation.findById(conversationId);
        if (!conversation) {
            return res.status(404).json({ 
                success: false, 
                message: 'Không tìm thấy cuộc hội thoại' 
            });
        }

        // Đánh dấu tất cả tin nhắn từ user là đã đọc
        conversation.messages.forEach(msg => {
            if (msg.sender === 'user' && !msg.isRead) {
                msg.isRead = true;
                msg.readAt = new Date();
            }
        });
        conversation.unreadCount = 0;

        await conversation.save();

        res.json({ success: true, message: 'Đã đánh dấu đọc' });
    } catch (error) {
        console.error('markAsRead error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Cập nhật trạng thái cuộc hội thoại (Admin)
 * PUT /api/chat/admin/status/:conversationId
 */
exports.updateConversationStatus = async (req, res) => {
    try {
        const { conversationId } = req.params;
        const { status, adminNotes, tags } = req.body;

        const updateData = {};
        if (status) updateData.status = status;
        if (adminNotes !== undefined) updateData.adminNotes = adminNotes;
        if (tags) updateData.tags = tags;

        const conversation = await Conversation.findByIdAndUpdate(
            conversationId,
            updateData,
            { new: true }
        );

        if (!conversation) {
            return res.status(404).json({ 
                success: false, 
                message: 'Không tìm thấy cuộc hội thoại' 
            });
        }

        res.json({ success: true, conversation });
    } catch (error) {
        console.error('updateConversationStatus error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Xóa cuộc hội thoại (Admin)
 * DELETE /api/chat/admin/:conversationId
 */
exports.deleteConversation = async (req, res) => {
    try {
        const { conversationId } = req.params;

        await Conversation.findByIdAndDelete(conversationId);

        res.json({ success: true, message: 'Đã xóa cuộc hội thoại' });
    } catch (error) {
        console.error('deleteConversation error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};
