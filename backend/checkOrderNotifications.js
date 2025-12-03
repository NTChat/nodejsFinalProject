const mongoose = require('mongoose');
require('dotenv').config();
const { connectDB } = require('./config/dbConnection');
const Notification = require('./models/notificationModel');
const Order = require('./models/orderModel');
const User = require('./models/userModel');

async function checkOrderNotifications() {
    try {
        await connectDB();
        console.log('Database connected');
        
        // Check latest order
        const latestOrder = await Order.findOne({}).sort({ createdAt: -1 });
        if (latestOrder) {
            console.log('Latest order:', latestOrder.orderId, '| User:', latestOrder.shippingAddress?.fullName, '| Created:', latestOrder.createdAt);
        }
        
        // Check if any notifications exist now
        const notifications = await Notification.find({})
            .populate('userId', 'email role')
            .sort({ createdAt: -1 });
            
        console.log('Current notifications in database:', notifications.length);
        notifications.forEach((n, index) => {
            console.log(`  ${index + 1}. ${n.title} | ${n.userId?.email} | ${n.createdAt}`);
        });
        
        mongoose.disconnect();
    } catch (error) {
        console.error('Error:', error);
        mongoose.disconnect();
    }
}

checkOrderNotifications();