// backend/routes/categoryRoutes.js
const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const { protect, admin } = require('../middleware/authMiddleware');

// PUBLIC routes
router.get('/', categoryController.getAllCategories);
router.get('/tree', categoryController.getCategoryTree); // ⭐ Tree structure
router.get('/stats', categoryController.getCategoryStats);
router.get('/:id', categoryController.getCategoryById);

// ADMIN routes
router.post('/', protect, admin, categoryController.createCategory);
router.put('/:id', protect, admin, categoryController.updateCategory);
router.delete('/:id', protect, admin, categoryController.deleteCategory);

module.exports = router;
