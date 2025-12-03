const mongoose = require('mongoose');
const Product = require('./models/productModel');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://admin:phoneworld123@localhost:27017/phoneworld?authSource=admin';

async function testBackendAPI() {
  try {
    console.log('🧪 === TEST BACKEND API RESPONSE ===\n');
    
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Đã kết nối MongoDB\n');

    // Simulate frontend request - getProducts
    const products = await Product.find({})
      .select('productName productId brand images variants category')
      .limit(3)
      .lean();

    console.log('📦 API Would return (first 3 products):');
    console.log(JSON.stringify(products, null, 2));

    console.log('\n🔍 === KIỂM TRA CHI TIẾT ===');
    products.forEach((p, idx) => {
      console.log(`\n${idx + 1}. ${p.productName}`);
      console.log(`   ID: ${p.productId}`);
      console.log(`   Images field exists: ${!!p.images}`);
      console.log(`   Images is array: ${Array.isArray(p.images)}`);
      console.log(`   Images length: ${p.images?.length || 0}`);
      console.log(`   First image: ${p.images?.[0] || 'KHÔNG CÓ'}`);
    });

    // Test aggregation pipeline (như controller dùng)
    console.log('\n\n📊 === TEST AGGREGATION PIPELINE (NHƯ CONTROLLER) ===\n');
    
    const aggregated = await Product.aggregate([
      { $limit: 3 },
      {
        $project: {
          productName: 1,
          productId: 1,
          brand: 1,
          images: 1,
          category: 1,
          variants: 1
        }
      }
    ]);

    console.log('Aggregation result:');
    console.log(JSON.stringify(aggregated, null, 2));

    await mongoose.connection.close();
    console.log('\n✅ Đã đóng kết nối MongoDB');
    
  } catch (error) {
    console.error('❌ Lỗi:', error.message);
    process.exit(1);
  }
}

testBackendAPI();
