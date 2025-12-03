// frontend/src/controllers/orderController.jsx
import api from '../services/api';

const BASE_URL = '/orders';

const getMyOrders = async () => {
    try {
        const response = await api.get(`${BASE_URL}/myorders`);
        return response.data.orders || [];
    } catch (error) {
        console.error("Lỗi getMyOrders:", error);
        return [];
    }
};

const getAllOrdersForAdmin = async (params) => {
    try {
        // Tích hợp logic ordersApi.list
        const response = await api.get(`${BASE_URL}/admin/all`, { params });
        return response.data.orders || response.data.data || [];
    } catch (error) {
        console.error("Lỗi getAllOrdersForAdmin:", error);
        throw error;
    }
};

const getOrderDetail = async (orderId) => {
    try {
        // Tích hợp logic ordersApi.detail
        const response = await api.get(`${BASE_URL}/${orderId}`);
        return response.data.order || response.data;
    } catch (error) {
        console.error("Error fetching order detail:", error);
        const message = error.response?.data?.message || error.message || "Không thể tải chi tiết đơn hàng";
        throw new Error(message);
    }
};

const updateOrderStatus = async (orderId, status) => {
    try {
        // Tích hợp logic ordersApi.updateStatus
        const response = await api.put(`${BASE_URL}/${orderId}/status`, { status });
        return response.data;
    } catch (error) {
        throw error;
    }
};
// 1. Tạo đơn hàng mới
const createOrder = async (orderData) => {
    try {
        console.log('🚀 Sending order request:', orderData);
        const response = await api.post('/orders', orderData);
        console.log('📨 Received order response:', response.data);
        return response.data; // Trả về { success: true, order: {...} }
    } catch (error) {
        console.error('❌ Order creation failed:', error.response?.data || error.message);
        throw error;
    }
};

// 1b. Tạo đơn hàng với hình ảnh xác nhận thanh toán
const createOrderWithPaymentImage = async (formData) => {
    try {
        console.log('🚀 Sending order with image request');
        const response = await api.post('/orders/with-payment-image', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        console.log('📨 Received order with image response:', response.data);
        return response.data;
    } catch (error) {
        console.error('❌ Order with image creation failed:', error.response?.data || error.message);
        throw error;
    }
};

// 2. Kiểm tra mã giảm giá
const validateCoupon = async (code, orderTotal) => {
    try {
        const response = await api.get(`/discounts/validate?code=${code}`);
        return response.data; // { valid: true, percent: 10 }
    } catch (error) {
        throw new Error(error.response?.data?.message || "Mã không hợp lệ");
    }
};

// 4. Check trạng thái đơn hàng (cho VNPay polling)
const checkOrderStatus = async (orderId) => {
    try {
        const response = await api.get(`/orders/status/${orderId}`);
        return response.data; // { success: true, isPaid: true, status: "Confirmed", ... }
    } catch (error) {
        console.error("Lỗi check order status:", error);
        throw error;
    }
};

// 🆕 5. Hủy đơn hàng (User)
const cancelOrder = async (orderId, { reason }) => {
    try {
        const response = await api.post(`${BASE_URL}/${orderId}/cancel`, { reason });
        return response.data; // { success: true, message: "Đã hủy...", order: {...} }
    } catch (error) {
        throw new Error(error.response?.data?.message || "Lỗi hủy đơn hàng");
    }
};

// 🆕 6. Upload chứng từ thanh toán (User)
const uploadPaymentProof = async (orderId, imageFile) => {
    try {
        const formData = new FormData();
        formData.append('paymentProof', imageFile);
        
        const response = await api.post(`${BASE_URL}/${orderId}/upload-payment-proof-cloudinary`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || "Lỗi upload chứng từ");
    }
};

export const OrderController = {
    getMyOrders,
    getAllOrdersForAdmin,
    getOrderDetail,
    updateOrderStatus,
    createOrder,
    createOrderWithPaymentImage,
    validateCoupon,
    checkOrderStatus,
    cancelOrder,
    uploadPaymentProof
};