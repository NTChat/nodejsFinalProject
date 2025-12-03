// backend/config/cloudinaryPayment.js
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');
const path = require('path');
require('dotenv').config();

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'payment_proofs',
        allowed_formats: ['jpg', 'png', 'jpeg'],
        public_id: (req, file) => {
            const fileName = path.parse(file.originalname).name;
            return `payment-${fileName.replace(/[^a-zA-Z0-9]/g, '_')}-${Date.now()}`;
        }
    },
});

const uploadPaymentProof = multer({ storage: storage });

module.exports = { cloudinary, uploadPaymentProof };
