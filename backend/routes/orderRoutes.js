const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const mongoose = require('mongoose');
const Order = require('../models/orderModel');
const discountCtrl = require('../controllers/discountControllers');
const identifyUser = require('../middleware/identifyUser');
const { protect, admin } = require('../middleware/authMiddleware');
const orderCtrl = require('../controllers/orderControllers');
const { uploadPaymentProof } = require('../config/cloudinaryPayment'); // Thêm dòng này

// Multer config cho payment confirmation images
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/images/payment-confirmations/');
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'payment-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|webp/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        
        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Chỉ chấp nhận file ảnh (JPG, PNG, WebP)'));
        }
    }
});

// Tạo đơn
router.post('/', identifyUser, orderCtrl.createOrder);

// Tạo đơn hàng với upload hình ảnh xác nhận thanh toán
router.post('/with-payment-image', identifyUser, upload.single('paymentConfirmation'), orderCtrl.createOrderWithPaymentImage);

// --- ROUTE MỚI: Thống kê Dashboard (Đặt trước các route có :id) ---
router.get('/admin/dashboard/stats', protect, admin, orderCtrl.getDashboardStats);

// Xem danh sách đơn hàng (Admin)
router.get('/', protect, admin, orderCtrl.listOrders);
router.get('/admin/all', protect, admin, orderCtrl.listOrders);

// Discount
router.post('/discount', protect, admin, discountCtrl.createCode);
router.get('/discount/validate', discountCtrl.validateCode);

// User xem đơn của mình
router.get('/myorders', protect, orderCtrl.listMyOrders);

// Check trạng thái đơn hàng (không cần auth - dùng cho polling sau thanh toán VNPay)
router.get('/status/:orderId', orderCtrl.checkOrderStatus);

// Upload ảnh chứng từ chuyển khoản lên Cloudinary (User)
router.post('/:orderId/upload-payment-proof-cloudinary', protect, uploadPaymentProof.single('paymentProof'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'Vui lòng chọn file ảnh chứng từ' });
        }
        
        const imageUrl = req.file.path; // Cloudinary URL
        
        // Gọi function uploadPaymentProof với imageUrl
        req.body.imageUrl = imageUrl;
        orderCtrl.uploadPaymentProof(req, res);
    } catch (error) {
        console.error('Error uploading payment proof to Cloudinary:', error);
        res.status(500).json({ success: false, message: 'Lỗi upload ảnh chứng từ' });
    }
});

// Upload ảnh chứng từ chuyển khoản (User) - version cũ với URL có sẵn
router.post('/:orderId/upload-proof', orderCtrl.uploadPaymentProof);

// Admin xác nhận thanh toán
router.post('/:orderId/confirm-payment', protect, admin, orderCtrl.confirmPayment);

// Mark order as paid (TEST ONLY - xác nhận thanh toán thủ công)
router.post('/:orderId/mark-paid', orderCtrl.markOrderAsPaid);

// Chi tiết và cập nhật trạng thái
router.get('/:orderId', identifyUser, orderCtrl.getOrder);
router.put('/:orderId/status', protect, admin, orderCtrl.updateOrderStatus);

// 🆕 HỦY ĐƠN HÀNG (User)
router.post('/:orderId/cancel', protect, orderCtrl.cancelOrder);

module.exports = router;