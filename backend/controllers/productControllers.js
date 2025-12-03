// backend/controllers/productControllers.js
const { v4: uuidv4 } = require('uuid');
const Product = require('../models/productModel');
const { cloudinary } = require('../config/cloudinaryPayment');

// Trợ giúp: tìm theo productId (slug) hoặc _id Mongo
async function findBySlugOrId(slug) {
  let p = await Product.findOne({ productId: slug });
  if (!p && /^[0-9a-fA-F]{24}$/.test(slug)) p = await Product.findById(slug);
  return p;
}

/**
 * GET /api/products
 * - Tìm kiếm, lọc, phân trang, sắp xếp
 * - Trả alias name, lowestPrice để FE dùng nhất quán
 */
exports.getProducts = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit) || 12, 60);

    // backward-compat sort
    let { sort, sortBy = 'newest', sortOrder = 'asc' } = req.query || {};
    if (sort) {
      const map = {
        name_asc: ['name', 'asc'],
        name_desc: ['name', 'desc'],
        price_asc: ['price', 'asc'],
        price_desc: ['price', 'desc'],
        newest: ['newest', 'desc'],
        oldest: ['oldest', 'asc'],
      };
      if (map[sort]) [sortBy, sortOrder] = map[sort];
    }

    const {
      categoryId,
      brand,
      keyword = '',
      minPrice,
      maxPrice,
      searchMode = 'norm',     // norm|text
      minRating,               // ⭐️ thêm rating tối thiểu (1..5)
      inStock,                 // optional: true => chỉ còn hàng
      isNew,                   // optional: true => isNewProduct
      bestSeller               // optional: true => isBestSeller
    } = req.query;

    const baseMatch = {};

    // chỉ lấy sản phẩm đang bán hoặc chưa gán trạng thái (dữ liệu import thủ công)
    const availabilityFilter = {
      $or: [
        { status: { $exists: false } },
        { status: 'available' }
      ]
    };

    // multi-category: categoryId=laptop,monitor
    if (categoryId) {
      const arr = String(categoryId).split(',').map(s => s.trim()).filter(Boolean);
      baseMatch['category.categoryId'] = arr.length > 1
        ? { $in: arr }
        : arr[0];
    }

    if (isNew === 'true') baseMatch.isNewProduct = true;
    if (bestSeller === 'true') baseMatch.isBestSeller = true;

    // multi-brand: brand=Asus,MSI
    if (brand) {
      const arr = String(brand).split(',').map(s => s.trim()).filter(Boolean);
      baseMatch.brand = arr.length > 1
        ? { $in: arr.map(b => new RegExp(`^${b}$`, 'i')) }
        : { $regex: brand, $options: 'i' };
    }

    // ===== Search theo keyword với Fuzzy Search =====
    const hasKeyword = String(keyword).trim().length > 0;
    console.log('🔍 Search keyword:', keyword, 'hasKeyword:', hasKeyword);
    const useText = hasKeyword && (String(searchMode).toLowerCase() === 'text');
    if (hasKeyword) {
      if (useText) {
        baseMatch.$text = { $search: String(keyword).trim() };
      } else {
        const kw = String(keyword).trim()
          .normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
        
        // Tạo nhiều fuzzy patterns để tìm kiếm linh hoạt hơn
        // Pattern 1: Cho phép có ký tự bất kỳ giữa các ký tự (thiếu chữ)
        // "laptp" -> "l.*a.*p.*t.*p" sẽ match "laptop"
        const fuzzyPattern1 = kw.split('').join('.*');
        
        // Pattern 2: Cho phép skip 1-2 ký tự (gõ thừa hoặc sai)
        const fuzzyPattern2 = kw.split('').join('.?');
        
        // Pattern 3: Tìm theo các ký tự consonant chính (bỏ qua nguyên âm)
        const consonants = kw.replace(/[aeiou]/gi, '');
        const consonantPattern = consonants.length >= 3 ? consonants.split('').join('.*') : null;
        
        // Dùng đúng tên field trong schema: productName, productDescription, brand
        const orConditions = [
          { productName: { $regex: kw, $options: 'i' } },              // Exact match tên
          { productDescription: { $regex: kw, $options: 'i' } },      // Exact match mô tả
          { brand: { $regex: kw, $options: 'i' } },                    // Exact match brand
          { productName: { $regex: fuzzyPattern1, $options: 'i' } },  // Fuzzy - thiếu ký tự
          { productName: { $regex: fuzzyPattern2, $options: 'i' } },  // Fuzzy - thừa ký tự
          { brand: { $regex: fuzzyPattern1, $options: 'i' } },        // Fuzzy brand
        ];
        
        // Thêm consonant pattern nếu có đủ phụ âm
        if (consonantPattern) {
          orConditions.push({ productName: { $regex: consonantPattern, $options: 'i' } });
          orConditions.push({ brand: { $regex: consonantPattern, $options: 'i' } });
        }
        
        baseMatch.$or = orConditions;
      }
    }

    // Lọc theo giá (biến thể)
    if (minPrice || maxPrice) {
      baseMatch['variants.price'] = {};
      if (minPrice) baseMatch['variants.price'].$gte = Number(minPrice);
      if (maxPrice) baseMatch['variants.price'].$lte = Number(maxPrice);
    }

    const combinedMatch = Object.keys(baseMatch).length
      ? { $and: [availabilityFilter, baseMatch] }
      : availabilityFilter;

    // sort mặc định
    const sortStage = (() => {
      if (sortBy === 'name') return { productName: (sortOrder === 'desc' ? -1 : 1) };
      if (sortBy === 'price') return { minPrice: (sortOrder === 'desc' ? -1 : 1) };
      if (sortBy === 'oldest') return { createdAt: 1 };
      return { createdAt: -1 }; // newest
    })();

    // ===== Pipeline =====
    const pipeline = [
      { $match: combinedMatch },
      ...(useText ? [{ $addFields: { score: { $meta: 'textScore' } } }] : []),

      // Tính minPrice (từ variants), avgStars (từ ratings), totalStock (để lọc còn hàng)
      {
        $addFields: {
          minPrice: { $min: '$variants.price' },
          avgStars: {
            $cond: [
              { $gt: [{ $size: { $ifNull: ['$ratings', []] } }, 0] },
              { $avg: '$ratings.stars' },
              0
            ]
          },
          totalStock: { $sum: '$variants.stock' } // Đã có sẵn, giữ nguyên
        }
      },

      // Lọc theo rating (nếu có)
      ...(Number(minRating) > 0 ? [{ $match: { avgStars: { $gte: Number(minRating) } } }] : []),

      // Lọc còn hàng (optional)
      ...(inStock === 'true' ? [{ $match: { totalStock: { $gt: 0 } } }] : []),

      // Sắp xếp
      { $sort: useText ? { score: { $meta: 'textScore' }, minPrice: 1 } : sortStage },

      {
        $facet: {
          items: [
            { $skip: (page - 1) * limit },
            { $limit: limit },
            {
              $project: {
                _id: 1, // Thêm _id để frontend có thể dùng
                productId: 1,
                productName: 1,
                name: '$productName',
                brand: 1,
                category: 1,
                // Trả về ảnh đầu tiên dưới dạng string, xử lý trường hợp array rỗng
                image: {
                  $cond: {
                    if: { $gt: [{ $size: { $ifNull: ['$images', []] } }, 0] },
                    then: { $arrayElemAt: ['$images', 0] },
                    else: null
                  }
                },
                images: '$images', // Return all images
                variants: 1, // Thêm variants để frontend biết stock của từng variant
                minPrice: 1,
                lowestPrice: '$minPrice',
                averageRating: { $round: ['$avgStars', 2] },
                ratingsCount: { $size: { $ifNull: ['$ratings', []] } },
                isNewProduct: 1,
                isBestSeller: 1,
                createdAt: 1,
                totalStock: 1 // Gửi về FE
              },
            },
          ],
          meta: [{ $count: 'total' }],
        },
      },
    ];

    const agg = await Product.aggregate(pipeline);
    const items = (agg[0]?.items || []);
    const total = agg[0]?.meta?.[0]?.total || 0;
    const totalPages = Math.max(Math.ceil(total / limit), 1);

    return res.status(200).json({
      success: true,
      products: items,
      totalProducts: total,
      currentPage: page,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Lỗi server', error: err.message });
  }
};

/** Chi tiết */
exports.getProductDetails = async (req, res) => {
  try {
    const { slug } = req.params;
    const product = await findBySlugOrId(slug);
    if (!product) return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm' });

    const minPrice = product.variants?.length
      ? Math.min(...product.variants.map(v => Number(v.price) || Infinity))
      : 0;

    return res.status(200).json({
      success: true,
      product: {
        ...product.toObject(),
        lowestPrice: minPrice,
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Lỗi server', error: err.message });
  }
};

// Lấy danh sách brand (phục vụ FilterBar)
exports.getBrandsList = async (_req, res) => {
  try {
    const brands = await Product.distinct('brand', { brand: { $nin: [null, ''] } });
    // loại null/undefined, trim & unique mềm
    const list = [...new Set(brands.map(b => String(b).trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'vi'));
    res.json({ success: true, brands: list });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Lỗi server', error: e.message });
  }
};

// Lấy danh sách category (id + name) từ field category
exports.getCategoriesList = async (_req, res) => {
  try {
    const rows = await Product.aggregate([
      // 1. Chỉ lấy sản phẩm có categoryId
      { $match: { 'category.categoryId': { $exists: true, $ne: '' } } },

      // 2. Gom nhóm
      {
        $group: {
          _id: '$category.categoryId',
          categoryName: { $first: '$category.categoryName' }
        }
      },

      // 3. Format lại kết quả trả về
      { $project: { _id: 0, categoryId: '$_id', categoryName: { $ifNull: ['$categoryName', ''] } } },
      { $sort: { categoryName: 1 } }
    ]);
    console.log('📂 Categories fetched from DB:', JSON.stringify(rows, null, 2));
    res.json({ success: true, categories: rows });
  } catch (e) {
    console.error('❌ Error getting categories:', e);
    res.status(500).json({ success: false, message: 'Lỗi server', error: e.message });
  }
};

/** batch enrich cho giỏ hàng */
exports.batchProductLines = async (req, res) => {
  try {
    const { variantIds } = req.body;
    if (!Array.isArray(variantIds) || variantIds.length === 0) {
      return res.status(400).json({ success: false, message: 'variantIds phải là mảng.' });
    }

    const products = await Product.find({ 'variants.variantId': { $in: variantIds } });
    const found = [];
    products.forEach((p) => {
      p.variants.forEach((v) => {
        if (variantIds.includes(v.variantId)) {
          found.push({
            productId: p.productId,
            _id: p._id,
            productName: p.productName,
            image: p.images?.[0] || null,
            variantId: v.variantId,
            name: v.name,
            variantName: v.name,
            price: v.price,
            stock: v.stock,
          });
        }
      });
    });

    return res.status(200).json(found);
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Lỗi server khi enrich biến thể' });
  }
};

/** Collections */
exports.getBestSellers = async (_req, res) => {
  try {
    const items = await Product.aggregate([
      { $match: { isBestSeller: true, $or: [{ status: { $exists: false } }, { status: 'available' }] } },
      // 👇 SỬA: Thêm tính totalStock
      {
        $addFields: {
          minPrice: { $min: '$variants.price' },
          totalStock: { $sum: '$variants.stock' }
        }
      },
      // 👇 SỬA: Thêm totalStock vào project
      {
        $project: {
          productId: 1,
          productName: 1,
          name: '$productName',
          brand: 1,
          images: '$images',
          lowestPrice: '$minPrice',
          totalStock: 1 // <-- Quan trọng
        }
      },
      { $limit: 20 },
    ]);
    res.json({ success: true, products: items });
  } catch {
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

exports.getNewProducts = async (_req, res) => {
  try {
    // Lấy sản phẩm mới: tạo trong 30 ngày gần đây HOẶC có isNewProduct = true
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const items = await Product.aggregate([
      { 
        $match: { 
          // Chỉ lấy sản phẩm available
          $or: [
            { status: { $exists: false } }, 
            { status: 'available' }
          ]
        } 
      },
      {
        $match: {
          // Điều kiện "mới": isNewProduct = true HOẶC tạo trong 30 ngày
          $or: [
            { isNewProduct: true },
            { createdAt: { $gte: thirtyDaysAgo } }
          ]
        }
      },
      // Sắp xếp theo ngày tạo mới nhất
      { $sort: { createdAt: -1 } },
      // Tính totalStock và minPrice
      {
        $addFields: {
          minPrice: { $min: '$variants.price' },
          totalStock: { $sum: '$variants.stock' }
        }
      },
      {
        $project: {
          productId: 1,
          productName: 1,
          name: '$productName',
          brand: 1,
          images: '$images',
          lowestPrice: '$minPrice',
          totalStock: 1,
          createdAt: 1,
          isNewProduct: 1
        }
      },
      { $limit: 20 },
    ]);
    res.json({ success: true, products: items });
  } catch (e) {
    console.error('Error getNewProducts:', e);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

exports.getProductsByCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const { page = 1, limit = 12, sortBy = 'newest', sortOrder = 'desc' } = req.query;

    const pageNum = Math.max(parseInt(page) || 1, 1);
    const limitNum = Math.min(parseInt(limit) || 12, 60);
    const skip = (pageNum - 1) * limitNum;

    // Determine sort stage
    let sortStage = { createdAt: -1 }; // default: newest
    if (sortBy === 'name') sortStage = { productName: sortOrder === 'desc' ? -1 : 1 };
    if (sortBy === 'price') sortStage = { minPrice: sortOrder === 'desc' ? -1 : 1 };
    if (sortBy === 'oldest') sortStage = { createdAt: 1 };

    // Count total documents
    const [items, totalCount] = await Promise.all([
      Product.aggregate([
        { $match: { 'category.categoryId': categoryId, $or: [{ status: { $exists: false } }, { status: 'available' }] } },
        // 👇 SỬA: Tính tổng tồn kho
        {
          $addFields: {
            minPrice: { $min: '$variants.price' },
            totalStock: { $sum: '$variants.stock' }
          }
        },
        { $sort: sortStage },
        { $skip: skip },
        { $limit: limitNum },
        // 👇 SỬA: Trả về totalStock
        {
          $project: {
            productId: 1,
            productName: 1,
            name: '$productName',
            brand: 1,
            images: '$images',
            lowestPrice: '$minPrice',
            minPrice: 1,
            totalStock: 1
          }
        },
      ]),
      Product.countDocuments({ 'category.categoryId': categoryId, $or: [{ status: { $exists: false } }, { status: 'available' }] })
    ]);

    const totalPages = Math.max(Math.ceil(totalCount / limitNum), 1);

    console.log(`📂 Category ${categoryId}: ${items.length} items on page ${pageNum}/${totalPages}`);

    res.json({
      success: true,
      products: items,
      totalProducts: totalCount,
      totalPages,
      currentPage: pageNum,
      limit: limitNum
    });
  } catch (error) {
    console.error('❌ Error in getProductsByCategory:', error);
    res.status(500).json({ success: false, message: 'Lỗi server', error: error.message });
  }
};

/** ADMIN */
exports.createProduct = async (req, res) => {
  try {
    console.log('📦 [CREATE PRODUCT] Request body:', JSON.stringify(req.body, null, 2));
    
    const {
      productId, productName, brand, productDescription, category, images = [],
      status = 'available', isNewProduct = false, isBestSeller = false, variants = [],
      createdAt, // Cho phép set ngày tạo tùy chỉnh
    } = req.body;

    if (!productId || !productName || !category?.categoryId || !variants?.length) {
      console.log('❌ [CREATE PRODUCT] Validation failed:', {
        hasProductId: !!productId,
        hasProductName: !!productName,
        hasCategoryId: !!category?.categoryId,
        hasVariants: !!variants?.length
      });
      return res.status(400).json({ success: false, message: 'Thiếu dữ liệu bắt buộc/biến thể.' });
    }

    const processedVariants = variants.map((v, index) => ({
      variantId: v.variantId || uuidv4(),
      name: v.name && v.name.trim() ? v.name.trim() : `Phiên bản ${index + 1}`, // Auto-generate name nếu thiếu
      price: v.price,
      oldPrice: v.oldPrice || 0,
      discount: Number(v.discount) || 0,
      stock: v.stock ?? 0,
    }));

    const productData = {
      productId, productName, brand, productDescription, category, images,
      status, isNewProduct, isBestSeller, variants: processedVariants,
    };

    // Nếu có createdAt từ request, sử dụng nó
    if (createdAt) {
      productData.createdAt = new Date(createdAt);
    }

    const created = await Product.create(productData);

    console.log('✅ [CREATE PRODUCT] Product created successfully:', created.productId);
    res.status(201).json({ success: true, product: created });
  } catch (e) {
    console.error('❌ [CREATE PRODUCT] Error:', e);
    console.error('❌ [CREATE PRODUCT] Stack:', e.stack);
    res.status(500).json({ success: false, message: 'Lỗi server', error: e.message });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const { slug } = req.params;
    const product = await findBySlugOrId(slug);
    if (!product) return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm' });

    const {
      productName, brand, productDescription, category,
      images, status, isNewProduct, isBestSeller, variants,
      createdAt, // Cho phép cập nhật ngày tạo
    } = req.body;

    if (productName) product.productName = productName;
    if (brand) product.brand = brand;
    if (productDescription) product.productDescription = productDescription;
    if (category) product.category = category;
    if (images) product.images = images;
    if (status) product.status = status;
    if (typeof isNewProduct !== 'undefined') product.isNewProduct = isNewProduct;
    if (typeof isBestSeller !== 'undefined') product.isBestSeller = isBestSeller;
    if (createdAt) product.createdAt = new Date(createdAt);

    if (Array.isArray(variants)) {
      if (variants.length === 0) {
        return res.status(400).json({ success: false, message: 'Phải có ít nhất 1 biến thể.' });
      }
      product.variants = variants.map(v => ({
        variantId: v.variantId || uuidv4(),
        name: v.name,
        price: v.price,
        oldPrice: v.oldPrice || 0,
        discount: Number(v.discount) || 0,
        stock: v.stock ?? 0,
      }));
    }

    const updated = await product.save();
    return res.status(200).json({ success: true, product: updated });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Lỗi server', error: e.message });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    const { slug } = req.params;
    const product = await findBySlugOrId(slug);
    if (!product) return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm' });

    await Product.deleteOne({ _id: product._id });
    return res.status(200).json({ success: true, message: 'Đã xoá sản phẩm.' });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Lỗi server', error: e.message });
  }
};

/** ========== COMMENTS (public) ========== */
exports.addComment = async (req, res) => {
  try {
    const { slug } = req.params;
    const { comment, name, userId, userAvatar } = req.body;

    if (!comment || !comment.trim()) {
      return res.status(400).json({ success: false, message: 'Field "comment" là bắt buộc.' });
    }

    const product = await findBySlugOrId(slug);
    if (!product) return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm.' });

    // Create comment object with optional user info
    const newComment = {
      name: (name || 'Guest').trim(),
      comment: comment.trim(),
      userId: userId || null,
      userAvatar: userAvatar || null,
      createdAt: new Date()
    };

    product.comments.push(newComment);
    await product.save();

    // === REALTIME UPDATE ===
    const io = req.app.get('socketio');
    if (io) {
      io.emit('new_activity', {
        type: 'comment',
        productSlug: slug,
        productId: product.productId, // Gửi cả 2 cho chắc
        mongoId: product._id.toString()
      });
    }
    // =======================

    return res.json({ success: true, comments: product.comments });
  } catch (e) {
    return res.status(500).json({ success: false, message: 'Lỗi server', error: e.message });
  }
};

/** ========== RATINGS (login) ========== */
exports.rateProduct = async (req, res) => {
  try {
    const { slug } = req.params;
    const stars = Number(req.body?.stars ?? req.body?.rating);

    if (!Number.isFinite(stars) || stars < 1 || stars > 5) {
      return res.status(400).json({ success: false, message: 'Rating phải từ 1-5.' });
    }

    const product = await findBySlugOrId(slug);
    if (!product) return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm.' });

    const uid = req.user._id.toString();
    const idx = product.ratings.findIndex(r => r.user.toString() === uid);

    if (idx >= 0) {
      product.ratings[idx].stars = stars;
      product.ratings[idx].createdAt = new Date();
    } else {
      product.ratings.push({ user: req.user._id, stars });
    }

    // === REALTIME UPDATE ===
    const io = req.app.get('socketio');
    if (io) {
      io.emit('new_activity', {
        type: 'rating',
        productSlug: slug,
        productId: product.productId,
        mongoId: product._id.toString()
      });
    }

    product.recomputeRating();
    await product.save();

    return res.json({ success: true, avgRating: product.avgRating, ratingsCount: product.ratingsCount });
  } catch (e) {
    return res.status(500).json({ success: false, message: 'Lỗi server', error: e.message });
  }
};

// Upload image to Cloudinary
exports.uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: 'Không có file được tải lên' 
      });
    }

    // Cloudinary URL from multer-storage-cloudinary
    const imageUrl = req.file.path;

    res.json({ 
      success: true, 
      imageUrl,
      message: 'Upload ảnh thành công' 
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Lỗi khi upload ảnh', 
      error: error.message 
    });
  }
};
exports.searchProducts = async (req, res) => {
  try {
    const { keyword } = req.query;

    if (!keyword || keyword.trim() === "") {
      return res.json({ success: true, products: [] });
    }

    const searchTerm = keyword.trim();
    const searchTermNorm = searchTerm.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    
    // Tạo các fuzzy patterns
    const fuzzyPattern1 = searchTermNorm.split('').join('.*');  // Cho phép thiếu ký tự: "lptp" -> "l.*p.*t.*p" matches "laptop"
    const fuzzyPattern2 = searchTermNorm.split('').join('.?');  // Cho phép thừa ký tự
    
    // Tạo regex objects
    const exactRegex = new RegExp(searchTerm, 'i');
    const fuzzyRegex1 = new RegExp(fuzzyPattern1, 'i');
    const fuzzyRegex2 = new RegExp(fuzzyPattern2, 'i');
    
    // Tìm với tất cả patterns cùng lúc - dùng đúng field trong schema
    let products = await Product.find({
      $or: [
        // Exact match
        { productName: exactRegex },
        { brand: exactRegex },
        { productDescription: exactRegex },
        // Fuzzy match - thiếu ký tự
        { productName: fuzzyRegex1 },
        { brand: fuzzyRegex1 },
        // Fuzzy match - thừa ký tự  
        { productName: fuzzyRegex2 },
        { brand: fuzzyRegex2 },
      ]
    })
    .select('productName productDescription images price productId _id brand variants')
    .limit(10);

    // Fallback: Tìm theo từng từ riêng lẻ
    if (products.length === 0 && searchTerm.includes(' ')) {
      const words = searchTerm.split(/\s+/).filter(w => w.length >= 2);
      const wordPatterns = words.map(w => new RegExp(w, 'i'));
      
      products = await Product.find({
        $or: wordPatterns.map(pattern => ({ productName: pattern }))
      })
      .select('productName productDescription images price productId _id brand variants')
      .limit(10);
    }

    // Fallback: Tìm theo ký tự đầu của mỗi từ (viết tắt)
    if (products.length === 0 && searchTerm.length >= 2) {
      // VD: "atg" -> tìm "ASUS TUF Gaming"
      const abbreviationPattern = searchTerm.split('').map(c => `\\b${c}`).join('.*');
      const abbreviationRegex = new RegExp(abbreviationPattern, 'i');
      
      products = await Product.find({ productName: abbreviationRegex })
        .select('productName productDescription images price productId _id brand variants')
        .limit(10);
    }

    // Map để tính giá từ variants và chuẩn hóa response
    const productsWithPrice = products.map(p => {
      const doc = p.toObject();
      // Thêm alias name = productName để FE dùng được
      doc.name = doc.productName;
      // Tính minPrice từ variants nếu price không có
      if (!doc.price && doc.variants && doc.variants.length > 0) {
        doc.price = Math.min(...doc.variants.map(v => v.price || 0));
      }
      return doc;
    });

    return res.json({ success: true, products: productsWithPrice });

  } catch (e) {
    console.error("Search Error:", e);
    return res.status(500).json({ success: false, message: e.message });
  }
};