// backend/models/categoryModel.js
const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema(
  {
    categoryId: { 
      type: String, 
      required: true, 
      unique: true,
      trim: true,
      lowercase: true
    },
    name: { 
      type: String, 
      required: true,
      trim: true
    },
    slug: { 
      type: String, 
      required: true, 
      unique: true,
      trim: true,
      lowercase: true
    },
    description: { 
      type: String, 
      default: '',
      trim: true
    },
    image: { 
      type: String, 
      default: ''
    },
    // ⭐ Danh mục đa cấp
    parentId: {
      type: String,
      default: null,
      ref: 'Category'
    },
    level: {
      type: Number,
      default: 0,
      min: 0
    },
    path: {
      type: String,
      default: ''
    },
    status: { 
      type: String, 
      enum: ['active', 'inactive'], 
      default: 'active' 
    },
    displayOrder: {
      type: Number,
      default: 0
    },
    // Metadata
    icon: {
      type: String,
      default: ''
    },
    productCount: {
      type: Number,
      default: 0
    }
  },
  { 
    timestamps: true 
  }
);

// Index cho tìm kiếm và filter
categorySchema.index({ name: 'text', description: 'text' });
categorySchema.index({ parentId: 1, displayOrder: 1 });
categorySchema.index({ path: 1 });
categorySchema.index({ status: 1 });

// Virtual cho danh mục con
categorySchema.virtual('children', {
  ref: 'Category',
  localField: 'categoryId',
  foreignField: 'parentId'
});

// Method: Lấy full path của category
categorySchema.methods.getFullPath = async function() {
  if (!this.parentId) return [this];
  
  const parent = await this.model('Category').findOne({ categoryId: this.parentId });
  if (!parent) return [this];
  
  const parentPath = await parent.getFullPath();
  return [...parentPath, this];
};

// Static method: Lấy tree danh mục
categorySchema.statics.getTree = async function(parentId = null) {
  const categories = await this.find({ parentId, status: 'active' })
    .sort({ displayOrder: 1, name: 1 });
  
  const tree = [];
  for (const cat of categories) {
    const children = await this.getTree(cat.categoryId);
    tree.push({
      ...cat.toObject(),
      children
    });
  }
  return tree;
};

// Static method: Cập nhật path
categorySchema.statics.updatePath = async function(categoryId) {
  const category = await this.findOne({ categoryId });
  if (!category) return;
  
  let path = categoryId;
  let level = 0;
  
  if (category.parentId) {
    const parent = await this.findOne({ categoryId: category.parentId });
    if (parent) {
      path = `${parent.path}/${categoryId}`;
      level = parent.level + 1;
    }
  }
  
  await this.updateOne({ categoryId }, { path, level });
  
  // Cập nhật path cho tất cả con
  const children = await this.find({ parentId: categoryId });
  for (const child of children) {
    await this.updatePath(child.categoryId);
  }
};

module.exports = mongoose.model('Category', categorySchema);
