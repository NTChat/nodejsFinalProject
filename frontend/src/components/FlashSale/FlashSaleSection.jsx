// frontend/src/components/FlashSale/FlashSaleSection.jsx
// UI kiểu Shopee: 3 tabs (Đang diễn ra | Sắp tới | Ngày mai)
import React, { useState, useEffect, useCallback } from 'react';
import FlashSaleCard from './FlashSaleCard';
import FlashSaleCountdown from './FlashSaleCountdown';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

// Time slots kiểu Shopee
const TIME_SLOTS = [
    { slot: '00:00-09:00', label: '00:00', icon: '🌙' },
    { slot: '09:00-12:00', label: '09:00', icon: '☀️' },
    { slot: '12:00-15:00', label: '12:00', icon: '🌞' },
    { slot: '15:00-18:00', label: '15:00', icon: '🌤️' },
    { slot: '18:00-21:00', label: '18:00', icon: '🌆' },
    { slot: '21:00-00:00', label: '21:00', icon: '🌃' },
];

const FlashSaleSection = () => {
    const [data, setData] = useState({ active: [], upcomingToday: [], tomorrow: [] });
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('active'); // 'active', 'upcoming', 'tomorrow'
    const [selectedSlot, setSelectedSlot] = useState(null);
    const navigate = useNavigate();

    const fetchFlashSales = useCallback(async () => {
        try {
            const { data: response } = await api.get('/flash-sales/homepage');
            console.log('🔥 Flash Sales homepage response:', response);
            
            if (response.success) {
                setData({
                    active: response.active || [],
                    upcomingToday: response.upcomingToday || [],
                    tomorrow: response.tomorrow || []
                });
                
                // Auto select tab based on available data
                if (response.active?.length > 0) {
                    setActiveTab('active');
                    setSelectedSlot(response.active[0]);
                } else if (response.upcomingToday?.length > 0) {
                    setActiveTab('upcoming');
                    setSelectedSlot(response.upcomingToday[0]);
                } else if (response.tomorrow?.length > 0) {
                    setActiveTab('tomorrow');
                    setSelectedSlot(response.tomorrow[0]);
                }
            }
        } catch (error) {
            console.error('❌ Error fetching flash sales:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchFlashSales();
        // Auto refresh every minute to update status
        const interval = setInterval(fetchFlashSales, 60000);
        return () => clearInterval(interval);
    }, [fetchFlashSales]);

    // Chọn tab
    const handleTabChange = (tab) => {
        setActiveTab(tab);
        const list = tab === 'active' ? data.active : tab === 'upcoming' ? data.upcomingToday : data.tomorrow;
        setSelectedSlot(list[0] || null);
    };

    // Chọn time slot
    const handleSlotChange = (slot) => {
        setSelectedSlot(slot);
    };

    // Tính countdown target
    const getCountdownTarget = () => {
        if (!selectedSlot) return null;
        if (activeTab === 'active') {
            return { type: 'end', time: selectedSlot.endTime, label: 'Kết thúc sau' };
        }
        return { type: 'start', time: selectedSlot.startTime, label: 'Bắt đầu sau' };
    };

    // Format time slot label
    const formatTimeSlot = (slot) => {
        const found = TIME_SLOTS.find(t => t.slot === slot.timeSlot);
        return found ? `${found.icon} ${found.label}` : slot.timeSlot;
    };

    // Get current list based on tab
    const getCurrentList = () => {
        switch (activeTab) {
            case 'active': return data.active;
            case 'upcoming': return data.upcomingToday;
            case 'tomorrow': return data.tomorrow;
            default: return [];
        }
    };

    if (loading) {
        return (
            <div className="bg-gradient-to-r from-red-600 to-orange-500 rounded-lg shadow-xl p-8 mb-8">
                <div className="flex items-center justify-center gap-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-4 border-white border-t-transparent"></div>
                    <span className="text-white font-bold">Đang tải Flash Sale...</span>
                </div>
            </div>
        );
    }

    // Không có flash sale nào
    const hasAnyFlashSale = data.active.length > 0 || data.upcomingToday.length > 0 || data.tomorrow.length > 0;
    
    if (!hasAnyFlashSale) {
        return (
            <div className="bg-gradient-to-r from-gray-400 to-gray-500 rounded-lg shadow-xl p-8 mb-8 text-center">
                <div className="flex items-center justify-center gap-2 mb-4">
                    <span className="text-4xl opacity-50">⚡</span>
                    <h2 className="text-3xl font-bold text-white opacity-75">FLASH SALE</h2>
                </div>
                <p className="text-white text-lg mb-4">Hiện chưa có Flash Sale nào</p>
                <p className="text-white/80 text-sm">Hãy quay lại sau để không bỏ lỡ các deal hot nhé!</p>
            </div>
        );
    }

    const countdown = getCountdownTarget();
    const currentList = getCurrentList();

    return (
        <div className="bg-gradient-to-r from-red-600 via-red-500 to-orange-500 rounded-lg shadow-xl overflow-hidden mb-8">
            {/* Header với tabs kiểu Shopee */}
            <div className="bg-gradient-to-r from-red-700 to-red-600 px-4 md:px-6 py-3 md:py-4">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 md:gap-4">
                    {/* Logo + Title */}
                    <div className="flex items-center gap-2 md:gap-3">
                        <span className="text-2xl md:text-4xl animate-pulse">⚡</span>
                        <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-white tracking-wider">FLASH SALE</h2>
                    </div>

                    {/* Tabs: Đang diễn ra | Sắp tới | Ngày mai */}
                    <div className="flex bg-red-800/50 rounded-lg p-1 overflow-x-auto w-full md:w-auto">
                        <button
                            onClick={() => handleTabChange('active')}
                            className={`px-3 md:px-4 py-1.5 md:py-2 rounded-md font-bold text-xs md:text-sm transition-all whitespace-nowrap ${
                                activeTab === 'active'
                                    ? 'bg-white text-red-600 shadow-md'
                                    : 'text-white hover:bg-white/10'
                            } ${data.active.length === 0 ? 'opacity-50' : ''}`}
                            disabled={data.active.length === 0}
                        >
                            🔴 Đang diễn ra
                            {data.active.length > 0 && (
                                <span className="ml-1 bg-yellow-400 text-red-700 text-xs px-1.5 rounded-full">
                                    {data.active.length}
                                </span>
                            )}
                        </button>
                        <button
                            onClick={() => handleTabChange('upcoming')}
                            className={`px-3 md:px-4 py-1.5 md:py-2 rounded-md font-bold text-xs md:text-sm transition-all whitespace-nowrap ${
                                activeTab === 'upcoming'
                                    ? 'bg-white text-red-600 shadow-md'
                                    : 'text-white hover:bg-white/10'
                            } ${data.upcomingToday.length === 0 ? 'opacity-50' : ''}`}
                            disabled={data.upcomingToday.length === 0}
                        >
                            ⏰ Sắp tới
                            {data.upcomingToday.length > 0 && (
                                <span className="ml-1 bg-yellow-400 text-red-700 text-xs px-1.5 rounded-full">
                                    {data.upcomingToday.length}
                                </span>
                            )}
                        </button>
                        <button
                            onClick={() => handleTabChange('tomorrow')}
                            className={`px-3 md:px-4 py-1.5 md:py-2 rounded-md font-bold text-xs md:text-sm transition-all whitespace-nowrap ${
                                activeTab === 'tomorrow'
                                    ? 'bg-white text-red-600 shadow-md'
                                    : 'text-white hover:bg-white/10'
                            } ${data.tomorrow.length === 0 ? 'opacity-50' : ''}`}
                            disabled={data.tomorrow.length === 0}
                        >
                            📅 Ngày mai
                            {data.tomorrow.length > 0 && (
                                <span className="ml-1 bg-yellow-400 text-red-700 text-xs px-1.5 rounded-full">
                                    {data.tomorrow.length}
                                </span>
                            )}
                        </button>
                    </div>

                    {/* Countdown + View All */}
                    <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
                        {countdown && selectedSlot && (
                            <div className="flex items-center gap-2">
                                <span className="text-white/80 text-xs md:text-sm">{countdown.label}:</span>
                                <FlashSaleCountdown 
                                    endTime={countdown.time} 
                                    onExpire={fetchFlashSales}
                                />
                            </div>
                        )}

                        {/* View All Button */}
                        <button
                            onClick={() => navigate('/flash-sale')}
                            className="bg-white text-red-600 px-3 md:px-4 py-1.5 md:py-2 rounded-full font-bold text-xs md:text-sm hover:bg-gray-100 transition-colors shadow-md whitespace-nowrap"
                        >
                            Xem tất cả →
                        </button>
                    </div>
                </div>
            </div>

            {/* Time Slot Selector */}
            {currentList.length > 1 && (
                <div className="bg-red-600/50 px-6 py-3">
                    <div className="flex gap-2 overflow-x-auto pb-1">
                        {currentList.map((slot) => (
                            <button
                                key={slot._id}
                                onClick={() => handleSlotChange(slot)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm whitespace-nowrap transition-all ${
                                    selectedSlot?._id === slot._id
                                        ? 'bg-white text-red-600 shadow-lg scale-105'
                                        : 'bg-red-700/50 text-white hover:bg-red-700'
                                }`}
                            >
                                <span>{formatTimeSlot(slot)}</span>
                                {slot.products?.length > 0 && (
                                    <span className="bg-yellow-400 text-red-700 text-xs px-1.5 rounded-full">
                                        {slot.products.length}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Products Grid */}
            <div className="p-6">
                {selectedSlot && selectedSlot.products?.length > 0 ? (
                    <>
                        {/* Flash Sale Name & Description */}
                        {selectedSlot.name && (
                            <div className="mb-4 text-center">
                                <h3 className="text-xl font-bold text-white">{selectedSlot.name}</h3>
                                {selectedSlot.description && (
                                    <p className="text-white/80 text-sm mt-1">{selectedSlot.description}</p>
                                )}
                            </div>
                        )}

                        {/* Products */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
                            {selectedSlot.products.slice(0, 12).map((product) => (
                                <FlashSaleCard
                                    key={product.productId?._id || product._id}
                                    product={product}
                                    flashSale={selectedSlot}
                                    isUpcoming={activeTab !== 'active'}
                                />
                            ))}
                        </div>

                        {/* View more if has more products */}
                        {selectedSlot.products.length > 12 && (
                            <div className="text-center mt-6">
                                <button
                                    onClick={() => navigate('/flash-sale')}
                                    className="bg-white/20 backdrop-blur text-white px-8 py-3 rounded-full font-bold hover:bg-white/30 transition-colors"
                                >
                                    Xem thêm {selectedSlot.products.length - 12} sản phẩm →
                                </button>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="text-center py-8">
                        <span className="text-6xl mb-4 block">📦</span>
                        <p className="text-white text-lg">Chưa có sản phẩm trong khung giờ này</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default FlashSaleSection;
