// backend/routes/flashSaleRoutes.js
const express = require('express');
const router = express.Router();
const flashSaleCtrl = require('../controllers/flashSaleController');
const { protect, admin } = require('../middleware/authMiddleware');

// ADMIN ROUTES (Phải đặt trước các route public để tránh conflict)
// Lấy tất cả flash sales (admin) - có query params
router.get('/', protect, admin, flashSaleCtrl.getAllFlashSales);

// Tạo flash sale mới
router.post('/', protect, admin, flashSaleCtrl.createFlashSale);

// Cập nhật flash sale
router.put('/:id', protect, admin, flashSaleCtrl.updateFlashSale);

// Xóa flash sale
router.delete('/:id', protect, admin, flashSaleCtrl.deleteFlashSale);

// PUBLIC ROUTES
// Lấy flash sales cho homepage (kiểu Shopee: active + upcoming + tomorrow)
router.get('/homepage', flashSaleCtrl.getFlashSalesForHomepage);

// Lấy flash sales đang diễn ra
router.get('/active', flashSaleCtrl.getActiveFlashSales);

// Lấy flash sales sắp diễn ra
router.get('/upcoming', flashSaleCtrl.getUpcomingFlashSales);

// Lấy chi tiết một flash sale
router.get('/:id', flashSaleCtrl.getFlashSaleDetail);

// Kiểm tra sản phẩm có trong flash sale không
router.get('/check/:productId', flashSaleCtrl.checkProductInFlashSale);

module.exports = router;
