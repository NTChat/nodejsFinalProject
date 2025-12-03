// routes/adminRoutes.js

const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { protect, admin } = require('../middleware/authMiddleware');

// Tất cả các route trong file này đều yêu cầu quyền Admin
router.use(protect, admin);

// === DASHBOARD ROUTES ===

// GET /api/admin/stats/simple - Lấy số liệu cho Simple Dashboard
router.get('/stats/simple', dashboardController.getSimpleStats);

// GET /api/admin/stats/advanced - Lấy số liệu cho Advanced Dashboard
router.get('/stats/advanced', dashboardController.getAdvancedStats);

module.exports = router;