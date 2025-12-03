// frontend/src/routes/ProtectedRoute.jsx
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // Đảm bảo đường dẫn đúng tới AuthContext của bạn

const ProtectedRoute = ({ children }) => {
    const { user, loading } = useAuth(); // Giả sử AuthContext có biến loading
    const location = useLocation();

    // 1. Nếu đang kiểm tra phiên đăng nhập (F5 trang), hiện loading để không đá user ra oan
    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    // 2. Nếu không có user (chưa login) -> Chuyển hướng về Login
    if (!user) {
        // state={{ from: location }} giúp lưu lại trang họ muốn vào
        // để sau khi login xong, ta chuyển hướng họ quay lại đúng trang đó.
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // 3. Nếu đã login -> Cho phép hiển thị trang
    return children;
};

export default ProtectedRoute;