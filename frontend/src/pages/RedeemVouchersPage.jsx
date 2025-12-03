// frontend/src/pages/RedeemVouchersPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Gift, Star, Tag, Check, AlertCircle } from 'lucide-react';
import LoyaltyController from '../controllers/LoyaltyController';

const RedeemVouchersPage = () => {
    const [availableVouchers, setAvailableVouchers] = useState([]);
    const [redeemedVouchers, setRedeemedVouchers] = useState([]);
    const [loyaltyPoints, setLoyaltyPoints] = useState(0);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('available'); // 'available' hoặc 'redeemed'
    const [message, setMessage] = useState({ type: '', text: '' });

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const [pointsData, availableData, redeemedData] = await Promise.all([
                LoyaltyController.getLoyaltyPoints(),
                LoyaltyController.getAvailableVouchers(),
                LoyaltyController.getRedeemedVouchers()
            ]);

            setLoyaltyPoints(pointsData.loyaltyPoints || 0);
            setAvailableVouchers(availableData.vouchers || []);
            setRedeemedVouchers(redeemedData.vouchers || []);
        } catch (error) {
            console.error('Error fetching data:', error);
            showMessage('error', 'Không thể tải dữ liệu. Vui lòng thử lại.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleRedeemVoucher = async (voucherId) => {
        try {
            const response = await LoyaltyController.redeemVoucher(voucherId);
            showMessage('success', response.message);
            
            // Cập nhật lại dữ liệu
            fetchData();
        } catch (error) {
            const errorMsg = error.response?.data?.message || 'Đổi voucher thất bại';
            showMessage('error', errorMsg);
        }
    };

    const showMessage = (type, text) => {
        setMessage({ type, text });
        setTimeout(() => setMessage({ type: '', text: '' }), 5000);
    };

    const VoucherCard = ({ voucher, type }) => {
        const isRedeemed = type === 'redeemed';
        const canAfford = loyaltyPoints >= voucher.pointsCost;
        const isAlreadyRedeemed = redeemedVouchers.some(v => v._id === voucher._id);

        return (
            <div className={`bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow ${
                isRedeemed ? 'border-l-4 border-green-500' : ''
            }`}>
                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center">
                        <div className={`p-3 rounded-full ${
                            isRedeemed ? 'bg-green-100' : 'bg-orange-100'
                        }`}>
                            <Tag className={`w-6 h-6 ${
                                isRedeemed ? 'text-green-600' : 'text-orange-600'
                            }`} />
                        </div>
                        <div className="ml-4">
                            <h3 className="text-lg font-semibold text-gray-800">
                                {voucher.discountName}
                            </h3>
                            <p className="text-sm text-gray-500">
                                Mã: <span className="font-mono font-bold text-orange-600">
                                    {voucher.discountCode}
                                </span>
                            </p>
                        </div>
                    </div>
                    {isRedeemed && (
                        <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium flex items-center">
                            <Check className="w-4 h-4 mr-1" />
                            Đã đổi
                        </div>
                    )}
                </div>

                <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Giảm giá:</span>
                        <span className="font-bold text-orange-600 text-lg">
                            {voucher.percent}%
                        </span>
                    </div>
                    {!isRedeemed && (
                        <>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-600">Chi phí:</span>
                                <span className="font-bold text-blue-600 flex items-center">
                                    <Star className="w-4 h-4 mr-1 fill-current" />
                                    {voucher.pointsCost} điểm
                                </span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-600">Còn lại:</span>
                                <span className="text-gray-700">
                                    {(voucher.maxUses || 0) - (voucher.uses || 0)} lượt
                                </span>
                            </div>
                        </>
                    )}
                    {isRedeemed && voucher.redeemedAt && (
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Ngày đổi:</span>
                            <span className="text-gray-700">
                                {new Date(voucher.redeemedAt).toLocaleDateString('vi-VN')}
                            </span>
                        </div>
                    )}
                    {voucher.endDate && (
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Hạn sử dụng:</span>
                            <span className="text-gray-700">
                                {new Date(voucher.endDate).toLocaleDateString('vi-VN')}
                            </span>
                        </div>
                    )}
                </div>

                {!isRedeemed && (
                    <button
                        onClick={() => handleRedeemVoucher(voucher._id)}
                        disabled={!canAfford || isAlreadyRedeemed}
                        className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
                            canAfford && !isAlreadyRedeemed
                                ? 'bg-orange-500 text-white hover:bg-orange-600'
                                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }`}
                    >
                        {isAlreadyRedeemed
                            ? 'Đã đổi voucher này'
                            : canAfford
                            ? 'Đổi ngay'
                            : 'Không đủ điểm'}
                    </button>
                )}
            </div>
        );
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Đang tải...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="container mx-auto px-4 max-w-7xl">
                {/* Header */}
                <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg shadow-lg p-8 mb-8 text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold mb-2 flex items-center">
                                <Gift className="w-8 h-8 mr-3" />
                                Đổi Điểm Thưởng
                            </h1>
                            <p className="text-orange-100">
                                Sử dụng điểm thưởng để đổi lấy voucher giảm giá
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="text-sm text-orange-100 mb-1">Điểm của bạn</p>
                            <div className="flex items-center justify-end">
                                <Star className="w-6 h-6 mr-2 fill-current" />
                                <span className="text-4xl font-bold">{loyaltyPoints}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Message Alert */}
                {message.text && (
                    <div className={`mb-6 p-4 rounded-lg flex items-center ${
                        message.type === 'success'
                            ? 'bg-green-50 text-green-800 border border-green-200'
                            : 'bg-red-50 text-red-800 border border-red-200'
                    }`}>
                        <AlertCircle className="w-5 h-5 mr-3" />
                        {message.text}
                    </div>
                )}

                {/* Tabs */}
                <div className="mb-6 border-b border-gray-200">
                    <nav className="flex space-x-8">
                        <button
                            onClick={() => setActiveTab('available')}
                            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                                activeTab === 'available'
                                    ? 'border-orange-500 text-orange-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                        >
                            Voucher khả dụng ({availableVouchers.length})
                        </button>
                        <button
                            onClick={() => setActiveTab('redeemed')}
                            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                                activeTab === 'redeemed'
                                    ? 'border-orange-500 text-orange-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                        >
                            Voucher đã đổi ({redeemedVouchers.length})
                        </button>
                    </nav>
                </div>

                {/* Vouchers Grid */}
                {activeTab === 'available' ? (
                    availableVouchers.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {availableVouchers.map((voucher) => (
                                <VoucherCard key={voucher._id} voucher={voucher} type="available" />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <Gift className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500 text-lg">
                                Hiện chưa có voucher khả dụng
                            </p>
                        </div>
                    )
                ) : (
                    redeemedVouchers.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {redeemedVouchers.map((voucher) => (
                                <VoucherCard key={voucher._id} voucher={voucher} type="redeemed" />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <Tag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500 text-lg">
                                Bạn chưa đổi voucher nào
                            </p>
                        </div>
                    )
                )}
            </div>
        </div>
    );
};

export default RedeemVouchersPage;
