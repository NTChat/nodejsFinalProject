// backend/routes/uploadRoutes.js
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();

// Tạo thư mục uploads nếu chưa có
const uploadDir = path.join(__dirname, '../public/images');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Cấu hình multer để lưu file
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        // Tạo tên file unique: timestamp + original name
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        const name = path.basename(file.originalname, ext)
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "") // Bỏ dấu tiếng Việt
            .replace(/[^a-z0-9]/g, '-') // Thay ký tự đặc biệt bằng dấu gạch ngang
            .replace(/-+/g, '-') // Gộp nhiều dấu gạch ngang
            .replace(/^-|-$/g, ''); // Bỏ dấu gạch ngang ở đầu/cuối
        
        cb(null, `${name}-${uniqueSuffix}${ext}`);
    }
});

// Filter để chỉ chấp nhận file ảnh
const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Chỉ chấp nhận file ảnh!'), false);
    }
};

// Cấu hình upload với giới hạn kích thước
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
    },
    fileFilter: fileFilter
});

// Route upload ảnh đơn
router.post('/image', upload.single('image'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ 
                success: false, 
                message: 'Không có file nào được upload!' 
            });
        }

        // Trả về đường dẫn ảnh
        const imagePath = `/images/${req.file.filename}`;
        
        res.json({
            success: true,
            message: 'Upload ảnh thành công!',
            imagePath: imagePath,
            path: imagePath,
            filename: req.file.filename,
            originalname: req.file.originalname,
            size: req.file.size
        });
        
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Lỗi server khi upload ảnh!' 
        });
    }
});

// Route upload nhiều ảnh
router.post('/images', upload.array('images', 10), (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'Không có file nào được upload!' 
            });
        }

        // Trả về mảng đường dẫn ảnh
        const imagePaths = req.files.map(file => `/images/${file.filename}`);
        
        res.json({
            success: true,
            message: `Upload ${req.files.length} ảnh thành công!`,
            imagePaths: imagePaths,
            files: req.files.map(file => ({
                path: `/images/${file.filename}`,
                filename: file.filename,
                originalname: file.originalname,
                size: file.size
            }))
        });
        
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Lỗi server khi upload ảnh!' 
        });
    }
});

// Middleware xử lý lỗi multer
router.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                message: 'File quá lớn! Kích thước tối đa là 5MB.'
            });
        }
        return res.status(400).json({
            success: false,
            message: 'Lỗi upload file: ' + error.message
        });
    }
    
    if (error.message === 'Chỉ chấp nhận file ảnh!') {
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
    
    next(error);
});

module.exports = router;