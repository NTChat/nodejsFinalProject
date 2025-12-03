// backend/controllers/flashSaleController.js
const FlashSale = require('../models/flashSaleModel');
const Product = require('../models/productModel');

// ADMIN: Tạo Flash Sale
exports.createFlashSale = async (req, res) => {
    try {
        const { name, description, timeSlot, startTime, endTime, products, bannerImage } = req.body;

        // Validate products
        if (!products || products.length === 0) {
            return res.status(400).json({ success: false, message: 'Vui lòng thêm sản phẩm vào flash sale' });
        }

        // Tính discountPercent cho mỗi sản phẩm
        const productsWithDiscount = products.map(p => ({
            ...p,
            discountPercent: Math.round(((p.originalPrice - p.flashPrice) / p.originalPrice) * 100)
        }));

        const flashSale = new FlashSale({
            name,
            description,
            timeSlot,
            startTime: new Date(startTime),
            endTime: new Date(endTime),
            products: productsWithDiscount,
            bannerImage,
            status: 'upcoming'
        });

        // Cập nhật status ngay lập tức
        flashSale.updateStatus();
        
        await flashSale.save();

        res.status(201).json({
            success: true,
            message: 'Tạo flash sale thành công',
            flashSale
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ADMIN: Cập nhật Flash Sale
exports.updateFlashSale = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        const flashSale = await FlashSale.findById(id);
        if (!flashSale) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy flash sale' });
        }

        // Không cho phép sửa flash sale đã kết thúc
        if (flashSale.status === 'ended') {
            return res.status(400).json({ success: false, message: 'Không thể sửa flash sale đã kết thúc' });
        }

        Object.assign(flashSale, updates);
        flashSale.updateStatus();
        
        await flashSale.save();

        res.json({
            success: true,
            message: 'Cập nhật flash sale thành công',
            flashSale
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ADMIN: Xóa Flash Sale
exports.deleteFlashSale = async (req, res) => {
    try {
        const { id } = req.params;

        const flashSale = await FlashSale.findById(id);
        if (!flashSale) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy flash sale' });
        }

        await flashSale.deleteOne();

        res.json({
            success: true,
            message: 'Đã xóa flash sale'
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// PUBLIC: Lấy Flash Sale đang diễn ra
exports.getActiveFlashSales = async (req, res) => {
    try {
        const flashSales = await FlashSale.getActive();

        // Cập nhật status cho tất cả
        for (const fs of flashSales) {
            fs.updateStatus();
            if (fs.isModified('status')) {
                await fs.save();
            }
        }

        res.json({
            success: true,
            flashSales
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// PUBLIC: Lấy Flash Sale cho Homepage (kiểu Shopee: active + upcoming + tomorrow)
exports.getFlashSalesForHomepage = async (req, res) => {
    try {
        const { active, upcomingToday, tomorrow } = await FlashSale.getForHomepage();

        // Cập nhật status cho tất cả active
        for (const fs of active) {
            fs.updateStatus();
            if (fs.isModified('status')) {
                await fs.save();
            }
        }

        res.json({
            success: true,
            active,
            upcomingToday,
            tomorrow,
            // Nếu có active thì ưu tiên hiển thị active, không thì hiển thị upcoming
            currentSlot: active.length > 0 ? active[0] : (upcomingToday.length > 0 ? upcomingToday[0] : null)
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// PUBLIC: Lấy Flash Sale sắp diễn ra
exports.getUpcomingFlashSales = async (req, res) => {
    try {
        const flashSales = await FlashSale.getUpcoming();

        res.json({
            success: true,
            flashSales
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// PUBLIC: Lấy chi tiết Flash Sale
exports.getFlashSaleDetail = async (req, res) => {
    try {
        const { id } = req.params;

        const flashSale = await FlashSale.findById(id).populate('products.productId');
        if (!flashSale) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy flash sale' });
        }

        // Cập nhật status
        flashSale.updateStatus();
        if (flashSale.isModified('status')) {
            await flashSale.save();
        }

        // Tăng view count
        flashSale.totalViews += 1;
        await flashSale.save();

        res.json({
            success: true,
            flashSale
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ADMIN: Lấy tất cả Flash Sales
exports.getAllFlashSales = async (req, res) => {
    try {
        const { status, page = 1, limit = 20 } = req.query;

        const query = {};
        if (status) query.status = status;

        const flashSales = await FlashSale.find(query)
            .populate('products.productId')
            .sort({ startTime: -1 })
            .limit(limit)
            .skip((page - 1) * limit);

        const total = await FlashSale.countDocuments(query);

        res.json({
            success: true,
            flashSales,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Kiểm tra sản phẩm có trong flash sale đang active không
exports.checkProductInFlashSale = async (req, res) => {
    try {
        const { productId } = req.params;

        const now = new Date();
        const flashSale = await FlashSale.findOne({
            status: 'active',
            startTime: { $lte: now },
            endTime: { $gte: now },
            'products.productId': productId
        });

        if (!flashSale) {
            return res.json({
                success: true,
                inFlashSale: false
            });
        }

        const product = flashSale.products.find(p => p.productId.toString() === productId);

        res.json({
            success: true,
            inFlashSale: true,
            flashSale: {
                _id: flashSale._id,
                name: flashSale.name,
                endTime: flashSale.endTime,
                product: {
                    originalPrice: product.originalPrice,
                    flashPrice: product.flashPrice,
                    discountPercent: product.discountPercent,
                    totalStock: product.totalStock,
                    soldCount: product.soldCount,
                    soldPercent: Math.round((product.soldCount / product.totalStock) * 100),
                    remaining: product.totalStock - product.soldCount
                }
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
