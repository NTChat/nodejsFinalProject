const mongoose = require('mongoose');

const discountSchema = new mongoose.Schema({
    discountID: { type: String, required: true, unique: true },
    discountCode: { type: String, required: true, unique: true, uppercase: true },
    discountName: { type: String, required: true },
    percent: { type: Number, required: true, min: 0, max: 100 },
    maxUses: { type: Number, required: true, min: 1, max: 10 },
    uses: { type: Number, default: 0 },
    appliedOrders: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Order' }],
    
    // Thời gian áp dụng
    startDate: { type: Date },
    endDate: { type: Date },
    
    // Điều kiện áp dụng
    conditionType: { 
        type: String, 
        enum: ['all', 'min_bill', 'freeship', 'flash_sale', 'customer_group', 'category', 'payment_method'],
        default: 'all'
    },
    conditionValue: { type: String, default: '' },
    productIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
    
    // Tính năng bổ sung
    isStackable: { type: Boolean, default: false }, // Có thể cộng dồn với mã khác
    
    // Loyalty Points (Đổi điểm)
    pointsCost: { type: Number, default: 0 },
    isRedeemable: { type: Boolean, default: false },
    redeemedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
}, {
    timestamps: true
});

module.exports = mongoose.model('Discount', discountSchema);