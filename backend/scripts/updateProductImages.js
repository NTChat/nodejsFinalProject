// Update Products with Real Images
const https = require('https');
const axios = require('axios');

const httpsAgent = new https.Agent({ rejectUnauthorized: false });
const API_URL = 'https://localhost:3001/api';
const axiosInstance = axios.create({ httpsAgent, baseURL: API_URL });

let adminToken;

async function updateProductImages() {
    console.log('\n📸 === UPDATE PRODUCTS WITH REAL IMAGES ===\n');

    try {
        // Step 1: Admin Login
        console.log('1️⃣ Đăng nhập admin...');
        const adminLogin = await axiosInstance.post('/auth/login', {
            identifier: 'admin@test.com',
            password: 'admin123'
        });
        adminToken = adminLogin.data.token;
        console.log('✅ Admin logged in');

        // Step 2: Get all products
        console.log('\n2️⃣ Lấy danh sách products...');
        const productsResponse = await axiosInstance.get('/products');
        const products = productsResponse.data.products || productsResponse.data;
        console.log(`✅ Found ${products.length} products`);

        // Step 3: Update each product with real images
        console.log('\n3️⃣ Cập nhật hình ảnh thật...\n');

        const productUpdates = [
            {
                name: 'iPhone 15 Pro Max',
                images: [
                    'https://cdn.tgdd.vn/Products/Images/42/305658/iphone-15-pro-max-blue-thumbnew-600x600.jpg',
                    'https://cdn.tgdd.vn/Products/Images/42/305658/iphone-15-pro-max-1-1.jpg',
                    'https://cdn.tgdd.vn/Products/Images/42/305658/iphone-15-pro-max-2.jpg'
                ]
            },
            {
                name: 'Samsung Galaxy S24 Ultra',
                images: [
                    'https://cdn.tgdd.vn/Products/Images/42/307174/samsung-galaxy-s24-ultra-grey-thumbnew-600x600.jpg',
                    'https://cdn.tgdd.vn/Products/Images/42/307174/samsung-galaxy-s24-ultra-1-1.jpg',
                    'https://cdn.tgdd.vn/Products/Images/42/307174/samsung-galaxy-s24-ultra-2.jpg'
                ]
            },
            {
                name: 'MacBook Pro M3',
                images: [
                    'https://cdn.tgdd.vn/Products/Images/44/309016/macbook-pro-14-inch-m3-2023-thumbnew-600x600.jpg',
                    'https://cdn.tgdd.vn/Products/Images/44/309016/macbook-pro-14-inch-m3-2023-1.jpg',
                    'https://cdn.tgdd.vn/Products/Images/44/309016/macbook-pro-14-inch-m3-2023-2.jpg'
                ]
            },
            {
                name: 'AirPods Pro Gen 2',
                images: [
                    'https://cdn.tgdd.vn/Products/Images/54/289780/tai-nghe-bluetooth-airpods-pro-gen-2-usb-c-charge-apple-thumbnew-600x600.jpg',
                    'https://cdn.tgdd.vn/Products/Images/54/289780/tai-nghe-bluetooth-airpods-pro-gen-2-usb-c-charge-apple-1.jpg',
                    'https://cdn.tgdd.vn/Products/Images/54/289780/tai-nghe-bluetooth-airpods-pro-gen-2-usb-c-charge-apple-2.jpg'
                ]
            },
            {
                name: 'iPad Pro M2',
                images: [
                    'https://cdn.tgdd.vn/Products/Images/522/325530/ipad-pro-m2-12-9-wifi-cellular-512gb-2024-thumbnew-600x600.jpg',
                    'https://cdn.tgdd.vn/Products/Images/522/325530/ipad-pro-m2-12-9-wifi-cellular-512gb-2024-1.jpg',
                    'https://cdn.tgdd.vn/Products/Images/522/325530/ipad-pro-m2-12-9-wifi-cellular-512gb-2024-2.jpg'
                ]
            }
        ];

        for (const update of productUpdates) {
            const product = products.find(p => p.productName.includes(update.name.split(' ')[0]));
            
            if (product) {
                console.log(`📸 Updating ${product.productName}...`);
                console.log(`   ID: ${product._id}`);
                console.log(`   Current images: ${product.images[0]?.substring(0,40)}`);
                
                const updateData = {
                    ...product,
                    images: update.images
                };

                const response = await axiosInstance.put(`/products/${product._id}`, updateData, {
                    headers: { Authorization: `Bearer ${adminToken}` }
                });
                
                console.log(`   Response: ${response.status} ${response.statusText}`);
                console.log(`   New images: ${response.data.product.images[0]?.substring(0,40)}`);
                console.log(`   ✅ Updated with ${update.images.length} images`);
            }
        }

        console.log('\n✅ === ALL PRODUCTS UPDATED WITH REAL IMAGES ===\n');

    } catch (error) {
        console.error('\n❌ Update failed:', error.response?.data || error.message);
        process.exit(1);
    }
}

// Run the update
updateProductImages();
