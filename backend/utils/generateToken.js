// backend/utils/generateToken.js

const jwt = require('jsonwebtoken');

/**
 * Hàm tạo JWT token
 * @param {string} id - ID của người dùng (thường là _id hoặc userId)
 * @param {string} email - Email của người dùng
 * @param {boolean} isAdmin - Trạng thái admin
 * @param {string} role - Vai trò của người dùng
 * @returns {string} - Chuỗi JWT token
 */
const generateToken = (id, email, isAdmin, role) => {
    // Kiểm tra xem JWT_SECRET có tồn tại không
    if (!process.env.JWT_SECRET) {
        console.error('Lỗi nghiêm trọng: JWT_SECRET chưa được định nghĩa trong file .env!');
        throw new Error('Lỗi cấu hình server.'); // Hoặc trả về null/undefined tùy cách xử lý
    }

    // Payload chứa thông tin muốn mã hóa vào token
    const payload = {
        id, // Đảm bảo ID này là định danh duy nhất của user
        email,
        isAdmin,
        role,
    };

    // Tạo token với secret và thời gian hết hạn từ .env
    return jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE || '1d', // Mặc định là 1 ngày nếu JWT_EXPIRE không có
    });
};

module.exports = generateToken;