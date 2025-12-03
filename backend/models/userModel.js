// backend/models/userModel.js
const mongoose = require('mongoose');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

// === 1. TẠO SCHEMA CHO ĐỊA CHỈ (MỚI) ===
const addressSchema = new mongoose.Schema({
    fullName: { type: String, required: [true, 'Vui lòng nhập họ tên'] },
    phoneNumber: { type: String, required: [true, 'Vui lòng nhập số điện thoại'] },
    address: { type: String, required: [true, 'Vui lòng nhập địa chỉ'] }, // Số nhà, tên đường
    city: { type: String, required: [true, 'Vui lòng nhập Tỉnh/Thành phố'] },
    district: { type: String, required: [true, 'Vui lòng nhập Quận/Huyện'] },
    ward: { type: String, required: [true, 'Vui lòng nhập Phường/Xã'] },
    isDefault: { type: Boolean, default: false }
}, { _id: true }); // Bật _id để dễ dàng Sửa/Xóa

const userSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    name: { type: String },
    userName: { type: String, required: true },
    password: { type: String, required: true, select: false },
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    phoneNumber: { type: String, default: null },
    dateOfBirth: { type: Date, default: null },
    avatar: { type: String, default: null },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    loyaltyPoints: { type: Number, default: 0 },
    googleId: { type: String },
    provider: {
        type: [
            {
                type: String,
                enum: ['local', 'google', 'facebook', 'github', 'twitter']
            }
        ],
        required: true,
    },
    passwordResetToken: String,
    passwordResetExpires: Date,
    isBanned: {
        type: Boolean,
        default: false,
    },
    // === 2. SỬA LẠI 'shippingAddresses' (QUAN TRỌNG) ===
    shippingAddresses: {
        type: [addressSchema], // Đổi thành một MẢNG các địa chỉ
        default: []
    },
    // === 3. THÊM VOUCHERS FIELD ===
    vouchers: [{
        code: String,
        name: String,
        percent: Number,
        minOrderValue: { type: Number, default: 0 },
        expiry: Date,
        redeemedAt: { type: Date, default: Date.now },
        isUsed: { type: Boolean, default: false },
        usedAt: Date
    }]
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});
userSchema.pre('save', async function (next) {
    // Chỉ hash nếu password có sự thay đổi (đổi pass hoặc tạo mới)
    // ❗ QUAN TRỌNG: Nếu password đã được hash trước (e.g. reset password)
    // thì không hash lại (sẽ trở thành hash của hash)

    // Kiểm tra xem password có phải đã hash chưa (hash bắt đầu bằng $2a$ hoặc $2b$)
    if (!this.isModified('password')) {
        return next();
    }

    // Nếu password bắt đầu bằng $2a$ hoặc $2b$ thì đã hash rồi, skip
    if (this.password && (this.password.startsWith('$2a$') || this.password.startsWith('$2b$'))) {
        console.log('⏭️ Password đã hash, bỏ qua pre-save hook');
        return next();
    }

    // Hash password nếu chưa hash
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});
// === VIRTUAL CHO HẠNG THÀNH VIÊN (MỚI) ===
// Tự động tính hạng dựa trên điểm, không cần lưu vào DB
// (Có thể tùy chỉnh các mốc điểm này)
userSchema.virtual('membershipTier').get(function () {
    if (this.loyaltyPoints >= 5000) { // Ví dụ: 5000 điểm
        return 'Kim Cương';
    }
    if (this.loyaltyPoints >= 2000) { // Ví dụ: 2000 điểm
        return 'Vàng';
    }
    if (this.loyaltyPoints >= 500) { // Ví dụ: 500 điểm
        return 'Bạc';
    }
    return 'Đồng'; // Mặc định
});

// Đảm bảo virtuals được bật khi chuyển sang JSON (file của bạn đã có sẵn)
userSchema.set('toJSON', { virtuals: true });
userSchema.set('toObject', { virtuals: true });
// ... (Các virtuals, methods, pre-save hooks của fen giữ nguyên) ...

module.exports = mongoose.model('User', userSchema); 