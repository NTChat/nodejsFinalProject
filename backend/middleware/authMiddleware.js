// backend/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const asyncHandler = require('express-async-handler');

// ❗ CHỈ LẤY TOKEN TỪ AUTHORIZATION HEADER để hỗ trợ multi-tab
// Không dùng cookie vì cookie được share giữa tất cả các tab
function getTokenFromReq(req) {
  // Chỉ lấy từ Authorization header (Bearer)
  const auth = req.headers.authorization || req.headers.Authorization;
  if (auth && typeof auth === 'string' && auth.startsWith('Bearer ')) {
    return auth.slice(7).trim();
  }
  return null;
}

const protect = asyncHandler(async (req, res, next) => {
  const token = getTokenFromReq(req);
  
  // Debug log
  console.log('🔐 [AUTH MIDDLEWARE] Checking token from Authorization header...');
  console.log('   Authorization header:', req.headers.authorization ? 'EXISTS' : 'MISSING');
  console.log('   Token found:', token ? `YES (${token.substring(0, 30)}...)` : 'NO');
  console.log('   JWT_SECRET exists:', process.env.JWT_SECRET ? 'YES' : 'NO');

  if (!token) {
    res.status(401);
    throw new Error('Không được ủy quyền: thiếu token trong Authorization header.');
  }

  try {
    console.log('   Verifying token with JWT_SECRET...');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('   Token decoded successfully, user ID:', decoded.id);

    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      console.log('   ❌ User not found in database for ID:', decoded.id);
      res.status(401);
      throw new Error('Người dùng không tồn tại hoặc đã bị xóa.');
    }

    req.user = user;        // gắn user cho các route sau
    req.auth = decoded;     // (tuỳ chọn) giữ decoded để debug
    console.log('✅ [AUTH MIDDLEWARE] User authenticated:', user.email, '| isAdmin:', user.isAdmin);
    next();
  } catch (err) {
    res.status(401);
    console.error('❌ [AUTH MIDDLEWARE] Token error:', err.message);
    console.error('   Error name:', err.name);
    // Phân biệt lỗi token hết hạn/không hợp lệ để debug dễ hơn
    if (err?.name === 'TokenExpiredError') {
      throw new Error('Token đã hết hạn.');
    }
    throw new Error('Token không hợp lệ.');
  }
});

// Chấp nhận cả role === 'admin' hoặc isAdmin === true (tuỳ model)
const admin = (req, res, next) => {
  console.log('🔒 [ADMIN MIDDLEWARE] Checking admin rights...');
  console.log('   User role:', req.user?.role);
  console.log('   User isAdmin:', req.user?.isAdmin);
  const isAdmin = req.user?.role === 'admin' || req.user?.isAdmin === true;
  console.log('   Is Admin:', isAdmin);
  if (isAdmin) return next();
  res.status(403);
  throw new Error('Không có quyền Admin.');
};

module.exports = { getTokenFromReq, protect, admin };
