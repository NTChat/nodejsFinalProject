const mongoose = require('mongoose');
require('dotenv').config();
const Product = require('./models/productModel');

(async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    // Picsum Photos - Free CDN, không cần API key
    // Format: https://picsum.photos/{width}/{height}?random={id}
    
    const productsWithImages = [
      {
        name: 'iPhone 15 Pro Max',
        images: [
          'https://picsum.photos/400/400?random=101',
          'https://picsum.photos/400/400?random=102',
          'https://picsum.photos/400/400?random=103'
        ]
      },
      {
        name: 'iPhone 14 Pro',
        images: [
          'https://picsum.photos/400/400?random=104',
          'https://picsum.photos/400/400?random=105',
          'https://picsum.photos/400/400?random=106'
        ]
      },
      {
        name: 'Samsung Galaxy S24 Ultra',
        images: [
          'https://picsum.photos/400/400?random=107',
          'https://picsum.photos/400/400?random=108',
          'https://picsum.photos/400/400?random=109'
        ]
      },
      {
        name: 'MacBook Pro 14 M3',
        images: [
          'https://picsum.photos/400/400?random=110',
          'https://picsum.photos/400/400?random=111',
          'https://picsum.photos/400/400?random=112'
        ]
      },
      {
        name: 'Dell Inspiron 15 3520',
        images: [
          'https://picsum.photos/400/400?random=113',
          'https://picsum.photos/400/400?random=114',
          'https://picsum.photos/400/400?random=115'
        ]
      },
      {
        name: 'iPad Pro M2 12.9',
        images: [
          'https://picsum.photos/400/400?random=116',
          'https://picsum.photos/400/400?random=117',
          'https://picsum.photos/400/400?random=118'
        ]
      },
      {
        name: 'AirPods Pro Gen 2',
        images: [
          'https://picsum.photos/400/400?random=119',
          'https://picsum.photos/400/400?random=120',
          'https://picsum.photos/400/400?random=121'
        ]
      },
      {
        name: 'Samsung Galaxy Tab S9',
        images: [
          'https://picsum.photos/400/400?random=122',
          'https://picsum.photos/400/400?random=123',
          'https://picsum.photos/400/400?random=124'
        ]
      },
      {
        name: 'Apple Watch Series 9',
        images: [
          'https://picsum.photos/400/400?random=125',
          'https://picsum.photos/400/400?random=126',
          'https://picsum.photos/400/400?random=127'
        ]
      }
    ];
    
    console.log('🖼️  Cập nhật ảnh sản phẩm từ Picsum Photos CDN...\n');
    
    for (const prod of productsWithImages) {
      const result = await Product.findOneAndUpdate(
        { productName: prod.name },
        { $set: { images: prod.images } },
        { new: true }
      );
      
      if (result) {
        console.log(`✅ ${prod.name} - ${prod.images.length} ảnh`);
      } else {
        console.log(`⚠️  ${prod.name} - không tìm thấy`);
      }
    }
    
    console.log('\n✅ Hoàn thành!');
    await mongoose.connection.close();
  } catch (err) {
    console.error('❌ Error:', err.message);
  }
})();
