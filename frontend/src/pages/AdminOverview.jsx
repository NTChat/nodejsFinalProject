import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { 
  FaShoppingCart, FaBox, FaUsers, FaTags, FaGift, FaBolt,
  FaChartLine, FaClipboardList, FaCog, FaArrowRight,
  FaCheckCircle, FaClock, FaTruck, FaTimesCircle
} from 'react-icons/fa';
import api from '../services/api';

const AdminOverview = () => {
  const [stats, setStats] = useState({
    orders: { total: 0, pending: 0, processing: 0, delivered: 0 },
    products: { total: 0, lowStock: 0 },
    users: { total: 0 },
    discounts: { active: 0 }
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch orders
        const ordersRes = await api.get('/orders/admin/all?limit=5');
        const orders = ordersRes.data?.orders || [];
        
        // Fetch products
        const productsRes = await api.get('/products?limit=1');
        const totalProducts = productsRes.data?.totalProducts || productsRes.data?.total || 0;
        
        // Fetch users
        const usersRes = await api.get('/users');
        const totalUsers = usersRes.data?.users?.length || 0;

        // Calculate order stats
        const orderStats = orders.reduce((acc, order) => {
          acc.total++;
          if (order.status === 'pending') acc.pending++;
          else if (order.status === 'processing') acc.processing++;
          else if (order.status === 'delivered') acc.delivered++;
          return acc;
        }, { total: ordersRes.data?.total || orders.length, pending: 0, processing: 0, delivered: 0 });

        setStats({
          orders: orderStats,
          products: { total: totalProducts, lowStock: 0 },
          users: { total: totalUsers },
          discounts: { active: 0 }
        });

        setRecentOrders(orders.slice(0, 5));
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const menuItems = [
    {
      title: 'Đơn hàng',
      description: 'Quản lý đơn hàng, theo dõi trạng thái giao hàng',
      icon: FaShoppingCart,
      path: '/admin/orders',
      color: 'bg-blue-500',
      stats: `${stats.orders.total} đơn hàng`,
      badge: stats.orders.pending > 0 ? `${stats.orders.pending} chờ xử lý` : null,
      badgeColor: 'bg-orange-500'
    },
    {
      title: 'Sản phẩm',
      description: 'Thêm, sửa, xóa sản phẩm trong cửa hàng',
      icon: FaBox,
      path: '/admin/products',
      color: 'bg-green-500',
      stats: `${stats.products.total} sản phẩm`
    },
    {
      title: 'Người dùng',
      description: 'Quản lý tài khoản khách hàng',
      icon: FaUsers,
      path: '/admin/users',
      color: 'bg-purple-500',
      stats: `${stats.users.total} người dùng`
    },
    {
      title: 'Danh mục',
      description: 'Quản lý danh mục sản phẩm',
      icon: FaClipboardList,
      path: '/admin/categories',
      color: 'bg-indigo-500',
      stats: 'Phân loại sản phẩm'
    },
    {
      title: 'Mã giảm giá',
      description: 'Tạo và quản lý mã khuyến mãi',
      icon: FaTags,
      path: '/admin/discounts',
      color: 'bg-pink-500',
      stats: 'Khuyến mãi'
    },
    {
      title: 'Quà đổi điểm',
      description: 'Quản lý chương trình tích điểm',
      icon: FaGift,
      path: '/admin/loyalty-rewards',
      color: 'bg-yellow-500',
      stats: 'Điểm thưởng'
    },
    {
      title: 'Flash Sale',
      description: 'Thiết lập chương trình giảm giá nhanh',
      icon: FaBolt,
      path: '/admin/flash-sales',
      color: 'bg-red-500',
      stats: 'Khuyến mãi nhanh'
    },
    {
      title: 'Thống kê',
      description: 'Xem báo cáo doanh thu, biểu đồ',
      icon: FaChartLine,
      path: '/admin/statistics',
      color: 'bg-teal-500',
      stats: 'Báo cáo & Phân tích'
    }
  ];

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <FaClock className="text-yellow-500" />;
      case 'processing': return <FaTruck className="text-blue-500" />;
      case 'delivered': return <FaCheckCircle className="text-green-500" />;
      case 'cancelled': return <FaTimesCircle className="text-red-500" />;
      default: return <FaClock className="text-gray-500" />;
    }
  };

  const getStatusText = (status) => {
    const statusMap = {
      'pending': 'Chờ xử lý',
      'processing': 'Đang xử lý',
      'shipped': 'Đang giao',
      'delivered': 'Đã giao',
      'cancelled': 'Đã hủy'
    };
    return statusMap[status] || status;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">Chào mừng đến Trang Quản Trị</h1>
        <p className="text-indigo-100">Quản lý cửa hàng PhoneWorld của bạn</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <FaShoppingCart className="text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{stats.orders.total}</p>
              <p className="text-xs text-gray-500">Tổng đơn hàng</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <FaClock className="text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{stats.orders.pending}</p>
              <p className="text-xs text-gray-500">Chờ xử lý</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <FaBox className="text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{stats.products.total}</p>
              <p className="text-xs text-gray-500">Sản phẩm</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <FaUsers className="text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{stats.users.total}</p>
              <p className="text-xs text-gray-500">Người dùng</p>
            </div>
          </div>
        </div>
      </div>

      {/* Menu Grid */}
      <div>
        <h2 className="text-lg font-bold text-gray-800 mb-4">Chức năng quản trị</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {menuItems.map((item, index) => (
            <Link
              key={index}
              to={item.path}
              className="group bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-lg hover:border-indigo-200 transition-all duration-300"
            >
              <div className="flex items-start justify-between mb-3">
                <div className={`w-12 h-12 ${item.color} rounded-xl flex items-center justify-center text-white shadow-md group-hover:scale-110 transition-transform`}>
                  <item.icon className="text-xl" />
                </div>
                {item.badge && (
                  <span className={`${item.badgeColor} text-white text-[10px] font-bold px-2 py-1 rounded-full`}>
                    {item.badge}
                  </span>
                )}
              </div>
              <h3 className="font-bold text-gray-800 mb-1 group-hover:text-indigo-600 transition-colors">
                {item.title}
              </h3>
              <p className="text-xs text-gray-500 mb-3 line-clamp-2">{item.description}</p>
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-400">{item.stats}</span>
                <FaArrowRight className="text-gray-300 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Orders */}
      {recentOrders.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-bold text-gray-800">Đơn hàng gần đây</h2>
            <Link to="/admin/orders" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1">
              Xem tất cả <FaArrowRight className="text-xs" />
            </Link>
          </div>
          <div className="divide-y divide-gray-100">
            {recentOrders.map((order, index) => (
              <Link
                key={index}
                to={`/admin/orders/${order._id}`}
                className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {getStatusIcon(order.status)}
                  <div>
                    <p className="font-medium text-gray-800 text-sm">#{order.orderId || order._id?.slice(-8)}</p>
                    <p className="text-xs text-gray-500">
                      {order.shippingAddress?.recipientName || 'Khách hàng'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-indigo-600 text-sm">{formatCurrency(order.totalPrice)}</p>
                  <p className="text-xs text-gray-500">{getStatusText(order.status)}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOverview;
