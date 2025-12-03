// backend/models/chatModel.js
const mongoose = require('mongoose');

// Schema cho từng tin nhắn trong cuộc hội thoại
const messageSchema = new mongoose.Schema({
    sender: {
        type: String,
        enum: ['user', 'admin'],
        required: true
    },
    senderName: {
        type: String,
        default: ''
    },
    text: {
        type: String,
        required: true
    },
    attachments: [{
        type: String, // URL của file đính kèm
    }],
    isRead: {
        type: Boolean,
        default: false
    },
    readAt: {
        type: Date
    }
}, { timestamps: true });

// Schema cho cuộc hội thoại
const conversationSchema = new mongoose.Schema({
    // User tham gia cuộc hội thoại
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false // Có thể là khách vãng lai
    },
    // Dành cho khách vãng lai
    guestId: {
        type: String,
        required: false
    },
    guestName: {
        type: String,
        default: 'Khách'
    },
    guestEmail: {
        type: String,
        default: ''
    },
    // Admin đang xử lý cuộc hội thoại này
    assignedAdmin: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    // Trạng thái cuộc hội thoại
    status: {
        type: String,
        enum: ['open', 'pending', 'resolved', 'closed'],
        default: 'open'
    },
    // Danh sách tin nhắn
    messages: [messageSchema],
    // Số tin nhắn chưa đọc (từ phía user)
    unreadCount: {
        type: Number,
        default: 0
    },
    // Tin nhắn cuối cùng (để hiển thị preview)
    lastMessage: {
        text: String,
        sender: String,
        createdAt: Date
    },
    // Tags để phân loại
    tags: [{
        type: String
    }],
    // Ghi chú nội bộ của admin
    adminNotes: {
        type: String,
        default: ''
    }
}, { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Index để tìm kiếm nhanh
conversationSchema.index({ userId: 1, status: 1 });
conversationSchema.index({ guestId: 1 });
conversationSchema.index({ assignedAdmin: 1, status: 1 });
conversationSchema.index({ updatedAt: -1 });

// Virtual để lấy thông tin customer
conversationSchema.virtual('customer', {
    ref: 'User',
    localField: 'userId',
    foreignField: '_id',
    justOne: true
});

const Conversation = mongoose.model('Conversation', conversationSchema);

module.exports = Conversation;
