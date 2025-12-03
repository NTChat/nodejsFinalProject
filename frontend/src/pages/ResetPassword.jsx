// frontend/src/pages/ResetPassword.jsx
import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { FiLock, FiCheckCircle, FiEye, FiEyeOff } from 'react-icons/fi'; // 👈 Import thêm icon mắt
import { toast } from 'react-toastify';

// Import AuthController và Layout
import AuthSide from '../components/common/AuthSide';
import { AuthController } from '../controllers/AuthController';

const ResetPassword = () => {
    // 1. Lấy token từ URL
    const { token } = useParams();
    const navigate = useNavigate();

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // 👇 State quản lý ẩn/hiện mật khẩu
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validate cơ bản
        if (password.length < 6) {
            toast.error("Mật khẩu phải có ít nhất 6 ký tự.");
            return;
        }
        if (password !== confirmPassword) {
            toast.error("Mật khẩu xác nhận không khớp.");
            return;
        }

        setIsLoading(true);
        try {
            // 2. Gọi API qua Controller
            await AuthController.resetPassword(token, password);

            toast.success("Đặt lại mật khẩu thành công!");

            // 3. Chuyển hướng về trang Login sau 2 giây
            setTimeout(() => {
                navigate('/login');
            }, 2000);

        } catch (error) {
            toast.error(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col md:flex-row h-screen overflow-hidden">

            {/* Phần ảnh minh họa bên trái */}
            <AuthSide imgSrc="/img/reset-password-illustration.svg" />

            {/* Phần Form bên phải */}
            <div className="flex flex-col justify-center items-center w-full md:w-1/2 px-8 py-10 bg-white">
                <div className="max-w-sm w-full">
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Đặt lại mật khẩu</h2>
                    <p className="text-gray-600 mb-6 text-sm">
                        Vui lòng nhập mật khẩu mới cho tài khoản của bạn.
                    </p>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Ô Mật khẩu mới */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Mật khẩu mới
                            </label>
                            <div className="relative">
                                {/* Icon Khóa bên trái */}
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <FiLock className="text-gray-400" />
                                </div>

                                <input
                                    type={showPassword ? "text" : "password"} // 👇 Đổi type dựa trên state
                                    className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />

                                {/* 👇 Nút con mắt bên phải */}
                                <button
                                    type="button" // Quan trọng: type button để không submit form
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-blue-600 focus:outline-none cursor-pointer"
                                >
                                    {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                                </button>
                            </div>
                        </div>

                        {/* Ô Xác nhận mật khẩu */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Xác nhận mật khẩu
                            </label>
                            <div className="relative">
                                {/* Icon Check bên trái */}
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <FiCheckCircle className="text-gray-400" />
                                </div>

                                <input
                                    type={showConfirmPassword ? "text" : "password"} // 👇 Đổi type dựa trên state
                                    className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                    placeholder="••••••••"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                />

                                {/* 👇 Nút con mắt bên phải */}
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-blue-600 focus:outline-none cursor-pointer"
                                >
                                    {showConfirmPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className={`w-full py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
                        >
                            {isLoading ? 'Đang cập nhật...' : 'Xác nhận đổi mật khẩu'}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <Link to="/login" className="text-sm text-blue-600 hover:underline">
                            Quay lại đăng nhập
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ResetPassword;