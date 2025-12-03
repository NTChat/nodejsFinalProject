const express = require('express');
const router = express.Router();
const discountCtrl = require('../controllers/discountControllers');
const { protect, admin } = require('../middleware/authMiddleware'); // Giả sử bạn có middleware để xác thực và kiểm tra admin

// === PUBLIC ROUTE ===
// Route cho khách hàng kiểm tra mã giảm giá
// GET /api/discounts/validate?code=DISCOUNTCODE
router.get('/validate', discountCtrl.validateCode);

// Route cho khách hàng xem voucher available
// GET /api/discounts/available
router.get('/available', discountCtrl.getAvailableVouchers);

// Route cho khách hàng đổi voucher
// POST /api/discounts/redeem
router.post('/redeem', protect, discountCtrl.redeemVoucher);


// === ADMIN ROUTES ===
// Các route dưới đây yêu cầu đăng nhập và quyền admin

// Route để admin tạo mã giảm giá mới
// POST /api/discounts
router.post('/', protect, admin, discountCtrl.createCode);

// Route để admin xem tất cả mã giảm giá
// GET /api/discounts
router.get('/', protect, admin, discountCtrl.getAllCodes);

// Route để admin xem chi tiết một mã giảm giá theo CODE
// GET /api/discounts/code/DISCOUNTCODE
router.get('/code/:code', protect, admin, discountCtrl.getCodeDetails);

// Route để admin cập nhật mã giảm giá theo ID
// PUT /api/discounts/:id
router.put('/:id', protect, admin, discountCtrl.updateCode);

// Route để admin xóa mã giảm giá theo ID
// DELETE /api/discounts/:id
router.delete('/:id', protect, admin, discountCtrl.deleteCode);


module.exports = router;