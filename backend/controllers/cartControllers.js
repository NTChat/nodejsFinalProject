// backend/controllers/cartControllers.js
const Cart = require('../models/cartModel');
const Product = require('../models/productModel');
const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

// === HÀM MỚI: Lấy giỏ hàng của user đã đăng nhập ===
exports.getCart = async (req, res) => {
    try {
        const userId = req.user._id || req.user.id;
        const cartItems = await Cart.find({ accountId: userId })
            .populate('productId', 'productName images variants productId'); // Thêm 'productId' (string)

        // "Làm giàu" giỏ hàng
        const enrichedItems = cartItems.map(item => {
            if (!item.productId) return null; // Sản phẩm đã bị xóa

            const product = item.productId;
            const variant = product.variants.find(v => v.variantId === item.variantId);

            if (!variant) return null; // Variant đã bị xóa

            return {
                _id: item._id, // cartItemId
                productId: product._id, // Mongo ID
                productStringId: product.productId, // String ID (VD: "monitor04")
                productName: product.productName,
                image: product.images[0] || null, 
                variantId: item.variantId,
                variantName: variant.name,
                price: variant.price,
                stock: variant.stock,
                quantity: item.quantity
            };
        }).filter(item => item !== null); 

        res.status(200).json({ success: true, cart: enrichedItems });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// === HÀM MỚI: Đồng bộ giỏ hàng (Fix lỗi 500) ===
exports.syncCart = async (req, res) => {
    try {
        const { localCart } = req.body; // Giỏ hàng từ localStorage
        const accountId = req.user._id || req.user.id;

        if (!Array.isArray(localCart) || localCart.length === 0) {
            return exports.getCart(req, res); // Không có gì sync, chỉ cần lấy giỏ hàng DB
        }

        const operations = localCart.map(item => ({
            updateOne: {
                filter: { 
                    accountId: accountId, 
                    productId: new mongoose.Types.ObjectId(item.productId), // 👈 FIX: Ép kiểu về ObjectId
                    variantId: item.variantId 
                },
                update: {
                    $inc: { quantity: item.quantity },
                    $setOnInsert: {
                        accountId: accountId,
                        productId: new mongoose.Types.ObjectId(item.productId), // 👈 FIX: Ép kiểu về ObjectId
                        variantId: item.variantId
                    }
                },
                upsert: true 
            }
        }));

        await Cart.bulkWrite(operations);

        // Sau khi gộp, gọi lại hàm getCart để trả về giỏ hàng mới nhất
        return exports.getCart(req, res);

    } catch (error) {
        // Bắt lỗi nếu 'item.productId' không phải ObjectId hợp lệ
        if (error.name === 'CastError' || error.message.includes('ObjectId')) {
            return res.status(400).json({ success: false, message: 'Lỗi đồng bộ: ProductID trong giỏ hàng local không hợp lệ.' });
        }
        res.status(500).json({ success: false, message: error.message });
    }
};


// === HÀM addToCart ĐÃ SỬA (FIX LỖI DUPLICATE KEY) ===
exports.addToCart = async (req, res) => {
    try {
        const { productId, variantId, quantity = 1 } = req.body;
        const accountId = req.user._id || req.user.id;
        const qtyToAdd = parseInt(quantity);

        if (!productId || !variantId) {
            return res.status(400).json({ success: false, message: 'Thiếu productId hoặc variantId.' });
        }

        // 1. Kiểm tra sản phẩm và tồn kho trước
        const product = await Product.findById(productId);
        if (!product) return res.status(404).json({ success: false, message: 'Sản phẩm không tồn tại.' });

        const variant = product.variants.find(v => v.variantId === variantId);
        if (!variant) return res.status(404).json({ success: false, message: 'Phiên bản không tồn tại.' });

        // Kiểm tra sơ bộ tồn kho (chỉ check lượng thêm vào)
        if (qtyToAdd > variant.stock) {
            return res.status(400).json({ success: false, message: `Số lượng vượt quá tồn kho (chỉ còn ${variant.stock})` });
        }

        // 2. Dùng findOneAndUpdate với upsert: true (Thần chú fix lỗi)
        // $inc: Cộng dồn số lượng
        // upsert: true -> Chưa có thì tạo, có rồi thì update
        // new: true -> Trả về dữ liệu mới nhất sau khi update
        let cartItem = await Cart.findOneAndUpdate(
            {
                accountId: accountId,
                productId: new mongoose.Types.ObjectId(productId), // Ép kiểu ObjectId cho chắc chắn
                variantId: variantId
            },
            {
                $inc: { quantity: qtyToAdd }, // Cộng dồn số lượng
                $setOnInsert: { // Những trường này chỉ set khi tạo mới
                    accountId: accountId,
                    productId: new mongoose.Types.ObjectId(productId),
                    variantId: variantId
                }
            },
            { new: true, upsert: true }
        );

        // 3. Kiểm tra lại tổng số lượng sau khi cộng dồn
        // Nếu tổng số lượng trong giỏ > tồn kho -> Phải rollback (trả lại số lượng cũ)
        if (cartItem.quantity > variant.stock) {
            // Rollback: Trừ đi số vừa cộng
            cartItem = await Cart.findByIdAndUpdate(
                cartItem._id, 
                { $inc: { quantity: -qtyToAdd } },
                { new: true }
            );
            return res.status(400).json({ success: false, message: `Tổng số lượng trong giỏ vượt quá tồn kho (chỉ còn ${variant.stock})` });
        }

        // 4. Trả về kết quả enrich (để Frontend hiển thị ngay)
        const enrichedItem = {
            _id: cartItem._id,
            productId: product._id,
            productStringId: product.productId,
            productName: product.productName,
            image: product.images[0] || null,
            variantId: variant.variantId,
            variantName: variant.name,
            price: variant.price,
            stock: variant.stock,
            quantity: cartItem.quantity
        };

        res.status(201).json({ success: true, item: enrichedItem });

    } catch (error) {
        console.error("Add to cart error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.updateCartItem = async (req, res) => {
    try {
        const { cartItemId } = req.params; // 👈 Đây là _id của Cart item
        const { quantity } = req.body;
        const accountId = req.user._id || req.user.id;

        const newQuantity = parseInt(quantity);

        const cartItem = await Cart.findOne({ _id: cartItemId, accountId: accountId })
            .populate('productId', 'variants'); // Lấy product để check stock
        
        if (!cartItem) {
            return res.status(404).json({ success: false, message: 'Sản phẩm không có trong giỏ hàng.' });
        }

        // Nếu số lượng <= 0, xóa item
        if (newQuantity <= 0) {
            await Cart.deleteOne({ _id: cartItem._id });
            return res.status(200).json({ success: true, message: 'Sản phẩm đã được xóa (số lượng = 0).', removed: true, variantId: cartItem.variantId });
        }
        
        const product = cartItem.productId;
        const variant = product.variants.find(v => v.variantId === cartItem.variantId);
        
        if (!variant) {
            return res.status(404).json({ success: false, message: 'Phiên bản sản phẩm không tồn tại.' });
        }
        if (variant.stock < newQuantity) {
            return res.status(400).json({ success: false, message: `Không đủ số lượng tồn kho. Chỉ còn ${variant.stock} sản phẩm.` });
        }

        cartItem.quantity = newQuantity;
        await cartItem.save();

        return res.status(200).json({ success: true, item: cartItem });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

exports.removeCartItem = async (req, res) => {
    try {
        const { cartItemId } = req.params; // 👈 Đây là _id của Cart item
        const accountId = req.user._id || req.user.id;

        const result = await Cart.deleteOne({ _id: cartItemId, accountId: accountId });

        if (result.deletedCount === 0) {
             return res.status(404).json({ success: false, message: 'Sản phẩm không có trong giỏ hàng.' });
        }

        return res.status(200).json({ success: true, message: 'Sản phẩm đã được xóa khỏi giỏ hàng.' });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

exports.clearCart = async (req, res) => {
    try {
        const userId = req.user._id || req.user.id;
        await Cart.deleteMany({ accountId: userId });
        console.log('🗑️ Cleared cart for user:', userId);
        res.status(200).json({ success: true, message: 'Giỏ hàng đã được xóa sạch.' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};