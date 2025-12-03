const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');

// Tạo URL thanh toán
router.post('/create_payment_url', paymentController.createPaymentUrl);

// API để Frontend verify kết quả thanh toán
router.get('/verify', paymentController.verifyPayment);

// IPN - VNPay gọi về để cập nhật trạng thái đơn hàng
router.get('/vnpay_ipn', paymentController.vnpayIPN);

// Xử lý kết quả trả về từ VNPAY (Method GET) - Legacy
router.get('/vnpay_return', paymentController.vnpayReturn);

module.exports = router;