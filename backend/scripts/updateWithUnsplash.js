const mongoose = require('mongoose');
require('dotenv').config();
const Product = require('./models/productModel');

(async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    // Unsplash Open CDN - ảnh thực tế, không bị chặn
    const productsWithImages = [
      {
        name: 'iPhone 15 Pro Max',
        images: [
          'https://images.unsplash.com/photo-1592286927505-1def25115558?w=400',
          'https://images.unsplash.com/photo-1511707267537-b85faf00021e?w=400',
          'https://images.unsplash.com/photo-1592286927505-1def25115558?w=400'
        ]
      },
      {
        name: 'iPhone 14 Pro',
        images: [
          'https://images.unsplash.com/photo-1511707267537-b85faf00021e?w=400',
          'https://images.unsplash.com/photo-1592286927505-1def25115558?w=400',
          'https://images.unsplash.com/photo-1511707267537-b85faf00021e?w=400'
        ]
      },
      {
        name: 'Samsung Galaxy S24 Ultra',
        images: [
          'https://images.unsplash.com/photo-1511707267537-b85faf00021e?w=400',
          'https://images.unsplash.com/photo-1592286927505-1def25115558?w=400',
          'https://images.unsplash.com/photo-1511707267537-b85faf00021e?w=400'
        ]
      },
      {
        name: 'MacBook Pro 14 M3',
        images: [
          'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400',
          'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=400',
          'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400'
        ]
      },
      {
        name: 'Dell Inspiron 15 3520',
        images: [
          'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=400',
          'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400',
          'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=400'
        ]
      },
      {
        name: 'iPad Pro M2 12.9',
        images: [
          'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=400',
          'https://images.unsplash.com/photo-1518820283438-1e89860b4b82?w=400',
          'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=400'
        ]
      },
      {
        name: 'AirPods Pro Gen 2',
        images: [
          'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400',
          'https://images.unsplash.com/photo-1487215078519-e21cc028cb29?w=400',
          'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400'
        ]
      },
      {
        name: 'Samsung Galaxy Tab S9',
        images: [
          'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=400',
          'https://images.unsplash.com/photo-1518820283438-1e89860b4b82?w=400',
          'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=400'
        ]
      },
      {
        name: 'Apple Watch Series 9',
        images: [
          'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400',
          'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400',
          'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400'
        ]
      }
    ];
    
    console.log('🖼️ Cập nhật ảnh sản phẩm từ Unsplash CDN...\n');
    
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
