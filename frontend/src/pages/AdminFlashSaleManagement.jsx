// frontend/src/pages/AdminFlashSaleManagement.jsx
import React, { useState, useEffect } from 'react';
import FlashSaleCountdown from '../components/FlashSale/FlashSaleCountdown';
import api, { getImageUrl } from '../services/api';
import Calendar from '../components/common/Calendar';

const AdminFlashSaleManagement = () => {
    const [flashSales, setFlashSales] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingFlashSale, setEditingFlashSale] = useState(null);
    const [selectedProducts, setSelectedProducts] = useState([]);
    
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        timeSlot: '09:00-12:00',
        startTime: '',
        endTime: '',
        products: []
    });

    const timeSlots = [
        '09:00-12:00',
        '12:00-15:00',
        '15:00-18:00',
        '18:00-21:00',
        '21:00-00:00'
    ];

    useEffect(() => {
        fetchFlashSales();
        fetchProducts();
    }, []);

    const fetchFlashSales = async () => {
        try {
            const { data } = await api.get('/flash-sales', {
                params: { page: 1, limit: 50 }
            });

            if (data.success) {
                const list = Array.isArray(data.data)
                    ? data.data
                    : Array.isArray(data.flashSales)
                        ? data.flashSales
                        : Array.isArray(data.items)
                            ? data.items
                            : [];
                setFlashSales(list);
            } else {
                console.error('API returned error:', data.message);
            }
        } catch (error) {
            console.error('Error fetching flash sales:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchProducts = async () => {
        try {
            const { data } = await api.get('/products');

            if (data.success) {
                const list = Array.isArray(data.data)
                    ? data.data
                    : Array.isArray(data.products)
                        ? data.products
                        : Array.isArray(data.items)
                            ? data.items
                            : [];
                setProducts(list);
                console.log('✅ Loaded', list.length, 'products');
            }
        } catch (error) {
            console.error('❌ Error fetching products:', error);
            alert('Không thể tải danh sách sản phẩm. Vui lòng kiểm tra backend.');
        }
    };

    const handleInputChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleProductSelect = (productId) => {
        const product = products.find(p => (p._id || p.id || p.productId) === productId);
        if (!product) return;

        if (selectedProducts.find(p => p.productId === productId)) {
            setSelectedProducts(selectedProducts.filter(p => p.productId !== productId));
        } else {
            // Lấy giá từ variant đầu tiên (vì product không có trường price trực tiếp)
            const originalPrice = product.variants?.[0]?.price || product.price || 0;
            setSelectedProducts([
                ...selectedProducts,
                {
                    productId: productId,
                    flashPrice: Math.round(originalPrice * 0.7), // Default 30% discount
                    originalPrice: originalPrice, // Lấy từ product.variants[0].price
                    discountPercent: 30, // Default 30%
                    totalStock: 50,
                    productName: product.productName || product.name || product.title || 'Sản phẩm',
                    productImage: product.images?.[0] || product.image || ''
                }
            ]);
        }
    };

    const updateSelectedProduct = (productId, field, value) => {
        setSelectedProducts(selectedProducts.map(p => {
            if (p.productId !== productId) return p;
            
            const numValue = parseInt(value) || 0;
            
            // Nếu thay đổi % giảm giá → tính lại flashPrice
            if (field === 'discountPercent') {
                const percent = Math.max(0, Math.min(100, numValue)); // Giới hạn 0-100%
                const newFlashPrice = Math.round(p.originalPrice * (100 - percent) / 100);
                return { 
                    ...p, 
                    discountPercent: percent,
                    flashPrice: newFlashPrice
                };
            }
            
            // Nếu thay đổi flashPrice → tính lại % giảm giá
            if (field === 'flashPrice') {
                const newFlashPrice = Math.max(0, numValue);
                const newPercent = p.originalPrice > 0 
                    ? Math.round((1 - newFlashPrice / p.originalPrice) * 100)
                    : 0;
                return { 
                    ...p, 
                    flashPrice: newFlashPrice,
                    discountPercent: Math.max(0, Math.min(100, newPercent))
                };
            }
            
            // Các field khác (totalStock)
            return { ...p, [field]: numValue };
        }));
    };

    const openCreateModal = () => {
        setEditingFlashSale(null);
        setFormData({
            name: '',
            description: '',
            timeSlot: '09:00-12:00',
            startTime: '',
            endTime: '',
            products: []
        });
        setSelectedProducts([]);
        setShowModal(true);
    };

    const openEditModal = (flashSale) => {
        setEditingFlashSale(flashSale);
        setFormData({
            name: flashSale.name,
            description: flashSale.description,
            timeSlot: flashSale.timeSlot,
            startTime: new Date(flashSale.startTime).toISOString().slice(0, 16),
            endTime: new Date(flashSale.endTime).toISOString().slice(0, 16),
            products: flashSale.products
        });
        const flashProducts = Array.isArray(flashSale.products) ? flashSale.products : [];
        setSelectedProducts(flashProducts.map(p => {
            const originalPrice = p.originalPrice || 0;
            const flashPrice = p.flashPrice || 0;
            const discountPercent = originalPrice > 0 
                ? Math.round((1 - flashPrice / originalPrice) * 100)
                : 0;
            
            return {
                productId: p.productId._id || p.productId,
                flashPrice: flashPrice,
                originalPrice: originalPrice,
                discountPercent: discountPercent, // Tính % từ giá hiện tại
                totalStock: p.totalStock,
                productName: p.productId?.productName || p.productName || 'Sản phẩm',
                productImage: p.productId?.images?.[0] || p.productImage || ''
            };
        }));
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (selectedProducts.length === 0) {
            alert('Vui lòng chọn ít nhất 1 sản phẩm');
            return;
        }

        const productsData = selectedProducts.map(p => ({
            productId: p.productId,
            flashPrice: p.flashPrice,
            originalPrice: p.originalPrice,
            totalStock: p.totalStock
        }));

        const submitData = {
            ...formData,
            products: productsData
        };

        try {
            const token = sessionStorage.getItem('token');
            const baseUrl = '/api/flash-sales';
            const url = editingFlashSale 
                ? `${baseUrl}/${editingFlashSale._id}`
                : baseUrl;
            
            const method = editingFlashSale ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(submitData)
            });

            const data = await response.json();

            if (data.success) {
                alert(editingFlashSale ? 'Cập nhật Flash Sale thành công!' : 'Tạo Flash Sale thành công!');
                setShowModal(false);
                fetchFlashSales();
            } else {
                alert(data.message || 'Có lỗi xảy ra');
            }
        } catch (error) {
            console.error('Error saving flash sale:', error);
            alert('Không thể lưu Flash Sale');
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Bạn có chắc muốn xóa Flash Sale này?')) return;

        try {
            const token = sessionStorage.getItem('token');
            const baseUrl = '/api/flash-sales';
            const response = await fetch(`${baseUrl}/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();

            if (data.success) {
                alert('Xóa Flash Sale thành công!');
                fetchFlashSales();
            } else {
                alert(data.message || 'Không thể xóa Flash Sale');
            }
        } catch (error) {
            console.error('Error deleting flash sale:', error);
            alert('Không thể xóa Flash Sale');
        }
    };

    const getStatusBadge = (status) => {
        const badges = {
            upcoming: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Sắp diễn ra' },
            active: { bg: 'bg-green-100', text: 'text-green-700', label: 'Đang diễn ra' },
            ended: { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Đã kết thúc' }
        };
        const badge = badges[status] || badges.ended;
        return (
            <span className={`${badge.bg} ${badge.text} px-3 py-1 rounded-full text-sm font-bold`}>
                {badge.label}
            </span>
        );
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 py-8">
            <div className="max-w-7xl mx-auto px-4">
                {/* Header */}
                <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                                <span>⚡</span>
                                Quản lý Flash Sale
                            </h1>
                            <p className="text-gray-600 mt-1">Tạo và quản lý các chương trình Flash Sale</p>
                        </div>
                        <button
                            onClick={openCreateModal}
                            className="bg-red-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-red-700 transition-colors"
                        >
                            + Tạo Flash Sale mới
                        </button>
                    </div>
                </div>

                {/* Flash Sales List */}
                <div className="space-y-4">
                    {flashSales.map((flashSale) => (
                        <div key={flashSale._id} className="bg-white rounded-lg shadow-md p-6">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <h3 className="text-xl font-bold text-gray-800">{flashSale.name}</h3>
                                        {getStatusBadge(flashSale.status)}
                                    </div>
                                    <p className="text-gray-600 mb-2">{flashSale.description}</p>
                                    <div className="flex items-center gap-4 text-sm text-gray-600">
                                        <span>⏰ {flashSale.timeSlot}</span>
                                        <span>
                                            {new Date(flashSale.startTime).toLocaleString('vi-VN')} 
                                            {' → '} 
                                            {new Date(flashSale.endTime).toLocaleString('vi-VN')}
                                        </span>
                                        <span>📦 {flashSale.products.length} sản phẩm</span>
                                        <span>👁️ {flashSale.viewCount || 0} lượt xem</span>
                                    </div>
                                </div>
                                
                                {flashSale.status === 'active' && (
                                    <FlashSaleCountdown endTime={flashSale.endTime} />
                                )}

                                <div className="flex gap-2 ml-4">
                                    {flashSale.status !== 'ended' && (
                                        <button
                                            onClick={() => openEditModal(flashSale)}
                                            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                                        >
                                            Sửa
                                        </button>
                                    )}
                                    <button
                                        onClick={() => handleDelete(flashSale._id)}
                                        className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                                    >
                                        Xóa
                                    </button>
                                </div>
                            </div>

                            {/* Products Preview */}
                            <div className="grid grid-cols-6 gap-4">
                                {flashSale.products.slice(0, 6).map((product) => (
                                    <div key={product._id} className="border rounded-lg p-2">
                                        <img 
                                            src={getImageUrl(product.productId.images?.[0])} 
                                            alt={product.productId.productName}
                                            className="w-full h-24 object-cover rounded mb-2"
                                        />
                                        <p className="text-xs text-gray-700 line-clamp-2 mb-1">
                                            {product.productId?.productName || 'N/A'}
                                        </p>
                                        <p className="text-sm font-bold text-red-600">
                                            {(product.flashPrice || 0).toLocaleString()}₫
                                        </p>
                                        <p className="text-xs text-gray-400">
                                            Đã bán: {product.soldCount || 0}/{product.totalStock || 0}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}

                    {flashSales.length === 0 && (
                        <div className="bg-white rounded-lg shadow-md p-12 text-center">
                            <span className="text-6xl block mb-4">📦</span>
                            <p className="text-gray-500 text-lg">Chưa có Flash Sale nào</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[95vh] flex flex-col">
                        <div className="p-6 border-b">
                            <h2 className="text-2xl font-bold text-gray-800">
                                {editingFlashSale ? 'Sửa Flash Sale' : 'Tạo Flash Sale mới'}
                            </h2>
                            <p className="text-sm text-gray-600 mt-1">
                                {selectedProducts.length > 0 
                                    ? `Đã chọn ${selectedProducts.length} sản phẩm - Vui lòng cấu hình giá Flash Sale bên dưới`
                                    : 'Bước 1: Điền thông tin cơ bản → Bước 2: Chọn sản phẩm → Bước 3: Cấu hình giá'}
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
                            <div className="p-6">
                            {/* Basic Info */}
                            <div className="space-y-4 mb-6">
                                <div>
                                    <label className="block text-gray-700 font-bold mb-2">Tên Flash Sale *</label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        className="w-full border rounded-lg px-4 py-2"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-gray-700 font-bold mb-2">Mô tả</label>
                                    <textarea
                                        name="description"
                                        value={formData.description}
                                        onChange={handleInputChange}
                                        className="w-full border rounded-lg px-4 py-2"
                                        rows="2"
                                    />
                                </div>

                                <div className="grid grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-gray-700 font-bold mb-2">Khung giờ *</label>
                                        <select
                                            name="timeSlot"
                                            value={formData.timeSlot}
                                            onChange={handleInputChange}
                                            className="w-full border rounded-lg px-4 py-2"
                                            required
                                        >
                                            {timeSlots.map(slot => (
                                                <option key={slot} value={slot}>{slot}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <Calendar
                                            label="Thời gian bắt đầu *"
                                            value={formData.startTime}
                                            onChange={(val) => handleInputChange({ target: { name: 'startTime', value: val } })}
                                            enableTime={true}
                                            placeholder="Chọn thời gian bắt đầu..."
                                        />
                                    </div>

                                    <div>
                                        <Calendar
                                            label="Thời gian kết thúc *"
                                            value={formData.endTime}
                                            onChange={(val) => handleInputChange({ target: { name: 'endTime', value: val } })}
                                            enableTime={true}
                                            placeholder="Chọn thời gian kết thúc..."
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Product Selection */}
                            <div className="mb-6">
                                <div className="bg-blue-50 border-l-4 border-blue-600 p-4 mb-4">
                                    <h3 className="text-lg font-bold text-blue-900 mb-1">
                                        📦 Bước 2: Chọn sản phẩm ({selectedProducts.length})
                                    </h3>
                                    <p className="text-sm text-blue-700">
                                        Click vào sản phẩm để chọn/bỏ chọn. Sản phẩm được chọn sẽ có viền đỏ.
                                    </p>
                                    {products.length === 0 && (
                                        <p className="text-sm text-red-600 mt-2 font-bold">
                                            ⚠️ Không có sản phẩm nào. Vui lòng kiểm tra backend đã chạy chưa!
                                        </p>
                                    )}
                                </div>
                                {products.length > 0 ? (
                                <div className="max-h-80 overflow-y-auto border-2 border-dashed border-gray-300 rounded-lg p-4 bg-gray-50">
                                    <div className="grid grid-cols-2 gap-3">
                                        {products.map(product => (
                                            <div 
                                                key={product._id}
                                                onClick={() => handleProductSelect(product._id)}
                                                className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                                                    selectedProducts.find(p => p.productId === product._id)
                                                        ? 'border-red-600 bg-red-50'
                                                        : 'hover:border-gray-400'
                                                }`}
                                            >
                                                <div className="flex gap-3">
                                                    <img 
                                                        src={getImageUrl(product.images?.[0])} 
                                                        alt={product.productName}
                                                        className="w-16 h-16 object-cover rounded"
                                                    />
                                                    <div className="flex-1">
                                                        <p className="text-sm font-medium line-clamp-2">{product.productName || 'N/A'}</p>
                                                        <p className="text-sm text-gray-600">
                                                            {((product.variants?.[0]?.price || product.price || 0)).toLocaleString()}₫
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                ) : (
                                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 bg-gray-50 text-center">
                                        <div className="text-6xl mb-4">📦</div>
                                        <p className="text-gray-600 font-bold mb-2">Không có sản phẩm nào</p>
                                        <p className="text-sm text-gray-500">Backend có thể chưa chạy hoặc chưa có sản phẩm trong database</p>
                                    </div>
                                )}
                            </div>

                            {/* Selected Products Configuration */}
                            {selectedProducts.length > 0 && (
                                <div className="mb-6">
                                    <div className="bg-red-50 border-l-4 border-red-600 p-4 mb-4">
                                        <h3 className="text-lg font-bold text-red-900 mb-1">
                                            💰 Bước 3: Cấu hình giá Flash Sale
                                        </h3>
                                        <p className="text-sm text-red-700">
                                            ✨ <strong>Giá gốc</strong> tự động lấy từ sản phẩm. Bạn chỉ cần nhập <strong>% giảm giá</strong> HOẶC <strong>giá Flash Sale</strong> (giá còn lại sẽ tự động tính).
                                        </p>
                                    </div>
                                    <div className="space-y-3 max-h-80 overflow-y-auto border-2 border-red-200 rounded-lg p-4 bg-red-50">
                                        {selectedProducts.map(product => (
                                            <div key={product.productId} className="bg-white border-2 border-red-300 rounded-lg p-4 shadow-sm">
                                                <div className="flex gap-4 items-start">
                                                    <img 
                                                        src={getImageUrl(product.productImage)} 
                                                        alt={product.productName}
                                                        className="w-20 h-20 object-cover rounded border-2 border-gray-200"
                                                    />
                                                    <div className="flex-1">
                                                        <h4 className="font-bold text-gray-800 mb-3">{product.productName}</h4>
                                                        
                                                        {/* Giá gốc - Read Only - Full width */}
                                                        <div className="mb-3 bg-blue-50 border-2 border-blue-300 rounded-lg px-4 py-3">
                                                            <label className="block text-xs font-bold text-blue-700 mb-1">💵 Giá gốc</label>
                                                            <div className="text-2xl font-bold text-blue-900">
                                                                {product.originalPrice.toLocaleString('vi-VN')}₫
                                                            </div>
                                                        </div>
                                                        
                                                        <div className="grid grid-cols-3 gap-4">
                                                            <div>
                                                                <label className="block text-sm font-bold text-green-700 mb-2">
                                                                    💚 Giảm % *
                                                                </label>
                                                                <input
                                                                    type="number"
                                                                    value={product.discountPercent || 0}
                                                                    onChange={(e) => updateSelectedProduct(product.productId, 'discountPercent', e.target.value)}
                                                                    className="w-full border-2 border-green-300 rounded-lg px-3 py-3 text-center text-lg font-bold focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-200"
                                                                    min="0"
                                                                    max="100"
                                                                    placeholder="30"
                                                                />
                                                            </div>
                                                            <div>
                                                                <label className="block text-sm font-bold text-red-700 mb-2">
                                                                    💸 Giá Flash Sale *
                                                                </label>
                                                                <input
                                                                    type="text"
                                                                    value={product.flashPrice.toLocaleString('vi-VN')}
                                                                    onChange={(e) => {
                                                                        const value = e.target.value.replace(/\D/g, '');
                                                                        updateSelectedProduct(product.productId, 'flashPrice', value);
                                                                    }}
                                                                    className="w-full border-2 border-red-300 rounded-lg px-3 py-3 text-center text-lg font-bold focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-200"
                                                                    placeholder="20.000.000"
                                                                />
                                                            </div>
                                                            <div>
                                                                <label className="block text-sm font-bold text-gray-700 mb-2">
                                                                    📦 Số lượng *
                                                                </label>
                                                                <input
                                                                    type="number"
                                                                    value={product.totalStock}
                                                                    onChange={(e) => updateSelectedProduct(product.productId, 'totalStock', e.target.value)}
                                                                    className="w-full border-2 border-gray-300 rounded-lg px-3 py-3 text-center text-lg font-bold focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                                                                    min="1"
                                                                    placeholder="50"
                                                                />
                                                            </div>
                                                        </div>
                                                        <div className="mt-4 flex items-center justify-between">
                                                            <div className="bg-gradient-to-r from-red-50 to-green-50 px-4 py-3 rounded-lg border-2 border-red-300 flex-1 mr-3">
                                                                <div className="flex items-center justify-between">
                                                                    <div>
                                                                        <span className="font-bold text-red-600 text-xl">
                                                                            Giảm {product.discountPercent || 0}%
                                                                        </span>
                                                                    </div>
                                                                    <div className="text-right">
                                                                        <div className="text-xs text-gray-600">Tiết kiệm</div>
                                                                        <div className="font-bold text-green-600 text-lg">
                                                                            {((product.originalPrice || 0) - (product.flashPrice || 0)).toLocaleString('vi-VN')}₫
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleProductSelect(product.productId)}
                                                                className="text-red-600 hover:text-red-800 font-bold text-lg px-3 py-1 hover:bg-red-100 rounded"
                                                                title="Xóa sản phẩm"
                                                            >
                                                                ✕ Xóa
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                            
                            {/* Actions */}
                            <div className="border-t p-6 bg-gray-50 flex justify-between items-center">
                                <div className="text-sm text-gray-600">
                                    {selectedProducts.length > 0 ? (
                                        <span className="font-bold text-green-600">
                                            ✓ Đã chọn {selectedProducts.length} sản phẩm, sẵn sàng tạo Flash Sale
                                        </span>
                                    ) : (
                                        <span className="text-orange-600">
                                            ⚠ Vui lòng chọn ít nhất 1 sản phẩm
                                        </span>
                                    )}
                                </div>
                                <div className="flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setShowModal(false)}
                                        className="px-6 py-2 border-2 border-gray-300 rounded-lg hover:bg-gray-100 font-medium"
                                    >
                                        Hủy
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={selectedProducts.length === 0}
                                        className={`px-6 py-2 rounded-lg font-bold ${
                                            selectedProducts.length > 0
                                                ? 'bg-red-600 text-white hover:bg-red-700'
                                                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                        }`}
                                    >
                                        {editingFlashSale ? 'Cập nhật Flash Sale' : 'Tạo Flash Sale'}
                                    </button>
                                </div>
                            </div>
                            </div> {/* Close p-6 div */}
                        </form>
                    </div> {/* Close modal bg-white div */}
                </div>
            )}
        </div>
    );
};

export default AdminFlashSaleManagement;
