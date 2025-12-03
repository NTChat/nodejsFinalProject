const mongoose = require('mongoose');
const User = require('./models/userModel');
const bcrypt = require('bcryptjs');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://admin:phoneworld123@localhost:27017/phoneworld?authSource=admin';

async function createTestUsers() {
  try {
    console.log('👥 === TẠO TÀI KHOẢN TEST ===\n');
    
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Đã kết nối MongoDB\n');

    const testUsers = [
      {
        userId: 'admin001',
        userName: 'admin',
        name: 'Administrator',
        email: 'admin@test.com',
        password: 'admin123',
        phoneNumber: '0123456789',
        role: 'admin',
        provider: ['local'],
        loyaltyPoints: 0,
        isBanned: false,
        shippingAddresses: [{
          fullName: 'Administrator',
          phoneNumber: '0123456789',
          address: '123 Admin Street',
          city: 'Hồ Chí Minh',
          district: 'Quận 1',
          ward: 'Phường Bến Nghé',
          isDefault: true
        }]
      },
      {
        userId: 'user001',
        userName: 'testuser',
        name: 'Test User',
        email: 'user@test.com',
        password: 'user123',
        phoneNumber: '0987654321',
        role: 'user',
        provider: ['local'],
        loyaltyPoints: 100,
        isBanned: false,
        shippingAddresses: [{
          fullName: 'Test User',
          phoneNumber: '0987654321',
          address: '456 User Street',
          city: 'Hà Nội',
          district: 'Quận Ba Đình',
          ward: 'Phường Cống Vị',
          isDefault: true
        }]
      },
      {
        userId: 'user002',
        userName: 'testexample',
        name: 'Test Example',
        email: 'test@example.com',
        password: 'test123',
        phoneNumber: '0912345678',
        role: 'user',
        provider: ['local'],
        loyaltyPoints: 50,
        isBanned: false,
        shippingAddresses: [{
          fullName: 'Test Example',
          phoneNumber: '0912345678',
          address: '789 Test Avenue',
          city: 'Đà Nẵng',
          district: 'Quận Hải Châu',
          ward: 'Phường Thạch Thang',
          isDefault: true
        }]
      }
    ];

    // Xóa users test cũ nếu có
    await User.deleteMany({ 
      email: { $in: ['admin@test.com', 'user@test.com', 'test@example.com'] } 
    });
    console.log('🗑️  Đã xóa test users cũ\n');

    let created = 0;

    for (const userData of testUsers) {
      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      
      // Tạo user mới
      const user = new User({
        ...userData,
        password: hashedPassword
      });

      await user.save();
      console.log(`✅ Đã tạo: ${userData.email} (${userData.role})`);
      created++;
    }

    console.log('\n📊 === TỔNG KẾT ===');
    console.log(`   Đã tạo: ${created} users`);
    
    console.log('\n📋 === THÔNG TIN ĐĂNG NHẬP (THEO TEST_GUIDE.md) ===');
    console.log('   🔑 Admin:');
    console.log('      Email: admin@test.com');
    console.log('      Password: admin123');
    console.log('');
    console.log('   👤 User 1:');
    console.log('      Email: user@test.com');
    console.log('      Password: user123');
    console.log('');
    console.log('   👤 User 2 (for register test):');
    console.log('      Email: test@example.com');
    console.log('      Password: test123');
    console.log('\n🎉 Các tài khoản đã sẵn sàng để test!');
    console.log('📖 Xem hướng dẫn test tại: TEST_GUIDE.md');

    await mongoose.connection.close();
    console.log('\n✅ Đã đóng kết nối MongoDB');
    
  } catch (error) {
    console.error('❌ Lỗi:', error.message);
    if (error.code === 11000) {
      console.log('⚠️  Email hoặc username đã tồn tại trong database');
    }
    process.exit(1);
  }
}

createTestUsers();
