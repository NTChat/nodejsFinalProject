const User = require('../models/userModel');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const asyncHandler = require('express-async-handler'); // dùng để bắt lỗi async
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
// =============================================================
// HÀM DÀNH CHO USER
// =============================================================

//Lấy thông tin cá nhân của người dùng đang đăng nhập
exports.getUserProfile = asyncHandler(async (req, res) => {
    // (req.user đến từ middleware 'protect')
    const user = await User.findById(req.user._id).select('-password');
    if (user) {
        res.status(200).json({ success: true, user: user });
    } else {
        res.status(404).json({ success: false, message: 'User not found' });
    }
});

exports.updateUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id); // req.user.id từ middleware 'protect'

        if (!user) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng' });
        }

        // 1. Cập nhật các trường text thông thường từ req.body
        // (FormData sẽ gửi các trường này trong req.body)
        user.name = req.body.name || user.name;
        user.phoneNumber = req.body.phoneNumber || user.phoneNumber;
        user.dateOfBirth = req.body.dateOfBirth || user.dateOfBirth;

        // 2. Cập nhật avatar NẾU có file mới được tải lên
        // (Multer sẽ đưa file vào req.file)
        if (req.file) {
            // req.file.path là đường dẫn URL mà Cloudinary trả về
            user.avatar = req.file.path;
        }

        // 3. Lưu lại user
        const updatedUser = await user.save();

        // 4. Trả về thông tin user mới (đã bao gồm virtuals nếu bạn set)
        res.status(200).json({
            success: true,
            message: 'Cập nhật hồ sơ thành công',
            user: updatedUser
        });

    } catch (error) {
        console.error("Lỗi cập nhật hồ sơ:", error);
        res.status(500).json({ success: false, message: 'Lỗi server', error: error.message });
    }
};
exports.updateUserByAdmin = async (req, res) => {
    try {
        // === SỬA LỖI: Lấy đúng các trường từ frontend ===
        const { name, email, phoneNumber, dateOfBirth, role, loyaltyPoints } = req.body;

        // === SỬA LỖI: DÙNG findById ===
        // Lỗi cũ: User.findOne({ userId: req.params.userId })
        const user = await User.findById(req.params.id);
        // ============================

        if (!user) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng' });
        }

        // Cập nhật các trường
        user.name = name || user.name;
        user.email = email || user.email;
        user.phoneNumber = phoneNumber || user.phoneNumber;
        user.dateOfBirth = dateOfBirth || user.dateOfBirth;
        user.role = role || user.role;

        // (isAdmin không nên bị sửa lung tung, chỉ sửa 'role')
        if (typeof loyaltyPoints !== 'undefined') {
            user.loyaltyPoints = loyaltyPoints;
        }

        const updatedUser = await user.save();

        const userResponse = updatedUser.toObject();
        delete userResponse.password;
        res.status(200).json({ success: true, user: userResponse });

    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi server', error: error.message });
    }
};//Quên mật khẩu - Bước 1: Yêu cầu reset
exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ message: 'Vui lòng cung cấp email.' });

        const user = await User.findOne({ email });
        if (!user) {
            // Luôn trả về thành công để không tiết lộ email nào tồn tại trong hệ thống
            return res.status(200).json({ message: 'Nếu email của bạn tồn tại trong hệ thống, một liên kết khôi phục mật khẩu đã được gửi đến.' });
        }

        // Tạo token reset và lưu vào database
        const resetToken = user.createPasswordResetToken();
        await user.save({ validateBeforeSave: false });

        // 2. Tạo URL khôi phục mật khẩu
        // URL này sẽ trỏ đến trang đặt lại mật khẩu trên frontend của bạn
        const resetURL = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

        // 3. Soạn nội dung và gửi email
        try {
            await sendEmail({
                to: user.email,
                subject: 'Yêu cầu khôi phục mật khẩu cho tài khoản của bạn',
                html: `
                    <div style="font-family: Arial, sans-serif; line-height: 1.6;">
                        <h2>Khôi phục mật khẩu</h2>
                        <p>Chúng tôi nhận được yêu cầu khôi phục mật khẩu cho tài khoản của bạn. Vui lòng nhấp vào nút dưới đây để đặt lại mật khẩu:</p>
                        <a href="${resetURL}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
                            Đặt lại mật khẩu
                        </a>
                        <p>Liên kết này sẽ hết hạn sau 10 phút.</p>
                        <p>Nếu bạn không yêu cầu khôi phục mật khẩu, vui lòng bỏ qua email này.</p>
                    </div>
                `
            });

            res.status(200).json({ message: 'Link khôi phục mật khẩu đã được gửi đến email của bạn.' });

        } catch (emailError) {
            // Nếu gửi email thất bại, xóa token đã tạo để người dùng có thể thử lại
            user.passwordResetToken = undefined;
            user.passwordResetExpires = undefined;
            await user.save({ validateBeforeSave: false });

            console.error("Lỗi khi gửi email khôi phục mật khẩu:", emailError);
            return res.status(500).json({ message: 'Không thể gửi email khôi phục. Vui lòng thử lại sau.' });
        }

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.changeMyPassword = asyncHandler(async (req, res) => {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmPassword) {
        res.status(400);
        throw new Error('Vui lòng nhập đầy đủ thông tin.');
    }

    if (newPassword !== confirmPassword) {
        res.status(400);
        throw new Error('Mật khẩu mới không khớp.');
    }

    // Lấy user (với password)
    const user = await User.findById(req.user.id).select('+password');
    if (!user) {
        res.status(404);
        throw new Error('Không tìm thấy người dùng.');
    }

    // Kiểm tra mật khẩu cũ
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
        res.status(400);
        throw new Error('Mật khẩu hiện tại không đúng.');
    }

    // Cập nhật mật khẩu mới
    user.password = newPassword;
    await user.save(); // pre-save hook trong userModel sẽ tự động hash

    res.status(200).json({ success: true, message: 'Đổi mật khẩu thành công.' });
});
//Quên mật khẩu - Bước 2: Đặt lại mật khẩu
exports.resetPassword = async (req, res) => {
    try {
        const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

        const user = await User.findOne({
            passwordResetToken: hashedToken,
            passwordResetExpires: { $gt: Date.now() }
        });

        if (!user) return res.status(400).json({ message: 'Token không hợp lệ hoặc đã hết hạn.' });

        user.password = await bcrypt.hash(req.body.password, 10);
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save();

        res.status(200).json({ message: 'Mật khẩu đã được đặt lại thành công.' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.getMyAddresses = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.id);
    if (!user) {
        res.status(404);
        throw new Error('Không tìm thấy người dùng.');
    }
    res.status(200).json({ success: true, addresses: user.shippingAddresses });
});
exports.addAddress = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.id);
    if (!user) {
        res.status(404);
        throw new Error('Không tìm thấy người dùng.');
    }
    const newAddress = req.body; // { fullName, phoneNumber, address, ... }

    // Nếu đây là địa chỉ đầu tiên, hoặc user set nó là default
    if (newAddress.isDefault || user.shippingAddresses.length === 0) {
        user.shippingAddresses.forEach(addr => addr.isDefault = false);
        newAddress.isDefault = true;
    }

    user.shippingAddresses.push(newAddress);
    await user.save();

    res.status(201).json({ success: true, addresses: user.shippingAddresses });
});
//Cập nhật một địa chỉ giao hàng
exports.updateShippingAddress = async (req, res) => {
    try {
        const { addressId } = req.params;
        const updates = req.body;

        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ message: 'Không tìm thấy người dùng.' });

        // Tìm địa chỉ bằng _id (ObjectId được chuyển thành string)
        const address = user.shippingAddresses.id(addressId);

        if (!address) return res.status(404).json({ message: 'Không tìm thấy địa chỉ.' });

        // Nếu đặt làm mặc định, bỏ mặc định của các địa chỉ khác
        if (updates.isDefault) {
            user.shippingAddresses.forEach(addr => {
                addr.isDefault = false;
            });
        }

        // Cập nhật các trường
        Object.assign(address, updates);
        await user.save();

        res.status(200).json({ success: true, message: 'Cập nhật địa chỉ thành công!', addresses: user.shippingAddresses });

    } catch (error) {
        console.error('Error updating address:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

//Xóa một địa chỉ giao hàng
exports.deleteAddress = asyncHandler(async (req, res) => {
    const { addressId } = req.params;
    const user = await User.findById(req.user._id);

    // Tìm và xóa địa chỉ bằng _id
    const address = user.shippingAddresses.id(addressId);
    if (!address) {
        res.status(404);
        throw new Error('Không tìm thấy địa chỉ.');
    }

    const wasDefault = address.isDefault;
    address.deleteOne(); // Xóa sub-document

    // Kiểm tra nếu địa chỉ mặc định bị xóa, chọn cái đầu tiên làm mặc định mới
    if (wasDefault && user.shippingAddresses.length > 0) {
        user.shippingAddresses[0].isDefault = true;
    }

    await user.save();
    res.status(200).json({ success: true, addresses: user.shippingAddresses });
});

//Đặt một địa chỉ làm mặc định
exports.setDefaultShippingAddress = async (req, res) => {
    try {
        const { addressId } = req.params;
        const user = await User.findById(req.user._id);

        // Bỏ mặc định tất cả và đặt mặc định cho địa chỉ được chọn
        let addressFound = false;
        user.shippingAddresses.forEach(addr => {
            if (addr._id.toString() === addressId) {
                addr.isDefault = true;
                addressFound = true;
            } else {
                addr.isDefault = false;
            }
        });

        if (!addressFound) return res.status(404).json({ success: false, message: 'Không tìm thấy địa chỉ.' });

        await user.save();
        res.status(200).json({ success: true, message: 'Đặt địa chỉ mặc định thành công!', addresses: user.shippingAddresses });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
// =============================================================
// HÀM DÀNH CHO ADMIN
// =============================================================

/**
 * [ADMIN] Lấy danh sách tất cả người dùng với phân trang
 */
exports.getUsers = async (req, res) => {
    try {
        const { page = 1, limit = 10, search = "" } = req.query;
        const query = search
            ? {
                $or: [
                    { name: { $regex: search, $options: "i" } },
                    { email: { $regex: search, $options: "i" } }
                ]
            }
            : {};
        const pipeline = [
            { $match: query },
            {
                $lookup: {
                    from: "orders",
                    localField: "userId",
                    foreignField: "userId",
                    as: "orders",
                }
            },
            {
                $addFields: {
                    delivered: {
                        $size: {
                            $filter: {
                                input: "$orders",
                                as: "o",
                                cond: { $eq: ["$$o.status", "delivered"] },
                            }
                        }
                    },
                    pending: {
                        $size: {
                            $filter: {
                                input: "$orders",
                                as: "o",
                                cond: { $eq: ["$$o.status", "pending"] },
                            }
                        }
                    },
                    canceled: {
                        $size: {
                            $filter: {
                                input: "$orders",
                                as: "o",
                                cond: { $eq: ["$$o.status", "canceled"] },
                            }
                        }
                    },
                }
            },
            {
                $project: {
                    password: 0,
                    orders: 0
                }
            },
            { $sort: { createdAt: -1 } },
            { $skip: (page - 1) * limit },
            { $limit: parseInt(limit) },
        ];

        const users = await User.aggregate(pipeline);


        const totalUsers = await User.countDocuments(query);

        res.status(200).json({
            success: true,
            users,
            currentPage: parseInt(page),
            totalPages: Math.ceil(totalUsers / limit),
            totalUsers
        });

    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi server', error: error.message });
    }
};
exports.getUserById = async (req, res) => {
    try {
        // === SỬA LỖI 2: DÙNG findById (Mongo ID) ===
        // Lỗi cũ: User.findOne({ userId: req.params.userId })
        const user = await User.findById(req.params.id).select('-password');
        // ======================================

        if (!user) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng' });
        }
        res.status(200).json({ success: true, user });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi server', error: error.message });
    }
};
/**
 * [ADMIN] Cập nhật thông tin người dùng
 */
exports.updateUserByAdmin = async (req, res) => {
    try {
        const { name, email, phoneNumber, dateOfBirth, role, loyaltyPoints } = req.body;

        // 2. Sửa logic: Dùng findById(req.params.id)
        const user = await User.findById(req.params.id);
        // ============================

        if (!user) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng' });
        }

        // (Cập nhật các trường...)
        user.name = name || user.name;
        user.email = email || user.email;
        user.phoneNumber = phoneNumber || user.phoneNumber;
        user.dateOfBirth = dateOfBirth || user.dateOfBirth;
        user.role = role || user.role;
        if (typeof loyaltyPoints !== 'undefined') {
            user.loyaltyPoints = loyaltyPoints;
        }

        const updatedUser = await user.save();
        // ... (trả về response)

    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi server', error: error.message });
    }
};
/**
 * [ADMIN] Cập nhật thông tin người dùng (ví dụ: cấp quyền admin)
 */
exports.updateUserByAdmin = async (req, res) => {
    try {
        // === SỬA LỖI 3: Lấy đúng các trường từ frontend (UserDetail.jsx) ===
        const { name, email, phoneNumber, dateOfBirth, role, loyaltyPoints } = req.body;

        // === SỬA LỖI 2: DÙNG findById (Mongo ID) ===
        // Lỗi cũ: User.findOne({ userId: req.params.userId })
        const user = await User.findById(req.params.id);
        // ======================================

        if (!user) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng' });
        }

        // Cập nhật các trường
        user.name = name || user.name;
        user.email = email || user.email;
        user.phoneNumber = phoneNumber || user.phoneNumber;
        user.dateOfBirth = dateOfBirth || user.dateOfBirth;
        user.role = role || user.role;

        if (typeof loyaltyPoints !== 'undefined') {
            user.loyaltyPoints = loyaltyPoints;
        }

        const updatedUser = await user.save();

        const userResponse = updatedUser.toObject();
        delete userResponse.password;
        res.status(200).json({ success: true, user: userResponse });

    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi server', error: error.message });
    }
};
exports.banUser = asyncHandler(async (req, res) => {
    // 1. Tìm user bằng Mongo ID
    const user = await User.findById(req.params.id);

    if (!user) {
        res.status(404);
        throw new Error('Không tìm thấy người dùng.');
    }

    // 2. Không cho Admin tự cấm chính mình
    if (user._id.equals(req.user._id)) {
        res.status(400);
        throw new Error('Bạn không thể tự cấm chính mình.');
    }

    // 3. Đảo ngược trạng thái cấm (toggle)
    // 👈 FIX: Nếu isBanned là undefined (user cũ), mặc định thành false trước khi toggle
    const currentBanStatus = user.isBanned || false;
    user.isBanned = !currentBanStatus;

    await user.save();

    console.log(`🔄 Ban toggle for user ${user.email}: ${currentBanStatus} -> ${user.isBanned}`);

    res.status(200).json({
        success: true,
        message: user.isBanned ? `Đã cấm người dùng ${user.name}` : `Đã gỡ cấm cho ${user.name}`,
        isBanned: user.isBanned // 👈 Trả về trạng thái mới
    });
});