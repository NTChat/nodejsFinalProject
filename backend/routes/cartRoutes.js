// backend/routes/cartRoutes.js
const express = require('express');
const router = express.Router();
const { 
    getCart, 
    syncCart, 
    addToCart, 
    updateCartItem, 
    removeCartItem, 
    clearCart 
} = require('../controllers/cartControllers'); // 👈 Sửa tên file thành "cartControllers" (có S)
const { protect } = require('../middleware/authMiddleware');

router.use(protect); 

router.route('/')
    .get(getCart) 
    .post(addToCart)
    .delete(clearCart);

router.post('/sync', syncCart); // 👈 Route cho lỗi 500

router.route('/:cartItemId') // 👈 Dùng _id của CartModel
    .put(updateCartItem) 
    .delete(removeCartItem); 

module.exports = router;