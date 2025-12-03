// frontend/src/pages/Auth/Register.jsx
import { AuthController } from "../controllers/AuthController";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from '../context/AuthContext';
import { FiEye, FiEyeOff } from "react-icons/fi";
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import AuthSide from "../components/common/AuthSide";
import Calendar from "../components/common/Calendar";

const Register = ({ onSuccess, onClose, context }) => {

    // 1. Xác định context
    const isModal = context === 'admin';

    const { login } = useAuth();
    const navigate = useNavigate();

    // 2. State
    const [formData, setFormData] = useState({
        name: "",
        userName: "",
        email: "",
        phoneNumber: "",
        dateOfBirth: "",
        password: "",
        confirmPassword: ""
    });

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [avatarFile, setAvatarFile] = useState(null);
    const [avatarPreview, setAvatarPreview] = useState(null);
    const [loading, setLoading] = useState(false);

    // 3. Handlers
    const handleChange = (e) => {
        try {
            if (!e?.target) {
                console.warn('⚠️ handleChange: e.target is undefined', e);
                return;
            }
            setFormData({
                ...formData,
                [e.target.name]: e.target.value
            });
        } catch (err) {
            console.error('❌ handleChange error:', err);
        }
    };

    const handleAvatarChange = (e) => {
        try {
            if (!e?.target?.files) {
                console.warn('⚠️ handleAvatarChange: e.target.files is undefined', e);
                return;
            }
            const file = e.target.files[0];
            if (file) {
                setAvatarFile(file);
                const reader = new FileReader();
                reader.onloadend = () => {
                    setAvatarPreview(reader.result);
                }
                reader.readAsDataURL(file);
            } else {
                setAvatarFile(null);
                setAvatarPreview(null);
            }
        } catch (err) {
            console.error('❌ handleAvatarChange error:', err);
        }
    };

    const handleSubmit = async (e) => {
        try {
            if (!e?.preventDefault) {
                console.warn('⚠️ handleSubmit: e object is invalid', e);
                return;
            }
            e.preventDefault();
            setLoading(true);

            if (formData.password !== formData.confirmPassword) {
                toast.error("Mật khẩu và xác nhận mật khẩu không khớp!");
                setLoading(false);
                return;
            }

            try {
                const registerFormData = new FormData();
                for (const key in formData) {
                    if (key !== 'confirmPassword') {
                        registerFormData.append(key, formData[key]);
                    }
                }
                if (avatarFile) {
                    registerFormData.append('avatar', avatarFile);
                }

                const data = await AuthController.register(registerFormData);

                // Backend trả về { success, user, ... }
                if (data?.user) {
                    if (isModal && onSuccess) {
                        onSuccess();
                    } else {
                        await login(data.user);
                        toast.success("Đăng ký thành công! Hãy thêm địa chỉ của bạn.");
                        setTimeout(() => {
                            navigate("/register-address");
                        }, 2000);
                    }
                } else {
                    throw new Error(data?.message || "Đăng ký thất bại");
                }

            } catch (error) {
                console.error('❌ handleSubmit register error:', error);
                toast.error(error.message);
            } finally {
                setLoading(false);
            }
        } catch (err) {
            console.error('❌ handleSubmit outer error:', err);
            setLoading(false);
        }
    };

    // === 4. FIX LỖI TEXTBOX: Chuyển thành biến JSX (không phải Component) ===
    const formContent = (
        <>
            {/* Header (Ẩn khi là Modal) */}
            {!isModal && (
                <>
                    <div className="md:hidden absolute top-6 left-6 flex items-center space-x-2">
                        <img src="/img/logo.svg" alt="Logo" className="h-24 w-auto" />
                    </div>
                    <div className="max-w-sm w-full mt-24 md:mt-0">
                        <h1 className="text-2xl font-semibold text-gray-800 mb-1">
                            Tạo tài khoản
                        </h1>
                        <h3 className="text-gray-600 mb-6">
                            Cùng PhoneWorld kết nối và trải nghiệm dịch vụ tốt nhất!
                        </h3>

                        <div className="flex items-center justify-center mb-6">
                            <hr className="w-1/4 border-gray-300" />
                            <span className="mx-3 text-gray-400 text-sm">Đăng ký bằng email</span>
                            <hr className="w-1/4 border-gray-300" />
                        </div>
                    </div>
                </>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Avatar */}
                <div className="flex flex-col items-center space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Ảnh đại diện (Tùy chọn)</label>
                    <div className="w-24 h-24 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden relative group">
                        {avatarPreview ? (
                            <img src={avatarPreview} alt="Avatar Preview" className="w-full h-full object-cover" />
                        ) : (
                            <span className="text-xs text-gray-400">Xem trước</span>
                        )}
                    </div>
                    <input
                        type="file"
                        name="avatar"
                        accept="image/*"
                        onChange={handleAvatarChange}
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                </div>

                {/* Họ tên */}
                <div>
                    <label className="block text-sm font-medium mb-1">Họ và tên <span className="text-red-500 text-xs">(bắt buộc)</span></label>
                    <input
                        type="text" name="name" placeholder="Nhập họ và tên"
                        value={formData.name} onChange={handleChange} required
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                {/* UserName */}
                <div>
                    <label className="block text-sm font-medium mb-1">Tên đăng nhập <span className="text-red-500 text-xs">(bắt buộc)</span></label>
                    <input
                        type="text" name="userName" placeholder="Nhập tên đăng nhập"
                        value={formData.userName} onChange={handleChange} required
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                {/* Email */}
                <div>
                    <label className="block text-sm font-medium mb-1">Email <span className="text-red-500 text-xs">(bắt buộc)</span></label>
                    <input
                        type="email" name="email" placeholder="Nhập email"
                        value={formData.email} onChange={handleChange} required
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                {/* SĐT & Ngày sinh */}
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                        <label className="block text-sm font-medium mb-1">SĐT <span className="text-gray-500 text-xs">(tùy chọn)</span></label>
                        <input
                            type="tel" name="phoneNumber" placeholder="Tùy chọn"
                            value={formData.phoneNumber} onChange={handleChange}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div className="w-full sm:w-1/2">
                        <Calendar
                            label="Ngày sinh"
                            value={formData.dateOfBirth}
                            onChange={(date) => setFormData({ ...formData, dateOfBirth: date })}
                            placeholder="Chọn ngày sinh..."
                            enableTime={false}
                        />
                    </div>
                </div>

                {/* Mật khẩu */}
                <div>
                    <label className="block text-sm font-medium mb-1">Mật khẩu <span className="text-red-500 text-xs">(bắt buộc)</span></label>
                    <div className="relative">
                        <input
                            type={showPassword ? "text" : "password"}
                            name="password" placeholder="Ít nhất 6 ký tự"
                            value={formData.password} onChange={handleChange} required
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
                        />
                        <button type="button" className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500" onClick={() => setShowPassword(!showPassword)}>
                            {showPassword ? <FiEyeOff /> : <FiEye />}
                        </button>
                    </div>
                </div>

                {/* Xác nhận mật khẩu */}
                <div>
                    <label className="block text-sm font-medium mb-1">Xác nhận mật khẩu <span className="text-red-500 text-xs">(bắt buộc)</span></label>
                    <div className="relative">
                        <input
                            type={showConfirmPassword ? "text" : "password"}
                            name="confirmPassword" placeholder="Nhập lại mật khẩu"
                            value={formData.confirmPassword} onChange={handleChange} required
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
                        />
                        <button type="button" className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                            {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
                        </button>
                    </div>
                </div>

                {/* Button Submit */}
                <div className="pt-2">
                    <button
                        type="submit"
                        className="w-full bg-blue-600 text-white rounded-md py-2 font-medium hover:bg-blue-700 transition"
                        disabled={loading}
                    >
                        {loading ? "Đang xử lý..." : (isModal ? "Tạo Người Dùng" : "Đăng ký")}
                    </button>
                </div>
            </form>

            {/* Footer Link (Ẩn khi là Modal) */}
            {!isModal && (
                <p className="text-center text-sm text-gray-600 mt-6 pb-10">
                    Đã có tài khoản?{" "}
                    <Link to="/login" className="text-blue-600 inline-block transition-all duration-200 hover:-translate-y-0.5">
                        Đăng nhập ngay
                    </Link>
                </p>
            )}
        </>
    );

    // === 5. RENDER CHÍNH ===

    // Trường hợp Modal (Admin)
    if (isModal) {
        return (
            <div className="w-full">
                {formContent}
            </div>
        );
    }

    // Trường hợp Page (Public)
    return (
        <div className="flex flex-col md:flex-row h-screen overflow-hidden">
            <AuthSide imgSrc="/img/register-illustration.svg" />
            <div className="flex flex-col justify-start items-center w-full md:w-1/2 px-8 py-10 overflow-y-auto">
                <div className="max-w-sm w-full">
                    {formContent}
                </div>
            </div>
        </div>
    );
};

export default Register;