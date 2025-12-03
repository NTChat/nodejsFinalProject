import {
    LayoutDashboard, Users, ShoppingCart, Settings,
    ChevronLeft, LogOut, ClipboardList, Store, Ticket, List, 
    ChevronRight, Gift, Zap, BarChart3, MessageSquare, Bell // Import Bell icon for notifications
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";

// --- CẤU HÌNH MENU ---
const overviewItems = [
    { label: "Tổng quan", icon: LayoutDashboard, path: "/admin/dashboard" },
    { label: "Thống kê", icon: BarChart3, path: "/admin/statistics" },
    { label: "Thông báo", icon: Bell, path: "/admin/notifications" },
];

const managementItems = [
    { label: "Đơn hàng", icon: ClipboardList, path: "/admin/orders" },
    { label: "Người dùng", icon: Users, path: "/admin/users" },
    { label: "Sản phẩm", icon: ShoppingCart, path: "/admin/products" },
    { label: "Danh mục", icon: List, path: "/admin/categories" },
    { label: "Mã giảm giá", icon: Ticket, path: "/admin/discounts" },
    { label: "Quà đổi điểm", icon: Gift, path: "/admin/loyalty-rewards" },
    { label: "Flash Sale", icon: Zap, path: "/admin/flash-sales" },
    { label: "Chat khách hàng", icon: MessageSquare, path: "/admin/chat" },
];

const SideBar = ({ onToggle, isMobileMenuOpen, onMobileClose }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { logout } = useAuth();

    const [active, setActive] = useState(location.pathname);
    const [collapsed, setCollapsed] = useState(false);

    const toggleSidebar = () => {
        const newState = !collapsed;
        setCollapsed(newState);
        if (onToggle) onToggle(newState);
    };

    // Xử lý navigation trên mobile
    const handleNavigate = (path) => {
        navigate(path);
        if (onMobileClose) onMobileClose();
    };

    useEffect(() => {
        setActive(location.pathname);
    }, [location.pathname]);

    const handleLogout = async () => {
        if (window.confirm("Bạn có chắc chắn muốn đăng xuất quyền Admin?")) {
            try {
                await logout();
                navigate('/login');
            } catch (error) {
                console.error("Lỗi đăng xuất:", error);
            }
        }
    };

    const NavItem = ({ item }) => {
        const isActive = active === item.path || active.startsWith(`${item.path}/`);
        return (
            <button
                onClick={() => handleNavigate(item.path)}
                className={`
                    relative group w-full py-3 rounded-xl transition-all duration-200 font-medium
                    flex items-center
                    ${collapsed ? "justify-center px-2" : "justify-between px-4"} 
                    ${isActive 
                        ? "bg-blue-600 text-white shadow-md shadow-blue-200" 
                        : "text-gray-500 hover:bg-blue-50 hover:text-blue-600"
                    }
                `}
                title={collapsed ? item.label : ""}
            >
                <div className="flex items-center gap-3 overflow-hidden">
                    <item.icon 
                        size={22} 
                        strokeWidth={isActive ? 2.5 : 2}
                        className={`flex-shrink-0 transition-transform duration-200 ${isActive ? "scale-105" : "group-hover:scale-110"}`} 
                    />
                    {!collapsed && <span className="text-sm whitespace-nowrap truncate">{item.label}</span>}
                </div>
                {/* Giữ lại mũi tên chỉ dẫn nhỏ ở item nếu muốn (hoặc xóa đoạn này nếu thấy rối) */}
                {!collapsed && isActive && <ChevronRight size={16} className="text-white" />}

                {collapsed && (
                    <div className="absolute left-full ml-3 px-3 py-1.5 bg-gray-800 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none whitespace-nowrap shadow-lg">
                        {item.label}
                        <div className="absolute top-1/2 right-full -translate-y-1/2 border-4 border-transparent border-r-gray-800"></div>
                    </div>
                )}
            </button>
        );
    };

    return (
        <aside
            className={`
                fixed top-0 left-0 h-screen bg-white shadow-xl border-r border-gray-100
                flex flex-col z-50 transition-all duration-300 ease-in-out
                overflow-x-hidden
                ${collapsed ? "lg:w-20" : "lg:w-64"}
                w-64
                ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
            `}
        >
            {/* === HEADER (SỬA ĐỔI CHÍNH Ở ĐÂY) === */}
            <div className={`
                flex items-center flex-shrink-0 border-b border-gray-50 transition-all duration-300
                ${collapsed 
                    ? "flex-col justify-center gap-4 py-4 h-auto" // Thu nhỏ: Xếp dọc (Logo trên, Nút dưới)
                    : "justify-between p-4 h-[72px]"             // Mở rộng: Xếp ngang
                }
            `}>
                {/* LOGO */}
                <div 
                    className="flex items-center gap-3 cursor-pointer group overflow-hidden" 
                    onClick={() => navigate('/')}
                >
                    <div className="w-9 h-9 flex-shrink-0 bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-blue-200 group-hover:scale-105 transition-transform">
                        P
                    </div>
                    
                    {!collapsed && (
                        <div className="flex flex-col truncate">
                            <h1 className="text-lg font-bold text-gray-800 tracking-tight leading-tight truncate">PhoneWorld</h1>
                            <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-widest">Admin</span>
                        </div>
                    )}
                </div>

                {/* NÚT TOGGLE (MŨI TÊN XỔ RA/THU VÀO) */}
                <button
                    onClick={toggleSidebar}
                    className={`
                        p-1.5 rounded-lg text-gray-400 hover:bg-blue-50 hover:text-blue-600 transition-all duration-200 flex-shrink-0
                        ${collapsed ? "bg-gray-50 hover:scale-110" : ""} /* Style nổi bật hơn khi thu nhỏ */
                    `}
                    title={collapsed ? "Mở rộng menu" : "Thu gọn menu"}
                >
                    {collapsed ? (
                        // Icon khi thu nhỏ: Mũi tên Phải (>)
                        <ChevronRight size={24} strokeWidth={2.5} />
                    ) : (
                        // Icon khi mở rộng: Mũi tên Trái (<)
                        <ChevronLeft size={20} />
                    )}
                </button>
            </div>

            {/* === MENU BODY === */}
            <nav className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-6 space-y-6 custom-scrollbar">
                {/* TỔNG QUAN & THỐNG KÊ */}
                <div className="space-y-1">
                    {!collapsed && <p className="px-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2 truncate">📊 Tổng quan</p>}
                    {overviewItems.map((item) => <NavItem key={item.path} item={item} />)}
                </div>

                {/* QUẢN LÝ CỬA HÀNG */}
                <div className="space-y-1">
                    {!collapsed && <p className="px-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2 truncate">🏪 Quản lý cửa hàng</p>}
                    {managementItems.map((item) => <NavItem key={item.path} item={item} />)}
                </div>
            </nav>

            {/* === FOOTER === */}
            <div className="mt-auto border-t border-gray-100 bg-gray-50/50 p-3 space-y-1 flex-shrink-0">
                <button
                    onClick={() => handleNavigate('/')}
                    className={`flex items-center w-full py-2.5 rounded-xl transition font-medium group
                        ${collapsed ? "justify-center" : "px-4 gap-3"}
                        text-gray-600 hover:text-blue-600 hover:bg-white hover:shadow-sm
                    `}
                    title={collapsed ? "Về cửa hàng" : ""}
                >
                    <Store size={20} className="group-hover:text-blue-600 transition-colors flex-shrink-0" />
                    {!collapsed && <span className="text-sm">Về cửa hàng</span>}
                </button>

                <button
                    onClick={handleLogout}
                    className={`flex items-center w-full py-2.5 rounded-xl transition font-medium group
                        ${collapsed ? "justify-center" : "px-4 gap-3"}
                        text-gray-500 hover:text-red-600 hover:bg-red-50
                    `}
                    title={collapsed ? "Đăng xuất" : ""}
                >
                    <LogOut size={20} className={`${collapsed ? "" : "rotate-180"} transition-transform group-hover:text-red-600 flex-shrink-0`} />
                    {!collapsed && <span className="text-sm">Đăng xuất</span>}
                </button>
            </div>
        </aside>
    );
};

export default SideBar;