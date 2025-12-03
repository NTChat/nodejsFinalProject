const mongoose = require('mongoose');
const Product = require('./models/productModel');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://admin:phoneworld123@localhost:27017/phoneworld?authSource=admin';

async function checkImages() {
  try {
    console.log('🖼️  === KIỂM TRA HÌNH ẢNH SẢN PHẨM ===\n');
    
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Đã kết nối MongoDB\n');

    const products = await Product.find({}).select('productName images');
    
    console.log(`📦 Tổng số sản phẩm: ${products.length}\n`);

    products.forEach((product, index) => {
      console.log(`${index + 1}. ${product.productName || 'N/A'}`);
      
      if (product.images && product.images.length > 0) {
        console.log(`   ✅ Có ${product.images.length} ảnh:`);
        product.images.forEach((img, idx) => {
          console.log(`      ${idx + 1}. ${img}`);
        });
      } else {
        console.log(`   ❌ KHÔNG CÓ ẢNH`);
      }
      console.log('');
    });

    // Tổng kết
    const withImages = products.filter(p => p.images && p.images.length > 0);
    const withoutImages = products.filter(p => !p.images || p.images.length === 0);
    
    console.log('📊 === TỔNG KẾT ===');
    console.log(`   ✅ Có ảnh: ${withImages.length} products`);
    console.log(`   ❌ Không có ảnh: ${withoutImages.length} products`);

    await mongoose.connection.close();
    console.log('\n✅ Đã đóng kết nối MongoDB');
    
  } catch (error) {
    console.error('❌ Lỗi:', error.message);
    process.exit(1);
  }
}

checkImages();
