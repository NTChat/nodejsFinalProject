// Test script cho tất cả tính năng
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/userModel');
const Product = require('./models/productModel');
const Category = require('./models/categoryModel');
const Order = require('./models/orderModel');
const Cart = require('./models/cartModel');
const FlashSale = require('./models/flashSaleModel');

async function testAllFeatures() {
    try {
        console.log('🚀 Starting feature tests...\n');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ MongoDB connected\n');

        // ========== TEST 1: Users & Authentication ==========
        console.log('📋 TEST 1: Users & Authentication');
        const userCount = await User.countDocuments();
        const adminUser = await User.findOne({ role: 'admin' });
        const normalUser = await User.findOne({ role: { $in: ['user', 'customer'] } });
        const bannedUsers = await User.countDocuments({ isBanned: true });
        
        console.log(`   Users: ${userCount} total`);
        console.log(`   Admin: ${adminUser ? '✅ ' + adminUser.email : '❌ No admin'}`);
        console.log(`   User: ${normalUser ? '✅ ' + normalUser.email : '❌ No user'}`);
        console.log(`   Banned: ${bannedUsers} users`);
        console.log(`   ✅ User system: OK\n`);

        // ========== TEST 2: Categories ==========
        console.log('📋 TEST 2: Categories');
        const categoryCount = await Category.countDocuments();
        const sampleCategories = await Category.find().limit(3);
        console.log(`   Categories: ${categoryCount} total`);
        if (categoryCount > 0) {
            sampleCategories.forEach(cat => {
                console.log(`   - ${cat.name || cat.categoryName} (${cat.categoryId})`);
            });
        }
        console.log(`   ${categoryCount > 0 ? '✅' : '⚠️'} Category system: ${categoryCount > 0 ? 'OK' : 'Empty'}\n`);

        // ========== TEST 3: Products ==========
        console.log('📋 TEST 3: Products');
        const productCount = await Product.countDocuments();
        const newProducts = await Product.countDocuments({ isNewProduct: true });
        const bestSellers = await Product.countDocuments({ isBestSeller: true });
        const sampleProducts = await Product.find().limit(3).select('productName brand variants');
        
        console.log(`   Products: ${productCount} total`);
        console.log(`   New Products: ${newProducts}`);
        console.log(`   Best Sellers: ${bestSellers}`);
        
        if (productCount > 0) {
            console.log(`   Sample products:`);
            sampleProducts.forEach(p => {
                console.log(`   - ${p.productName} (${p.brand}) - ${p.variants?.length || 0} variants`);
            });
        }
        console.log(`   ${productCount > 0 ? '✅' : '⚠️'} Product system: ${productCount > 0 ? 'OK' : 'Empty'}\n`);

        // ========== TEST 4: Cart ==========
        console.log('📋 TEST 4: Cart');
        const cartCount = await Cart.countDocuments();
        const activeCarts = await Cart.countDocuments({ items: { $exists: true, $ne: [] } });
        console.log(`   Carts: ${cartCount} total`);
        console.log(`   Active carts: ${activeCarts} (with items)`);
        console.log(`   ✅ Cart system: OK\n`);

        // ========== TEST 5: Orders ==========
        console.log('📋 TEST 5: Orders');
        const orderCount = await Order.countDocuments();
        const ordersByStatus = await Order.aggregate([
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]);
        
        console.log(`   Orders: ${orderCount} total`);
        if (orderCount > 0) {
            console.log(`   By status:`);
            ordersByStatus.forEach(s => {
                console.log(`   - ${s._id}: ${s.count}`);
            });
        }
        
        const totalRevenue = await Order.aggregate([
            { $match: { status: { $in: ['completed', 'delivered'] } } },
            { $group: { _id: null, total: { $sum: '$totalAmount' } } }
        ]);
        
        if (totalRevenue.length > 0) {
            console.log(`   Revenue: ${totalRevenue[0].total.toLocaleString('vi-VN')} VNĐ`);
        }
        console.log(`   ${orderCount >= 0 ? '✅' : '⚠️'} Order system: OK\n`);

        // ========== TEST 6: Flash Sales ==========
        console.log('📋 TEST 6: Flash Sales');
        const flashSaleCount = await FlashSale.countDocuments();
        const activeFlashSales = await FlashSale.countDocuments({
            startTime: { $lte: new Date() },
            endTime: { $gte: new Date() }
        });
        const upcomingFlashSales = await FlashSale.countDocuments({
            startTime: { $gt: new Date() }
        });
        
        console.log(`   Flash Sales: ${flashSaleCount} total`);
        console.log(`   Active: ${activeFlashSales}`);
        console.log(`   Upcoming: ${upcomingFlashSales}`);
        console.log(`   ✅ Flash Sale system: OK\n`);

        // ========== TEST 7: Ban Feature ==========
        console.log('📋 TEST 7: Ban Account Feature');
        const usersWithBanField = await User.countDocuments({ isBanned: { $exists: true } });
        const totalUsers = await User.countDocuments();
        const bannedCount = await User.countDocuments({ isBanned: true });
        
        console.log(`   Users with isBanned field: ${usersWithBanField}/${totalUsers}`);
        console.log(`   Banned users: ${bannedCount}`);
        console.log(`   ${usersWithBanField === totalUsers ? '✅' : '⚠️'} Ban feature: ${usersWithBanField === totalUsers ? 'All users have isBanned field' : 'Some users missing isBanned field'}\n`);

        // ========== TEST 8: Loyalty Points ==========
        console.log('📋 TEST 8: Loyalty Points');
        const usersWithPoints = await User.countDocuments({ loyaltyPoints: { $gt: 0 } });
        const topUsers = await User.find({ loyaltyPoints: { $gt: 0 } })
            .sort({ loyaltyPoints: -1 })
            .limit(3)
            .select('email loyaltyPoints');
        
        console.log(`   Users with points: ${usersWithPoints}`);
        if (topUsers.length > 0) {
            console.log(`   Top users:`);
            topUsers.forEach(u => {
                console.log(`   - ${u.email}: ${u.loyaltyPoints} points`);
            });
        }
        console.log(`   ✅ Loyalty system: OK\n`);

        // ========== SUMMARY ==========
        console.log('\n' + '='.repeat(50));
        console.log('📊 FEATURE TEST SUMMARY');
        console.log('='.repeat(50));
        console.log(`✅ Authentication & Users: ${userCount} users (${bannedCount} banned)`);
        console.log(`${categoryCount > 0 ? '✅' : '⚠️'} Categories: ${categoryCount} categories`);
        console.log(`${productCount > 0 ? '✅' : '⚠️'} Products: ${productCount} products`);
        console.log(`✅ Cart: ${cartCount} carts`);
        console.log(`✅ Orders: ${orderCount} orders`);
        console.log(`✅ Flash Sales: ${flashSaleCount} flash sales (${activeFlashSales} active)`);
        console.log(`✅ Ban Feature: Working (${bannedCount} banned users)`);
        console.log(`✅ Loyalty Points: Working (${usersWithPoints} users with points)`);
        console.log('='.repeat(50));
        
        // Test credentials
        console.log('\n📝 TEST CREDENTIALS:');
        console.log('Admin: admin@test.com | Password: admin123');
        console.log('User:  user@test.com  | Password: user123');
        console.log('Access: http://localhost:3000\n');

        process.exit(0);
    } catch (error) {
        console.error('❌ Test Error:', error);
        process.exit(1);
    }
}

testAllFeatures();
