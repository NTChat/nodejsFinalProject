// TGDD Data Crawler - Lấy sản phẩm thực từ TGDD API
const axios = require('axios');
const mongoose = require('mongoose');
require('dotenv').config();

const Product = require('./models/productModel');
const Category = require('./models/categoryModel');

// Danh sách sản phẩm mẫu từ TGDD với category mapping
const tgddProducts = [
  // iPhone
  {
    categoryId: 'iphone',
    productName: 'iPhone 15 Pro Max',
    brand: 'Apple',
    description: 'iPhone 15 Pro Max 256GB - Titan tự nhiên. Chip A17 Pro, Camera 48MP, màn hình Super Retina XDR 6.7 inch',
    images: [
      'https://cdn.tgdd.vn/Products/Images/42/305658/iphone-15-pro-max-blue-thumbnew-600x600.jpg',
      'https://cdn.tgdd.vn/Products/Images/42/305658/iphone-15-pro-max-1-1.jpg',
      'https://cdn.tgdd.vn/Products/Images/42/305658/iphone-15-pro-max-2.jpg'
    ],
    variants: [
      { name: '256GB - Titan Tự nhiên', price: 28490000, oldPrice: 29990000, discount: 5, stock: 50 },
      { name: '512GB - Titan Xanh', price: 33240000, oldPrice: 34990000, discount: 5, stock: 30 },
      { name: '1TB - Titan Trắng', price: 38740000, oldPrice: 39990000, discount: 3, stock: 20 }
    ],
    isNewProduct: true,
    isBestSeller: true
  },
  {
    categoryId: 'iphone',
    productName: 'iPhone 14 Pro',
    brand: 'Apple',
    description: 'iPhone 14 Pro 128GB - Tím. Chip A16 Bionic, Dynamic Island, Camera 48MP Pro',
    images: [
      'https://cdn.tgdd.vn/Products/Images/42/289700/iPhone-14-pro-vang-1.jpg',
      'https://cdn.tgdd.vn/Products/Images/42/289700/iPhone-14-pro-vang-2.jpg',
      'https://cdn.tgdd.vn/Products/Images/42/289700/iPhone-14-pro-vang-3.jpg'
    ],
    variants: [
      { name: '128GB - Tím', price: 24490000, oldPrice: 27990000, discount: 12, stock: 40 },
      { name: '256GB - Vàng', price: 27790000, oldPrice: 30990000, discount: 10, stock: 35 }
    ],
    isNewProduct: false,
    isBestSeller: true
  },
  
  // Samsung
  {
    categoryId: 'samsung',
    productName: 'Samsung Galaxy S24 Ultra',
    brand: 'Samsung',
    description: 'Samsung Galaxy S24 Ultra 12GB 256GB - Xám Titan. Snapdragon 8 Gen 3, S Pen tích hợp, Camera AI 200MP',
    images: [
      'https://cdn.tgdd.vn/Products/Images/42/307174/samsung-galaxy-s24-ultra-grey-thumbnew-600x600.jpg',
      'https://cdn.tgdd.vn/Products/Images/42/307174/samsung-galaxy-s24-ultra-1-1.jpg',
      'https://cdn.tgdd.vn/Products/Images/42/307174/samsung-galaxy-s24-ultra-2.jpg'
    ],
    variants: [
      { name: '256GB - Xám Titan', price: 27990000, oldPrice: 31990000, discount: 12, stock: 45 },
      { name: '512GB - Tím', price: 33990000, oldPrice: 36990000, discount: 8, stock: 30 }
    ],
    isNewProduct: true,
    isBestSeller: true
  },
  
  // MacBook
  {
    categoryId: 'macbook',
    productName: 'MacBook Pro 14 M3',
    brand: 'Apple',
    description: 'MacBook Pro 14 inch M3 8GB 512GB - Xám không gian. Chip M3 8 nhân, GPU 10 nhân, màn hình Liquid Retina XDR',
    images: [
      'https://cdn.tgdd.vn/Products/Images/44/309016/macbook-pro-14-inch-m3-2023-thumbnew-600x600.jpg',
      'https://cdn.tgdd.vn/Products/Images/44/309016/macbook-pro-14-inch-m3-2023-1.jpg',
      'https://cdn.tgdd.vn/Products/Images/44/309016/macbook-pro-14-inch-m3-2023-2.jpg'
    ],
    variants: [
      { name: '8GB - 512GB SSD', price: 38990000, oldPrice: 40990000, discount: 5, stock: 20 },
      { name: '16GB - 1TB SSD', price: 48990000, oldPrice: 51990000, discount: 6, stock: 15 }
    ],
    isNewProduct: true,
    isBestSeller: true
  },
  
  // Dell Laptop
  {
    categoryId: 'dell',
    productName: 'Dell Inspiron 15 3520',
    brand: 'Dell',
    description: 'Laptop Dell Inspiron 15 3520 i5 1235U/16GB/512GB/120Hz/Win11. Hiệu năng Intel Gen 12, màn hình 120Hz mượt mà',
    images: [
      'https://cdn.tgdd.vn/Products/Images/44/309016/dell-inspiron-15-3520-i5-thumbnew-600x600.jpg',
      'https://cdn.tgdd.vn/Products/Images/44/285070/laptop-dell-inspiron-15-3520-i5-1.jpg',
      'https://cdn.tgdd.vn/Products/Images/44/285070/laptop-dell-inspiron-15-3520-i5-2.jpg'
    ],
    variants: [
      { name: 'i5-1235U/16GB/512GB', price: 15990000, oldPrice: 18990000, discount: 16, stock: 30 }
    ],
    isNewProduct: false,
    isBestSeller: true
  },
  
  // iPad
  {
    categoryId: 'ipad',
    productName: 'iPad Pro M2 12.9',
    brand: 'Apple',
    description: 'iPad Pro M2 12.9 inch WiFi Cellular 512GB - Xám không gian. Chip M2 mạnh mẽ, màn hình Liquid Retina XDR',
    images: [
      'https://cdn.tgdd.vn/Products/Images/522/325530/ipad-pro-m2-12-9-wifi-cellular-512gb-2024-thumbnew-600x600.jpg',
      'https://cdn.tgdd.vn/Products/Images/522/325530/ipad-pro-m2-12-9-wifi-cellular-512gb-2024-1.jpg',
      'https://cdn.tgdd.vn/Products/Images/522/325530/ipad-pro-m2-12-9-wifi-cellular-512gb-2024-2.jpg'
    ],
    variants: [
      { name: 'WiFi 256GB', price: 28990000, oldPrice: 30990000, discount: 6, stock: 25 },
      { name: 'WiFi + Cellular 512GB', price: 38990000, oldPrice: 41990000, discount: 7, stock: 15 }
    ],
    isNewProduct: true,
    isBestSeller: false
  },
  
  // AirPods
  {
    categoryId: 'airpods',
    productName: 'AirPods Pro Gen 2',
    brand: 'Apple',
    description: 'Tai nghe Bluetooth AirPods Pro Gen 2 USB-C Charge - Trắng. Chip H2, chống ồn chủ động nâng cấp',
    images: [
      'https://cdn.tgdd.vn/Products/Images/54/289780/tai-nghe-bluetooth-airpods-pro-gen-2-usb-c-charge-apple-thumbnew-600x600.jpg',
      'https://cdn.tgdd.vn/Products/Images/54/289780/tai-nghe-bluetooth-airpods-pro-gen-2-usb-c-charge-apple-1.jpg',
      'https://cdn.tgdd.vn/Products/Images/54/289780/tai-nghe-bluetooth-airpods-pro-gen-2-usb-c-charge-apple-2.jpg'
    ],
    variants: [
      { name: 'USB-C', price: 5990000, oldPrice: 6490000, discount: 8, stock: 100 }
    ],
    isNewProduct: true,
    isBestSeller: true
  },
  
  // Samsung Tab
  {
    categoryId: 'samsung-tab',
    productName: 'Samsung Galaxy Tab S9',
    brand: 'Samsung',
    description: 'Samsung Galaxy Tab S9 11 inch WiFi - Xám Graphite. Snapdragon 8 Gen 2, màn hình Dynamic AMOLED 2X 120Hz',
    images: [
      'https://cdn.tgdd.vn/Products/Images/522/306231/samsung-galaxy-tab-s9-thumbnew-600x600.jpg',
      'https://cdn.tgdd.vn/Products/Images/522/306231/samsung-galaxy-tab-s9-1.jpg',
      'https://cdn.tgdd.vn/Products/Images/522/306231/samsung-galaxy-tab-s9-2.jpg'
    ],
    variants: [
      { name: '8GB - 128GB WiFi', price: 18990000, oldPrice: 20990000, discount: 10, stock: 30 },
      { name: '12GB - 256GB 5G', price: 22990000, oldPrice: 24990000, discount: 8, stock: 20 }
    ],
    isNewProduct: true,
    isBestSeller: false
  },
  
  // Apple Watch
  {
    categoryId: 'apple-watch',
    productName: 'Apple Watch Series 9',
    brand: 'Apple',
    description: 'Apple Watch Series 9 GPS 41mm - Viền nhôm dây cao su. Chip S9, màn hình sáng hơn 2x, Double Tap',
    images: [
      'https://cdn.tgdd.vn/Products/Images/7077/309727/apple-watch-s9-gps-41mm-vien-nhom-day-cao-su-thumbnew-600x600.jpg',
      'https://cdn.tgdd.vn/Products/Images/7077/309727/apple-watch-s9-1.jpg',
      'https://cdn.tgdd.vn/Products/Images/7077/309727/apple-watch-s9-2.jpg'
    ],
    variants: [
      { name: '41mm GPS', price: 9990000, oldPrice: 10990000, discount: 9, stock: 40 },
      { name: '45mm GPS', price: 11490000, oldPrice: 12490000, discount: 8, stock: 35 }
    ],
    isNewProduct: true,
    isBestSeller: true
  }
];

async function seedProductsFromTGDD() {
  try {
    console.log('\n📦 === SEED PRODUCTS FROM TGDD ===\n');
    
    console.log('1️⃣ Kết nối MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Đã kết nối MongoDB\n');
    
    console.log('2️⃣ Xóa sản phẩm cũ...');
    await Product.deleteMany({});
    console.log('✅ Đã xóa sản phẩm cũ\n');
    
    console.log('3️⃣ Thêm sản phẩm mới từ TGDD...\n');
    
    let count = 0;
    for (const prod of tgddProducts) {
      // Lấy thông tin category
      const category = await Category.findOne({ categoryId: prod.categoryId });
      if (!category) {
        console.log(`   ⚠️  Không tìm thấy category: ${prod.categoryId}`);
        continue;
      }
      
      // Tạo productId từ tên
      const productId = prod.productName
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[đĐ]/g, 'd')
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .substring(0, 50);
      
      // Tạo variants với variantId
      const variants = prod.variants.map((v, idx) => ({
        variantId: `${productId}-v${idx + 1}`,
        name: v.name,
        price: v.price,
        oldPrice: v.oldPrice,
        discount: v.discount,
        stock: v.stock
      }));
      
      const product = await Product.create({
        productId,
        productName: prod.productName,
        brand: prod.brand,
        productDescription: prod.description,
        category: {
          categoryId: category.categoryId,
          categoryName: category.name
        },
        images: prod.images,
        variants,
        isNewProduct: prod.isNewProduct,
        isBestSeller: prod.isBestSeller,
        status: 'available'
      });
      
      count++;
      console.log(`   ✅ ${prod.productName} (${category.name})`);
      console.log(`      📸 ${product.images.length} ảnh | 🏷️  ${variants.length} phiên bản`);
    }
    
    console.log(`\n✅ Đã thêm ${count} sản phẩm thành công!\n`);
    
    // Thống kê
    const stats = await Product.aggregate([
      { 
        $group: { 
          _id: '$category.categoryName', 
          count: { $sum: 1 },
          totalStock: { $sum: { $sum: '$variants.stock' } }
        } 
      },
      { $sort: { count: -1 } }
    ]);
    
    console.log('📊 Thống kê theo danh mục:');
    stats.forEach(s => {
      console.log(`   ${s._id}: ${s.count} sản phẩm (${s.totalStock} items)`);
    });
    
    await mongoose.connection.close();
    console.log('\n✅ Hoàn thành!\n');
    
  } catch (error) {
    console.error('\n❌ Lỗi:', error.message);
    console.error(error);
    process.exit(1);
  }
}

seedProductsFromTGDD();
