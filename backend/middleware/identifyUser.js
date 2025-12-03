const jwt = require("jsonwebtoken");
const User = require("../models/userModel");

/**
 * Middleware này sẽ cố gắng xác thực người dùng nếu có token.
 * Nếu không có token, nó sẽ bỏ qua và cho request đi tiếp.
 * Nếu có token nhưng token không hợp lệ, nó sẽ báo lỗi.
 */
const identifyUser = async (req, res, next) => {
    try {
        const token = req.headers.authorization && req.headers.authorization.split(" ")[1];

        // Nếu không có token, coi như là khách và cho đi tiếp
        if (!token) {
            req.user = null;
            return next();
        }

        // Nếu có token, giải mã và lấy user từ DB
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select('-password');
        
        if (user) {
            req.user = user;
        } else {
            req.user = null;
        }
        
        next();

    } catch (error) {
        // Nếu token có vấn đề, coi như là guest
        req.user = null;
        next();
    }
};

module.exports = identifyUser;