// backend/routes/route.js
const express = require('express');
const router = express.Router();

// Import route modules
const userRoutes = require('./userRoutes');
const productRoutes = require('./productRoutes');
const cartRoutes = require('./cartRoutes');
const orderRoutes = require('./orderRoutes');
const authRoutes = require('./authRoutes');
const discountRoutes = require('./discountRoutes');
const adminRoutes = require('./adminRoutes');
const categoryRoutes = require('./categoryRoutes');
const loyaltyRoutes = require('./loyaltyRoutes');
const flashSaleRoutes = require('./flashSaleRoutes');
const notificationRoutes = require('./notificationRoutes');
const chatRoutes = require('./chatRoutes');
const imageProxyRoutes = require('./imageProxyRoutes');

// ===========================================
// === LOGGING: ĐỂ XEM REQUEST ĐÃ VÀO ROUTE.JS CHƯA ===
router.use((req, res, next) => {
    console.log(`[ROUTE.JS]: Đã nhận request. Method: ${req.method}, URL: ${req.url}`);
    next();
});
// ===========================================

// Mount routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/cart', cartRoutes);
router.use('/products', productRoutes);
router.use('/orders', orderRoutes);
router.use('/discounts', discountRoutes);
router.use('/categories', categoryRoutes);
router.use('/admin', adminRoutes);
router.use('/loyalty', loyaltyRoutes);
router.use('/flash-sales', flashSaleRoutes);
router.use('/notifications', notificationRoutes);
router.use('/chat', chatRoutes);
router.use('/image-proxy', imageProxyRoutes);

module.exports = router;