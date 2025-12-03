import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { OrderController } from '../controllers/OrderController';
import { ArrowLeft, MapPin, CreditCard, Package, Truck, Calendar, DollarSign, X } from 'lucide-react';
import { getImageUrl } from '../services/api';
import { toast } from 'react-toastify';

const OrderDetailPage = () => {
    const { id } = useParams(); // Lấy orderId từ URL
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [cancelReason, setCancelReason] = useState('');
    const [cancelling, setCancelling] = useState(false);
    const [cancelError, setCancelError] = useState('');
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        const fetchOrderDetail = async () => {
            try {
                console.log('Fetching order detail for ID:', id);
                // Gọi API lấy chi tiết đơn hàng
                const data = await OrderController.getOrderDetail(id);
                console.log('Order detail data:', data);
                setOrder(data);
            } catch (err) {
                console.error('Error fetching order detail:', err);
                setError(err.message || "Không tìm thấy đơn hàng hoặc bạn không có quyền xem.");
            } finally {
                setLoading(false);
            }
        };
        
        if (id) {
            fetchOrderDetail();
        } else {
            setError("Không tìm thấy ID đơn hàng");
            setLoading(false);
        }
    }, [id]);

    // 🆕 Kiểm tra có thể hủy đơn không (trong vòng 24 giờ, trạng thái Pending/Confirmed)
    const canCancel = order && 
        ['Pending', 'Confirmed'].includes(order.status) && 
        (new Date() - new Date(order.createdAt)) < 24 * 60 * 60 * 1000;

    // 🆕 Hủy đơn hàng
    const handleCancelOrder = async () => {
        if (!cancelReason.trim()) {
            setCancelError('Vui lòng cung cấp lý do hủy đơn hàng');
            return;
        }

        setCancelling(true);
        setCancelError('');
        try {
            const result = await OrderController.cancelOrder(order.orderId || id, { reason: cancelReason });
            alert('✅ ' + result.message);
            setShowCancelModal(false);
            // Cập nhật trạng thái đơn hàng
            setOrder(prev => ({
                ...prev,
                status: 'Cancelled',
                cancelReason: cancelReason,
                cancelledAt: new Date().toISOString()
            }));
        } catch (err) {
            setCancelError(err.message || 'Lỗi hủy đơn hàng');
            console.error('❌ Cancel error:', err);
        } finally {
            setCancelling(false);
        }
    };

    // 🆕 Upload chứng từ thanh toán
    const handleUploadProof = async (file) => {
        if (!file) return;
        
        // Kiểm tra file type
        if (!file.type.startsWith('image/')) {
            toast.error('Vui lòng chọn file ảnh');
            return;
        }
        
        // Kiểm tra file size (5MB)
        if (file.size > 5 * 1024 * 1024) {
            toast.error('Kích thước file phải nhỏ hơn 5MB');
            return;
        }
        
        setUploading(true);
        try {
            await OrderController.uploadPaymentProof(order.orderId || id, file);
            toast.success('Upload chứng từ thành công! Admin sẽ xác nhận trong thời gian sớm nhất.');
            
            // Reload order để hiển thị chứng từ
            const updatedOrder = await OrderController.getOrderDetail(id);
            setOrder(updatedOrder);
        } catch (err) {
            console.error('Upload proof error:', err);
            toast.error(err.message || 'Lỗi upload chứng từ');
        } finally {
            setUploading(false);
        }
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                <p className="text-gray-600">Đang tải chi tiết đơn hàng...</p>
            </div>
        </div>
    );
    
    if (error) return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="text-center max-w-md mx-auto p-6">
                <div className="bg-red-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                    <X className="w-8 h-8 text-red-500" />
                </div>
                <h2 className="text-xl font-bold text-gray-800 mb-2">Không thể tải đơn hàng</h2>
                <p className="text-gray-600 mb-4">{error}</p>
                <Link 
                    to="/profile" 
                    className="inline-flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition"
                >
                    <ArrowLeft size={16} />
                    Quay lại danh sách đơn hàng
                </Link>
            </div>
        </div>
    );
    
    if (!order) return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
                <p className="text-gray-600">Không tìm thấy thông tin đơn hàng</p>
            </div>
        </div>
    );

    // Helpers format
    const fmtVND = (n) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n || 0);
    const formatDate = (d) => new Date(d).toLocaleString('vi-VN');

    // Màu trạng thái
    const getStatusColor = (st) => {
        const map = {
            'Delivered': 'bg-green-100 text-green-700',
            'Shipping': 'bg-purple-100 text-purple-700',
            'Cancelled': 'bg-red-100 text-red-700',
            'Pending': 'bg-yellow-100 text-yellow-700'
        };
        return map[st] || 'bg-gray-100 text-gray-700';
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4">
            <div className="max-w-4xl mx-auto">
                {/* Header: Nút back & Title */}
                <div className="flex items-center justify-between gap-4 mb-6">
                    <div className="flex items-center gap-4">
                        <Link to="/profile" className="p-2 bg-white rounded-full shadow-sm hover:bg-gray-100 text-gray-600">
                            <ArrowLeft size={20} />
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-800">Chi tiết đơn hàng</h1>
                            <p className="text-sm text-gray-500">Mã đơn: <span className="font-mono font-bold text-blue-600">#{order.orderId || order._id}</span></p>
                        </div>
                    </div>
                    {/* 🆕 Nút hủy đơn */}
                    {canCancel && (
                        <button
                            onClick={() => setShowCancelModal(true)}
                            className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-medium rounded-lg transition duration-200 text-sm"
                        >
                            Hủy đơn hàng
                        </button>
                    )}
                </div>

                {/* Thông tin chính */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    {/* Cột 1: Thông tin người nhận */}
                    <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
                        <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                            <MapPin size={18} className="text-blue-500" /> Địa chỉ nhận hàng
                        </h3>
                        <div className="text-sm text-gray-600 space-y-1">
                            <p className="font-semibold text-gray-800">{order.shippingAddress?.recipientName || order.guestInfo?.name}</p>
                            <p>{order.shippingAddress?.phoneNumber || order.guestInfo?.phone}</p>
                            <p>{order.shippingAddress?.street || order.shippingAddress?.address}</p>
                            <p>{order.shippingAddress?.ward && `${order.shippingAddress.ward}, `}
                               {order.shippingAddress?.district && `${order.shippingAddress.district}, `}
                               {order.shippingAddress?.city}</p>
                        </div>
                    </div>

                    {/* Cột 2: Trạng thái & Thanh toán */}
                    <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
                        <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                            <Truck size={18} className="text-purple-500" /> Thông tin vận chuyển
                        </h3>
                        <div className="space-y-3">
                            <div>
                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(order.status)}`}>
                                    {order.status === 'Delivered' ? 'Giao thành công' : order.status}
                                </span>
                            </div>
                            <div className="text-sm text-gray-600">
                                <p className="flex items-center gap-2"><Calendar size={14}/> Đặt lúc: {formatDate(order.createdAt)}</p>
                                {order.paidAt && <p className="flex items-center gap-2 text-green-600"><DollarSign size={14}/> Đã thanh toán: {formatDate(order.paidAt)}</p>}
                            </div>
                        </div>
                    </div>

                    {/* Cột 3: Phương thức thanh toán */}
                    <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
                        <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                            <CreditCard size={18} className="text-orange-500" /> Thanh toán
                        </h3>
                        <p className="text-sm text-gray-600 uppercase font-semibold">
                            {order.paymentMethod === 'cod' ? 'Thanh toán khi nhận hàng (COD)' : order.paymentMethod}
                        </p>
                        <p className={`text-sm mt-2 font-medium ${order.isPaid ? 'text-green-600' : 'text-orange-600'}`}>
                            {order.isPaid ? 'Đã thanh toán' : 'Chưa thanh toán'}
                        </p>
                        {/* Hiển thị chứng từ thanh toán nếu có */}
                        {order.paymentMethod === 'banking' && order.paymentProof?.imageUrl && (
                            <div className="mt-4 pt-3 border-t border-gray-200">
                                <h4 className="text-sm font-medium text-gray-700 mb-2">Chứng từ chuyển khoản:</h4>
                                <a 
                                    href={getImageUrl(order.paymentProof.imageUrl)}
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="block"
                                >
                                    <img 
                                        src={getImageUrl(order.paymentProof.imageUrl)}
                                        alt="Chứng từ chuyển khoản" 
                                        className="w-full max-w-xs max-h-40 object-contain rounded-lg border border-gray-300 hover:opacity-90 transition cursor-pointer bg-gray-50"
                                        onError={(e) => {
                                            e.target.onerror = null;
                                            e.target.src = '/img/placeholder.png';
                                        }}
                                    />
                                </a>
                                <p className="text-xs text-gray-500 mt-1">
                                    Upload lúc: {new Date(order.paymentProof.uploadedAt).toLocaleString('vi-VN')}
                                </p>
                                {order.paymentProof.verifiedAt && (
                                    <p className="text-xs text-green-600 mt-1">
                                        ✓ Đã được admin xác nhận lúc: {new Date(order.paymentProof.verifiedAt).toLocaleString('vi-VN')}
                                    </p>
                                )}
                            </div>
                        )}
                        
                        {/* Form upload chứng từ nếu banking và chưa có chứng từ và chưa hủy */}
                        {order.paymentMethod === 'banking' && !order.paymentProof?.imageUrl && !order.isPaid && order.status !== 'Cancelled' && (
                            <div className="mt-4 pt-3 border-t border-gray-200">
                                <h4 className="text-sm font-medium text-gray-700 mb-2">Upload chứng từ chuyển khoản:</h4>
                                <input 
                                    type="file" 
                                    accept="image/*"
                                    disabled={uploading}
                                    onChange={(e) => {
                                        const file = e.target.files[0];
                                        if (file) {
                                            handleUploadProof(file);
                                        }
                                    }}
                                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50"
                                />
                                {uploading && (
                                    <p className="text-xs text-blue-600 mt-1">
                                        Đang upload...
                                    </p>
                                )}
                                <p className="text-xs text-gray-500 mt-1">
                                    Chấp nhận JPG, PNG. Tối đa 5MB.
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Danh sách sản phẩm */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6">
                    <div className="p-4 border-b border-gray-100 bg-gray-50 font-bold text-gray-700 flex items-center gap-2">
                        <Package size={18} /> Danh sách sản phẩm
                    </div>
                    <div className="divide-y divide-gray-100">
                        {order.items?.map((item, index) => {
                             // Xử lý ảnh: item có thể lưu sẵn image hoặc phải tự lấy placeholder
                             const itemImage = getImageUrl(item.image || item.images?.[0] || '/img/placeholder.png');
                             
                             return (
                                <div key={index} className="p-4 flex gap-4 items-center">
                                    <div className="w-16 h-16 bg-gray-50 rounded border border-gray-200 flex-shrink-0">
                                        <img src={itemImage} alt={item.name} className="w-full h-full object-contain p-1" />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-medium text-gray-800 line-clamp-2">{item.name}</h4>
                                        <p className="text-sm text-gray-500">Phân loại: {item.variantName || 'Mặc định'}</p>
                                        <p className="text-sm text-gray-500">x{item.quantity}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-gray-800">{fmtVND(item.price)}</p>
                                        <p className="text-xs text-gray-500">Tổng: {fmtVND(item.price * item.quantity)}</p>
                                    </div>
                                </div>
                             )
                        })}
                    </div>
                </div>

                {/* Điểm thưởng */}
                {order.loyaltyPoints && order.loyaltyPoints.pointsEarned > 0 && (
                    <div className="bg-gradient-to-br from-yellow-50 via-orange-50 to-red-50 rounded-xl shadow-sm border border-yellow-200 p-5 mb-6">
                        <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                            <span className="text-2xl">🎁</span> Điểm thưởng
                        </h3>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-700">Điểm sẽ nhận từ đơn hàng này:</span>
                                <span className="font-bold text-2xl text-green-600">+{order.loyaltyPoints.pointsEarned} điểm</span>
                            </div>
                            <div className="mt-3 pt-3 border-t border-yellow-200">
                                <p className="text-xs text-gray-600 text-center">
                                    Giá trị: {(order.loyaltyPoints.pointsEarned * 1000).toLocaleString()}đ (1 điểm = 1.000đ)
                                </p>
                            </div>
                            {order.status === 'Delivered' && order.isPaid ? (
                                <div className="mt-3 bg-green-50 border border-green-200 rounded-lg p-3">
                                    <p className="text-xs text-green-700 text-center font-medium">
                                        ✅ Điểm đã được cộng vào tài khoản của bạn!
                                    </p>
                                </div>
                            ) : (
                                <div className="mt-3 bg-orange-50 border border-orange-200 rounded-lg p-3">
                                    <p className="text-xs text-orange-700 text-center font-medium">
                                        ⏳ Điểm sẽ được cộng sau khi đơn hàng được giao thành công
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Tổng kết tiền */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                    <div className="flex justify-end">
                        <div className="w-full md:w-1/3 space-y-2">
                            <div className="flex justify-between text-sm text-gray-600">
                                <span>Tạm tính:</span>
                                <span>{fmtVND(order.subTotal)}</span>
                            </div>
                            <div className="flex justify-between text-sm text-gray-600">
                                <span>Phí vận chuyển:</span>
                                <span>{fmtVND(order.shippingPrice)}</span>
                            </div>
                            {order.tax > 0 && (
                                <div className="flex justify-between text-sm text-gray-600">
                                    <span>Thuế:</span>
                                    <span>{fmtVND(order.tax)}</span>
                                </div>
                            )}
                            {order.discount?.amount > 0 && (
                                <div className="flex justify-between text-sm text-green-600">
                                    <span>Giảm giá:</span>
                                    <span>-{fmtVND(order.discount.amount)}</span>
                                </div>
                            )}
                            <div className="border-t border-gray-100 pt-2 mt-2 flex justify-between items-center">
                                <span className="font-bold text-gray-800">Tổng cộng:</span>
                                <span className="font-bold text-xl text-blue-600">{fmtVND(order.totalPrice)}</span>
                            </div>
                        </div>
                    </div>
                </div>

            </div>

            {/* 🆕 MODAL HỦY ĐƠN HÀNG */}
            {showCancelModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold text-gray-800">Hủy đơn hàng</h2>
                            <button
                                onClick={() => {
                                    setShowCancelModal(false);
                                    setCancelError('');
                                }}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                            <p className="text-sm text-orange-700">
                                ⚠️ Bạn chỉ có thể hủy đơn hàng trong vòng <strong>24 giờ</strong> kể từ khi đặt.
                            </p>
                        </div>

                        <label className="block mb-2 font-medium text-gray-700">
                            Lý do hủy đơn <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            value={cancelReason}
                            onChange={(e) => setCancelReason(e.target.value)}
                            placeholder="Vui lòng cho biết lý do hủy đơn hàng..."
                            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 mb-3 resize-none"
                            rows="4"
                        />

                        {cancelError && (
                            <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                                <p className="text-sm text-red-700">{cancelError}</p>
                            </div>
                        )}

                        <div className="flex gap-3">
                            <button
                                onClick={() => {
                                    setShowCancelModal(false);
                                    setCancelError('');
                                }}
                                disabled={cancelling}
                                className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium rounded-lg transition disabled:opacity-50"
                            >
                                Quay lại
                            </button>
                            <button
                                onClick={handleCancelOrder}
                                disabled={cancelling || !cancelReason.trim()}
                                className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-medium rounded-lg transition disabled:opacity-50"
                            >
                                {cancelling ? 'Đang xử lý...' : 'Xác nhận hủy'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OrderDetailPage;