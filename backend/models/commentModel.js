const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
    // ID của sản phẩm được đánh giá (liên kết với collection 'products')
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    // ID của người dùng đã đánh giá (liên kết với collection 'users')
    accountId: {
        type: String, // Dùng String để khớp với user.userId
        ref: 'User',
        required: true
    },
    // Điểm xếp hạng (từ 1 đến 5 sao)
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    // Nội dung bình luận
    comment: {
        type: String,
        required: true,
        trim: true
    }
}, {
    timestamps: true // Tự động thêm createdAt và updatedAt
});

module.exports = mongoose.model('Comment', commentSchema);