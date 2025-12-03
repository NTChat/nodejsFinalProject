// frontend/src/controllers/CartController.jsx
import api from "../services/api"; // Import axios instance đã cấu hình
import { toast } from 'react-toastify';

/**
 * Lấy thông tin sản phẩm (giá, tồn kho) mới nhất từ server
 * dựa trên các variantId có trong giỏ hàng local.
 * @param {Array} localCartItems - Mảng cartItems từ CartContext
 * @returns {Promise<Array>} - Mảng cartItems đã được "làm giàu" (enrich)
 */
const enrichCart = async (localCartItems) => {
    if (!localCartItems || localCartItems.length === 0) {
        return []; // Trả về mảng rỗng nếu không có gì trong giỏ
    }

    // 1. Tạo mảng các ID cần kiểm tra
    const variantIds = localCartItems.map(item => item.variantId);

    try {
        // 2. Gọi API backend (route /api/products/batch đã có)
        const response = await api.post('/products/batch', {
            variantIds: variantIds
        });
        
        // ================================================================
        // === 🔴 SỬA LỖI Ở ĐÂY 🔴 ===
        // Backend (batchProductLines) có thể trả về { products: [...] } hoặc [...]
        // Chúng ta kiểm tra cả hai trường hợp
        const enrichedVariants = response.data.products || response.data;

        // Thêm kiểm tra an toàn: Đảm bảo enrichedVariants là một MẢNG
        if (!Array.isArray(enrichedVariants)) {
            console.error("API /products/batch không trả về một mảng:", response.data);
            throw new Error("Dữ liệu giỏ hàng trả về không hợp lệ.");
        }
        // ================================================================

        // 3. Cập nhật giỏ hàng local với thông tin mới
        let cartChanged = false;
        const updatedCartItems = localCartItems.map(localItem => {
            // Dòng 30 (cũ) giờ đã an toàn vì enrichedVariants là một mảng
            const freshData = enrichedVariants.find(
                v => v.variantId === localItem.variantId
            );

            if (!freshData) {
                // Sản phẩm này không còn tồn tại trên DB
                toast.error(`Sản phẩm "${localItem.productName}" không còn tồn tại và đã bị xóa.`, { autoClose: 5000 });
                cartChanged = true;
                return null; // Sẽ bị xóa sau
            }

            let updatedItem = { ...localItem };

            // Kiểm tra giá
            if (freshData.price !== localItem.price) {
                toast.warn(`Giá của "${localItem.productName}" đã thay đổi.`, { autoClose: 5000 });
                updatedItem.price = freshData.price;
                cartChanged = true;
            }

            // Cập nhật tồn kho (quan trọng)
            updatedItem.stock = freshData.stock; 

            // Kiểm tra số lượng trong giỏ so với tồn kho mới
            if (updatedItem.quantity > freshData.stock) {
                toast.error(`Số lượng của "${localItem.productName}" vượt quá tồn kho (chỉ còn ${freshData.stock}). Đã tự động cập nhật.`, { autoClose: 5000 });
                updatedItem.quantity = freshData.stock;
                cartChanged = true;
            }
            
            // Trả về null nếu tồn kho mới = 0 (và số lượng cũng = 0)
            if (updatedItem.quantity <= 0) {
                cartChanged = true;
                return null;
            }

            return updatedItem;

        }).filter(item => item !== null); // Lọc bỏ item bị xóa

        return { updatedCartItems, cartChanged };

    } catch (error) {
        console.error("Lỗi khi enrich cart (Controller):", error); // Đây là dòng 67
        toast.error("Không thể cập nhật giỏ hàng từ server.");
        return { updatedCartItems: localCartItems, cartChanged: false }; // Trả về giỏ hàng cũ nếu API lỗi
    }
};

/**
 * (Tương lai) Hàm lưu giỏ hàng vào Database khi người dùng checkout
 */
const saveCartToDatabase = async (cartItems) => {
    // try {
    //     const response = await api.post('/cart/save', { items: cartItems });
    //     return response.data;
    // } catch (error) {
    //     console.error("Lỗi khi lưu giỏ hàng:", error);
    //     throw error;
    // }
    console.log("Giả lập lưu giỏ hàng vào DB:", cartItems);
    return Promise.resolve({ success: true });
};

const clearCart = async () => {
    try {
        await api.delete('/cart'); // Backend route là DELETE /cart (không có /clear)
        return true;
    } catch (error) {
        console.error("Lỗi xóa giỏ hàng:", error);
        return false;
    }
};


export const CartController = {
    enrichCart,
    saveCartToDatabase,
    clearCart
};