// frontend/src/controllers/categoryController.jsx
import api from '../services/api';
import { toast } from 'react-toastify';

export const CategoryController = {
    getAll: async (params = {}) => {
        try {
            const response = await api.get('/categories', { params });
            console.log('📂 Categories fetched:', response.data);
            return response.data.categories || [];
        } catch (error) {
            console.error('❌ Error fetching categories:', error);
            toast.error('Lỗi khi tải danh mục');
            return [];
        }
    },

    getById: async (id) => {
        try {
            const response = await api.get(`/categories/${id}`);
            return response.data.category || null;
        } catch (error) {
            console.error('❌ Error fetching category:', error);
            toast.error('Lỗi khi tải thông tin danh mục');
            return null;
        }
    },

    create: async (data, isFormData = false) => {
        try {
            const config = isFormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : {};
            const response = await api.post('/categories', data, config);
            toast.success(response.data.message || 'Thêm danh mục thành công!');
            return response.data.category;
        } catch (error) {
            console.error('❌ Error creating category:', error);
            const message = error.response?.data?.message || 'Lỗi khi thêm danh mục';
            toast.error(message);
            throw error;
        }
    },

    update: async (id, data, isFormData = false) => {
        try {
            const config = isFormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : {};
            const response = await api.put(`/categories/${id}`, data, config);
            toast.success(response.data.message || 'Cập nhật thành công!');
            return response.data.category;
        } catch (error) {
            console.error('❌ Error updating category:', error);
            const message = error.response?.data?.message || 'Lỗi khi cập nhật danh mục';
            toast.error(message);
            throw error;
        }
    },

    delete: async (id) => {
        try {
            const response = await api.delete(`/categories/${id}`);
            toast.success(response.data.message || 'Đã xóa danh mục!');
            return true;
        } catch (error) {
            console.error('❌ Error deleting category:', error);
            const message = error.response?.data?.message || 'Lỗi khi xóa danh mục';
            toast.error(message);
            throw error;
        }
    },

    getStats: async () => {
        try {
            const response = await api.get('/categories/stats');
            return response.data.stats || { total: 0, active: 0, inactive: 0 };
        } catch (error) {
            console.error('❌ Error fetching stats:', error);
            return { total: 0, active: 0, inactive: 0 };
        }
    }
};