const mongoose = require('mongoose');
const User = require('./models/userModel');
const bcrypt = require('bcryptjs');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://admin:phoneworld123@localhost:27017/phoneworld?authSource=admin';

async function createAdmin() {
  try {
    console.log('👤 === TẠO TÀI KHOẢN ADMIN ===\n');
    
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Đã kết nối MongoDB\n');

    // Kiểm tra admin đã tồn tại chưa
    const existingAdmin = await User.findOne({ 
      $or: [
        { email: 'admin@test.com' },
        { userName: 'admin' }
      ]
    });

    if (existingAdmin) {
      console.log('⚠️  Tài khoản admin đã tồn tại:');
      console.log(`   Username: ${existingAdmin.userName}`);
      console.log(`   Email: ${existingAdmin.email}`);
      console.log(`   Role: ${existingAdmin.role}`);
      console.log('\n💡 Bạn có thể đăng nhập với:');
      console.log('   Email: admin@phoneworld.com');
      console.log('   Password: admin123');
      await mongoose.connection.close();
      return;
    }

    // Tạo tài khoản admin mới
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    const admin = new User({
      userId: 'admin001',
      userName: 'admin',
      name: 'Administrator',
      email: 'admin@test.com',
      password: hashedPassword,
      phoneNumber: '0123456789',
      role: 'admin',
      provider: ['local'],
      shippingAddresses: [{
        fullName: 'Administrator',
        phoneNumber: '0123456789',
        address: '123 Admin Street',
        city: 'Hồ Chí Minh',
        district: 'Quận 1',
        ward: 'Phường Bến Nghé',
        isDefault: true
      }]
    });

    await admin.save();
    
    console.log('✅ Đã tạo tài khoản admin thành công!\n');
    console.log('📋 Thông tin đăng nhập:');
    console.log('   Email: admin@phoneworld.com');
    console.log('   Password: admin123');
    console.log('   Username: admin');
    console.log('   Role: admin');
    console.log('\n🎉 Bạn có thể đăng nhập ngay bây giờ!');

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

createAdmin();
