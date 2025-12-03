const mongoose = require('mongoose');
const User = require('./models/userModel');
const Category = require('./models/categoryModel');
const Product = require('./models/productModel');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://admin:phoneworld123@localhost:27017/phoneworld?authSource=admin';

async function checkAllData() {
  try {
    console.log('🔍 === KIỂM TRA DỮ LIỆU DATABASE ===\n');
    
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Đã kết nối MongoDB\n');

    // Check Users
    console.log('👤 USERS:');
    const users = await User.find({}).select('username email role isVerified');
    console.log(`   Tổng số: ${users.length} users`);
    users.forEach(user => {
      console.log(`   - ${user.username} (${user.email}) - Role: ${user.role} - Verified: ${user.isVerified}`);
    });
    console.log('');

    // Check Categories
    console.log('📂 CATEGORIES:');
    const categories = await Category.find({}).select('categoryId name level parentId productCount');
    console.log(`   Tổng số: ${categories.length} categories`);
    
    const level0 = categories.filter(c => c.level === 0);
    const level1 = categories.filter(c => c.level === 1);
    const level2 = categories.filter(c => c.level === 2);
    
    console.log(`   Level 0: ${level0.length} categories`);
    level0.forEach(cat => {
      console.log(`   📁 ${cat.icon || ''} ${cat.name} (${cat.categoryId}) - ${cat.productCount || 0} products`);
    });
    
    console.log(`\n   Level 1: ${level1.length} categories`);
    level1.slice(0, 5).forEach(cat => {
      console.log(`      └─ ${cat.icon || ''} ${cat.name} (${cat.categoryId}) - ${cat.productCount || 0} products`);
    });
    if (level1.length > 5) console.log(`      ... và ${level1.length - 5} categories khác`);
    
    if (level2.length > 0) {
      console.log(`\n   Level 2: ${level2.length} categories`);
      level2.forEach(cat => {
        console.log(`         └─ ${cat.icon || ''} ${cat.name} (${cat.categoryId}) - ${cat.productCount || 0} products`);
      });
    }
    console.log('');

    // Check Products
    console.log('📦 PRODUCTS:');
    const products = await Product.find({})
      .select('name brand category variants')
      .populate('category', 'name categoryId');
    
    console.log(`   Tổng số: ${products.length} products\n`);
    
    products.forEach(product => {
      const totalStock = product.variants?.reduce((sum, v) => sum + (v.stock || 0), 0) || 0;
      const categoryName = product.category?.name || 'N/A';
      console.log(`   📱 ${product.name}`);
      console.log(`      Brand: ${product.brand}`);
      console.log(`      Category: ${categoryName}`);
      console.log(`      Variants: ${product.variants?.length || 0}`);
      console.log(`      Total Stock: ${totalStock}\n`);
    });

    // Summary
    console.log('📊 === TỔNG KẾT ===');
    console.log(`   Users: ${users.length}`);
    console.log(`   Categories: ${categories.length} (Level 0: ${level0.length}, Level 1: ${level1.length}, Level 2: ${level2.length})`);
    console.log(`   Products: ${products.length}`);
    
    const adminUsers = users.filter(u => u.role === 'admin');
    console.log(`\n   👑 Admin accounts: ${adminUsers.length}`);
    adminUsers.forEach(admin => {
      console.log(`      - ${admin.username} (${admin.email})`);
    });

    await mongoose.connection.close();
    console.log('\n✅ Đã đóng kết nối MongoDB');
    
  } catch (error) {
    console.error('❌ Lỗi:', error.message);
    process.exit(1);
  }
}

checkAllData();
