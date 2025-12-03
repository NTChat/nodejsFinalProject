const mongoose = require('mongoose');

const connectDB = async () => {
    const uri = process.env.MONGODB_URI ;
    if (!uri) {
        console.warn('Warning: MONGO_URI/MONGODB_URI is not set. Skipping DB connection.');
        return;
    }
    try {
        await mongoose.connect(uri, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('MongoDB connected successfully');
    } catch (error) {
        console.error('MongoDB connection error:', error.message);
        // Đừng thoát app trong môi trường dev; chỉ log lỗi
        if (process.env.NODE_ENV === 'production') {
            process.exit(1);
        }
    }
};

module.exports = { connectDB };