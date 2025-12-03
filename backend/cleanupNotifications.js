const mongoose = require('mongoose');
require('dotenv').config();
const { connectDB } = require('./config/dbConnection');
const Notification = require('./models/notificationModel');
const User = require('./models/userModel');

async function cleanupFakeNotifications() {
    try {
        await connectDB();
        console.log('📊 Database connected');
        
        // Show current notifications
        const allNotifications = await Notification.find({})
            .populate('userId', 'email role')
            .sort({ createdAt: -1 });
        
        console.log('🔔 Current notifications in database:', allNotifications.length);
        allNotifications.forEach((n, index) => {
            console.log(`  ${index + 1}. ${n.title} | ${n.userId?.email} | ${n.createdAt.toISOString().split('T')[0]}`);
        });
        
        // Delete all existing fake/test notifications
        const deleteResult = await Notification.deleteMany({});
        console.log(`🧹 Deleted ${deleteResult.deletedCount} old notifications`);
        
        console.log('✅ Database cleaned! Now only real notifications from user actions will appear.');
        console.log('💡 To test: Place a real order as a user to see admin notifications appear.');
        
        mongoose.disconnect();
    } catch (error) {
        console.error('❌ Error:', error);
        mongoose.disconnect();
    }
}

cleanupFakeNotifications();