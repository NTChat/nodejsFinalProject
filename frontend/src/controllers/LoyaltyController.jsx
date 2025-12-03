// frontend/src/controllers/LoyaltyController.jsx
import api from '../services/api';

class LoyaltyController {
    // Lấy điểm thưởng của user
    static async getLoyaltyPoints() {
        try {
            const response = await api.get('/loyalty/points');
            return response.data;
        } catch (error) {
            console.error('Error fetching loyalty points:', error);
            throw error;
        }
    }

    // Lấy danh sách vouchers có thể đổi
    static async getAvailableVouchers() {
        try {
            const response = await api.get('/loyalty/vouchers/available');
            return response.data;
        } catch (error) {
            console.error('Error fetching available vouchers:', error);
            throw error;
        }
    }

    // Đổi điểm lấy voucher
    static async redeemVoucher(voucherId) {
        try {
            const response = await api.post('/loyalty/vouchers/redeem', { voucherId });
            return response.data;
        } catch (error) {
            console.error('Error redeeming voucher:', error);
            throw error;
        }
    }

    // Lấy danh sách vouchers đã đổi
    static async getRedeemedVouchers() {
        try {
            const response = await api.get('/loyalty/vouchers/redeemed');
            return response.data;
        } catch (error) {
            console.error('Error fetching redeemed vouchers:', error);
            throw error;
        }
    }
}

export default LoyaltyController;
