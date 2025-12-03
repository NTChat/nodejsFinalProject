import { Route, Routes, Navigate } from "react-router-dom";
import Dashboard from "../pages/Dashboard";
import Users from "../components/Dashboard/Users";
import ProductManagement from "../components/Dashboard/ProductManagement";
import Settings from "../components/Dashboard/Settings";
import DashboardAdvanced from "../pages/DashboardAdvanced";
import AdminOrders from "../pages/AdminOrders";
import AdminProductEditPage from "../pages/AdminProductEditPage";
import AdminProductNewPage from "../pages/AdminProductNewPage";
import AdminOrderDetail from "../pages/AdminOrderDetail";
import DiscountManagement from "../pages/DiscountManagement";
import CategoriesManagement from "../pages/CategoriesManagement";
import OrderDetailPage from "../pages/OrderDetailPage";
import AdminNotifications from "../pages/AdminNotifications_Simple";
import NotificationDetailPage from "../pages/NotificationDetailPage";
import LoyaltyRewardsManagement from "../pages/LoyaltyRewardsManagement";
import AdminFlashSaleManagement from "../pages/AdminFlashSaleManagement";
import AdminOverview from "../pages/AdminOverview";
import AdminChatManagement from "../pages/AdminChatManagement";

export default function DashboardRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />}>

        {/* Route mặc định: Trang tổng quan Admin */}
        <Route index element={<Navigate to="/admin/dashboard" replace />} />

        {/* Trang tổng quan - hiển thị menu các chức năng */}
        <Route path="dashboard" element={<AdminOverview />} />
        
        {/* Trang thống kê & biểu đồ */}
        <Route path="statistics" element={<DashboardAdvanced />} />
        <Route path="users" element={<Users />} />
        <Route path="settings" element={<Settings />} />
        <Route path="categories" element={<CategoriesManagement />} />

        {/* --- QUẢN LÝ SẢN PHẨM --- */}
        <Route path="products" element={<ProductManagement />} />
        <Route path="products/new" element={<AdminProductNewPage />} />
        <Route path="products/:id/edit" element={<AdminProductEditPage />} />

        {/* --- QUẢN LÝ ĐƠN HÀNG --- */}
        {/* 1. Danh sách đơn hàng */}
        <Route path="orders" element={<AdminOrders />} />

        {/* 2. Chi tiết đơn hàng (Lưu ý: path tương đối, không có /admin ở đầu) */}
        <Route path="orders/:id" element={<AdminOrderDetail />} />

        {/* --- THÔNG BÁO --- */}
        <Route path="notifications" element={<AdminNotifications />} />
        <Route path="notifications/:type/:id" element={<NotificationDetailPage />} />

        {/* --- CỤM DISCOUNT (QUAN TRỌNG) --- */}
        <Route path="discounts" element={<DiscountManagement />} />
        
        {/* --- QUÀ ĐỔI ĐIỂM --- */}
        <Route path="loyalty-rewards" element={<LoyaltyRewardsManagement />} />

        {/* --- FLASH SALE --- */}
        <Route path="flash-sales" element={<AdminFlashSaleManagement />} />

        {/* --- QUẢN LÝ CHAT --- */}
        <Route path="chat" element={<AdminChatManagement />} />

        {/* --- FALLBACK (CHỐNG LỖI LẶP) --- */}
        {/* Nếu đường dẫn sai, buộc quay về trang chủ Dashboard tuyệt đối */}
        <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />

      </Route>
    </Routes>
  );
}