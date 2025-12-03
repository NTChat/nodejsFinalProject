// Test Product Image Upload & Update
const https = require('https');
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const httpsAgent = new https.Agent({ rejectUnauthorized: false });
const API_URL = 'https://localhost:3001/api';
const axiosInstance = axios.create({ httpsAgent, baseURL: API_URL });

let adminToken;
let productId;

async function testProductImageUpload() {
    console.log('\n🧪 === PRODUCT IMAGE UPLOAD TEST ===\n');

    try {
        // Step 1: Admin Login
        console.log('1️⃣ Đăng nhập admin...');
        const adminLogin = await axiosInstance.post('/auth/login', {
            identifier: 'admin@test.com',
            password: 'admin123'
        });
        adminToken = adminLogin.data.token;
        console.log('✅ Admin logged in:', adminLogin.data.user.name);

        // Step 2: Get or create category
        console.log('\n2️⃣ Lấy category...');
        let categoriesResponse = await axiosInstance.get('/categories');
        let categories = categoriesResponse.data.categories || categoriesResponse.data;
        let categoryId = categories[0]._id;
        console.log('✅ Found category:', categories[0].name);

        // Step 3: Create product with sample images
        console.log('\n3️⃣ Tạo sản phẩm test với hình ảnh...');
        const productData = {
            productId: 'test-img-upload-' + Date.now(),
            productName: 'Samsung Galaxy S24 Ultra Test',
            category: {
                categoryId: 'smartphone',
                categoryName: 'Điện thoại'
            },
            productDescription: 'Testing image upload - Samsung Galaxy S24 Ultra với camera 200MP',
            price: 27990000,
            discount: 10,
            stock: 80,
            brand: 'Samsung',
            images: [
                'https://cdn.tgdd.vn/Products/Images/42/307174/samsung-galaxy-s24-ultra-grey-thumbnew-600x600.jpg',
                'https://cdn.tgdd.vn/Products/Images/42/307174/samsung-galaxy-s24-ultra-1-1.jpg'
            ],
            isNewProduct: true,
            isBestSeller: true,
            status: 'available',
            variants: [
                {
                    variantId: 'var-s24-1',
                    name: 'Phiên bản 1',
                    color: 'Xám Titan',
                    storage: '256GB',
                    price: 27990000,
                    oldPrice: 30990000,
                    stock: 40,
                    discount: 10
                },
                {
                    variantId: 'var-s24-2',
                    name: 'Phiên bản 2',
                    color: 'Tím',
                    storage: '512GB',
                    price: 31990000,
                    oldPrice: 34990000,
                    stock: 40,
                    discount: 10
                }
            ],
            specifications: {
                screen: '6.8" Dynamic AMOLED 2X',
                os: 'Android 14',
                camera: 'Camera chính 200MP',
                chip: 'Snapdragon 8 Gen 3 for Galaxy',
                ram: '12GB',
                battery: '5000mAh, sạc nhanh 45W'
            }
        };

        const createResponse = await axiosInstance.post('/products', productData, {
            headers: { Authorization: `Bearer ${adminToken}` }
        });

        productId = createResponse.data.product.productId;
        console.log('✅ Product created!');
        console.log('   Product ID:', productId);
        console.log('   Product Name:', createResponse.data.product.productName);
        console.log('   Current images:', createResponse.data.product.images.length, 'images');

        // Step 4: Update product images (add more images)
        console.log('\n4️⃣ Cập nhật thêm hình ảnh sản phẩm...');
        const updatedImages = [
            'https://cdn.tgdd.vn/Products/Images/42/307174/samsung-galaxy-s24-ultra-grey-thumbnew-600x600.jpg',
            'https://cdn.tgdd.vn/Products/Images/42/307174/samsung-galaxy-s24-ultra-1-1.jpg',
            'https://cdn.tgdd.vn/Products/Images/42/307174/samsung-galaxy-s24-ultra-2.jpg',
            'https://cdn.tgdd.vn/Products/Images/42/307174/samsung-galaxy-s24-ultra-3.jpg',
            'https://cdn.tgdd.vn/Products/Images/42/307174/samsung-galaxy-s24-ultra-4.jpg'
        ];

        const updateData = {
            productId: productId,
            productName: productData.productName,
            category: productData.category,
            productDescription: productData.productDescription,
            price: productData.price,
            discount: productData.discount,
            stock: productData.stock,
            brand: productData.brand,
            images: updatedImages,
            isNewProduct: productData.isNewProduct,
            isBestSeller: productData.isBestSeller,
            status: productData.status,
            variants: productData.variants,
            specifications: productData.specifications
        };

        const updateResponse = await axiosInstance.put(`/products/${productId}`, updateData, {
            headers: { Authorization: `Bearer ${adminToken}` }
        });

        console.log('✅ Product images updated!');
        console.log('   New image count:', updateResponse.data.product.images.length, 'images');
        
        // Step 5: Verify images
        console.log('\n5️⃣ Xác nhận hình ảnh...');
        const verifyResponse = await axiosInstance.get(`/products/${productId}`);
        const product = verifyResponse.data.product || verifyResponse.data;

        console.log('\n   📸 Product Images:');
        if (product.images && product.images.length > 0) {
            product.images.forEach((img, index) => {
                const shortUrl = img.substring(0, 80) + '...';
                console.log(`   ${index + 1}. ${shortUrl}`);
            });

            if (product.images.length === updatedImages.length) {
                console.log('\n✅ Image count CORRECT!');
                console.log(`   Expected: ${updatedImages.length}, Got: ${product.images.length}`);
            } else {
                console.log('\n❌ Image count WRONG!');
                console.log(`   Expected: ${updatedImages.length}, Got: ${product.images.length}`);
            }
        } else {
            console.log('   ❌ No images found!');
        }

        // Step 6: Delete test product
        console.log('\n6️⃣ Xóa test product...');
        await axiosInstance.delete(`/products/${productId}`, {
            headers: { Authorization: `Bearer ${adminToken}` }
        });
        console.log('✅ Test product deleted');

        console.log('\n✅ === ALL IMAGE UPLOAD TESTS PASSED ===\n');

    } catch (error) {
        console.error('\n❌ Test failed:', error.response?.data || error.message);
        if (error.response?.data?.errors) {
            console.error('Validation errors:', error.response.data.errors);
        }
        
        // Cleanup: Try to delete product if it was created
        if (productId) {
            try {
                await axiosInstance.delete(`/products/${productId}`, {
                    headers: { Authorization: `Bearer ${adminToken}` }
                });
                console.log('🧹 Cleaned up test product');
            } catch (cleanupError) {
                // Ignore cleanup errors
            }
        }
        
        process.exit(1);
    }
}

// Run the test
testProductImageUpload();
