// Seed Categories from TGDD Structure
const mongoose = require('mongoose');
require('dotenv').config();

const Category = require('./models/categoryModel');

const tgddCategories = [
  // ========== CẤP 1: Danh mục chính ==========
  {
    categoryId: 'dien-thoai',
    name: 'Điện thoại',
    slug: 'dien-thoai',
    description: 'Điện thoại thông minh các thương hiệu iPhone, Samsung, Oppo, Xiaomi, Vivo...',
    image: 'https://cdn.tgdd.vn/Category/42/dien-thoai-220x48.png',
    icon: '📱',
    parentId: null,
    level: 0,
    path: 'dien-thoai',
    displayOrder: 1,
    status: 'active'
  },
  {
    categoryId: 'laptop',
    name: 'Laptop',
    slug: 'laptop',
    description: 'Laptop văn phòng, gaming, đồ họa các thương hiệu Dell, HP, Asus, Lenovo, Macbook...',
    image: 'https://cdn.tgdd.vn/Category/44/laptop-220x48-1.png',
    icon: '💻',
    parentId: null,
    level: 0,
    path: 'laptop',
    displayOrder: 2,
    status: 'active'
  },
  {
    categoryId: 'tablet',
    name: 'Tablet',
    slug: 'tablet',
    description: 'Máy tính bảng iPad, Samsung Tab, Xiaomi Pad...',
    image: 'https://cdn.tgdd.vn/Category/522/may-tinh-bang-220x48-1.png',
    icon: '📲',
    parentId: null,
    level: 0,
    path: 'tablet',
    displayOrder: 3,
    status: 'active'
  },
  {
    categoryId: 'phu-kien',
    name: 'Phụ kiện',
    slug: 'phu-kien',
    description: 'Phụ kiện điện thoại, laptop, tablet',
    image: 'https://cdn.tgdd.vn/Category/accessories-220x48.png',
    icon: '🎧',
    parentId: null,
    level: 0,
    path: 'phu-kien',
    displayOrder: 4,
    status: 'active'
  },
  {
    categoryId: 'dong-ho',
    name: 'Đồng hồ',
    slug: 'dong-ho',
    description: 'Đồng hồ thông minh, đồng hồ thời trang',
    image: 'https://cdn.tgdd.vn/Category/7077/dong-ho-220x48.png',
    icon: '⌚',
    parentId: null,
    level: 0,
    path: 'dong-ho',
    displayOrder: 5,
    status: 'active'
  },
  
  // ========== CẤP 2: Danh mục con của ĐIỆN THOẠI ==========
  {
    categoryId: 'iphone',
    name: 'iPhone (Apple)',
    slug: 'iphone',
    description: 'Điện thoại iPhone chính hãng VN/A',
    image: 'https://cdn.tgdd.vn/Brand/1/iPhone-(Apple)42-b_5.png',
    icon: '🍎',
    parentId: 'dien-thoai',
    level: 1,
    path: 'dien-thoai/iphone',
    displayOrder: 1,
    status: 'active'
  },
  {
    categoryId: 'samsung',
    name: 'Samsung',
    slug: 'samsung',
    description: 'Điện thoại Samsung Galaxy chính hãng',
    image: 'https://cdn.tgdd.vn/Brand/2/Samsung42-b_21.png',
    icon: '📱',
    parentId: 'dien-thoai',
    level: 1,
    path: 'dien-thoai/samsung',
    displayOrder: 2,
    status: 'active'
  },
  {
    categoryId: 'oppo',
    name: 'OPPO',
    slug: 'oppo',
    description: 'Điện thoại OPPO chính hãng',
    image: 'https://cdn.tgdd.vn/Brand/2/OPPO42-b_23.png',
    icon: '📱',
    parentId: 'dien-thoai',
    level: 1,
    path: 'dien-thoai/oppo',
    displayOrder: 3,
    status: 'active'
  },
  {
    categoryId: 'xiaomi',
    name: 'Xiaomi',
    slug: 'xiaomi',
    description: 'Điện thoại Xiaomi, Redmi chính hãng',
    image: 'https://cdn.tgdd.vn/Brand/2/Xiaomi42-b_28.png',
    icon: '📱',
    parentId: 'dien-thoai',
    level: 1,
    path: 'dien-thoai/xiaomi',
    displayOrder: 4,
    status: 'active'
  },
  {
    categoryId: 'vivo',
    name: 'Vivo',
    slug: 'vivo',
    description: 'Điện thoại Vivo chính hãng',
    image: 'https://cdn.tgdd.vn/Brand/2/vivo42-b_20.png',
    icon: '📱',
    parentId: 'dien-thoai',
    level: 1,
    path: 'dien-thoai/vivo',
    displayOrder: 5,
    status: 'active'
  },
  
  // ========== CẤP 2: Danh mục con của LAPTOP ==========
  {
    categoryId: 'macbook',
    name: 'MacBook (Apple)',
    slug: 'macbook',
    description: 'Laptop MacBook Air, MacBook Pro chính hãng Apple',
    image: 'https://cdn.tgdd.vn/Brand/1/MacBook-(Apple)44-b_20.png',
    icon: '🍎',
    parentId: 'laptop',
    level: 1,
    path: 'laptop/macbook',
    displayOrder: 1,
    status: 'active'
  },
  {
    categoryId: 'dell',
    name: 'Dell',
    slug: 'dell',
    description: 'Laptop Dell Inspiron, XPS, Alienware',
    image: 'https://cdn.tgdd.vn/Brand/2/Dell44-b_20.png',
    icon: '💻',
    parentId: 'laptop',
    level: 1,
    path: 'laptop/dell',
    displayOrder: 2,
    status: 'active'
  },
  {
    categoryId: 'hp',
    name: 'HP',
    slug: 'hp',
    description: 'Laptop HP Pavilion, Envy, Omen',
    image: 'https://cdn.tgdd.vn/Brand/2/HP44-b_22.png',
    icon: '💻',
    parentId: 'laptop',
    level: 1,
    path: 'laptop/hp',
    displayOrder: 3,
    status: 'active'
  },
  {
    categoryId: 'asus',
    name: 'Asus',
    slug: 'asus',
    description: 'Laptop Asus Vivobook, ROG, TUF Gaming',
    image: 'https://cdn.tgdd.vn/Brand/2/Asus44-b_21.png',
    icon: '💻',
    parentId: 'laptop',
    level: 1,
    path: 'laptop/asus',
    displayOrder: 4,
    status: 'active'
  },
  {
    categoryId: 'lenovo',
    name: 'Lenovo',
    slug: 'lenovo',
    description: 'Laptop Lenovo IdeaPad, ThinkPad, Legion',
    image: 'https://cdn.tgdd.vn/Brand/2/Lenovo44-b_21.png',
    icon: '💻',
    parentId: 'laptop',
    level: 1,
    path: 'laptop/lenovo',
    displayOrder: 5,
    status: 'active'
  },
  
  // ========== CẤP 2: Danh mục con của TABLET ==========
  {
    categoryId: 'ipad',
    name: 'iPad (Apple)',
    slug: 'ipad',
    description: 'iPad Pro, iPad Air, iPad Mini chính hãng Apple',
    image: 'https://cdn.tgdd.vn/Brand/1/iPad-(Apple)522-b_2.png',
    icon: '🍎',
    parentId: 'tablet',
    level: 1,
    path: 'tablet/ipad',
    displayOrder: 1,
    status: 'active'
  },
  {
    categoryId: 'samsung-tab',
    name: 'Samsung Tab',
    slug: 'samsung-tab',
    description: 'Samsung Galaxy Tab S, Tab A chính hãng',
    image: 'https://cdn.tgdd.vn/Brand/2/Samsung522-b_5.png',
    icon: '📲',
    parentId: 'tablet',
    level: 1,
    path: 'tablet/samsung-tab',
    displayOrder: 2,
    status: 'active'
  },
  {
    categoryId: 'xiaomi-pad',
    name: 'Xiaomi Pad',
    slug: 'xiaomi-pad',
    description: 'Xiaomi Pad, Redmi Pad chính hãng',
    image: 'https://cdn.tgdd.vn/Brand/2/Xiaomi522-b_3.png',
    icon: '📲',
    parentId: 'tablet',
    level: 1,
    path: 'tablet/xiaomi-pad',
    displayOrder: 3,
    status: 'active'
  },
  
  // ========== CẤP 2: Danh mục con của PHỤ KIỆN ==========
  {
    categoryId: 'tai-nghe',
    name: 'Tai nghe',
    slug: 'tai-nghe',
    description: 'Tai nghe Bluetooth, tai nghe có dây, AirPods',
    image: 'https://cdn.tgdd.vn/Category/54/tai-nghe-220x48.png',
    icon: '🎧',
    parentId: 'phu-kien',
    level: 1,
    path: 'phu-kien/tai-nghe',
    displayOrder: 1,
    status: 'active'
  },
  {
    categoryId: 'sac-cap',
    name: 'Sạc & Cáp',
    slug: 'sac-cap',
    description: 'Sạc dự phòng, cáp sạc, adapter sạc nhanh',
    image: 'https://cdn.tgdd.vn/Category/accessories-220x48.png',
    icon: '🔌',
    parentId: 'phu-kien',
    level: 1,
    path: 'phu-kien/sac-cap',
    displayOrder: 2,
    status: 'active'
  },
  {
    categoryId: 'op-lung',
    name: 'Ốp lưng',
    slug: 'op-lung',
    description: 'Ốp lưng điện thoại, case bảo vệ',
    image: 'https://cdn.tgdd.vn/Category/accessories-220x48.png',
    icon: '🛡️',
    parentId: 'phu-kien',
    level: 1,
    path: 'phu-kien/op-lung',
    displayOrder: 3,
    status: 'active'
  },
  {
    categoryId: 'balo-tui-xach',
    name: 'Balo & Túi xách',
    slug: 'balo-tui-xach',
    description: 'Balo laptop, túi xách laptop, túi chống sốc',
    image: 'https://cdn.tgdd.vn/Category/accessories-220x48.png',
    icon: '🎒',
    parentId: 'phu-kien',
    level: 1,
    path: 'phu-kien/balo-tui-xach',
    displayOrder: 4,
    status: 'active'
  },
  
  // ========== CẤP 2: Danh mục con của ĐỒNG HỒ ==========
  {
    categoryId: 'apple-watch',
    name: 'Apple Watch',
    slug: 'apple-watch',
    description: 'Apple Watch Series, Apple Watch SE, Apple Watch Ultra',
    image: 'https://cdn.tgdd.vn/Brand/1/Apple-Watch7077-b_1.png',
    icon: '⌚',
    parentId: 'dong-ho',
    level: 1,
    path: 'dong-ho/apple-watch',
    displayOrder: 1,
    status: 'active'
  },
  {
    categoryId: 'samsung-watch',
    name: 'Samsung Watch',
    slug: 'samsung-watch',
    description: 'Samsung Galaxy Watch, Galaxy Watch Active',
    image: 'https://cdn.tgdd.vn/Brand/2/Samsung7077-b_3.png',
    icon: '⌚',
    parentId: 'dong-ho',
    level: 1,
    path: 'dong-ho/samsung-watch',
    displayOrder: 2,
    status: 'active'
  },
  {
    categoryId: 'xiaomi-watch',
    name: 'Xiaomi Watch',
    slug: 'xiaomi-watch',
    description: 'Xiaomi Watch, Mi Band, Redmi Watch',
    image: 'https://cdn.tgdd.vn/Brand/2/Xiaomi7077-b_1.png',
    icon: '⌚',
    parentId: 'dong-ho',
    level: 1,
    path: 'dong-ho/xiaomi-watch',
    displayOrder: 3,
    status: 'active'
  },
  
  // ========== CẤP 3: Danh mục con của TAI NGHE ==========
  {
    categoryId: 'airpods',
    name: 'AirPods',
    slug: 'airpods',
    description: 'AirPods Pro, AirPods Max, AirPods thế hệ 2, 3',
    image: 'https://cdn.tgdd.vn/Brand/1/AirPods54-b_3.png',
    icon: '🎧',
    parentId: 'tai-nghe',
    level: 2,
    path: 'phu-kien/tai-nghe/airpods',
    displayOrder: 1,
    status: 'active'
  },
  {
    categoryId: 'tai-nghe-samsung',
    name: 'Tai nghe Samsung',
    slug: 'tai-nghe-samsung',
    description: 'Galaxy Buds Pro, Galaxy Buds Live, Galaxy Buds+',
    image: 'https://cdn.tgdd.vn/Brand/2/Samsung54-b_4.png',
    icon: '🎧',
    parentId: 'tai-nghe',
    level: 2,
    path: 'phu-kien/tai-nghe/tai-nghe-samsung',
    displayOrder: 2,
    status: 'active'
  }
];

async function seedCategories() {
  try {
    console.log('\n📂 === SEED CATEGORIES FROM TGDD ===\n');
    
    console.log('1️⃣ Kết nối MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Đã kết nối MongoDB\n');
    
    console.log('2️⃣ Xóa dữ liệu cũ...');
    await Category.deleteMany({});
    console.log('✅ Đã xóa dữ liệu cũ\n');
    
    console.log('3️⃣ Thêm danh mục mới...');
    for (const cat of tgddCategories) {
      await Category.create(cat);
      console.log(`   ✅ ${cat.icon} ${cat.name} (Level ${cat.level})`);
    }
    
    console.log(`\n✅ Đã thêm ${tgddCategories.length} danh mục thành công!\n`);
    
    // Thống kê
    const stats = await Category.aggregate([
      { $group: { _id: '$level', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);
    
    console.log('📊 Thống kê:');
    stats.forEach(s => {
      console.log(`   Level ${s._id}: ${s.count} danh mục`);
    });
    
    await mongoose.connection.close();
    console.log('\n✅ Hoàn thành!\n');
    
  } catch (error) {
    console.error('\n❌ Lỗi:', error.message);
    process.exit(1);
  }
}

seedCategories();
