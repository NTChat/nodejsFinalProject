const mongoose = require('mongoose');
require('dotenv').config();
const { connectDB } = require('./config/dbConnection');
const Notification = require('./models/notificationModel');
const User = require('./models/userModel');

async function checkAndCreateAdminNotifications() {
    try {
        await connectDB();
        console.log('Database connected');
        
        // Check current notifications after the latest order
        const notifications = await Notification.find({})
            .populate('userId', 'email role')
            .sort({ createdAt: -1 })
            .limit(5);
        
        console.log('Recent notifications:');
        notifications.forEach((n, index) => {
            console.log(`  ${index + 1}. ${n.title} | User: ${n.userId?.email} | Created: ${n.createdAt}`);
        });
        
        // Find admin and user
        const adminUser = await User.findOne({ role: 'admin' });
        const regularUser = await User.findOne({ email: 'user@example.com' });
        
        console.log('\nAdmin user:', adminUser?.email);
        console.log('Regular user:', regularUser?.email);
        
        // Copy user notification logic to admin
        // Find the latest user notification
        const latestUserNotification = await Notification.findOne({ userId: regularUser._id })
            .sort({ createdAt: -1 });
        
        if (latestUserNotification) {
            console.log('\nLatest user notification:', latestUserNotification.title);
            
            // Create corresponding admin notification
            const adminNotification = await Notification.create({
                userId: adminUser._id,
                title: 'Đơn hàng mới cần xử lý',
                message: `Khách hàng ${regularUser.userName || regularUser.email} đã đặt đơn hàng mới cần được xử lý.`,
                type: 'order',
                isRead: false,
                relatedId: latestUserNotification.relatedId,
                actionUrl: '/admin/orders',
                data: {
                    orderId: latestUserNotification.data?.orderId || 'N/A',
                    customerEmail: regularUser.email
                }
            });
            
            console.log('✅ Created admin notification:', adminNotification.title);
        }
        
        mongoose.disconnect();
    } catch (error) {
        console.error('Error:', error);
        mongoose.disconnect();
    }
}

checkAndCreateAdminNotifications();