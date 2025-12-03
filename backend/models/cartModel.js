// backend/models/cartModel.js
const mongoose = require('mongoose');

const cartSchema = new mongoose.Schema({
    cartId: { type: String }, // Vẫn giữ lại dòng này theo ý bạn
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    variantId: { type: String, required: true },
    accountId: { type: String, ref: 'User', required: true },
    quantity: { type: Number, required: true, min: 1 }
}, {
    timestamps: true
});

// 1. Index cho User đăng nhập (Quan trọng nhất)
cartSchema.index(
    { accountId: 1, productId: 1, variantId: 1 }, 
    { unique: true }
);

// 2. Index cho CartId (SỬA LẠI ĐOẠN NÀY)
// Thêm "partialFilterExpression" để chỉ check trùng khi cartId là chuỗi (có giá trị)
// Bỏ qua nếu cartId là null hoặc không tồn tại
cartSchema.index(
    { cartId: 1, productId: 1, variantId: 1 }, 
    { 
        unique: true, 
        partialFilterExpression: { cartId: { $type: "string" } } // <--- CÂU THẦN CHÚ FIX LỖI
    }
);

module.exports = mongoose.model('Cart', cartSchema);