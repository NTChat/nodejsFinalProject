const mongoose = require('mongoose');
require('dotenv').config();
const { connectDB } = require('./config/dbConnection');
const User = require('./models/userModel');

async function checkUsers() {
    try {
        await connectDB();
        console.log('Database connected');
        
        // Check users with role field
        const users = await User.find({}).select('email role _id');
        console.log('Users in database:');
        users.forEach(u => console.log('  -', u.email, '| role:', u.role, '| ID:', u._id));
        
        // Set admin role
        const adminUpdate = await User.updateOne(
            { email: 'admin@example.com' },
            { role: 'admin' }
        );
        console.log('Admin update result:', adminUpdate);
        
        // Check final state
        const finalUsers = await User.find({}).select('email role');
        console.log('Final users:');
        finalUsers.forEach(u => console.log('  -', u.email, '| role:', u.role, '| isAdmin:', u.role === 'admin'));
        
        mongoose.disconnect();
    } catch (error) {
        console.error('Error:', error);
        mongoose.disconnect();
    }
}

checkUsers();