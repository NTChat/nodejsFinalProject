const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const MONGODB_URI = 'mongodb://localhost:27017/shop';

async function seedData() {
  try {
    console.log('🌱 === SEEDING TEST DATA ===\n');
    
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // ===== 1. SEED USERS =====
    console.log('👥 Seeding users...');
    const usersCollection = mongoose.connection.collection('users');
    
    const userCount = await usersCollection.countDocuments();
    if (userCount === 0) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      const hashedPassword2 = await bcrypt.hash('user123', 10);
      const hashedPassword3 = await bcrypt.hash('123456', 10);

      const users = [
        {
          userId: 'admin001',
          userName: 'admin',
          name: 'Admin Test',
          email: 'admin@test.com',
          password: hashedPassword,
          phoneNumber: '0123456789',
          role: 'admin',
          provider: ['local'],
          loyaltyPoints: 0,
          isBanned: false,
          shippingAddresses: [
            {
              fullName: 'Admin Test',
              phoneNumber: '0123456789',
              address: '123 Admin Street',
              city: 'Hồ Chí Minh',
              district: 'Quận 1',
              ward: 'Phường Bến Nghé',
              isDefault: true
            }
          ]
        },
        {
          userId: 'user001',
          userName: 'usertest',
          name: 'User Test',
          email: 'user@test.com',
          password: hashedPassword2,
          phoneNumber: '0987654321',
          role: 'user',
          provider: ['local'],
          loyaltyPoints: 0,
          isBanned: false,
          shippingAddresses: [
            {
              fullName: 'User Test',
              phoneNumber: '0987654321',
              address: '456 User Street',
              city: 'Hồ Chí Minh',
              district: 'Quận 2',
              ward: 'Phường Bình An',
              isDefault: true
            }
          ]
        },
        {
          userId: 'student001',
          userName: '52100759',
          name: 'Nguyễn Khoa Tài',
          email: '52100759@student.tdtu.edu.vn',
          password: hashedPassword3,
          phoneNumber: '0912345678',
          role: 'admin',
          provider: ['local'],
          loyaltyPoints: 0,
          isBanned: false,
          shippingAddresses: [
            {
              fullName: 'Nguyễn Khoa Tài',
              phoneNumber: '0912345678',
              address: 'TDTU Street',
              city: 'Hồ Chí Minh',
              district: 'Quận 7',
              ward: 'Phường Tân Thuận Tây',
              isDefault: true
            }
          ]
        }
      ];

      await usersCollection.insertMany(users);
      console.log(`✅ Created ${users.length} users\n`);
    } else {
      console.log(`⏭️  Users already exist (${userCount}), skipping\n`);
    }

    // ===== 2. SEED CATEGORIES =====
    console.log('📂 Seeding categories...');
    const categoriesCollection = mongoose.connection.collection('categories');
    
    const categoryCount = await categoriesCollection.countDocuments();
    if (categoryCount === 0) {
      const categories = [
        {
          categoryName: 'Điện thoại',
          categorySlug: 'dien-thoai',
          level: 1,
          parent: null,
          image: 'https://res.cloudinary.com/phoneworld/image/upload/v1/category-phone.jpg',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          categoryName: 'Laptop',
          categorySlug: 'laptop',
          level: 1,
          parent: null,
          image: 'https://res.cloudinary.com/phoneworld/image/upload/v1/category-laptop.jpg',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          categoryName: 'Tablet',
          categorySlug: 'tablet',
          level: 1,
          parent: null,
          image: 'https://res.cloudinary.com/phoneworld/image/upload/v1/category-tablet.jpg',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          categoryName: 'Phụ kiện',
          categorySlug: 'phu-kien',
          level: 1,
          parent: null,
          image: 'https://res.cloudinary.com/phoneworld/image/upload/v1/category-accessory.jpg',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      await categoriesCollection.insertMany(categories);
      console.log(`✅ Created ${categories.length} categories\n`);
    } else {
      console.log(`⏭️  Categories already exist (${categoryCount}), skipping\n`);
    }

    // ===== 3. SEED PRODUCTS =====
    console.log('📦 Seeding products...');
    const productsCollection = mongoose.connection.collection('products');
    
    const productCount = await productsCollection.countDocuments();
    if (productCount === 0) {
      const products = [
        {
          productId: 'prod001',
          productName: 'iPhone 15 Pro Max',
          brand: 'Apple',
          categoryId: 'dien-thoai',
          description: 'Latest iPhone 15 Pro Max with A17 Pro chip',
          originalPrice: 45000000,
          salePrice: 42000000,
          quantity: 50,
          images: [
            'https://images.pexels.com/photos/699122/pexels-photo-699122.jpeg?auto=compress&cs=tinysrgb&w=600'
          ],
          variants: [
            {
              variantId: 'var001',
              variantName: 'Phiên bản 1',
              color: 'Black',
              capacity: '256GB',
              stock: 25,
              price: 42000000
            },
            {
              variantId: 'var002',
              variantName: 'Phiên bản 2',
              color: 'Gold',
              capacity: '512GB',
              stock: 25,
              price: 48000000
            }
          ],
          ratings: 4.8,
          reviews: [],
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          productId: 'prod002',
          productName: 'Samsung Galaxy S24 Ultra',
          brand: 'Samsung',
          categoryId: 'dien-thoai',
          description: 'Samsung Galaxy S24 Ultra with Snapdragon 8 Gen 3',
          originalPrice: 40000000,
          salePrice: 37000000,
          quantity: 40,
          images: [
            'https://images.pexels.com/photos/788946/pexels-photo-788946.jpeg?auto=compress&cs=tinysrgb&w=600'
          ],
          variants: [
            {
              variantId: 'var003',
              variantName: 'Phiên bản 1',
              color: 'Titanium Gray',
              capacity: '256GB',
              stock: 20,
              price: 37000000
            },
            {
              variantId: 'var004',
              variantName: 'Phiên bản 2',
              color: 'Titanium Black',
              capacity: '512GB',
              stock: 20,
              price: 42000000
            }
          ],
          ratings: 4.7,
          reviews: [],
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          productId: 'prod003',
          productName: 'MacBook Pro 16"',
          brand: 'Apple',
          categoryId: 'laptop',
          description: 'MacBook Pro 16-inch with M3 Max chip',
          originalPrice: 60000000,
          salePrice: 55000000,
          quantity: 20,
          images: [
            'https://images.pexels.com/photos/18105/pexels-photo.jpg?auto=compress&cs=tinysrgb&w=600'
          ],
          variants: [
            {
              variantId: 'var005',
              variantName: 'Phiên bản 1',
              color: 'Silver',
              capacity: '512GB',
              stock: 10,
              price: 55000000
            },
            {
              variantId: 'var006',
              variantName: 'Phiên bản 2',
              color: 'Space Black',
              capacity: '1TB',
              stock: 10,
              price: 65000000
            }
          ],
          ratings: 4.9,
          reviews: [],
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          productId: 'prod004',
          productName: 'iPad Pro 12.9"',
          brand: 'Apple',
          categoryId: 'tablet',
          description: 'iPad Pro 12.9-inch with M2 chip',
          originalPrice: 25000000,
          salePrice: 23000000,
          quantity: 30,
          images: [
            'https://images.pexels.com/photos/3808519/pexels-photo-3808519.jpeg?auto=compress&cs=tinysrgb&w=600'
          ],
          variants: [
            {
              variantId: 'var007',
              variantName: 'Phiên bản 1',
              color: 'Silver',
              capacity: '128GB',
              stock: 15,
              price: 23000000
            },
            {
              variantId: 'var008',
              variantName: 'Phiên bản 2',
              color: 'Space Gray',
              capacity: '256GB',
              stock: 15,
              price: 27000000
            }
          ],
          ratings: 4.8,
          reviews: [],
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          productId: 'prod005',
          productName: 'AirPods Pro 2',
          brand: 'Apple',
          categoryId: 'phu-kien',
          description: 'Apple AirPods Pro 2 with Active Noise Cancellation',
          originalPrice: 6000000,
          salePrice: 5500000,
          quantity: 100,
          images: [
            'https://images.pexels.com/photos/3587478/pexels-photo-3587478.jpeg?auto=compress&cs=tinysrgb&w=600'
          ],
          variants: [
            {
              variantId: 'var009',
              variantName: 'Phiên bản 1',
              color: 'White',
              capacity: 'Standard',
              stock: 100,
              price: 5500000
            }
          ],
          ratings: 4.7,
          reviews: [],
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      await productsCollection.insertMany(products);
      console.log(`✅ Created ${products.length} products\n`);
    } else {
      console.log(`⏭️  Products already exist (${productCount}), skipping\n`);
    }

    // ===== 4. SEED DISCOUNTS =====
    console.log('🎁 Seeding discounts...');
    const discountsCollection = mongoose.connection.collection('discounts');
    
    const discountCount = await discountsCollection.countDocuments();
    if (discountCount === 0) {
      const discounts = [
        {
          code: 'WELCOME10',
          discountType: 'percent',
          discountValue: 10,
          minOrderAmount: 1000000,
          maxDiscount: 500000,
          usageLimit: 100,
          usedCount: 0,
          startDate: new Date(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          description: 'Welcome discount 10%',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          code: 'SUMMER20',
          discountType: 'percent',
          discountValue: 20,
          minOrderAmount: 5000000,
          maxDiscount: 2000000,
          usageLimit: 50,
          usedCount: 0,
          startDate: new Date(),
          endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
          description: 'Summer sale 20%',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      await discountsCollection.insertMany(discounts);
      console.log(`✅ Created ${discounts.length} discounts\n`);
    } else {
      console.log(`⏭️  Discounts already exist (${discountCount}), skipping\n`);
    }

    console.log('✅ ✅ ✅ SEEDING COMPLETED SUCCESSFULLY! ✅ ✅ ✅\n');
    console.log('📋 Test Credentials:');
    console.log('   Admin: admin@test.com / admin123');
    console.log('   User: user@test.com / user123');
    console.log('   Student Admin: 52100759@student.tdtu.edu.vn / 123456');
    console.log('\n🚀 Ready to test! Visit: https://localhost:3000');

    await mongoose.connection.close();
    
  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
    process.exit(1);
  }
}

seedData();
