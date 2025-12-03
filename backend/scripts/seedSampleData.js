// Seed sample data cho testing
require('dotenv').config();
const mongoose = require('mongoose');
const Category = require('./models/categoryModel');
const Product = require('./models/productModel');
const FlashSale = require('./models/flashSaleModel');

async function seedData() {
    try {
        console.log('🌱 Seeding sample data...\n');
        await mongoose.connect(process.env.MONGODB_URI);

        // ========== CATEGORIES ==========
        console.log('📂 Creating categories...');
        const categories = [
            { categoryId: 'smartphone', name: 'Điện thoại', slug: 'dien-thoai', description: 'Smartphone các loại' },
            { categoryId: 'laptop', name: 'Laptop', slug: 'laptop', description: 'Máy tính xách tay' },
            { categoryId: 'tablet', name: 'Máy tính bảng', slug: 'may-tinh-bang', description: 'Tablet' },
            { categoryId: 'accessory', name: 'Phụ kiện', slug: 'phu-kien', description: 'Phụ kiện điện thoại' },
        ];

        for (const cat of categories) {
            await Category.findOneAndUpdate(
                { categoryId: cat.categoryId },
                cat,
                { upsert: true, new: true }
            );
        }
        console.log(`✅ Created ${categories.length} categories\n`);

        // ========== PRODUCTS ==========
        console.log('📦 Creating products...');
        const products = [
            {
                productId: 'IPHONE-15-PRO',
                productName: 'iPhone 15 Pro Max',
                brand: 'Apple',
                productDescription: 'Flagship mới nhất từ Apple với chip A17 Pro',
                category: { categoryId: 'smartphone', categoryName: 'Điện thoại' },
                images: ['https://via.placeholder.com/400x400?text=iPhone+15+Pro'],
                variants: [
                    { variantId: 'IP15P-256-BLK', name: '256GB - Đen', oldPrice: 29990000, discount: 5, price: 28490500, stock: 50 },
                    { variantId: 'IP15P-512-WHT', name: '512GB - Trắng', oldPrice: 34990000, discount: 5, price: 33240500, stock: 30 }
                ],
                status: 'available',
                isNewProduct: true,
                isBestSeller: true,
                createdAt: new Date()
            },
            {
                productId: 'SAMSUNG-S24-ULTRA',
                productName: 'Samsung Galaxy S24 Ultra',
                brand: 'Samsung',
                productDescription: 'Flagship Android với S-Pen tích hợp',
                category: { categoryId: 'smartphone', categoryName: 'Điện thoại' },
                images: ['https://via.placeholder.com/400x400?text=Galaxy+S24'],
                variants: [
                    { variantId: 'S24U-256-GRY', name: '256GB - Xám', oldPrice: 26990000, discount: 10, price: 24291000, stock: 40 },
                    { variantId: 'S24U-512-BLK', name: '512GB - Đen', oldPrice: 29990000, discount: 10, price: 26991000, stock: 25 }
                ],
                status: 'available',
                isNewProduct: true,
                isBestSeller: true,
                createdAt: new Date()
            },
            {
                productId: 'MACBOOK-M3-PRO',
                productName: 'MacBook Pro M3',
                brand: 'Apple',
                productDescription: 'Laptop chuyên nghiệp với chip M3',
                category: { categoryId: 'laptop', categoryName: 'Laptop' },
                images: ['https://via.placeholder.com/400x400?text=MacBook+M3'],
                variants: [
                    { variantId: 'MBP-M3-14-512', name: '14" 512GB', oldPrice: 52990000, discount: 3, price: 51400300, stock: 15 },
                    { variantId: 'MBP-M3-16-1TB', name: '16" 1TB', oldPrice: 69990000, discount: 3, price: 67890300, stock: 10 }
                ],
                status: 'available',
                isNewProduct: false,
                isBestSeller: true,
                createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000) // 45 ngày trước
            },
            {
                productId: 'AIRPODS-PRO-2',
                productName: 'AirPods Pro 2',
                brand: 'Apple',
                productDescription: 'Tai nghe true wireless cao cấp',
                category: { categoryId: 'accessory', categoryName: 'Phụ kiện' },
                images: ['https://via.placeholder.com/400x400?text=AirPods+Pro+2'],
                variants: [
                    { variantId: 'APP2-WHT', name: 'Trắng', oldPrice: 6490000, discount: 8, price: 5970800, stock: 100 }
                ],
                status: 'available',
                isNewProduct: false,
                isBestSeller: true,
                createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000)
            },
            {
                productId: 'IPAD-AIR-M2',
                productName: 'iPad Air M2',
                brand: 'Apple',
                productDescription: 'Máy tính bảng mạnh mẽ với chip M2',
                category: { categoryId: 'tablet', categoryName: 'Máy tính bảng' },
                images: ['https://via.placeholder.com/400x400?text=iPad+Air'],
                variants: [
                    { variantId: 'IPAD-AIR-128', name: '128GB', oldPrice: 16990000, discount: 5, price: 16140500, stock: 30 },
                    { variantId: 'IPAD-AIR-256', name: '256GB', oldPrice: 20990000, discount: 5, price: 19940500, stock: 20 }
                ],
                status: 'available',
                isNewProduct: true,
                isBestSeller: false,
                createdAt: new Date()
            }
        ];

        for (const prod of products) {
            await Product.findOneAndUpdate(
                { productId: prod.productId },
                prod,
                { upsert: true, new: true }
            );
        }
        console.log(`✅ Created ${products.length} products\n`);

        // ========== FLASH SALES ==========
        console.log('⚡ Creating flash sales...');
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        
        const flashSales = [
            {
                name: 'Flash Sale Sáng - iPhone Hot',
                startTime: new Date(today.getTime() + 9 * 60 * 60 * 1000), // 9:00 AM
                endTime: new Date(today.getTime() + 11 * 60 * 60 * 1000), // 11:00 AM
                products: [
                    {
                        productId: 'IPHONE-15-PRO',
                        variantId: 'IP15P-256-BLK',
                        flashSalePrice: 26990000,
                        originalPrice: 29990000,
                        stock: 20,
                        sold: 0
                    }
                ]
            },
            {
                name: 'Flash Sale Trưa - Samsung Deal',
                startTime: new Date(today.getTime() + 12 * 60 * 60 * 1000), // 12:00 PM
                endTime: new Date(today.getTime() + 14 * 60 * 60 * 1000), // 2:00 PM
                products: [
                    {
                        productId: 'SAMSUNG-S24-ULTRA',
                        variantId: 'S24U-256-GRY',
                        flashSalePrice: 22990000,
                        originalPrice: 26990000,
                        stock: 15,
                        sold: 0
                    }
                ]
            },
            {
                name: 'Flash Sale Tối - Phụ kiện giá sốc',
                startTime: new Date(today.getTime() + 20 * 60 * 60 * 1000), // 8:00 PM
                endTime: new Date(today.getTime() + 22 * 60 * 60 * 1000), // 10:00 PM
                products: [
                    {
                        productId: 'AIRPODS-PRO-2',
                        variantId: 'APP2-WHT',
                        flashSalePrice: 5490000,
                        originalPrice: 6490000,
                        stock: 50,
                        sold: 0
                    }
                ]
            }
        ];

        for (const fs of flashSales) {
            await FlashSale.findOneAndUpdate(
                { name: fs.name, startTime: fs.startTime },
                fs,
                { upsert: true, new: true }
            );
        }
        console.log(`✅ Created ${flashSales.length} flash sales\n`);

        console.log('🎉 Seeding completed successfully!\n');
        process.exit(0);
    } catch (error) {
        console.error('❌ Seeding error:', error);
        process.exit(1);
    }
}

seedData();
