const mongoose = require('mongoose');
require('dotenv').config();
const { connectDB } = require('./config/dbConnection');
const Notification = require('./models/notificationModel');
const User = require('./models/userModel');

async function debugNotifications() {
    try {
        await connectDB();
        console.log('Database connected');
        
        // Show all users and their IDs
        const users = await User.find({}).select('email role _id');
        console.log('All users in database:');
        users.forEach(u => console.log(`  ${u._id} | ${u.email} | ${u.role}`));
        
        // Show all notifications with user details
        const notifications = await Notification.find({})
            .populate('userId', 'email role')
            .select('title userId isRead type createdAt')
            .sort({ createdAt: -1 })
            .limit(10);
        
        console.log('\nRecent 10 notifications:');
        notifications.forEach((n, index) => {
            console.log(`  ${index + 1}. ${n.title} | User: ${n.userId?.email || 'Unknown'} | Read: ${n.isRead} | Type: ${n.type}`);
        });
        
        // Count notifications by user
        const countByUser = await Notification.aggregate([
            {
                $group: {
                    _id: '$userId',
                    count: { $sum: 1 },
                    unread: { $sum: { $cond: [{ $eq: ['$isRead', false] }, 1, 0] } }
                }
            }
        ]);
        
        console.log('\nNotification counts by userId:');
        for (const group of countByUser) {
            const user = await User.findById(group._id).select('email role');
            console.log(`  ${group._id} | ${user?.email || 'Unknown'} | Total: ${group.count} | Unread: ${group.unread}`);
        }
        
        mongoose.disconnect();
    } catch (error) {
        console.error('Error:', error);
        mongoose.disconnect();
    }
}

debugNotifications();