// Direct MongoDB Update - No API
const mongoose = require('mongoose');
require('dotenv').config();

const Product = require('./models/productModel');

const productImages = {
    'iPhone 15 Pro Max': [
        'https://cdn.tgdd.vn/Products/Images/42/305658/iphone-15-pro-max-blue-thumbnew-600x600.jpg',
        'https://cdn.tgdd.vn/Products/Images/42/305658/iphone-15-pro-max-1-1.jpg',
        'https://cdn.tgdd.vn/Products/Images/42/305658/iphone-15-pro-max-2.jpg'
    ],
    'Samsung Galaxy S24 Ultra': [
        'https://cdn.tgdd.vn/Products/Images/42/307174/samsung-galaxy-s24-ultra-grey-thumbnew-600x600.jpg',
        'https://cdn.tgdd.vn/Products/Images/42/307174/samsung-galaxy-s24-ultra-1-1.jpg',
        'https://cdn.tgdd.vn/Products/Images/42/307174/samsung-galaxy-s24-ultra-2.jpg'
    ],
    'MacBook Pro M3': [
        'https://cdn.tgdd.vn/Products/Images/44/309016/macbook-pro-14-inch-m3-2023-thumbnew-600x600.jpg',
        'https://cdn.tgdd.vn/Products/Images/44/309016/macbook-pro-14-inch-m3-2023-1.jpg',
        'https://cdn.tgdd.vn/Products/Images/44/309016/macbook-pro-14-inch-m3-2023-2.jpg'
    ],
    'AirPods Pro 2': [
        'https://cdn.tgdd.vn/Products/Images/54/289780/tai-nghe-bluetooth-airpods-pro-gen-2-usb-c-charge-apple-thumbnew-600x600.jpg',
        'https://cdn.tgdd.vn/Products/Images/54/289780/tai-nghe-bluetooth-airpods-pro-gen-2-usb-c-charge-apple-1.jpg',
        'https://cdn.tgdd.vn/Products/Images/54/289780/tai-nghe-bluetooth-airpods-pro-gen-2-usb-c-charge-apple-2.jpg'
    ],
    'iPad Air M2': [
        'https://cdn.tgdd.vn/Products/Images/522/325530/ipad-pro-m2-12-9-wifi-cellular-512gb-2024-thumbnew-600x600.jpg',
        'https://cdn.tgdd.vn/Products/Images/522/325530/ipad-pro-m2-12-9-wifi-cellular-512gb-2024-1.jpg',
        'https://cdn.tgdd.vn/Products/Images/522/325530/ipad-pro-m2-12-9-wifi-cellular-512gb-2024-2.jpg'
    ]
};

async function directUpdate() {
    try {
        console.log('\n📸 === DIRECT MONGODB UPDATE ===\n');
        
        console.log('1️⃣ Connecting to MongoDB...');
        console.log('   URI:', process.env.MONGODB_URI);
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');
        
        console.log('\n2️⃣ Updating products...\n');
        
        for (const [productName, images] of Object.entries(productImages)) {
            const product = await Product.findOne({ productName: { $regex: productName.split(' ')[0], $options: 'i' } });
            
            if (product) {
                console.log(`📸 ${productName}`);
                console.log(`   Before: ${product.images[0]?.substring(0, 40)}`);
                
                product.images = images;
                await product.save();
                
                const updated = await Product.findById(product._id);
                console.log(`   After:  ${updated.images[0]?.substring(0, 40)}`);
                console.log(`   ✅ ${updated.images.length} images saved`);
            } else {
                console.log(`❌ ${productName} not found`);
            }
        }
        
        console.log('\n✅ === ALL UPDATES COMPLETE ===\n');
        
        // Verify
        const count = await Product.countDocuments({ 'images.0': /cdn\.tgdd\.vn/ });
        console.log(`✅ ${count} products now have TGDD images\n`);
        
        await mongoose.connection.close();
        
    } catch (error) {
        console.error('\n❌ Error:', error.message);
        process.exit(1);
    }
}

directUpdate();
