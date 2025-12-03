// frontend/src/pages/ForgotPassword.jsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiMail, FiArrowLeft, FiCheckCircle } from 'react-icons/fi';
import { toast } from 'react-toastify';

// Import các thành phần cần thiết
import AuthSide from '../components/common/AuthSide';
import { AuthController } from '../controllers/AuthController';

const ForgotPassword = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!email) {
            toast.error("Vui lòng nhập email.");
            return;
        }

        setIsLoading(true);
        try {
            // Gọi AuthController
            // Lưu ý: AuthController cần trả về object { success: boolean, isSocial?: boolean, message?: string }
            const result = await AuthController.forgotPassword(email);

            setIsLoading(false);

            if (result.success) {
                // Thành công -> Hiện UI đã gửi mail
                setIsSubmitted(true);
            } else if (result.isSocial) {
                // === LOGIC MỚI: TÀI KHOẢN SOCIAL ===
                // 1. Hiện thông báo
                toast.info(result.message || "Tài khoản này được đăng ký bằng Google/Facebook. Vui lòng đăng nhập lại.", {
                    autoClose: 3500,
                    onClose: () => navigate('/login')
                });

                // 2. Chuyển hướng an toàn sau 3.5s
                setTimeout(() => {
                    navigate('/login');
                }, 3500);
            }
            // Các lỗi khác thì Controller đã tự hiện toast error rồi

        } catch (error) {
            setIsLoading(false);
            console.error("Forgot password error:", error);
            toast.error("Có lỗi xảy ra, vui lòng thử lại.");
        }
    };

    return (
        <div className="flex h-screen bg-gray-50 overflow-hidden">

            {/* === 1. LEFT SIDE: IMAGE (Đặt lên trước để hiển thị bên trái) === */}
            <AuthSide imgSrc="/img/forgot-password-illustration.svg" />


            {/* === 2. RIGHT SIDE: FORM === */}
            <div className="w-full md:w-1/2 flex flex-col justify-center items-center p-8 md:p-12 bg-white relative">

                {/* Logo cho Mobile */}
                <div className="md:hidden absolute top-6 left-6">
                    <img src="/img/logo.svg" alt="Logo" className="h-10 w-auto" />
                </div>

                <div className="max-w-md w-full">
                    <div className="text-center mb-8">
                        <h2 className="text-3xl font-bold text-gray-900">
                            {isSubmitted ? 'Kiểm tra hộp thư' : 'Quên mật khẩu?'}
                        </h2>
                        {!isSubmitted && (
                            <p className="mt-2 text-sm text-gray-600">
                                Nhập email của bạn để nhận hướng dẫn đặt lại mật khẩu.
                            </p>
                        )}
                    </div>

                    {!isSubmitted ? (
                        <>
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div>
                                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                                        Địa chỉ Email
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <FiMail className="text-gray-400" />
                                        </div>
                                        <input
                                            id="email"
                                            name="email"
                                            type="email"
                                            autoComplete="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                            placeholder="nhapmailcuaban@example.com"
                                            required
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className={`w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
                                >
                                    {isLoading ? 'Đang xử lý...' : 'Gửi hướng dẫn'}
                                </button>
                            </form>

                            <div className="mt-6 text-center">
                                <Link
                                    to="/login"
                                    className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors"
                                >
                                    <FiArrowLeft /> Quay lại đăng nhập
                                </Link>
                            </div>
                        </>
                    ) : (
                        <div className="text-center">
                            <FiCheckCircle className="mx-auto h-16 w-16 text-green-500 mb-4" />
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Đã gửi email!</h3>
                            <p className="text-gray-600 mb-6">
                                Chúng tôi đã gửi hướng dẫn đặt lại mật khẩu đến <strong>{email}</strong>.
                                Vui lòng kiểm tra hộp thư đến (và cả mục Spam nhé).
                            </p>

                            <div className="space-y-3">
                                <button
                                    onClick={() => window.open('https://mail.google.com', '_blank')}
                                    className="w-full flex justify-center py-2.5 px-4 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-all"
                                >
                                    Mở Gmail ngay
                                </button>

                                <button
                                    onClick={() => setIsSubmitted(false)}
                                    className="w-full text-sm font-medium text-blue-600 hover:text-blue-500"
                                >
                                    Thử lại với email khác
                                </button>

                                <div className="pt-4">
                                    <Link
                                        to="/login"
                                        className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors"
                                    >
                                        <FiArrowLeft /> Quay lại đăng nhập
                                    </Link>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;