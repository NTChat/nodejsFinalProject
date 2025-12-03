// backend/updateSpecificProducts.js
require('dotenv').config();
const mongoose = require('mongoose');
const { connectDB } = require('./config/dbConnection');
const Product = require('./models/productModel');

connectDB();

// Ảnh thật cho laptop từ Pexels (product images)
const productImages = {
  'Dell Inspiron 15 3520': [
    'https://images.pexels.com/photos/18105/pexels-photo.jpeg?auto=compress&cs=tinysrgb&w=400',
    'https://images.pexels.com/photos/7974/pexels-photo.jpeg?auto=compress&cs=tinysrgb&w=400',
    'https://images.pexels.com/photos/4195326/pexels-photo-4195326.jpeg?auto=compress&cs=tinysrgb&w=400'
  ],
  'MacBook Pro 14 M3': [
    'https://images.pexels.com/photos/7974/pexels-photo.jpeg?auto=compress&cs=tinysrgb&w=400',
    'https://images.pexels.com/photos/18105/pexels-photo.jpeg?auto=compress&cs=tinysrgb&w=400',
    'https://images.pexels.com/photos/4195326/pexels-photo-4195326.jpeg?auto=compress&cs=tinysrgb&w=400'
  ]
};

async function updateProducts() {
  try {
    console.log('🖥️  Cập nhật ảnh laptop cho 2 sản phẩm...\n');

    for (const [productName, images] of Object.entries(productImages)) {
      const result = await Product.findOneAndUpdate(
        { productName: productName },
        { images: images },
        { new: true }
      );

      if (result) {
        console.log(`✅ ${productName}`);
        console.log(`   📸 ${images[0]}\n`);
      } else {
        console.log(`⚠️  Sản phẩm không tìm thấy: ${productName}\n`);
      }
    }

    console.log('✅ Hoàn thành cập nhật!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Lỗi:', error.message);
    process.exit(1);
  }
}

updateProducts();
