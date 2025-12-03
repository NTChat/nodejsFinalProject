// backend/config/cloudinary.js
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');
const path = require('path'); // Thêm path
require('dotenv').config();

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'phone_world_avatars',
        allowed_formats: ['jpg', 'png', 'jpeg'],
        public_id: (req, file) => {
            const fileName = path.parse(file.originalname).name;
            return `avatar-${fileName.replace(/[^a-zA-Z0-9]/g, '_')}-${Date.now()}`;
        }

    },
});

const upload = multer({ storage: storage });
module.exports = upload;