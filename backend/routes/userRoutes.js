// backend/routes/userRoutes.js
const express = require('express');
const router = express.Router();
const {
    getUsers,
    getUserById,
    getUserProfile,
    updateUserByAdmin,
    updateUserProfile,
    changeMyPassword,
    getMyAddresses,
    addAddress,
    updateShippingAddress,
    deleteAddress,
    setDefaultShippingAddress,
    banUser
} = require('../controllers/userControllers'); // 👈 Sửa tên file (có S)
const { protect, admin } = require('../middleware/authMiddleware');
const upload = require('../config/cloudinary');// Tất cả các route dưới đây đều yêu cầu đăng nhập
router.use(protect);
router.route('/')
    .get(getUsers); // GET /api/users?page=1&limit=10&search=...

// === Hồ sơ cá nhân ===
router.route('/me')
    .get(getUserProfile) // GET /api/users/me
    .put(upload.single('avatar'), updateUserProfile); // 👈 THÊM upload.single('avatar') VÀO TRƯỚC

router.put('/change-password', changeMyPassword); // PUT /api/users/change-password

// === Quản lý địa chỉ ===
router.route('/addresses')
    .get(getMyAddresses) // GET /api/users/addresses
    .post(addAddress); // POST /api/users/addresses

router.route('/addresses/:addressId')
    .put(updateShippingAddress) // PUT /api/users/addresses/:addressId
    .delete(deleteAddress); // DELETE /api/users/addresses/:addressId

router.put('/addresses/:addressId/default', setDefaultShippingAddress); // PUT /api/users/addresses/:addressId/default

router.route('/:id')
    .get(protect, admin, getUserById) // 👈 (GET /api/users/:id)
    .put(protect, admin, updateUserByAdmin); // 👈 (PUT /api/users/:id)
router.route('/:id/ban')
    .put(protect, admin, banUser); // PUT /api/users/:id/ban
// =============================
module.exports = router;