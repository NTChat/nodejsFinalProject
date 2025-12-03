// frontend/src/components/Profile/ChangePassword.jsx
import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import { FaGoogle, FaFacebook, FaLock } from 'react-icons/fa';
import { AuthController } from '../../controllers/AuthController'; // 👈 Import Controller

const ChangePassword = () => {
    const { user } = useAuth();
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Kiểm tra đăng nhập Social
    const isSocialLogin = user?.provider?.includes('google') || user?.provider?.includes('facebook');

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (newPassword.length < 6) {
            toast.error("Mật khẩu mới phải có ít nhất 6 ký tự.");
            return;
        }
        if (newPassword !== confirmPassword) {
            toast.error("Mật khẩu xác nhận không khớp!");
            return;
        }

        setIsLoading(true);
        try {
            // ❗ GỌI HÀM TỪ CONTROLLER
            await AuthController.changePassword(oldPassword, newPassword);

            toast.success("Đổi mật khẩu thành công!");

            // Reset form
            setOldPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (error) {
            // Hiển thị thông báo lỗi (ví dụ: Mật khẩu cũ sai)
            toast.error(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    // Nếu là Social Login thì ẩn form
    if (isSocialLogin) {
        return (
            <div className="bg-surface rounded-lg shadow-md p-6">
                <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-md">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            {user?.provider?.includes('google') ?
                                <FaGoogle className="h-6 w-6 text-blue-500" /> :
                                <FaFacebook className="h-6 w-6 text-blue-600" />
                            }
                        </div>
                        <div className="ml-3">
                            <p className="text-sm font-medium text-blue-700">
                                Bạn đã đăng nhập bằng {user?.provider?.includes('google') ? 'Google' : 'Facebook'}.
                            </p>
                            <p className="text-sm text-blue-600">
                                Bạn không cần quản lý mật khẩu tại đây.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-surface rounded-lg shadow-md p-6">

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="label-field">Mật khẩu cũ</label>
                    <input
                        type="password"
                        value={oldPassword}
                        onChange={(e) => setOldPassword(e.target.value)}
                        required
                        className="input-field w-full px-3 py-2 border rounded-md"
                    />
                </div>
                <div>
                    <label className="label-field">Mật khẩu mới</label>
                    <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                        className="input-field w-full px-3 py-2 border rounded-md"
                    />
                </div>
                <div>
                    <label className="label-field">Xác nhận mật khẩu mới</label>
                    <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        className="input-field w-full px-3 py-2 border rounded-md"
                    />
                </div>
                <div>
                    <button
                        type="submit"
                        disabled={isLoading}
                        className={`btn-accent-profile flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
                    >
                        <FaLock size={12} />
                        {isLoading ? "Đang xử lý..." : "Lưu thay đổi"}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ChangePassword;