// src/components/common/OrderHistory.jsx
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom'; // Thêm Link để bấm vào xem chi tiết
import { motion } from 'framer-motion';
import { PackageCheck, Truck, ArchiveRestore, ClipboardList, AlertCircle, Loader } from 'lucide-react';
import { OrderController } from '../../controllers/OrderController'; // Import controller

// Helper format tiền tệ
const formatVND = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);
};

// Helper format ngày
const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('vi-VN', {
        day: '2-digit', month: '2-digit', year: 'numeric',
    });
};

// Helper Badge trạng thái (Đã map theo backend status string)
const formatOrderStatusBadges = (statusString) => {
    const status = String(statusString).toLowerCase();

    const config = {
        pending: { color: 'bg-yellow-100 text-yellow-700 border-yellow-200', icon: <ClipboardList size={14} />, label: 'Chờ xử lý' },
        confirmed: { color: 'bg-blue-100 text-blue-700 border-blue-200', icon: <PackageCheck size={14} />, label: 'Đã xác nhận' },
        shipping: { color: 'bg-purple-100 text-purple-700 border-purple-200', icon: <Truck size={14} />, label: 'Đang giao' },
        delivered: { color: 'bg-green-100 text-green-700 border-green-200', icon: <ArchiveRestore size={14} />, label: 'Giao thành công' },
        cancelled: { color: 'bg-red-100 text-red-700 border-red-200', icon: <AlertCircle size={14} />, label: 'Đã hủy' },
    };

    const style = config[status] || config.pending;

    return (
        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${style.color}`}>
            {style.icon}
            {style.label}
        </span>
    );
};

const OrderHistory = () => {
    const [orders, setOrders] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    // Tự động gọi API khi component được mount (vào Tab)
    useEffect(() => {
        const fetchOrders = async () => {
            try {
                const data = await OrderController.getMyOrders();
                if (data && data.orders) {
                    setOrders(data.orders);
                } else if (Array.isArray(data)) {
                    setOrders(data);
                } else {
                    setOrders([]); // Fallback an toàn
                }
                // ====================

            } catch (error) {
                console.error("Failed to load orders", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchOrders();
    }, []);

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-text-secondary">
                <Loader className="animate-spin mb-2" size={24} />
                <p>Đang tải đơn hàng...</p>
            </div>
        );
    }

    if (!orders || orders.length === 0) {
        return (
            <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                <ClipboardList className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                <p className="text-text-secondary font-medium">Chưa có đơn hàng nào</p>
                <Link to="/products" className="text-sm text-blue-600 hover:underline mt-2 inline-block">
                    Mua sắm ngay
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Đã bỏ max-h-[400px] để list hiển thị full trong Tab Profile */}
            <div className="space-y-4">
                {orders.map((order, index) => (
                    <motion.div
                        key={order._id || index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                    >
                        <Link
                            to={`/order/${order.orderId || order._id}`} // Link sang chi tiết đơn
                            className="block p-5 rounded-xl border border-gray-200 bg-white hover:border-blue-300 hover:shadow-md transition-all duration-200 group"
                        >
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-gray-800 group-hover:text-blue-600 transition-colors">
                                            #{order.orderId || order._id.slice(-6).toUpperCase()}
                                        </span>
                                        <span className="text-xs text-gray-400">
                                            • {formatDate(order.createdAt)}
                                        </span>
                                    </div>
                                </div>
                                {formatOrderStatusBadges(order.status)}
                            </div>

                            <div className="flex justify-between items-end pt-3 border-t border-gray-100">
                                <div className="text-sm text-gray-600">
                                    <span className="font-medium">{order.itemsCount || (order.items?.length || 0)}</span> sản phẩm
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-gray-400 mb-0.5">Tổng tiền</p>
                                    <span className="font-bold text-lg text-blue-600">
                                        {formatVND(order.totalPrice)}
                                    </span>
                                </div>
                            </div>
                        </Link>
                    </motion.div>
                ))}
            </div>
        </div>
    );
};

export default OrderHistory;