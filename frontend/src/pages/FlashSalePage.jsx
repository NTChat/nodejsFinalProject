// frontend/src/pages/FlashSalePage.jsx
import React, { useState, useEffect } from 'react';
import FlashSaleCard from '../components/FlashSale/FlashSaleCard';
import FlashSaleCountdown from '../components/FlashSale/FlashSaleCountdown';

const FlashSalePage = () => {
    const [activeFlashSales, setActiveFlashSales] = useState([]);
    const [upcomingFlashSales, setUpcomingFlashSales] = useState([]);
    const [selectedTab, setSelectedTab] = useState('active');
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchFlashSales();
    }, []);

    useEffect(() => {
        if (activeFlashSales.length > 0 && selectedTab === 'active') {
            setSelectedSlot(activeFlashSales[0]);
        } else if (upcomingFlashSales.length > 0 && selectedTab === 'upcoming') {
            setSelectedSlot(upcomingFlashSales[0]);
        }
    }, [activeFlashSales, upcomingFlashSales, selectedTab]);

    const fetchFlashSales = async () => {
        try {
            const [activeResponse, upcomingResponse] = await Promise.all([
                fetch('/api/flash-sales/active'),
                fetch('/api/flash-sales/upcoming')
            ]);

            const activeData = await activeRes.json();
            const upcomingData = await upcomingRes.json();

            if (activeData.success) {
                setActiveFlashSales(activeData.data);
            }
            if (upcomingData.success) {
                setUpcomingFlashSales(upcomingData.data);
            }
        } catch (error) {
            console.error('Error fetching flash sales:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleTabChange = (tab) => {
        setSelectedTab(tab);
        if (tab === 'active' && activeFlashSales.length > 0) {
            setSelectedSlot(activeFlashSales[0]);
        } else if (tab === 'upcoming' && upcomingFlashSales.length > 0) {
            setSelectedSlot(upcomingFlashSales[0]);
        }
    };

    const currentSales = selectedTab === 'active' ? activeFlashSales : upcomingFlashSales;

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-red-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600 text-lg">Đang tải Flash Sale...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 py-8">
            <div className="max-w-7xl mx-auto px-4">
                {/* Header Banner */}
                <div className="bg-gradient-to-r from-red-600 to-orange-500 rounded-lg shadow-xl p-8 mb-8 text-center">
                    <div className="flex items-center justify-center gap-3 mb-4">
                        <span className="text-5xl">⚡</span>
                        <h1 className="text-5xl font-bold text-white">FLASH SALE</h1>
                        <span className="text-5xl">⚡</span>
                    </div>
                    <p className="text-white text-xl">Giảm giá cực sốc - Giới hạn thời gian & số lượng</p>
                </div>

                {/* Tabs */}
                <div className="flex gap-4 mb-6">
                    <button
                        onClick={() => handleTabChange('active')}
                        className={`flex-1 py-4 rounded-lg font-bold text-lg transition-colors ${
                            selectedTab === 'active'
                                ? 'bg-red-600 text-white'
                                : 'bg-white text-gray-700 hover:bg-gray-50'
                        }`}
                    >
                        🔥 Đang diễn ra ({activeFlashSales.length})
                    </button>
                    <button
                        onClick={() => handleTabChange('upcoming')}
                        className={`flex-1 py-4 rounded-lg font-bold text-lg transition-colors ${
                            selectedTab === 'upcoming'
                                ? 'bg-red-600 text-white'
                                : 'bg-white text-gray-700 hover:bg-gray-50'
                        }`}
                    >
                        ⏰ Sắp diễn ra ({upcomingFlashSales.length})
                    </button>
                </div>

                {/* Time Slots */}
                {currentSales.length > 0 && (
                    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                        <h3 className="text-lg font-bold text-gray-800 mb-4">Khung giờ Flash Sale</h3>
                        <div className="flex gap-3 overflow-x-auto pb-2">
                            {currentSales.map((sale) => (
                                <button
                                    key={sale._id}
                                    onClick={() => setSelectedSlot(sale)}
                                    className={`px-6 py-3 rounded-lg font-bold whitespace-nowrap transition-colors ${
                                        selectedSlot?._id === sale._id
                                            ? 'bg-red-600 text-white'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                                >
                                    <div className="text-sm">{sale.timeSlot}</div>
                                    {selectedTab === 'active' && (
                                        <div className="text-xs mt-1 opacity-75">Đang diễn ra</div>
                                    )}
                                    {selectedTab === 'upcoming' && (
                                        <div className="text-xs mt-1 opacity-75">
                                            Bắt đầu {new Date(sale.startTime).toLocaleTimeString('vi-VN', { 
                                                hour: '2-digit', 
                                                minute: '2-digit' 
                                            })}
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Selected Slot Content */}
                {selectedSlot ? (
                    <div className="bg-white rounded-lg shadow-md p-6">
                        {/* Slot Header */}
                        <div className="flex items-center justify-between mb-6 pb-4 border-b">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-800">
                                    {selectedSlot.name}
                                </h2>
                                {selectedSlot.description && (
                                    <p className="text-gray-600 mt-1">{selectedSlot.description}</p>
                                )}
                            </div>
                            {selectedTab === 'active' && (
                                <div className="flex items-center gap-3">
                                    <span className="text-gray-700 font-medium">Kết thúc sau:</span>
                                    <FlashSaleCountdown endTime={selectedSlot.endTime} />
                                </div>
                            )}
                            {selectedTab === 'upcoming' && (
                                <div className="flex items-center gap-3">
                                    <span className="text-gray-700 font-medium">Bắt đầu sau:</span>
                                    <FlashSaleCountdown endTime={selectedSlot.startTime} />
                                </div>
                            )}
                        </div>

                        {/* Products Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                            {selectedSlot.products.map((product) => (
                                <FlashSaleCard
                                    key={product.productId._id}
                                    product={product}
                                    flashSale={selectedSlot}
                                />
                            ))}
                        </div>

                        {selectedSlot.products.length === 0 && (
                            <div className="text-center py-12">
                                <span className="text-6xl mb-4 block">📦</span>
                                <p className="text-gray-500 text-lg">Chưa có sản phẩm nào trong Flash Sale này</p>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="bg-white rounded-lg shadow-md p-12 text-center">
                        <span className="text-6xl mb-4 block">🎯</span>
                        <p className="text-gray-500 text-xl">
                            {selectedTab === 'active' 
                                ? 'Hiện tại không có Flash Sale nào đang diễn ra' 
                                : 'Không có Flash Sale nào sắp diễn ra'}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default FlashSalePage;
