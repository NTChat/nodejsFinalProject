import React from "react";
import { toast } from "react-toastify";
import { Package, Calendar, Clock, ChevronRight } from "lucide-react";
import { getImageUrl } from "../../services/api";

// Helper format tiền tệ VNĐ
const formatCurrency = (amount) => {
    return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
    }).format(amount);
};

// Helper format ngày tháng
const formatDate = (dateString) => {
    if (!dateString) return "Đang cập nhật";
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    });
};

// Helper lấy màu sắc dựa trên trạng thái đơn hàng
const getStatusStyle = (status) => {
    const styles = {
        pending: { label: "Chờ xác nhận", color: "bg-yellow-100 text-yellow-700 border-yellow-200" },
        processing: { label: "Đang xử lý", color: "bg-blue-100 text-blue-700 border-blue-200" },
        shipping: { label: "Đang giao", color: "bg-purple-100 text-purple-700 border-purple-200" },
        delivered: { label: "Giao thành công", color: "bg-green-100 text-green-700 border-green-200" },
        cancelled: { label: "Đã hủy", color: "bg-red-100 text-red-700 border-red-200" },
    };
    // Mặc định trả về trạng thái pending nếu không tìm thấy key
    return styles[status?.toLowerCase()] || styles.pending;
};

const OverviewOrderCard = ({ order }) => {
    // Dữ liệu giả lập mặc định nếu không truyền prop (để tránh lỗi khi test UI)
    const data = order || {
        id: "ORD-SAMPLE-001",
        status: "processing",
        totalPrice: 25990000,
        createdAt: new Date().toISOString(),
        estimatedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // +3 ngày
        items: [
            {
                productName: "iPhone 15 Pro Max 256GB",
                image: "https://cdn2.cellphones.com.vn/insecure/rs:fill:358:358/q:90/plain/https://cellphones.com.vn/media/catalog/product/i/p/iphone-15-pro-max_3.jpg",
                quantity: 1
            }
        ]
    };

    const statusInfo = getStatusStyle(data.status);

    const handleClick = () => {
        toast.info("🚀 Tính năng chi tiết đơn hàng đang được phát triển!");
    };

    return (
        <div
            onClick={handleClick}
            className="bg-white border border-gray-200 rounded-xl p-5 mb-4 cursor-pointer 
            transition-all duration-300 hover:shadow-lg hover:border-blue-300 hover:-translate-y-1 group"
        >
            {/* Header: Mã đơn & Trạng thái */}
            <div className="flex justify-between items-start mb-4">
                <div>
                    <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Mã đơn hàng</p>
                    <h3 className="text-lg font-bold text-gray-800 group-hover:text-blue-600 transition-colors">
                        #{data.id}
                    </h3>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${statusInfo.color}`}>
                    {statusInfo.label}
                </span>
            </div>

            {/* Body: Hình ảnh & Thông tin ngày */}
            <div className="flex gap-4 border-b border-dashed border-gray-200 pb-4 mb-4">
                {/* Hình ảnh sản phẩm đầu tiên (thumbnail) */}
                <div className="w-20 h-20 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                    <img
                        src={getImageUrl(data.items?.[0]?.image)}
                        alt="Product"
                        className="w-full h-full object-cover mix-blend-multiply"
                    />
                </div>

                {/* Thông tin ngày tháng */}
                <div className="flex flex-col justify-center gap-2 text-sm text-gray-600 w-full">
                    <div className="flex items-center gap-2">
                        <Calendar size={16} className="text-gray-400" />
                        <span>Ngày đặt: <span className="font-medium text-gray-800">{formatDate(data.createdAt)}</span></span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Clock size={16} className="text-gray-400" />
                        <span>Dự kiến giao: <span className="font-medium text-green-600">{formatDate(data.estimatedDelivery)}</span></span>
                    </div>
                </div>
            </div>

            {/* Footer: Tổng tiền & CTA */}
            <div className="flex justify-between items-center">
                <div>
                    <p className="text-xs text-gray-500">Tổng thanh toán</p>
                    <p className="text-lg font-bold text-blue-600">
                        {formatCurrency(data.totalPrice)}
                    </p>
                </div>

                <button className="text-gray-400 group-hover:text-blue-600 transition-colors">
                    <ChevronRight size={24} />
                </button>
            </div>
        </div>
    );
};

export default OverviewOrderCard;