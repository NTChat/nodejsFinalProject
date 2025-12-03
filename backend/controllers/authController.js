// backend/controllers/authController.js
const User = require('../models/userModel');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const axios = require('axios');
const cloudinary = require('cloudinary').v2;
const { OAuth2Client } = require('google-auth-library');
const asyncHandler = require('express-async-handler');
const crypto = require('crypto');
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const sendEmail = require('../utils/sendEmail');

// === CÁC HÀM HELPER (Giữ nguyên) ===
async function generateUuid() {
    return uuidv4();
}

const generateToken = (id) => {
    return jwt.sign({ id: id }, process.env.JWT_SECRET, {
        expiresIn: '1d',
    });
};
const isProduction = process.env.NODE_ENV === 'production';
const getCookieOptions = () => {
    // ❗ CHÚ THÍCH: Cấu hình cookie cho HTTP localhost
    const options = {
        httpOnly: true,
        secure: false, // false cho HTTP
        maxAge: 24 * 60 * 60 * 1000, // 1 ngày
        path: '/',
        sameSite: 'lax', // lax cho localhost
        domain: undefined // Không set domain để cookie hoạt động cross-port (3000 ↔ 3001)
    };
    return options;
};

// =============================================================
// === NÂNG CẤP 1: Sửa hàm sendTokenResponse (Hàm chuẩn) ===
// =============================================================
// (Hàm này sẽ được TẤT CẢ các hàm auth khác gọi)
const sendTokenResponse = (user, statusCode, res, message) => {

    // ❗ SỬA LỖI 1: Hàm generateToken() cũ của bạn đang gọi mà không có ID.
    // (payload bạn định nghĩa bên trên cũng không được dùng)
    // Chúng ta sẽ gọi generateToken(user._id) cho đúng.
    const token = generateToken(user._id);

    // ❗ QUAN TRỌNG: Không dùng cookie để hỗ trợ multi-tab authentication
    // Mỗi tab sẽ lưu token riêng trong sessionStorage và gửi qua Authorization header
    console.log('✅ [AUTH] Token generated for user:', user.email);

    // 4. TRẢ VỀ JSON CHỨA USER (Chuẩn hóa)
    // Client (React AuthContext) sẽ nhận được 'user' từ đây
    res.status(statusCode).json({
        success: true,
        message: message || "Thao tác thành công",
        // Chúng ta format lại user object để client luôn nhận được
        // dữ liệu nhất quán, bất kể là login hay register
        user: {
            _id: user._id, // Client có thể cần _id
            userId: user.userId,
            name: user.name,
            userName: user.userName,
            email: user.email,
            avatar: user.avatar,
            isAdmin: user.isAdmin,
            role: user.role,
            provider: user.provider // 👈 TRƯỜNG QUAN TRỌNG NHẤT
        },
        token // Vẫn gửi token trong JSON (như code cũ của bạn)
    });
};

// =============================================================
// === NÂNG CẤP 2: Dùng sendTokenResponse cho mọi hàm ===
// =============================================================

// --- HÀM LOGIN (ĐÃ NÂNG CẤP) ---
exports.login = async (req, res) => {
    try {
        // ... (Toàn bộ logic tìm user, check provider, check pass của bạn giữ nguyên) ...
        const { identifier, password } = req.body;
        if (!identifier || !password) return res.status(400).json({ message: 'Vui lòng cung cấp email/username và password.' });

        const user = await User.findOne({
            $or: [{ email: identifier }, { userName: identifier }]
        }).select('+password');

        if (!user) {
            return res.status(401).json({ message: 'Email hoặc username không tồn tại.' });
        }

        // 👈 NÂNG CẤP: Kiểm tra trạng thái ban tài khoản TRƯỚC khi check mật khẩu
        if (user.isBanned === true) {
            console.log(`🚫 Tài khoản bị ban đã cố gắng đăng nhập: ${user.email}`);
            return res.status(403).json({
                message: 'tài khoản của bạn đã bị cấm do có hành vi bất thường. Vui lòng liên hệ hotline để được hỗ trợ',
                isBanned: true
            });
        }

        if (user.provider.includes('google') || user.provider.includes('facebook')) {
            if (user.password === null) {
                return res.status(401).json({ message: `Tài khoản này được đăng ký qua ${user.provider.join(', ')}. Vui lòng đăng nhập bằng phương thức đó.` });
            }
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Sai mật khẩu.' });
        }

        // 👈 NÂNG CẤP: Thay vì res.cookie và res.json thủ công...
        // ... chúng ta gọi hàm chuẩn
        sendTokenResponse(user, 200, res, "Đăng nhập thành công!");

    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

// --- HÀM REGISTER (ĐÃ NÂNG CẤP) ---
exports.register = async (req, res) => {
    try {
        console.log('📝 [REGISTER] Starting registration...');
        console.log('📝 [REGISTER] Body:', req.body);
        console.log('📝 [REGISTER] File:', req.file);

        // ... (Toàn bộ logic validate, check user, hash pass, upload Cloudinary giữ nguyên) ...
        const { name, userName, email, password } = req.body;
        if (!name || !userName || !email || !password) {
            console.log('❌ [REGISTER] Missing required fields');
            return res.status(400).json({ message: 'Vui lòng cung cấp đầy đủ thông tin: name, userName, email, password.' });
        }
        let user = await User.findOne({ $or: [{ email: email }, { userName: userName }] });
        if (user) {
            if (user.email === email) {
                console.log('❌ [REGISTER] Email already exists');
                return res.status(400).json({ message: 'Email đã được sử dụng!' });
            }
            if (user.userName === userName) {
                console.log('❌ [REGISTER] Username already exists');
                return res.status(400).json({ message: 'Username đã được sử dụng!' });
            }
        }
        console.log('✅ [REGISTER] Email & username are available');

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        const newUserId = await generateUuid();
        console.log('✅ [REGISTER] Password hashed, UUID generated');

        let avatarUrl = null;
        if (req.file) {
            console.log('📸 [REGISTER] Uploading avatar...');
            try {
                const result = await cloudinary.uploader.upload(req.file.path, {
                    folder: "avatars", width: 150, crop: "scale"
                });
                avatarUrl = result.secure_url;
                console.log('✅ [REGISTER] Avatar uploaded:', avatarUrl);
            } catch (uploadErr) {
                console.error('❌ [REGISTER] Cloudinary upload error:', uploadErr.message);
                // Vẫn tạo user mà không avatar
                avatarUrl = null;
            }
        }

        user = new User({
            userId: newUserId,
            name,
            userName,
            email,
            password: hashedPassword,
            avatar: avatarUrl,
            provider: ['local'], // Logic này đã đúng
            role: 'user',
        });

        console.log('💾 [REGISTER] Saving user to DB...');
        await user.save();
        console.log('✅ [REGISTER] User saved successfully:', user.email);

        // 👈 NÂNG CẤP: Thay vì res.cookie và res.json thủ công...
        // ... chúng ta gọi hàm chuẩn
        sendTokenResponse(user, 201, res, "Đăng ký thành công!");

    } catch (error) {
        console.error('❌ [REGISTER] Error:', error.message);
        console.error('❌ [REGISTER] Stack:', error.stack);
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};


// --- HÀM GOOGLE LOGIN (ĐÃ NÂNG CẤP) ---
// ❗ CHÚ THÍCH: Hàm này của bạn có lỗi logic "headers already sent"
// (vì bạn gọi sendTokenResponse (bị lỗi) rồi lại res.json ở cuối).
// Tôi đã cấu trúc lại, nhưng giữ nguyên 100% ý tưởng của bạn.
exports.googleLogin = async (req, res) => {
    const { accessToken } = req.body;
    if (!accessToken) {
        return res.status(400).json({ message: 'Không có accessToken.' });
    }

    try {
        // 1. Lấy thông tin Google (Giữ nguyên)
        const googleResponse = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { Authorization: `Bearer ${accessToken}` },
        });

        const { email, name, picture } = googleResponse.data;
        if (!email) {
            return res.status(400).json({ message: 'Không lấy được email từ Google.' });
        }

        // 2. Tìm User
        let user = await User.findOne({ email: email });

        if (user) {
            // 3a. User tồn tại -> Liên kết tài khoản
            if (!user.provider.includes('google')) {
                user.provider.push('google');
                await user.save();
            }

            // 👈 NÂNG CẤP: Kiểm tra trạng thái ban tài khoản
            if (user.isBanned) {
                return res.status(403).json({
                    message: 'Tài khoản của bạn đã bị cấm do có hành vi bất thường. Vui lòng liên hệ hotline để được hỗ trợ',
                    isBanned: true
                });
            }

            // 👈 NÂNG CẤP: Gửi response và DỪNG LẠI (return)
            // (Đây là cách sửa lỗi `foundUser` và lỗi "headers already sent")
            return sendTokenResponse(user, 200, res, "Đăng nhập Google thành công");
        } else {
            // 3b. User không tồn tại -> Tạo mới (Giữ nguyên logic của bạn)
            const newUserId = await generateUuid();
            user = new User({
                userId: newUserId,
                email: email,
                name: name,
                userName: email.split('@')[0] + uuidv4().substring(0, 4),
                avatar: picture,
                provider: ['google'],
                password: await bcrypt.hash(uuidv4(), 10),
                // ❗ CHÚ THÍCH: Bạn quên 'role' ở đây, tôi thêm vào cho an toàn
                role: 'user',
            });
            await user.save();

            // 👈 NÂNG CẤP: Kiểm tra trạng thái ban tài khoản (dù tạo mới thì bình thường không bị ban)
            if (user.isBanned) {
                return res.status(403).json({
                    message: 'Tài khoản của bạn đã bị cấm do có hành vi bất thường. Vui lòng liên hệ hotline để được hỗ trợ',
                    isBanned: true
                });
            }

            // 👈 NÂNG CẤP: Gửi response và DỪNG LẠI (return)
            return sendTokenResponse(user, 201, res, "Tạo tài khoản Google thành công");
        }

        // ❗ SỬA LỖI: Xóa bỏ toàn bộ phần res.cookie/res.json
        // lặp lại ở cuối hàm cũ của bạn.

    } catch (error) {
        // (Khối catch giữ nguyên)
        console.error("Lỗi xác thực Google (Access Token):", error.response?.data || error.message);
        if (error.name === 'ValidationError') {
            return res.status(500).json({ message: error.message });
        }
        res.status(500).json({ message: error.response?.data?.error_description || error.message });
    }
};

// --- HÀM FACEBOOK LOGIN (ĐÃ NÂNG CẤP) ---
exports.facebookLogin = asyncHandler(async (req, res) => {
    // ... (Toàn bộ logic `appsecret_proof`, `axios.get`, tìm user,
    // logic liên kết, logic "dọn dẹp" shippingAddresses, logic tạo user mới...
    // TẤT CẢ ĐỀU ĐƯỢC GIỮ NGUYÊN)

    // (Bỏ qua phần code dài, chỉ hiển thị phần thay đổi)
    const { accessToken, userID } = req.body;
    const appSecret = process.env.FACEBOOK_APP_SECRET;

    if (!accessToken || !userID) {
        return res.status(400).json({ message: 'Missing Facebook accessToken or userID' });
    }
    if (!appSecret) {
        return res.status(500).json({ message: 'Facebook App Secret chưa được cấu hình' });
    }

    try {
        const appsecret_proof = crypto
            .createHmac('sha256', appSecret)
            .update(accessToken)
            .digest('hex');

        const { data } = await axios.get(
            `https://graph.facebook.com/${userID}`, {
            params: {
                fields: 'id,name,email',
                access_token: accessToken,
                appsecret_proof: appsecret_proof
            }
        }
        );

        if (!data) {
            return res.status(400).json({ message: 'Invalid Facebook token or user ID' });
        }

        const { id: facebookId, name, email } = data;
        let user = await User.findOne({ facebookId: facebookId });

        if (!user && email) {
            user = await User.findOne({ email: email });
            if (user) {
                user.facebookId = facebookId;
                if (user.shippingAddresses && user.shippingAddresses.length > 0) {
                    user.shippingAddresses = user.shippingAddresses.filter(
                        addr => addr.fullName && addr.address
                    );
                }
                if (!user.provider.includes('facebook')) {
                    user.provider.push('facebook');
                }
                await user.save();
            }
        }
        if (!user) {
            const randomPassword = crypto.randomBytes(16).toString('hex');
            user = await User.create({
                name: name,
                email: email || `${facebookId}@facebook.placeholder.com`,
                userName: facebookId,
                facebookId: facebookId,
                password: randomPassword,
                isVerified: true,
                userId: uuidv4(),
                provider: ['facebook'],
                shippingAddresses: []
            });
        }

        // 👈 NÂNG CẤP: Kiểm tra trạng thái ban tài khoản
        if (user.isBanned) {
            return res.status(403).json({
                message: 'Tài khoản của bạn đã bị cấm do có hành vi bất thường. Vui lòng liên hệ hotline để được hỗ trợ',
                isBanned: true
            });
        }

        // 👈 NÂNG CẤP: Thay vì res.json thủ công...
        // ... chúng ta gọi hàm chuẩn
        // (Hàm chuẩn sẽ tự động gửi cookie và format user object)
        sendTokenResponse(user, 200, res, "Đăng nhập Facebook thành công");

    } catch (error) {
        // (Khối catch giữ nguyên)
        console.error("🚨 [FACEBOOK LOGIN CRASH]: Lỗi nghiêm trọng:", error.message);
        console.error("STACK TRACE:", error.stack);
        if (error.response) {
            console.error("DATA TỪ AXIOS (Facebook):", error.response.data);
        }
        res.status(500).json({
            message: 'Lỗi máy chủ khi đăng nhập Facebook',
            error: error.message
        });
    }
});

// =============================================================
// === CÁC HÀM KHÁC (KHÔNG THAY ĐỔI NHIỀU) ===
// =============================================================

exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: 'Email không tồn tại trong hệ thống.' });
        }

        // 🛡️ BỔ SUNG: Kiểm tra tài khoản Social
        // Nếu provider chứa 'google' hoặc 'facebook' VÀ user không có password (thuần social)
        // Hoặc đơn giản là cứ dính social là nhắc nhở.
        const isSocial = user.provider.some(p => p === 'google' || p === 'facebook');

        if (isSocial) {
            const providers = user.provider.filter(p => p !== 'local').join(' hoặc ');
            // Backend trả về lỗi 400 kèm thông báo cụ thể
            // Frontend sẽ bắt lỗi này và hiện Toast
            return res.status(400).json({
                message: `Tài khoản này được đăng ký bằng ${providers}. Vui lòng đăng nhập bằng ${providers}!`
            });
        }

        // --- SỬA LỖI: Tự tạo token thủ công (Thay thế hàm bị lỗi) ---
        const resetToken = crypto.randomBytes(20).toString('hex');
        // Hash token để lưu vào DB
        user.passwordResetToken = crypto
            .createHash('sha256')
            .update(resetToken)
            .digest('hex');
        // Set thời gian hết hạn (10 phút)
        user.passwordResetExpires = Date.now() + 10 * 60 * 1000;
        await user.save({ validateBeforeSave: false });
        // Tạo URL (Lưu ý: Phải trỏ về FRONTEND localhost:3000)
        const frontendHost = process.env.FRONTEND_URL || 'http://localhost:3000';
        const resetURL = `${frontendHost}/reset-password/${resetToken}`;
        const message = `
            Bạn nhận được email này vì có yêu cầu đặt lại mật khẩu.
            Vui lòng bấm vào link dưới đây:
            
            ${resetURL}
            
            Link hết hạn sau 10 phút.
        `;
        try {
            await sendEmail({
                email: user.email,
                subject: 'Khôi phục mật khẩu PhoneWorld',
                message
            });

            res.status(200).json({ success: true, message: 'Email đã được gửi!' });
        } catch (err) {
            console.error("Lỗi gửi mail:", err);
            user.passwordResetToken = undefined;
            user.passwordResetExpires = undefined;
            await user.save({ validateBeforeSave: false });
            return res.status(500).json({ message: 'Không thể gửi email. Vui lòng thử lại.' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server: ' + error.message });
    }
};
exports.resetPassword = async (req, res) => {
    try {
        const { token } = req.params;
        const { password } = req.body; // 👈 Chỉ nhận password, không cần confirmPassword

        // Validate cơ bản
        if (!password) {
            return res.status(400).json({ message: "Vui lòng nhập mật khẩu mới." });
        }

        // 1. Hash token từ URL để tìm user
        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

        // 2. Tìm user có token đó và chưa hết hạn
        const user = await User.findOne({
            passwordResetToken: hashedToken,
            passwordResetExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ message: 'Link khôi phục không hợp lệ hoặc đã hết hạn.' });
        }

        // 3. Hash mật khẩu mới (Thủ công để an toàn tuyệt đối)
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // 4. Cập nhật user object
        user.password = hashedPassword;
        user.passwordResetToken = undefined; // Xóa token sau khi dùng
        user.passwordResetExpires = undefined;

        // 5. Lưu vào DB với validateBeforeSave: false (tránh pre-save hook hash lại)
        await user.save({ validateBeforeSave: false });

        // 6. Verify rằng password đã được lưu
        const verify = await User.findById(user._id).select('+password');
        const isPasswordMatch = await require('bcryptjs').compare(password, verify.password);
        console.log(`✅ Reset mật khẩu thành công cho: ${user.email}`);
        console.log(`✅ Verify password match: ${isPasswordMatch}`);

        res.status(200).json({ success: true, message: 'Đặt lại mật khẩu thành công! Hãy đăng nhập ngay.' });

    } catch (error) {
        console.error("Reset Password Error:", error);
        res.status(500).json({ message: 'Lỗi server khi đặt lại mật khẩu.' });
    }
};

// Kiểm tra token từ cookie HOẶC Authorization header
exports.checkSession = asyncHandler(async (req, res) => {
    // ❗ CHỈ LẤY TOKEN TỪ AUTHORIZATION HEADER để hỗ trợ multi-tab
    // Không dùng cookie vì cookie được share giữa tất cả các tab
    let token = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
    }

    if (!token) {
        return res.status(200).json({ isAuthenticated: false, user: null });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select('-password');
        if (user) {

            return res.status(200).json({ isAuthenticated: true, user: user });
        } else {
            return res.status(200).json({ isAuthenticated: false, user: null });
        }
        return res.status(200).json({ isAuthenticated: false, user: null });
    } catch (error) {
        // Nếu token lỗi (do rác), trả về chưa login chứ đừng crash server
        return res.status(200).json({ isAuthenticated: false, user: null });
    }
});
exports.changePassword = async (req, res) => {
    try {
        const { oldPassword, newPassword } = req.body;

        console.log("------------------------------------------------");
        console.log("🚀 BẮT ĐẦU QUÁ TRÌNH ĐỔI MẬT KHẨU");
        console.log("👤 User ID từ Token:", req.user._id);

        // 1. Kiểm tra ID
        if (!req.user || !req.user._id) {
            return res.status(401).json({ message: 'Không tìm thấy thông tin User từ Token' });
        }

        // 2. Lấy thông tin user từ DB để kiểm tra
        const user = await User.findById(req.user._id).select('+password');
        if (!user) {
            console.log("❌ Lỗi: Không tìm thấy User trong Database với ID này.");
            return res.status(404).json({ message: 'Người dùng không tồn tại.' });
        }
        console.log("✅ Đã tìm thấy User:", user.email);
        console.log("🔑 Mật khẩu hash hiện tại trong DB:", user.password);

        // 3. Kiểm tra mật khẩu cũ
        const isMatch = await bcrypt.compare(oldPassword, user.password);
        if (!isMatch) {
            console.log("❌ Lỗi: Mật khẩu cũ không khớp.");
            return res.status(400).json({ message: 'Mật khẩu cũ không chính xác.' });
        }
        console.log("✅ Mật khẩu cũ chính xác.");

        // 4. Hash mật khẩu mới
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);
        console.log("🔒 Mật khẩu mới đã hash:", hashedPassword);

        // 5. THỰC HIỆN UPDATE (Sử dụng findByIdAndUpdate và lấy về document mới)
        const updatedUser = await User.findByIdAndUpdate(
            req.user._id,
            { password: hashedPassword },
            { new: true }
        ).select('+password'); // 👈 THÊM DÒNG NÀY

        // 6. KIỂM TRA NGAY LẬP TỨC
        if (updatedUser.password === hashedPassword) {
            console.log("✅ [THÀNH CÔNG TUYỆT ĐỐI] Mật khẩu trong DB đã khớp với mật khẩu mới!");
        } else {
            console.log("⚠️ [CẢNH BÁO] Có gì đó sai sai...");
        }

        console.log("------------------------------------------------");
        res.status(200).json({ success: true, message: 'Đổi mật khẩu thành công!' });

    } catch (error) {
        console.error("❌ LỖI SERVER:", error);
        res.status(500).json({ message: 'Lỗi server: ' + error.message });
    }
};

exports.emergencyReset = async (req, res) => {
    try {
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash("123456", salt); // Mật khẩu mặc định là 123456

        await User.findOneAndUpdate(
            { email: "keytynguyen2003@gmail.com" }, // Email của bạn trong log
            { password: hash }
        );
        res.json({ message: "Đã reset mật khẩu về 123456" });
    } catch (e) { res.json(e); }
};
// --- HÀM LOGOUT (ĐÃ NÂNG CẤP) ---
exports.logout = async (req, res) => {
    try {
        // ❗ Không cần xóa cookie vì không dùng cookie nữa
        // Client sẽ tự xóa token từ sessionStorage
        console.log('✅ [AUTH] Logout successful');
        res.status(200).json({ success: true, message: 'Đăng xuất thành công' });
    } catch (error) {
        console.error('Lỗi khi đăng xuất:', error);
        res.status(500).json({ success: false, message: 'Lỗi server khi đăng xuất' });
    }
};

// --- HÀM CHECK BAN STATUS (MỚI) ---
exports.checkBanStatus = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ message: 'Email là bắt buộc' });
        }

        const user = await User.findOne({ email }).select('+isBanned');

        if (!user) {
            return res.status(404).json({ message: 'Tài khoản không tồn tại' });
        }

        console.log(`✅ Check ban status cho: ${email}, isBanned: ${user.isBanned}`);
        res.status(200).json({
            success: true,
            email: user.email,
            isBanned: user.isBanned || false,
            message: user.isBanned ? 'Tài khoản đã bị cấm' : 'Tài khoản bình thường'
        });

    } catch (error) {
        console.error('Check Ban Status Error:', error);
        res.status(500).json({ message: 'Lỗi server khi kiểm tra trạng thái cấm' });
    }
};

// --- HÀM MIGRATE ISBANNED (MỚI) ---
// Thêm field isBanned = false cho tất cả users cũ chưa có field này
exports.migrateIsBanned = async (req, res) => {
    try {
        console.log('🔄 Bắt đầu migrate isBanned field...');

        // Chỉ admin có quyền chạy migration này
        if (req.user?.role !== 'admin') {
            return res.status(403).json({ message: 'Chỉ admin mới có quyền thực hiện' });
        }

        // Thêm isBanned = false cho tất cả users chưa có field này
        const result = await User.updateMany(
            { isBanned: { $exists: false } },
            { $set: { isBanned: false } }
        );

        console.log(`✅ Migration hoàn tất - Modified: ${result.modifiedCount}, Matched: ${result.matchedCount}`);

        // List tất cả users sau migration
        const allUsers = await User.find({}).select('email isBanned name');
        const bannedUsers = allUsers.filter(u => u.isBanned);
        const activeUsers = allUsers.filter(u => !u.isBanned);

        res.status(200).json({
            success: true,
            message: 'Migration isBanned hoàn tất!',
            stats: {
                totalUsers: allUsers.length,
                activeUsers: activeUsers.length,
                bannedUsers: bannedUsers.length,
                modifiedCount: result.modifiedCount,
                matchedCount: result.matchedCount
            },
            bannedUsersList: bannedUsers.map(u => ({ email: u.email, name: u.name }))
        });

    } catch (error) {
        console.error('❌ Migrate isBanned Error:', error);
        res.status(500).json({ message: 'Lỗi server khi migrate isBanned', error: error.message });
    }
};