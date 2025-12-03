// backend/controllers/categoryController.js
const Category = require('../models/categoryModel');
const Product = require('../models/productModel');

// ========== DANH MỤC ĐA CẤP ==========

// Lấy cây danh mục (tree structure)
exports.getCategoryTree = async (req, res) => {
  try {
    const tree = await Category.getTree();
    res.json({ 
      success: true, 
      categories: tree,
      total: tree.length
    });
  } catch (error) {
    console.error('❌ Error fetching category tree:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Lỗi khi lấy cây danh mục', 
      error: error.message 
    });
  }
};

// Lấy tất cả categories (flat list) với filter
exports.getAllCategories = async (req, res) => {
  try {
    const { search, status, parentId, level } = req.query;
    
    // Build query
    const query = {};
    if (status && status !== 'all') {
      query.status = status;
    }
    if (parentId !== undefined) {
      query.parentId = parentId === 'null' ? null : parentId;
    }
    if (level !== undefined) {
      query.level = parseInt(level);
    }
    if (search) {
      query.$or = [
        { name: new RegExp(search, 'i') },
        { description: new RegExp(search, 'i') },
        { categoryId: new RegExp(search, 'i') }
      ];
    }

    const categories = await Category.find(query)
      .sort({ level: 1, displayOrder: 1, name: 1 });

    // Đếm số products và children cho mỗi category
    const categoriesWithCount = await Promise.all(
      categories.map(async (cat) => {
        const productCount = await Product.countDocuments({ 
          'category.categoryId': cat.categoryId 
        });
        const childrenCount = await Category.countDocuments({
          parentId: cat.categoryId
        });
        
        // Lấy thông tin parent nếu có
        let parent = null;
        if (cat.parentId) {
          parent = await Category.findOne({ categoryId: cat.parentId })
            .select('categoryId name');
        }
        
        return {
          ...cat.toObject(),
          productCount,
          childrenCount,
          parent
        };
      })
    );

    res.json({ 
      success: true, 
      categories: categoriesWithCount,
      total: categoriesWithCount.length
    });
  } catch (error) {
    console.error('❌ Error fetching categories:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Lỗi khi lấy danh sách danh mục', 
      error: error.message 
    });
  }
};

// Lấy chi tiết một category với thông tin đầy đủ
exports.getCategoryById = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    
    if (!category) {
      return res.status(404).json({ 
        success: false, 
        message: 'Không tìm thấy danh mục' 
      });
    }

    // Đếm số products
    const productCount = await Product.countDocuments({ 
      'category.categoryId': category.categoryId 
    });
    
    // Đếm số children
    const childrenCount = await Category.countDocuments({
      parentId: category.categoryId
    });
    
    // Lấy children
    const children = await Category.find({ parentId: category.categoryId })
      .sort({ displayOrder: 1, name: 1 });
    
    // Lấy parent nếu có
    let parent = null;
    if (category.parentId) {
      parent = await Category.findOne({ categoryId: category.parentId });
    }
    
    // Lấy full path
    const fullPath = await category.getFullPath();

    res.json({ 
      success: true, 
      category: {
        ...category.toObject(),
        productCount,
        childrenCount,
        children,
        parent,
        fullPath: fullPath.map(c => ({ categoryId: c.categoryId, name: c.name }))
      }
    });
  } catch (error) {
    console.error('❌ Error fetching category:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Lỗi khi lấy thông tin danh mục', 
      error: error.message 
    });
  }
};

// Tạo category mới (hỗ trợ đa cấp)
exports.createCategory = async (req, res) => {
  try {
    const { categoryId, name, slug, description, image, status, displayOrder, parentId, icon } = req.body;

    // Validate required fields
    if (!categoryId || !name || !slug) {
      return res.status(400).json({ 
        success: false, 
        message: 'Vui lòng điền đầy đủ thông tin bắt buộc (categoryId, name, slug)' 
      });
    }

    // Check duplicate categoryId or slug
    const existing = await Category.findOne({
      $or: [{ categoryId }, { slug }]
    });

    if (existing) {
      return res.status(400).json({ 
        success: false, 
        message: existing.categoryId === categoryId 
          ? 'Mã danh mục đã tồn tại' 
          : 'Slug đã tồn tại' 
      });
    }
    
    // Validate parent nếu có
    let level = 0;
    let path = categoryId;
    if (parentId) {
      const parent = await Category.findOne({ categoryId: parentId });
      if (!parent) {
        return res.status(400).json({
          success: false,
          message: 'Danh mục cha không tồn tại'
        });
      }
      level = parent.level + 1;
      path = `${parent.path}/${categoryId}`;
      
      // Giới hạn level (tối đa 3 cấp: 0, 1, 2)
      if (level > 2) {
        return res.status(400).json({
          success: false,
          message: 'Chỉ hỗ trợ tối đa 3 cấp danh mục'
        });
      }
    }

    const category = new Category({
      categoryId,
      name,
      slug,
      description: description || '',
      image: image || '',
      icon: icon || '',
      status: status || 'active',
      displayOrder: displayOrder || 0,
      parentId: parentId || null,
      level,
      path
    });

    await category.save();
    
    // Cập nhật productCount của parent
    if (parentId) {
      await Category.findOneAndUpdate(
        { categoryId: parentId },
        { $inc: { productCount: 0 } } // Trigger update
      );
    }

    res.status(201).json({ 
      success: true, 
      message: 'Tạo danh mục thành công', 
      category: {
        ...category.toObject(),
        productCount: 0,
        childrenCount: 0
      }
    });
  } catch (error) {
    console.error('❌ Error creating category:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Lỗi khi tạo danh mục', 
      error: error.message 
    });
  }
};

// Cập nhật category (hỗ trợ chuyển parent)
exports.updateCategory = async (req, res) => {
  try {
    const { name, slug, description, image, status, displayOrder, parentId, icon } = req.body;

    const category = await Category.findById(req.params.id);
    
    if (!category) {
      return res.status(404).json({ 
        success: false, 
        message: 'Không tìm thấy danh mục' 
      });
    }

    // Check slug duplicate (nếu thay đổi)
    if (slug && slug !== category.slug) {
      const existing = await Category.findOne({ slug, _id: { $ne: req.params.id } });
      if (existing) {
        return res.status(400).json({ 
          success: false, 
          message: 'Slug đã tồn tại' 
        });
      }
    }
    
    // Validate parent nếu thay đổi
    if (parentId !== undefined && parentId !== category.parentId) {
      if (parentId) {
        // Không cho phép chọn chính nó làm parent
        if (parentId === category.categoryId) {
          return res.status(400).json({
            success: false,
            message: 'Không thể chọn chính danh mục này làm danh mục cha'
          });
        }
        
        const parent = await Category.findOne({ categoryId: parentId });
        if (!parent) {
          return res.status(400).json({
            success: false,
            message: 'Danh mục cha không tồn tại'
          });
        }
        
        // Không cho phép chọn con/cháu làm parent (tránh circular reference)
        if (parent.path && parent.path.includes(category.categoryId)) {
          return res.status(400).json({
            success: false,
            message: 'Không thể chọn danh mục con làm danh mục cha'
          });
        }
        
        // Kiểm tra level
        if (parent.level >= 2) {
          return res.status(400).json({
            success: false,
            message: 'Chỉ hỗ trợ tối đa 3 cấp danh mục'
          });
        }
      }
      
      // Cập nhật parentId
      category.parentId = parentId || null;
      
      // Cập nhật path và level cho category này và tất cả children
      await Category.updatePath(category.categoryId);
    }

    // Update fields
    if (name) category.name = name;
    if (slug) category.slug = slug;
    if (description !== undefined) category.description = description;
    if (image !== undefined) category.image = image;
    if (icon !== undefined) category.icon = icon;
    if (status) category.status = status;
    if (displayOrder !== undefined) category.displayOrder = displayOrder;

    await category.save();

    // Cập nhật categoryName trong tất cả products
    if (name) {
      await Product.updateMany(
        { 'category.categoryId': category.categoryId },
        { $set: { 'category.categoryName': name } }
      );
    }

    const productCount = await Product.countDocuments({ 
      'category.categoryId': category.categoryId 
    });
    
    const childrenCount = await Category.countDocuments({
      parentId: category.categoryId
    });

    res.json({ 
      success: true, 
      message: 'Cập nhật danh mục thành công', 
      category: {
        ...category.toObject(),
        productCount,
        childrenCount
      }
    });
  } catch (error) {
    console.error('❌ Error updating category:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Lỗi khi cập nhật danh mục', 
      error: error.message 
    });
  }
};

// Xóa category (kiểm tra children)
exports.deleteCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    
    if (!category) {
      return res.status(404).json({ 
        success: false, 
        message: 'Không tìm thấy danh mục' 
      });
    }

    // Kiểm tra children
    const childrenCount = await Category.countDocuments({
      parentId: category.categoryId
    });
    
    if (childrenCount > 0) {
      return res.status(400).json({ 
        success: false, 
        message: `Không thể xóa danh mục này vì có ${childrenCount} danh mục con. Vui lòng xóa các danh mục con trước.` 
      });
    }

    // Kiểm tra xem có products nào đang dùng category này không
    const productCount = await Product.countDocuments({ 
      'category.categoryId': category.categoryId 
    });

    if (productCount > 0) {
      return res.status(400).json({ 
        success: false, 
        message: `Không thể xóa danh mục này vì có ${productCount} sản phẩm đang sử dụng. Vui lòng chuyển các sản phẩm sang danh mục khác trước.` 
      });
    }

    await category.deleteOne();

    res.json({ 
      success: true, 
      message: 'Xóa danh mục thành công' 
    });
  } catch (error) {
    console.error('❌ Error deleting category:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Lỗi khi xóa danh mục', 
      error: error.message 
    });
  }
};

// Lấy stats tổng quan
exports.getCategoryStats = async (req, res) => {
  try {
    const total = await Category.countDocuments();
    const active = await Category.countDocuments({ status: 'active' });
    const inactive = await Category.countDocuments({ status: 'inactive' });
    const byLevel = await Category.aggregate([
      { $group: { _id: '$level', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      success: true,
      stats: { 
        total, 
        active, 
        inactive,
        byLevel: byLevel.map(l => ({ level: l._id, count: l.count }))
      }
    });
  } catch (error) {
    console.error('❌ Error fetching category stats:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Lỗi khi lấy thống kê', 
      error: error.message 
    });
  }
};
