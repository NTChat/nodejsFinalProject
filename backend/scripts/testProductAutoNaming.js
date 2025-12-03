// Test Product Creation với Auto-naming Variants
const https = require('https');
const axios = require('axios');

const httpsAgent = new https.Agent({ rejectUnauthorized: false });
const API_URL = 'https://localhost:3001/api';
const axiosInstance = axios.create({ httpsAgent, baseURL: API_URL });

let adminToken;

async function testProductCreation() {
    console.log('\n🧪 === PRODUCT AUTO-NAMING TEST ===\n');

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
        console.log('\n2️⃣ Lấy hoặc tạo category...');
        let categoriesResponse = await axiosInstance.get('/categories');
        console.log('   Categories response:', JSON.stringify(categoriesResponse.data).substring(0, 200));
        let categories = categoriesResponse.data.categories || categoriesResponse.data;
        let categoryId;
        
        if (!categories || categories.length === 0) {
            console.log('   No categories found, creating one...');
            const newCategory = await axiosInstance.post('/categories', {
                name: 'Test Category',
                description: 'Test category for product creation'
            }, {
                headers: { Authorization: `Bearer ${adminToken}` }
            });
            categoryId = newCategory.data._id;
            console.log('✅ Created category:', newCategory.data.name);
        } else {
            categoryId = categories[0]._id;
            console.log('✅ Found category:', categories[0].name);
        }

        // Step 3: Create product with empty variant names
        console.log('\n3️⃣ Tạo sản phẩm với variant names rỗng và hình ảnh thật...');
        const productData = {
            productId: 'test-phone-auto-' + Date.now(),
            productName: 'iPhone 15 Pro Max Test',
            category: {
                categoryId: 'smartphone',
                categoryName: 'Điện thoại'
            },
            productDescription: 'Testing auto-naming feature for variants - iPhone 15 Pro Max với chip A17 Pro mạnh mẽ',
            price: 29990000,
            discount: 5,
            stock: 100,
            brand: 'Apple',
            images: [
                'https://cdn.tgdd.vn/Products/Images/42/305658/iphone-15-pro-max-blue-thumbnew-600x600.jpg',
                'https://cdn.tgdd.vn/Products/Images/42/305658/iphone-15-pro-max-1-1.jpg',
                'https://cdn.tgdd.vn/Products/Images/42/305658/iphone-15-pro-max-2.jpg'
            ],
            isNewProduct: true,
            isBestSeller: true,
            status: 'available',  // Changed from 'active' to 'available'
            variants: [
                {
                    variantId: 'var-1-' + Date.now(),
                    name: '',  // Empty - should auto-generate "Phiên bản 1"
                    color: 'Titan Tự nhiên',
                    storage: '256GB',
                    price: 29990000,
                    oldPrice: 31990000,
                    stock: 50,
                    discount: 5
                },
                {
                    variantId: 'var-2-' + Date.now(),
                    name: '',  // Empty - should auto-generate "Phiên bản 2"
                    color: 'Titan Xanh',
                    storage: '512GB',
                    price: 34990000,
                    oldPrice: 36990000,
                    stock: 30,
                    discount: 5
                },
                {
                    variantId: 'var-3-' + Date.now(),
                    name: '',  // Empty - should auto-generate "Phiên bản 3"
                    color: 'Titan Trắng',
                    storage: '1TB',
                    price: 39990000,
                    oldPrice: 41990000,
                    stock: 20,
                    discount: 5
                }
            ],
            specifications: {
                screen: '6.7" Super Retina XDR OLED',
                os: 'iOS 17',
                camera: 'Camera chính 48MP, telephoto 5x',
                chip: 'Apple A17 Pro 6 nhân',
                ram: '8GB',
                battery: '4422mAh, sạc nhanh 20W'
            }
        };

        const createResponse = await axiosInstance.post('/products', productData, {
            headers: { Authorization: `Bearer ${adminToken}` }
        });

        console.log('✅ Product created successfully!');
        console.log('   Product ID:', createResponse.data.product.productId);
        console.log('   Product Name:', createResponse.data.product.productName);
        console.log('   Images:', createResponse.data.product.images.length, 'images');
        
        // Step 4: Verify variant names
        console.log('\n4️⃣ Kiểm tra variant names...');
        const variants = createResponse.data.product.variants;
        
        console.log(`\n   📦 Total variants: ${variants.length}`);
        variants.forEach((variant, index) => {
            console.log(`\n   Variant ${index + 1}:`);
            console.log(`   - Name: "${variant.name}"`);
            console.log(`   - Color: ${variant.color}`);
            console.log(`   - Storage: ${variant.storage}`);
            console.log(`   - Price: ${variant.price.toLocaleString()} VNĐ`);
        });

        // Verify auto-naming
        const expectedNames = ['Phiên bản 1', 'Phiên bản 2', 'Phiên bản 3'];
        let allCorrect = true;

        variants.forEach((variant, index) => {
            if (variant.name !== expectedNames[index]) {
                console.log(`\n❌ Variant ${index + 1} name is WRONG!`);
                console.log(`   Expected: "${expectedNames[index]}"`);
                console.log(`   Got: "${variant.name}"`);
                allCorrect = false;
            }
        });

        if (allCorrect) {
            console.log('\n✅ All variant names are CORRECT!');
            console.log('   Auto-naming feature is working perfectly!');
        }

        // Step 5: Delete test product
        console.log('\n5️⃣ Xóa test product...');
        await axiosInstance.delete(`/products/${createResponse.data.product.productId}`, {
            headers: { Authorization: `Bearer ${adminToken}` }
        });
        console.log('✅ Test product deleted');

        console.log('\n✅ === ALL PRODUCT AUTO-NAMING TESTS PASSED ===\n');

    } catch (error) {
        console.error('\n❌ Test failed:', error.response?.data || error.message);
        if (error.response?.data?.errors) {
            console.error('Validation errors:', error.response.data.errors);
        }
        process.exit(1);
    }
}

// Run the test
testProductCreation();
