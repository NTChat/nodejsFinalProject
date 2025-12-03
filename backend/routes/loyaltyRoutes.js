// backend/routes/loyaltyRoutes.js
const express = require('express');
const router = express.Router();
const loyaltyController = require('../controllers/loyaltyController');
const { protect } = require('../middleware/authMiddleware');

// Lấy điểm thưởng của user
router.get('/points', protect, loyaltyController.getLoyaltyPoints);

// Lấy danh sách vouchers có thể đổi
router.get('/vouchers/available', protect, loyaltyController.getRedeemableVouchers);

// Đổi điểm lấy voucher
router.post('/vouchers/redeem', protect, loyaltyController.redeemVoucher);

// Lấy danh sách vouchers đã đổi
router.get('/vouchers/redeemed', protect, loyaltyController.getRedeemedVouchers);

module.exports = router;
