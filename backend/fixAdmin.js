const mongoose = require('mongoose');
require('dotenv').config();
const { connectDB } = require('./config/dbConnection');
const User = require('./models/userModel');
const Notification = require('./models/notificationModel');

async function fixAdminAndCreateNotifications() {
    try {
        await connectDB();
        console.log('📊 Database connected');
        
        // Update admin field
        const adminUpdate = await User.updateOne(
            { email: 'admin@example.com' },
            { $set: { isAdmin: true } }
        );
        console.log('✅ Admin update result:', adminUpdate);
        
        // Update other users
        const userUpdate = await User.updateMany(
            { email: { $ne: 'admin@example.com' } },
            { $set: { isAdmin: false } }
        );
        console.log('✅ Users update result:', userUpdate);
        
        // Check results
        const users = await User.find({}).select('email isAdmin _id');
        console.log('👥 Updated users:');
        users.forEach(u => console.log('   -', u.email, '| isAdmin:', u.isAdmin, '| ID:', u._id));
        
        // Find admin user
        const adminUser = await User.findOne({ email: 'admin@example.com' });
        if (adminUser) {
            console.log('🔑 Admin user found:', adminUser.email, '| ID:', adminUser._id);
            
            // Create some test notifications for admin
            const testNotifications = [
                {
                    userId: adminUser._id,
                    title: 'Đơn hàng mới cần xử lý',
                    message: 'Có đơn hàng mới từ khách hàng cần được xử lý.',
                    type: 'order',
                    isRead: false
                },
                {
                    userId: adminUser._id,
                    title: 'Sản phẩm sắp hết hàng',
                    message: 'iPhone 14 Pro Max chỉ còn 2 sản phẩm trong kho.',
                    type: 'system',
                    isRead: false
                },
                {
                    userId: adminUser._id,
                    title: 'Khuyến mãi mới được tạo',
                    message: 'Khuyến mãi Black Friday 2024 đã được kích hoạt.',
                    type: 'promotion',
                    isRead: true
                }
            ];
            
            // Check if admin notifications already exist
            const existingAdminNotifs = await Notification.countDocuments({ userId: adminUser._id });
            console.log('🔔 Existing admin notifications:', existingAdminNotifs);
            
            if (existingAdminNotifs === 0) {
                await Notification.insertMany(testNotifications);
                console.log('✅ Created 3 test notifications for admin');
            } else {
                console.log('ℹ️  Admin already has notifications, skipping creation');
            }
            
            // Show final count
            const finalCount = await Notification.countDocuments({ userId: adminUser._id });
            console.log('🔔 Total admin notifications:', finalCount);
        }
        
        mongoose.disconnect();
        console.log('🏁 Done!');
    } catch (error) {
        console.error('❌ Error:', error);
        mongoose.disconnect();
    }
}

fixAdminAndCreateNotifications();