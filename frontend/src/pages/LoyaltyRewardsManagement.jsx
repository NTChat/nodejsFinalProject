// frontend/src/pages/LoyaltyRewardsManagement.jsx
import React, { useState, useEffect } from 'react';
import { Gift, Plus, Trash2, Edit, Star, Percent } from 'lucide-react';
import { toast } from 'react-toastify';
import api from '../services/api';
import Breadcrumb from '../components/common/Breadcrumb';

export default function LoyaltyRewardsManagement() {
    const [rewards, setRewards] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState(null);
    
    const [formData, setFormData] = useState({
        discountName: '',
        discountCode: '',
        percent: '',
        maxUses: '10',
        pointsCost: ''
    });

    useEffect(() => {
        fetchRewards();
    }, []);

    const fetchRewards = async () => {
        try {
            setLoading(true);
            const res = await api.get('/discounts?isRedeemable=true');
            const rewardsList = res.data.discounts || res.data || [];
            setRewards(rewardsList.filter(r => r.isRedeemable));
        } catch (error) {
            toast.error('Lỗi tải danh sách quà đổi điểm');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.discountName || !formData.discountCode || !formData.percent || !formData.pointsCost) {
            toast.error('Vui lòng điền đầy đủ thông tin');
            return;
        }

        try {
            const payload = {
                ...formData,
                isRedeemable: true,
                conditionType: 'all',
                percent: parseInt(formData.percent),
                maxUses: parseInt(formData.maxUses),
                pointsCost: parseInt(formData.pointsCost)
            };

            if (editingId) {
                await api.put(`/discounts/${editingId}`, payload);
                toast.success('Cập nhật quà thành công');
            } else {
                await api.post('/discounts', payload);
                toast.success('Tạo quà đổi điểm thành công');
            }

            setShowModal(false);
            resetForm();
            fetchRewards();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Có lỗi xảy ra');
        }
    };

    const handleEdit = (reward) => {
        setEditingId(reward._id);
        setFormData({
            discountName: reward.discountName,
            discountCode: reward.discountCode,
            percent: reward.percent.toString(),
            maxUses: reward.maxUses.toString(),
            pointsCost: reward.pointsCost.toString()
        });
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Xóa quà đổi điểm này?')) return;
        
        try {
            await api.delete(`/discounts/${id}`);
            toast.success('Đã xóa quà đổi điểm');
            fetchRewards();
        } catch (error) {
            toast.error('Lỗi khi xóa');
        }
    };

    const resetForm = () => {
        setFormData({
            discountName: '',
            discountCode: '',
            percent: '',
            maxUses: '10',
            pointsCost: ''
        });
        setEditingId(null);
    };

    const breadcrumbs = [
        { label: "Dashboard", link: "/admin" },
        { label: "Quà đổi điểm" }
    ];

    return (
        <div className="p-6">
            <Breadcrumb crumbs={breadcrumbs} />

            <div className="bg-white rounded-lg shadow-md p-6 mt-6">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                            <Gift className="text-orange-500" size={28} />
                            Quản lý Quà đổi điểm
                        </h1>
                        <p className="text-sm text-gray-500 mt-1">
                            Tạo và quản lý voucher có thể đổi bằng điểm thưởng
                        </p>
                    </div>
                    <button
                        onClick={() => { resetForm(); setShowModal(true); }}
                        className="flex items-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition"
                    >
                        <Plus size={20} />
                        Tạo quà mới
                    </button>
                </div>

                {loading ? (
                    <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
                    </div>
                ) : rewards.length === 0 ? (
                    <div className="text-center py-12">
                        <Gift className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500">Chưa có quà đổi điểm nào</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {rewards.map((reward) => (
                            <div key={reward._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-lg transition">
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex items-center gap-2">
                                        <div className="p-2 bg-orange-100 rounded-lg">
                                            <Gift className="text-orange-600" size={20} />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-gray-800">{reward.discountName}</h3>
                                            <p className="text-xs text-gray-500 font-mono">{reward.discountCode}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-1">
                                        <button
                                            onClick={() => handleEdit(reward)}
                                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                                        >
                                            <Edit size={16} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(reward._id)}
                                            className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-600">Giảm giá:</span>
                                        <span className="font-bold text-orange-600 flex items-center gap-1">
                                            <Percent size={14} />
                                            {reward.percent}%
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-600">Chi phí:</span>
                                        <span className="font-bold text-blue-600 flex items-center gap-1">
                                            <Star className="fill-current" size={14} />
                                            {reward.pointsCost} điểm
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="text-gray-500">Đã đổi:</span>
                                        <span className="text-gray-700">
                                            {reward.redeemedBy?.length || 0} / {reward.maxUses}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg w-full max-w-md mx-4">
                        <div className="flex justify-between items-center p-6 border-b">
                            <h2 className="text-xl font-bold text-gray-800">
                                {editingId ? 'Chỉnh sửa quà' : 'Tạo quà đổi điểm mới'}
                            </h2>
                            <button onClick={() => { setShowModal(false); resetForm(); }} className="text-gray-400 hover:text-gray-600">
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Tên quà <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                    placeholder="VD: Voucher giảm 10%"
                                    value={formData.discountName}
                                    onChange={(e) => setFormData({...formData, discountName: e.target.value})}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Mã voucher <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 uppercase font-mono"
                                    placeholder="VD: GIFT10"
                                    value={formData.discountCode}
                                    onChange={(e) => setFormData({...formData, discountCode: e.target.value.toUpperCase()})}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        % Giảm <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="100"
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                        value={formData.percent}
                                        onChange={(e) => setFormData({...formData, percent: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Số lượng <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                        value={formData.maxUses}
                                        onChange={(e) => setFormData({...formData, maxUses: e.target.value})}
                                    />
                                </div>
                            </div>

                            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                                <label className="block text-sm font-medium text-orange-700 mb-1 flex items-center gap-2">
                                    <Star className="fill-current" size={14} />
                                    Số điểm cần đổi <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    className="w-full border border-orange-300 rounded-lg px-3 py-2"
                                    placeholder="VD: 100"
                                    value={formData.pointsCost}
                                    onChange={(e) => setFormData({...formData, pointsCost: e.target.value})}
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    User cần {formData.pointsCost || '??'} điểm để đổi voucher này
                                </p>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => { setShowModal(false); resetForm(); }}
                                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                                >
                                    Hủy
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
                                >
                                    {editingId ? 'Cập nhật' : 'Tạo quà'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
