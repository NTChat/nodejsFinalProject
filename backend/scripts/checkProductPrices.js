const mongoose = require('mongoose');
const Product = require('./models/productModel');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://admin:phoneworld123@localhost:27017/phoneworld?authSource=admin';

async function checkProductPrices() {
  try {
    console.log('🔍 === KIỂM TRA GIÁ SẢN PHẨM ===\n');
    
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Đã kết nối MongoDB\n');

    const products = await Product.find({}).select('productName variants');
    
    console.log(`📦 Tổng số sản phẩm: ${products.length}\n`);

    products.forEach((product, index) => {
      console.log(`${index + 1}. ${product.productName || 'N/A'}`);
      console.log(`   Product ID: ${product._id}`);
      
      if (product.variants && product.variants.length > 0) {
        console.log(`   Variants: ${product.variants.length}`);
        product.variants.forEach((variant, vIndex) => {
          console.log(`      ${vIndex + 1}. ${variant.name}`);
          console.log(`         - Giá: ${variant.price?.toLocaleString() || 'N/A'}₫`);
          console.log(`         - Giá cũ: ${variant.oldPrice?.toLocaleString() || '0'}₫`);
          console.log(`         - Giảm: ${variant.discount || 0}%`);
          console.log(`         - Stock: ${variant.stock || 0}`);
        });
      } else {
        console.log(`   ⚠️ Không có variants`);
      }
      console.log('');
    });

    await mongoose.connection.close();
    console.log('✅ Đã đóng kết nối MongoDB');
    
  } catch (error) {
    console.error('❌ Lỗi:', error.message);
    process.exit(1);
  }
}

checkProductPrices();
