// backend/models/flashSaleModel.js
const mongoose = require('mongoose');

// Time slots theo kiểu Shopee
const TIME_SLOTS = ['00:00-09:00', '09:00-12:00', '12:00-15:00', '15:00-18:00', '18:00-21:00', '21:00-00:00'];

const flashSaleSchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: true 
    },
    description: { 
        type: String 
    },
    
    // Thời gian flash sale
    timeSlot: {
        type: String,
        enum: TIME_SLOTS,
        required: true
    },
    startTime: { 
        type: Date, 
        required: true 
    },
    endTime: { 
        type: Date, 
        required: true 
    },
    
    // Trạng thái
    status: {
        type: String,
        enum: ['upcoming', 'active', 'ended'],
        default: 'upcoming'
    },
    
    // Danh sách sản phẩm flash sale
    products: [{
        productId: { 
            type: mongoose.Schema.Types.ObjectId, 
            ref: 'Product', 
            required: true 
        },
        variantId: { 
            type: String 
        },
        
        // Giá gốc và giá flash sale
        originalPrice: { 
            type: Number, 
            required: true 
        },
        flashPrice: { 
            type: Number, 
            required: true 
        },
        discountPercent: { 
            type: Number, 
            default: 0 
        },
        
        // Số lượng giới hạn
        totalStock: { 
            type: Number, 
            required: true,
            min: 1
        },
        soldCount: { 
            type: Number, 
            default: 0 
        },
        
        // Giới hạn mua
        maxPerOrder: { 
            type: Number, 
            default: 5 
        },
        
        // Metadata
        badge: { 
            type: String 
        } // VD: "SALE SỐC", "HOT"
    }],
    
    // Banner/Image cho flash sale
    bannerImage: { 
        type: String 
    },
    
    // Thống kê
    totalViews: { 
        type: Number, 
        default: 0 
    },
    totalOrders: { 
        type: Number, 
        default: 0 
    }
}, {
    timestamps: true
});

// Index để query nhanh
flashSaleSchema.index({ status: 1, startTime: 1, endTime: 1 });
flashSaleSchema.index({ 'products.productId': 1 });

// Virtual để tính % đã bán
flashSaleSchema.virtual('products.soldPercent').get(function() {
    return this.products.map(p => ({
        ...p,
        soldPercent: Math.round((p.soldCount / p.totalStock) * 100)
    }));
});

// Method: Cập nhật trạng thái tự động
flashSaleSchema.methods.updateStatus = function() {
    const now = new Date();
    if (now < this.startTime) {
        this.status = 'upcoming';
    } else if (now >= this.startTime && now <= this.endTime) {
        this.status = 'active';
    } else {
        this.status = 'ended';
    }
};

// Static: Lấy flash sale đang active
flashSaleSchema.statics.getActive = function() {
    const now = new Date();
    return this.find({
        startTime: { $lte: now },
        endTime: { $gte: now }
    }).populate('products.productId').sort({ startTime: 1 });
};

// Static: Lấy flash sale sắp diễn ra (trong 24h tới)
flashSaleSchema.statics.getUpcoming = function() {
    const now = new Date();
    const next24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    return this.find({
        startTime: { $gt: now, $lte: next24h }
    }).populate('products.productId').sort({ startTime: 1 }).limit(5);
};

// Static: Lấy flash sales cho homepage (active + upcoming gần nhất)
flashSaleSchema.statics.getForHomepage = async function() {
    const now = new Date();
    const endOfToday = new Date(now);
    endOfToday.setHours(23, 59, 59, 999);
    
    // Lấy active
    const active = await this.find({
        startTime: { $lte: now },
        endTime: { $gte: now }
    }).populate('products.productId').sort({ startTime: 1 });
    
    // Lấy upcoming trong ngày
    const upcomingToday = await this.find({
        startTime: { $gt: now, $lte: endOfToday }
    }).populate('products.productId').sort({ startTime: 1 });
    
    // Lấy ngày mai
    const startOfTomorrow = new Date(now);
    startOfTomorrow.setDate(startOfTomorrow.getDate() + 1);
    startOfTomorrow.setHours(0, 0, 0, 0);
    const endOfTomorrow = new Date(startOfTomorrow);
    endOfTomorrow.setHours(23, 59, 59, 999);
    
    const tomorrow = await this.find({
        startTime: { $gte: startOfTomorrow, $lte: endOfTomorrow }
    }).populate('products.productId').sort({ startTime: 1 });
    
    return { active, upcomingToday, tomorrow };
};

module.exports = mongoose.model('FlashSale', flashSaleSchema);
