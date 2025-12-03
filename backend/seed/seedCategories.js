// backend/seed/seedCategories.js
const mongoose = require('mongoose');
require('dotenv').config({ path: '.env' });
const Category = require('../models/categoryModel');

const seedCategories = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        console.log('✅ Connected to MongoDB');

        // Xóa categories cũ
        await Category.deleteMany({});
        console.log('🗑️  Deleted old categories');

        // 10 danh mục cha
        const parentCategories = [
            {
                categoryId: 'dien-thoai',
                name: 'Điện thoại',
                slug: 'dien-thoai',
                description: 'Các loại điện thoại di động',
                image: 'https://images.pexels.com/photos/788946/pexels-photo-788946.jpeg',
                status: 'active',
                displayOrder: 1,
                parentId: null,
            },
            {
                categoryId: 'laptop',
                name: 'Laptop',
                slug: 'laptop',
                description: 'Máy tính xách tay',
                image: 'https://images.pexels.com/photos/18105/pexels-photo.jpg',
                status: 'active',
                displayOrder: 2,
                parentId: null,
            },
            {
                categoryId: 'tablet',
                name: 'Tablet',
                slug: 'tablet',
                description: 'Máy tính bảng',
                image: 'https://images.pexels.com/photos/699122/pexels-photo-699122.jpeg',
                status: 'active',
                displayOrder: 3,
                parentId: null,
            },
            {
                categoryId: 'phu-kien-dien-tu',
                name: 'Phụ kiện điện tử',
                slug: 'phu-kien-dien-tu',
                description: 'Các loại phụ kiện điện tử',
                image: 'https://images.pexels.com/photos/3825517/pexels-photo-3825517.jpeg',
                status: 'active',
                displayOrder: 4,
                parentId: null,
            },
            {
                categoryId: 'camera-may-anh',
                name: 'Camera & Máy ảnh',
                slug: 'camera-may-anh',
                description: 'Camera và máy ảnh chuyên nghiệp',
                image: 'https://images.pexels.com/photos/606941/pexels-photo-606941.jpeg',
                status: 'active',
                displayOrder: 5,
                parentId: null,
            },
            {
                categoryId: 'am-thanh',
                name: 'Âm thanh',
                slug: 'am-thanh',
                description: 'Loa, tai nghe, âm thanh',
                image: 'https://images.pexels.com/photos/3587478/pexels-photo-3587478.jpeg',
                status: 'active',
                displayOrder: 6,
                parentId: null,
            },
            {
                categoryId: 'gaming',
                name: 'Gaming',
                slug: 'gaming',
                description: 'Periperal gaming, bàn phím, chuột',
                image: 'https://images.pexels.com/photos/2085159/pexels-photo-2085159.jpeg',
                status: 'active',
                displayOrder: 7,
                parentId: null,
            },
            {
                categoryId: 'thiet-bi-deo',
                name: 'Thiết bị đeo',
                slug: 'thiet-bi-deo',
                description: 'Smartwatch, fitness tracker',
                image: 'https://images.pexels.com/photos/3962285/pexels-photo-3962285.jpeg',
                status: 'active',
                displayOrder: 8,
                parentId: null,
            },
            {
                categoryId: 'may-in-scanner',
                name: 'Máy in & Scanner',
                slug: 'may-in-scanner',
                description: 'Máy in, scanner văn phòng',
                image: 'https://images.pexels.com/photos/3587478/pexels-photo-3587478.jpeg',
                status: 'active',
                displayOrder: 9,
                parentId: null,
            },
            {
                categoryId: 'networking',
                name: 'Networking',
                slug: 'networking',
                description: 'Router, modem, thiết bị mạng',
                image: 'https://images.pexels.com/photos/3768315/pexels-photo-3768315.jpeg',
                status: 'active',
                displayOrder: 10,
                parentId: null,
            },
        ];

        // Tạo danh mục cha
        const createdParents = await Category.insertMany(parentCategories);
        console.log(`✅ Created ${createdParents.length} parent categories`);

        // Danh mục con cho mỗi cha
        const childData = {
            'dien-thoai': [
                { name: 'iPhone', slug: 'iphone', description: 'Điện thoại Apple' },
                { name: 'Samsung', slug: 'samsung', description: 'Điện thoại Samsung' },
                { name: 'Xiaomi', slug: 'xiaomi', description: 'Điện thoại Xiaomi' },
                { name: 'OnePlus', slug: 'oneplus', description: 'Điện thoại OnePlus' },
            ],
            'laptop': [
                { name: 'MacBook', slug: 'macbook', description: 'Laptop Apple' },
                { name: 'Dell', slug: 'dell', description: 'Laptop Dell' },
                { name: 'HP', slug: 'hp', description: 'Laptop HP' },
                { name: 'ASUS', slug: 'asus', description: 'Laptop ASUS' },
            ],
            'tablet': [
                { name: 'iPad', slug: 'ipad', description: 'Tablet Apple' },
                { name: 'Samsung Tab', slug: 'samsung-tab', description: 'Tablet Samsung' },
                { name: 'iPad Air', slug: 'ipad-air', description: 'iPad Air' },
            ],
            'phu-kien-dien-tu': [
                { name: 'Cáp sạc', slug: 'cap-sac', description: 'Các loại cáp sạc' },
                { name: 'Sạc nhanh', slug: 'sac-nhanh', description: 'Sạc nhanh USB-C' },
                { name: 'Pin dự phòng', slug: 'pin-du-phong', description: 'Pin sạc dự phòng' },
                { name: 'Ốp lưng', slug: 'op-lung', description: 'Ốp lưng điện thoại' },
            ],
            'camera-may-anh': [
                { name: 'Canon', slug: 'canon', description: 'Máy ảnh Canon' },
                { name: 'Nikon', slug: 'nikon', description: 'Máy ảnh Nikon' },
                { name: 'Sony', slug: 'sony', description: 'Máy ảnh Sony' },
                { name: 'Lens & Filter', slug: 'lens-filter', description: 'Lens và bộ lọc' },
            ],
            'am-thanh': [
                { name: 'Tai nghe Over-ear', slug: 'tai-nghe-over-ear', description: 'Tai nghe over-ear' },
                { name: 'Tai nghe In-ear', slug: 'tai-nghe-in-ear', description: 'Tai nghe in-ear' },
                { name: 'Loa Bluetooth', slug: 'loa-bluetooth', description: 'Loa Bluetooth không dây' },
                { name: 'Micro', slug: 'micro', description: 'Microphone' },
            ],
            'gaming': [
                { name: 'Bàn phím Gaming', slug: 'ban-phim-gaming', description: 'Bàn phím gaming cơ' },
                { name: 'Chuột Gaming', slug: 'chuot-gaming', description: 'Chuột gaming cao cấp' },
                { name: 'Headset Gaming', slug: 'headset-gaming', description: 'Headset gaming' },
                { name: 'Mousepad', slug: 'mousepad', description: 'Mousepad gaming' },
            ],
            'thiet-bi-deo': [
                { name: 'Apple Watch', slug: 'apple-watch', description: 'Apple Watch' },
                { name: 'Smartwatch Android', slug: 'smartwatch-android', description: 'Smartwatch Android' },
                { name: 'Fitness Tracker', slug: 'fitness-tracker', description: 'Fitness tracker' },
                { name: 'Smart Band', slug: 'smart-band', description: 'Smart band giá rẻ' },
            ],
            'may-in-scanner': [
                { name: 'Máy in Laser', slug: 'may-in-laser', description: 'Máy in laser' },
                { name: 'Máy in Phun', slug: 'may-in-phun', description: 'Máy in phun' },
                { name: 'Scanner', slug: 'scanner', description: 'Scanner văn phòng' },
                { name: 'Máy in đa năng', slug: 'may-in-da-nang', description: 'Máy in đa năng' },
            ],
            'networking': [
                { name: 'Router WiFi', slug: 'router-wifi', description: 'Router WiFi' },
                { name: 'Modem', slug: 'modem', description: 'Modem cáp quang' },
                { name: 'Switch', slug: 'switch', description: 'Network switch' },
                { name: 'WiFi Mesh', slug: 'wifi-mesh', description: 'Hệ thống WiFi mesh' },
            ],
        };

        // Tạo danh mục con
        let childCount = 0;
        for (const parent of createdParents) {
            const children = childData[parent.slug] || [];
            const childCategories = children.map((child, idx) => ({
                categoryId: child.slug,
                name: child.name,
                slug: child.slug,
                description: child.description,
                status: 'active',
                displayOrder: idx + 1,
                parentId: parent.categoryId, // Use categoryId not _id
                image: parent.image,
            }));

            if (childCategories.length > 0) {
                await Category.insertMany(childCategories);
                childCount += childCategories.length;
            }
        }

        console.log(`✅ Created ${childCount} child categories`);
        console.log('✅ Seeding completed successfully!');
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding categories:', error.message);
        process.exit(1);
    }
};

seedCategories();
