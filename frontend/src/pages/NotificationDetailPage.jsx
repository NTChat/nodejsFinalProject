import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Package, User, ShoppingBag, Clock, MapPin, Phone, Mail, CreditCard } from 'lucide-react';
import { OrderController } from '../controllers/OrderController';
import { UserController } from '../controllers/userController';
import { ProductController } from '../controllers/productController';

const NotificationDetailPage = () => {
    const { type, id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState(null);

    useEffect(() => {
        fetchDetail();
        // eslint-disable-next-line
    }, [type, id]);

    const fetchDetail = async () => {
        try {
            setLoading(true);
            if (type === 'order') {
                const order = await OrderController.getOrderDetail(id);
                console.log('📦 Order detail:', order);
                setData(order);
            } else if (type === 'user') {
                const user = await UserController.getUserById(id);
                console.log('👤 User detail:', user);
                setData(user);
            } else if (type === 'product') {
                const product = await ProductController.getProductById(id);
                console.log('🛍️ Product detail:', product);
                setData(product);
            }
        } catch (error) {
            console.error('Lỗi khi tải chi tiết:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatPrice = (price) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(price);
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleString('vi-VN');
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!data) {
        return (
            <div className="max-w-4xl mx-auto p-6">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
                    <p className="text-gray-500">Không tìm thấy dữ liệu</p>
                    <button
                        onClick={() => navigate('/admin/notifications')}
                        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                        Quay lại
                    </button>
                </div>
            </div>
        );
    }

    // Render chi tiết theo loại
    const renderOrderDetail = () => (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white">
                <div className="flex items-center gap-3 mb-2">
                    <Package className="w-8 h-8" />
                    <h1 className="text-2xl font-bold">Chi tiết đơn hàng</h1>
                </div>
                <p className="text-blue-100">Mã đơn hàng: #{data._id?.slice(-8).toUpperCase()}</p>
            </div>

            {/* Order Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Customer Info */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                        <User className="w-5 h-5 text-blue-600" />
                        Thông tin khách hàng
                    </h3>
                    <div className="space-y-3">
                        <div className="flex items-start gap-3">
                            <User className="w-4 h-4 text-gray-400 mt-1" />
                            <div>
                                <p className="text-sm text-gray-500">Họ tên</p>
                                <p className="font-medium">
                                    {data.accountId?.name || data.accountId?.userName || data.guestInfo?.name || data.shippingAddress?.recipientName || 'N/A'}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <Phone className="w-4 h-4 text-gray-400 mt-1" />
                            <div>
                                <p className="text-sm text-gray-500">Số điện thoại</p>
                                <p className="font-medium">{data.shippingAddress?.phoneNumber || data.accountId?.phone || 'N/A'}</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <Mail className="w-4 h-4 text-gray-400 mt-1" />
                            <div>
                                <p className="text-sm text-gray-500">Email</p>
                                <p className="font-medium">{data.accountId?.email || data.guestInfo?.email || 'N/A'}</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <MapPin className="w-4 h-4 text-gray-400 mt-1" />
                            <div>
                                <p className="text-sm text-gray-500">Địa chỉ giao hàng</p>
                                <p className="font-medium">
                                    {data.shippingAddress?.street}, {data.shippingAddress?.city}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Order Status */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                        <Clock className="w-5 h-5 text-blue-600" />
                        Trạng thái đơn hàng
                    </h3>
                    <div className="space-y-3">
                        <div>
                            <p className="text-sm text-gray-500 mb-1">Trạng thái hiện tại</p>
                            <span className={`inline-block px-3 py-1 rounded-lg text-sm font-medium ${
                                data.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' :
                                data.status === 'Confirmed' ? 'bg-blue-100 text-blue-700' :
                                data.status === 'Shipping' ? 'bg-purple-100 text-purple-700' :
                                data.status === 'Delivered' ? 'bg-green-100 text-green-700' :
                                'bg-red-100 text-red-700'
                            }`}>
                                {data.status}
                            </span>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Ngày đặt hàng</p>
                            <p className="font-medium">{formatDate(data.createdAt)}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Phương thức thanh toán</p>
                            <div className="flex items-center gap-2 mt-1">
                                <CreditCard className="w-4 h-4 text-gray-400" />
                                <p className="font-medium">{data.paymentMethod || 'COD'}</p>
                            </div>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Trạng thái thanh toán</p>
                            <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                                data.isPaid ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                            }`}>
                                {data.isPaid ? 'Đã thanh toán' : 'Chưa thanh toán'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Products */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="font-semibold text-gray-800 mb-4">Sản phẩm đã đặt</h3>
                <div className="space-y-3">
                    {data.items?.map((item, index) => (
                        <div key={index} className="flex gap-4 p-4 bg-gray-50 rounded-lg">
                            <img 
                                src={ProductController.getImageUrl(item.productId?.images?.[0] || item.image)}
                                alt={item.productId?.name || item.name}
                                className="w-20 h-20 object-cover rounded-lg"
                                onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = '/img/default.png';
                                }}
                            />
                            <div className="flex-1">
                                <h4 className="font-medium text-gray-800">{item.productId?.name || item.name}</h4>
                                <p className="text-sm text-gray-500">Số lượng: {item.quantity}</p>
                                <p className="text-sm font-medium text-blue-600">{formatPrice(item.price)}</p>
                            </div>
                            <div className="text-right">
                                <p className="font-semibold text-gray-800">{formatPrice(item.price * item.quantity)}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Total */}
                <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex justify-between items-center text-lg font-bold">
                        <span>Tổng cộng:</span>
                        <span className="text-blue-600">{formatPrice(data.totalPrice)}</span>
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
                <button
                    onClick={() => navigate(`/admin/orders/${data._id}`)}
                    className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                    Quản lý đơn hàng
                </button>
                <button
                    onClick={() => navigate('/admin/notifications')}
                    className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                >
                    Quay lại
                </button>
            </div>
        </div>
    );

    const renderUserDetail = () => (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white">
                <div className="flex items-center gap-3 mb-2">
                    <User className="w-8 h-8" />
                    <h1 className="text-2xl font-bold">Thông tin người dùng</h1>
                </div>
                <p className="text-green-100">ID: {data._id}</p>
            </div>

            {/* User Info */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-start gap-6">
                    <img 
                        src={data.avatar || '/img/default-avatar.png'} 
                        alt={data.name}
                        className="w-24 h-24 rounded-full object-cover border-4 border-gray-100"
                        onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = '/img/default-avatar.png';
                        }}
                    />
                    <div className="flex-1 space-y-4">
                        <div>
                            <p className="text-sm text-gray-500">Họ tên</p>
                            <p className="text-xl font-semibold text-gray-800">{data.name || data.userName}</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm text-gray-500">Email</p>
                                <p className="font-medium">{data.email}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Số điện thoại</p>
                                <p className="font-medium">{data.phone || 'Chưa cập nhật'}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Ngày đăng ký</p>
                                <p className="font-medium">{formatDate(data.createdAt)}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Vai trò</p>
                                <span className={`inline-block px-3 py-1 rounded-lg text-sm font-medium ${
                                    data.isAdmin ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'
                                }`}>
                                    {data.isAdmin ? 'Admin' : 'Người dùng'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
                <button
                    onClick={() => navigate('/admin/users')}
                    className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                >
                    Quản lý người dùng
                </button>
                <button
                    onClick={() => navigate('/admin/notifications')}
                    className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                >
                    Quay lại
                </button>
            </div>
        </div>
    );

    const renderProductDetail = () => (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl p-6 text-white">
                <div className="flex items-center gap-3 mb-2">
                    <ShoppingBag className="w-8 h-8" />
                    <h1 className="text-2xl font-bold">Chi tiết sản phẩm</h1>
                </div>
                <p className="text-orange-100">SKU: {data._id?.slice(-8).toUpperCase()}</p>
            </div>

            {/* Product Info */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex flex-col md:flex-row gap-6">
                    <img 
                        src={ProductController.getImageUrl(data.images?.[0])}
                        alt={data.name}
                        className="w-full md:w-64 h-64 object-cover rounded-lg"
                        onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = '/img/default.png';
                        }}
                    />
                    <div className="flex-1 space-y-4">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-800 mb-2">{data.name}</h2>
                            <p className="text-gray-600">{data.description}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm text-gray-500">Giá bán</p>
                                <p className="text-xl font-bold text-blue-600">{formatPrice(data.price)}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Số lượng tồn kho</p>
                                <p className={`text-xl font-bold ${
                                    data.stock === 0 ? 'text-red-600' : 
                                    data.stock < 10 ? 'text-orange-600' : 
                                    'text-green-600'
                                }`}>
                                    {data.stock}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Thương hiệu</p>
                                <p className="font-medium">{data.brand || 'N/A'}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Danh mục</p>
                                <p className="font-medium">{data.category?.name || 'N/A'}</p>
                            </div>
                        </div>

                        {/* Stock Alert */}
                        {data.stock === 0 && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                <p className="text-red-700 font-medium">⚠️ Sản phẩm đã hết hàng - Cần nhập thêm ngay!</p>
                            </div>
                        )}
                        {data.stock > 0 && data.stock < 10 && (
                            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                                <p className="text-orange-700 font-medium">⚠️ Sản phẩm sắp hết hàng - Còn {data.stock} sản phẩm</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
                <button
                    onClick={() => navigate(`/admin/products/${data._id}/edit`)}
                    className="flex-1 px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium"
                >
                    Cập nhật sản phẩm
                </button>
                <button
                    onClick={() => navigate('/admin/notifications')}
                    className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                >
                    Quay lại
                </button>
            </div>
        </div>
    );

    return (
        <div className="max-w-6xl mx-auto p-6">
            <button
                onClick={() => navigate('/admin/notifications')}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-6 font-medium"
            >
                <ArrowLeft className="w-5 h-5" />
                Quay lại thông báo
            </button>

            {type === 'order' && renderOrderDetail()}
            {type === 'user' && renderUserDetail()}
            {type === 'product' && renderProductDetail()}
        </div>
    );
};

export default NotificationDetailPage;
