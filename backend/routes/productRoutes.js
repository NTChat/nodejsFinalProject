// backend/routes/productRoutes.js
const express = require('express');
const router = express.Router();
const productController = require('../controllers/productControllers');
const { protect, admin } = require('../middleware/authMiddleware');
const { uploadPaymentProof } = require('../config/cloudinaryPayment');

async function loadProduct(req, res, next) {
  try {
    // chấp nhận cả :productId, :idOrSlug, :slug
    const raw =
      decodeURIComponent(
        String(
          req.params.productId || req.params.idOrSlug || req.params.slug || ""
        ).trim()
      );

    if (!raw) {
      return res.status(400).json({ success: false, message: 'Thiếu tham số sản phẩm' });
    }

    let product = null;

    // 1) Nếu là ObjectId 24 hex → tìm theo _id
    if (/^[0-9a-fA-F]{24}$/.test(raw)) {
      product = await Product.findById(raw);
    }

    // 2) Thử theo productId / code đúng nguyên văn
    if (!product) product = await Product.findOne({ productId: raw });
    if (!product) product = await Product.findOne({ code: raw });

    if (!product && raw.includes('-')) {
      const base = raw.split('-')[0];
      product = await Product.findOne({ productId: base });
      if (!product) product = await Product.findOne({ code: base });
    }

    if (!product) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm' });
    }

    req.product = product;
    next();
  } catch (err) {
    next(err);
  }
}

// PUBLIC
router.get('/', productController.getProducts);
router.get('/brands', productController.getBrandsList);       // <-- thêm
router.get('/categories', productController.getCategoriesList); // <-- thêm
router.get('/collections/bestsellers', productController.getBestSellers);
router.get('/collections/new', productController.getNewProducts);
router.get('/category/:categoryId', productController.getProductsByCategory);
router.post('/batch', productController.batchProductLines);

// Upload image endpoint
router.post('/upload-image', uploadPaymentProof.single('image'), productController.uploadImage);

// Tìm kiếm sản phẩm
router.get('/search', productController.searchProducts); 

// Chi tiết
router.get('/:slug', productController.getProductDetails);

// Comments (public) & Rating (login)
router.post('/:slug/comments', productController.addComment);
router.post('/:slug/ratings', protect, productController.rateProduct);

// ADMIN
router.post('/', protect, admin, productController.createProduct);
router.put('/:slug', protect, admin, productController.updateProduct);
router.delete('/:slug', protect, admin, productController.deleteProduct);

module.exports = router;
