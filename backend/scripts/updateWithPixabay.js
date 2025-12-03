// backend/updateWithPixabay.js
require('dotenv').config();
const mongoose = require('mongoose');
const { connectDB } = require('./config/dbConnection');
const Product = require('./models/productModel');

connectDB();

// Ảnh product từ Pixabay (free, opensource)
// Format: https://pixabay.com/get/{photo_id}/
const productImages = {
  'iPhone 15 Pro Max': [
    'https://cdn.pixabay.com/photo/2020/09/28/09/43/iphone-5607164_640.jpg',
    'https://cdn.pixabay.com/photo/2021/08/04/13/06/smartphone-6521720_640.jpg',
    'https://cdn.pixabay.com/photo/2016/11/19/14/00/code-1839406_640.jpg'
  ],
  'iPhone 14 Pro': [
    'https://cdn.pixabay.com/photo/2021/08/04/13/06/smartphone-6521720_640.jpg',
    'https://cdn.pixabay.com/photo/2020/09/28/09/43/iphone-5607164_640.jpg',
    'https://cdn.pixabay.com/photo/2016/11/19/14/00/code-1839406_640.jpg'
  ],
  'Samsung Galaxy S24 Ultra': [
    'https://cdn.pixabay.com/photo/2021/08/04/13/06/smartphone-6521720_640.jpg',
    'https://cdn.pixabay.com/photo/2020/09/28/09/43/iphone-5607164_640.jpg',
    'https://cdn.pixabay.com/photo/2022/04/04/11/53/mobile-phone-7111090_640.jpg'
  ],
  'MacBook Pro 14 M3': [
    'https://cdn.pixabay.com/photo/2015/12/11/02/36/laptop-1089358_640.jpg',
    'https://cdn.pixabay.com/photo/2016/11/21/12/42/apple-1646504_640.jpg',
    'https://cdn.pixabay.com/photo/2015/04/23/17/41/apple-apple-macbook-pro-738316_640.jpg'
  ],
  'Dell Inspiron 15 3520': [
    'https://cdn.pixabay.com/photo/2015/12/11/02/36/laptop-1089358_640.jpg',
    'https://cdn.pixabay.com/photo/2016/11/21/12/42/apple-1646504_640.jpg',
    'https://cdn.pixabay.com/photo/2017/08/14/17/48/computer-2637999_640.jpg'
  ],
  'iPad Pro M2 12.9': [
    'https://cdn.pixabay.com/photo/2021/08/04/13/06/smartphone-6521720_640.jpg',
    'https://cdn.pixabay.com/photo/2017/08/14/17/48/computer-2637999_640.jpg',
    'https://cdn.pixabay.com/photo/2020/09/28/09/43/iphone-5607164_640.jpg'
  ],
  'AirPods Pro Gen 2': [
    'https://cdn.pixabay.com/photo/2021/08/04/13/06/smartphone-6521720_640.jpg',
    'https://cdn.pixabay.com/photo/2020/09/28/09/43/iphone-5607164_640.jpg',
    'https://cdn.pixabay.com/photo/2016/11/19/14/00/code-1839406_640.jpg'
  ],
  'Samsung Galaxy Tab S9': [
    'https://cdn.pixabay.com/photo/2017/08/14/17/48/computer-2637999_640.jpg',
    'https://cdn.pixabay.com/photo/2021/08/04/13/06/smartphone-6521720_640.jpg',
    'https://cdn.pixabay.com/photo/2020/09/28/09/43/iphone-5607164_640.jpg'
  ],
  'Apple Watch Series 9': [
    'https://cdn.pixabay.com/photo/2021/08/04/13/06/smartphone-6521720_640.jpg',
    'https://cdn.pixabay.com/photo/2020/09/28/09/43/iphone-5607164_640.jpg',
    'https://cdn.pixabay.com/photo/2016/11/19/14/00/code-1839406_640.jpg'
  ]
};

async function updateProducts() {
  try {
    console.log('🖼️  Cập nhật ảnh từ Pixabay CDN cho tất cả sản phẩm...\n');

    for (const [productName, images] of Object.entries(productImages)) {
      const result = await Product.findOneAndUpdate(
        { productName: productName },
        { images: images },
        { new: true }
      );

      if (result) {
        console.log(`✅ ${productName}`);
        console.log(`   📸 ${images[0].substring(0, 60)}...\n`);
      } else {
        console.log(`⚠️  Sản phẩm không tìm thấy: ${productName}\n`);
      }
    }

    console.log('✅ Hoàn thành cập nhật từ Pixabay!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Lỗi:', error.message);
    process.exit(1);
  }
}

updateProducts();
