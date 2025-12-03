const express = require('express');
const router = express.Router();
const upload = require('../config/cloudinary.js');
const {
    register,
    login,
    logout,
    googleLogin,
    facebookLogin,
    checkSession,
    forgotPassword,
    changePassword,
    resetPassword,
    emergencyReset,
    checkBanStatus,
    migrateIsBanned
} = require('../controllers/authController.js');

const { protect, admin } = require("../middleware/authMiddleware.js");

// === CÁC ROUTE CÔNG KHAI ===

// /api/auth/register
router.post('/register', upload.single('avatar'), register);
// /api/auth/login
router.post('/login', login);

// /api/auth/googleLogin
router.post('/googleLogin', googleLogin);

// /api/auth/facebookLogin
router.post('/facebookLogin', facebookLogin);
// === CÁC ROUTE BẢO VỆ (CẦN ĐĂNG NHẬP) ===
router.get('/check-session', checkSession);
// /api/auth/logout
router.post("/logout", logout);
router.post('/forgot-password', forgotPassword);
router.put('/change-password', protect, changePassword);
router.put('/reset-password/:token', resetPassword);
router.post('/check-ban-status', checkBanStatus); // 👈 Route kiểm tra ban
router.post('/migrate-is-banned', protect, admin, migrateIsBanned); // 👈 Route migrate (chỉ admin)
router.get('/emergency-reset', emergencyReset); // Nhớ import hàm ở trên
module.exports = router;