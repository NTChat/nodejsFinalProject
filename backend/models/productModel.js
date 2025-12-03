// backend/models/productModel.js
const mongoose = require('mongoose');

const variantSchema = new mongoose.Schema(
  {
    variantId: { type: String, required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    oldPrice: { type: Number, default: 0, min: 0 },
    discount: { type: Number, default: 0, min: 0, max: 100 },
    stock: { type: Number, default: 0, min: 0 },
    images: [{ type: String, default: '' }], // Ảnh riêng cho biến thể
  },
  { _id: false }
);

const commentSchema = new mongoose.Schema(
  {
    name: { type: String, default: 'Guest', trim: true },
    comment: { type: String, required: true, trim: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    userAvatar: { type: String, default: null },
    createdAt: { type: Date, default: Date.now }
  },
  { _id: false }
);

const ratingSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    stars: { type: Number, min: 1, max: 5, required: true },
    createdAt: { type: Date, default: Date.now }
  },
  { _id: false }
);

const productSchema = new mongoose.Schema(
  {
    // “slug” public của bạn
    productId: { type: String, index: true }, // ví dụ "laptop01"
    productName: { type: String, required: true },
    brand: { type: String, default: '' },
    productDescription: { type: String, default: '' },

    category: {
      categoryId: { type: String, required: true },
      categoryName: { type: String, default: '' },
    },

    images: [{ type: String }],
    status: { type: String, enum: ['available', 'unavailable'], default: 'available' },
    isNewProduct: { type: Boolean, default: false },
    isBestSeller: { type: Boolean, default: false },

    variants: { type: [variantSchema], default: [] },

    // Social
    comments: { type: [commentSchema], default: [] },
    ratings: { type: [ratingSchema], default: [] },
    avgRating: { type: Number, default: 0 },
    ratingsCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

productSchema.methods.recomputeRating = function () {
  if (!this.ratings?.length) {
    this.avgRating = 0;
    this.ratingsCount = 0;
    return;
  }
  this.ratingsCount = this.ratings.length;
  const sum = this.ratings.reduce((s, r) => s + (r.stars || 0), 0);
  this.avgRating = Math.round((sum / this.ratingsCount) * 10) / 10;
};

// text search (mục 14)
productSchema.index({ productName: 'text', productDescription: 'text', brand: 'text' });

module.exports = mongoose.model('Product', productSchema);
