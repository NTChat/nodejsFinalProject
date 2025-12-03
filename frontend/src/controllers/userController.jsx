// frontend/src/controllers/userController.jsx
import api from "../services/api"; // API chính
import axios from "axios"; // Dùng riêng cho Province
import { toast } from "react-toastify";
const provinceRequest = axios.create({
    baseURL: "https://provinces.open-api.vn/api/",
});

const handleApiError = (error, customMessage) => {
    const message = error.response?.data?.message || error.message || customMessage;
    toast.error(message);
    throw new Error(message);
};

export const UserController = {

    // === ADMIN USER MANAGEMENT ===
    // Tích hợp logic từ userApi.js cũ
    getUsers: async ({ page = 1, limit = 10, keyword = "" } = {}) => {
        try {
            const params = { page, limit, keyword };
            const response = await api.get('/users', { params });
            return response.data;
        } catch (error) {
            handleApiError(error, "Lỗi tải danh sách người dùng.");
        }
    },

    getUserById: async (userId) => {
        try {
            const response = await api.get(`/users/${userId}`);
            return response.data.user;
        } catch (error) {
            handleApiError(error, "Lỗi tải thông tin người dùng.");
        }
    },

    adminUpdateUser: async (userId, userData) => {
        try {
            const response = await api.put(`/users/${userId}`, userData);
            return response.data;
        } catch (error) {
            handleApiError(error, "Lỗi cập nhật người dùng.");
        }
    },

    deleteUser: async (userId) => {
        try {
            const response = await api.delete(`/users/${userId}`);
            return response.data;
        } catch (error) {
            handleApiError(error, "Lỗi xóa người dùng.");
        }
    },

    banUser: async (userId) => {
        try {
            const response = await api.put(`/users/${userId}/ban`);
            return response.data;
        } catch (error) {
            handleApiError(error, "Lỗi khi cấm người dùng.");
        }
    },

    // 👈 NÂNG CẤP: Migrate isBanned field
    migrateIsBanned: async () => {
        try {
            const response = await api.post('/auth/migrate-is-banned');
            return response.data;
        } catch (error) {
            handleApiError(error, "Lỗi khi migrate isBanned field.");
        }
    },

    // === PROFILE ===
    updateProfile: async (formData) => {
        try {
            const response = await api.put('/users/me', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            if (response.data?.success) return response.data.user;
            throw new Error(response.data?.message);
        } catch (error) {
            handleApiError(error, "Lỗi cập nhật hồ sơ.");
        }
    },

    changeMyPassword: async (passwordData) => {
        try {
            const response = await api.put('/users/change-password', passwordData);
            if (response.data?.success) return response.data;
            throw new Error(response.data?.message);
        } catch (error) {
            handleApiError(error, "Lỗi đổi mật khẩu.");
        }
    },

    // === ADDRESSES ===
    getMyAddresses: async () => {
        try {
            const response = await api.get('/users/addresses');
            return response.data;
        } catch (error) {
            handleApiError(error, "Lỗi tải địa chỉ.");
        }
    },
    // Alias cho getMyAddresses (dùng trong CheckoutPage)
    getShippingAddresses: async () => {
        try {
            const response = await api.get('/users/addresses');
            return response.data?.addresses || response.data || [];
        } catch (error) {
            console.error("Lỗi tải địa chỉ:", error);
            return [];
        }
    },
    addAddress: async (data) => {
        try {
            const response = await api.post('/users/addresses', data);
            return response.data;
        } catch (error) {
            handleApiError(error, "Lỗi thêm địa chỉ.");
        }
    },
    updateAddress: async (id, data) => {
        try {
            const response = await api.put(`/users/addresses/${id}`, data);
            return response.data;
        } catch (error) {
            handleApiError(error, "Lỗi cập nhật địa chỉ.");
        }
    },
    deleteAddress: async (id) => {
        try {
            const response = await api.delete(`/users/addresses/${id}`);
            return response.data;
        } catch (error) {
            handleApiError(error, "Lỗi xóa địa chỉ.");
        }
    },
    setDefaultAddress: async (id) => {
        try {
            const response = await api.put(`/users/addresses/${id}/default`);
            return response.data;
        } catch (error) {
            handleApiError(error, "Lỗi đặt địa chỉ mặc định.");
        }
    },

    // === PROVINCES (Đã gọi trực tiếp provinceRequest ở trên) ===
    getProvinces: async () => {
        try {
            const response = await provinceRequest.get('p/');
            return response.data || [];
        } catch (error) {
            handleApiError(error, "Lỗi tải Tỉnh/Thành.");
            return [];
        }
    },
    getDistricts: async (provinceCode) => {
        if (!provinceCode) return [];
        try {
            const response = await provinceRequest.get(`p/${provinceCode}`, { params: { depth: 2 } });
            return response.data?.districts || [];
        } catch (error) {
            handleApiError(error, "Lỗi tải Quận/Huyện.");
            return [];
        }
    },
    getWards: async (districtCode) => {
        if (!districtCode) return [];
        try {
            const response = await provinceRequest.get(`d/${districtCode}`, { params: { depth: 2 } });
            return response.data?.wards || [];
        } catch (error) {
            handleApiError(error, "Lỗi tải Phường/Xã.");
            return [];
        }
    }
};