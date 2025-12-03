// frontend/src/pages/ProfilePage.jsx
import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { FaUser, FaLock, FaMapMarkerAlt, FaCamera, FaShoppingBag, FaGift, FaTicketAlt } from 'react-icons/fa';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import OrderHistory from '../components/Order/OrderHistory';

// Import các component Tab
import ChangePassword from '../components/Profile/ChangePassword';
import ManageAddresses from '../components/Profile/ManageAddresses';
import UserDetail from '../components/common/UserDetail';
import { UserController } from '../controllers/userController';
import { getAvatarUrl } from '../services/api';
import api from '../services/api';
import Breadcrumb from '../components/common/Breadcrumb';

const TABS = {
    PROFILE: 'profile',
    PASSWORD: 'password',
    ADDRESSES: 'addresses',
    ORDERS: 'orders', // <--- MỚI
    VOUCHERS: 'vouchers', // <--- Voucher khả dụng để đổi
    MY_VOUCHERS: 'my-vouchers' // <--- Voucher đã đổi của tôi
};

const LoadingSpinner = () => (
    <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-accent"></div>
    </div>
);

const ProfilePage = () => {
    const { user, setUser } = useAuth();
    const [activeTab, setActiveTab] = useState(TABS.PROFILE);

    const [isLoadingAvatar, setIsLoadingAvatar] = useState(false);
    const fileInputRef = useRef(null);
    const [avatarPreview, setAvatarPreview] = useState(getAvatarUrl(user?.avatar));
    
    // State for vouchers
    const [availableVouchers, setAvailableVouchers] = useState(null);
    const [isLoadingVouchers, setIsLoadingVouchers] = useState(false);
    const [myVouchers, setMyVouchers] = useState(null);
    const [isLoadingMyVouchers, setIsLoadingMyVouchers] = useState(false);

    // Đồng bộ ảnh khi user context thay đổi
    useEffect(() => {
        if (user?.avatar) {
            setAvatarPreview(getAvatarUrl(user.avatar));
        }
    }, [user]);

    const handleAvatarClick = () => {
        fileInputRef.current.click();
    };

    // === CẬP NHẬT LOGIC: GỌI API + TOAST ===
    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // 1. Preview ảnh ngay lập tức (Optimistic UI)
        const reader = new FileReader();
        reader.onloadend = () => {
            setAvatarPreview(reader.result);
        };
        reader.readAsDataURL(file);

        setIsLoadingAvatar(true);
        try {
            const formData = new FormData();
            formData.append('avatar', file);

            // 2. Gọi API
            const response = await UserController.updateProfile(formData);

            // 3. SỬA LỖI TẠI ĐÂY:
            // Kiểm tra lỏng hơn: Nếu response tồn tại là OK. 
            // (UserController thường trả về data, nếu lỗi nó đã throw error rồi)
            if (response) {
                // API có thể trả về { success: true, user: ... } HOẶC chỉ trả về object User
                const newUser = response.user || response;

                // Cập nhật Context
                setUser(newUser);

                // Hiện Toast
                toast.success("Cập nhật ảnh đại diện thành công!");
            }

        } catch (error) {
            console.error("Lỗi upload avatar:", error);
            toast.error("Lỗi khi cập nhật ảnh đại diện.");
            // Revert lại ảnh cũ nếu lỗi
            setAvatarPreview(getAvatarUrl(user?.avatar));
        } finally {
            setIsLoadingAvatar(false);
        }
    };
    // =================================================
    
    // Fetch available vouchers
    const fetchAvailableVouchers = async (forceRefresh = false) => {
        if (availableVouchers && !forceRefresh) return; // Đã load rồi
        
        setIsLoadingVouchers(true);
        try {
            const response = await api.get('/discounts/available');
            setAvailableVouchers(response.data.vouchers || []);
        } catch (error) {
            console.error('Error fetching vouchers:', error);
            setAvailableVouchers([]);
        } finally {
            setIsLoadingVouchers(false);
        }
    };

    // Load vouchers khi switch to VOUCHERS tab
    useEffect(() => {
        if (activeTab === TABS.VOUCHERS) {
            fetchAvailableVouchers();
        } else if (activeTab === TABS.MY_VOUCHERS) {
            fetchMyVouchers();
        }
    }, [activeTab]);

    // Fetch user's redeemed vouchers
    const fetchMyVouchers = async () => {
        if (myVouchers) return; // Đã load rồi
        
        setIsLoadingMyVouchers(true);
        try {
            // Lấy voucher từ user profile
            setMyVouchers(user?.vouchers || []);
        } catch (error) {
            console.error('Error fetching my vouchers:', error);
            setMyVouchers([]);
        } finally {
            setIsLoadingMyVouchers(false);
        }
    };

    // Redeem voucher function
    const handleRedeemVoucher = async (voucher) => {
        if (!user) {
            toast.error('Vui lòng đăng nhập để đổi voucher!');
            return;
        }

        try {
            const response = await api.post('/discounts/redeem', {
                code: voucher.code
            });
            
            if (response.data.success) {
                toast.success(`Đã đổi voucher ${voucher.code} thành công!`);
                
                // Cập nhật myVouchers nếu đã load
                if (myVouchers !== null) {
                    const newVoucher = {
                        code: voucher.code,
                        name: voucher.name,
                        percent: voucher.percent,
                        minOrderValue: voucher.minOrder || 0,
                        expiry: voucher.expiry,
                        redeemedAt: new Date(),
                        isUsed: false
                    };
                    setMyVouchers(prev => [newVoucher, ...(prev || [])]);
                }
                
                // Force refresh voucher list
                setAvailableVouchers(null);
                setIsLoadingVouchers(true);
                setTimeout(() => {
                    fetchAvailableVouchers(true); // Force refresh
                }, 500); // Delay để backend update xong
            }
        } catch (error) {
            console.error('Error redeeming voucher:', error);
            const errorMsg = error.response?.data?.message || 'Có lỗi xảy ra khi đổi voucher';
            toast.error(errorMsg);
        }
    };

    // Hàm render nội dung theo Tab
    const renderTabContent = () => {
        switch (activeTab) {
            case TABS.PROFILE:
                return (
                    <div className="space-y-6">
                        <div className="bg-surface p-6 rounded-lg shadow-md">
                            <h3 className="text-xl font-semibold text-text-primary mb-4 pb-2 border-b border-gray-100">
                                Thông tin cá nhân
                            </h3>
                            <UserDetail
                                context="user"
                                user={user}
                                onSave={(updatedUser) => {
                                    setUser(updatedUser);
                                    // UserDetail tự xử lý toast
                                }}
                            />
                        </div>
                    </div>
                );
            case TABS.PASSWORD:
                return (
                    <div className="bg-surface p-6 rounded-lg shadow-md">
                        <h3 className="text-xl font-semibold text-text-primary mb-4 pb-2 border-b border-gray-100">
                            Đổi mật khẩu
                        </h3>
                        <ChangePassword />
                    </div>
                );
            case TABS.ADDRESSES:
                return (
                    <div className="bg-surface p-6 rounded-lg shadow-md">
                        <h3 className="text-xl font-semibold text-text-primary mb-4 pb-2 border-b border-gray-100">
                            Sổ địa chỉ
                        </h3>
                        <ManageAddresses />
                    </div>
                );
            case TABS.ORDERS:
                return (
                    <div className="bg-surface p-6 rounded-lg shadow-md min-h-[400px]">
                        <h3 className="text-xl font-semibold text-text-primary mb-6 pb-2 border-b border-gray-100">
                            Lịch sử đơn hàng
                        </h3>
                        {/* Gọi component OrderHistory đã tự xử lý logic fetch data */}
                        <OrderHistory />
                    </div>
                );
            case TABS.VOUCHERS:
                return (
                    <div className="bg-surface p-6 rounded-lg shadow-md min-h-[400px]">
                        <h3 className="text-xl font-semibold text-text-primary mb-6 pb-2 border-b border-gray-100 flex items-center">
                            <FaTicketAlt className="mr-2 text-orange-500" />
                            Voucher khả dụng
                        </h3>
                        
                        {isLoadingVouchers ? (
                            <div className="flex justify-center items-center py-12">
                                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-orange-500"></div>
                                <span className="ml-2 text-gray-500">Đang tải voucher...</span>
                            </div>
                        ) : availableVouchers && availableVouchers.length > 0 ? (
                            <div className="space-y-3">
                                {availableVouchers.map((voucher, index) => (
                                    <motion.div
                                        key={voucher._id || voucher.code}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                        className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all duration-200 bg-gradient-to-r from-orange-50 to-yellow-50 cursor-pointer hover:scale-[1.02]"
                                        onClick={() => handleRedeemVoucher(voucher)}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center space-x-4">
                                                <div className="bg-orange-500 text-white px-3 py-2 rounded-lg font-bold text-sm">
                                                    {voucher.percent ? `${voucher.percent}%` : '0%'}
                                                </div>
                                                <div>
                                                    <h4 className="font-semibold text-gray-800">{voucher.name || 'Voucher'}</h4>
                                                    <p className="text-sm text-gray-600 mt-1">
                                                        Voucher giảm giá đặc biệt
                                                    </p>
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        {voucher.minOrder > 0 && `Đơn tối thiểu: ${(voucher.minOrder || 0).toLocaleString()}đ • `}
                                                        {voucher.expiry && `HSD: ${new Date(voucher.expiry).toLocaleDateString('vi-VN')}`}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-orange-600 font-semibold text-sm mb-1">
                                                    Mã: {voucher.code || 'N/A'}
                                                </div>
                                                <div className="text-xs text-gray-500 mb-2">
                                                    Còn lại: {voucher.remaining || 0}
                                                </div>
                                                <button className="bg-orange-500 hover:bg-orange-600 text-white text-xs px-3 py-1 rounded-full transition-colors">
                                                    Đổi ngay
                                                </button>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        ) : availableVouchers !== null ? (
                            <div className="text-center py-12">
                                <FaTicketAlt className="mx-auto h-16 w-16 text-gray-300 mb-4" />
                                <p className="text-gray-500 text-lg">Bạn đã đổi hết voucher khả dụng!</p>
                                <p className="text-gray-400 text-sm mt-2">Hãy quay lại sau để không bỏ lỡ ưu đãi mới!</p>
                            </div>
                        ) : null}
                    </div>
                );
            
            case TABS.MY_VOUCHERS:
                return (
                    <div className="bg-surface p-6 rounded-lg shadow-md min-h-[400px]">
                        <h3 className="text-xl font-semibold text-text-primary mb-6 pb-2 border-b border-gray-100 flex items-center">
                            <FaTicketAlt className="mr-2 text-blue-500" />
                            Voucher của tôi
                        </h3>
                        
                        {isLoadingMyVouchers ? (
                            <div className="flex justify-center items-center py-12">
                                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                                <span className="ml-2 text-gray-500">Đang tải voucher...</span>
                            </div>
                        ) : myVouchers && myVouchers.length > 0 ? (
                            <div className="space-y-3">
                                {myVouchers.map((voucher, index) => (
                                    <motion.div
                                        key={voucher._id || `${voucher.code}_${index}`}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                        className="border border-gray-200 rounded-lg p-4 bg-gradient-to-r from-blue-50 to-purple-50"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center space-x-4">
                                                <div className="bg-blue-500 text-white px-3 py-2 rounded-lg font-bold text-sm">
                                                    {voucher.percent ? `${voucher.percent}%` : '0%'}
                                                </div>
                                                <div>
                                                    <h4 className="font-semibold text-gray-800">{voucher.name || 'Voucher'}</h4>
                                                    <p className="text-sm text-gray-600 mt-1">
                                                        {voucher.isUsed ? "✅ Đã sử dụng" : "🎫 Chưa sử dụng"}
                                                    </p>
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        {voucher.minOrderValue > 0 && `Đơn tối thiểu: ${(voucher.minOrderValue || 0).toLocaleString()}đ • `}
                                                        {voucher.expiry && `HSD: ${new Date(voucher.expiry).toLocaleDateString('vi-VN')}`}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-blue-600 font-semibold text-sm mb-1">
                                                    Mã: {voucher.code || 'N/A'}
                                                </div>
                                                <div className="text-xs text-gray-500 mb-1">
                                                    Đổi lúc: {new Date(voucher.redeemedAt).toLocaleDateString('vi-VN')}
                                                </div>
                                                {voucher.isUsed && voucher.usedAt && (
                                                    <div className="text-xs text-green-600">
                                                        Dùng lúc: {new Date(voucher.usedAt).toLocaleDateString('vi-VN')}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        ) : myVouchers !== null ? (
                            <div className="text-center py-12">
                                <FaTicketAlt className="mx-auto h-16 w-16 text-gray-300 mb-4" />
                                <p className="text-gray-500 text-lg">Bạn chưa có voucher nào</p>
                                <p className="text-gray-400 text-sm mt-2">Hãy đổi voucher từ tab "Đổi điểm"!</p>
                            </div>
                        ) : null}
                    </div>
                );
            
            default: return null;
        }
    };

    const TabButton = ({ tabKey, icon, label }) => (
        <button
            onClick={() => setActiveTab(tabKey)}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200
                ${activeTab === tabKey
                    ? 'bg-accent text-white shadow-md transform scale-105'
                    : 'text-text-secondary hover:bg-gray-100 hover:text-text-primary'
                }`}
        >
            <span className="text-lg">{icon}</span>
            <span className="font-medium">{label}</span>
        </button>
    );

    const breadcrumbs = [
        { label: "Tài khoản của tôi" }
    ];

    if (!user) return <LoadingSpinner />;

    return (
        <div className="min-h-screen bg-background py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto">
                <Breadcrumb crumbs={breadcrumbs} />

                <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mt-6">
                    {/* Cột trái: Sidebar Menu + Avatar */}
                    <aside className="md:col-span-1 space-y-6">
                        <div className="sticky top-24 space-y-6">

                            {/* 1. Avatar Card */}
                            <div className="bg-surface p-6 rounded-lg shadow-lg flex flex-col items-center text-center">
                                <div className="relative group mb-4">
                                    <div className="w-28 h-28 rounded-full overflow-hidden ring-4 ring-accent/20">
                                        <img
                                            src={avatarPreview}
                                            alt="Profile"
                                            className={`w-full h-full object-cover transition-opacity duration-300 ${isLoadingAvatar ? 'opacity-50' : 'opacity-100'}`}
                                        />
                                        {isLoadingAvatar && (
                                            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30">
                                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Nút upload ảnh */}
                                    {!isLoadingAvatar && (
                                        <div
                                            onClick={handleAvatarClick}
                                            className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                                        >
                                            <FaCamera className="text-white text-2xl" />
                                        </div>
                                    )}
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        onChange={handleFileChange}
                                        className="hidden"
                                        accept="image/*"
                                    />
                                </div>

                                <h2 className="text-xl font-semibold text-text-primary">{user.name}</h2>
                                <p className="text-sm text-text-secondary">{user.email}</p>
                                
                                {/* Hiển thị điểm thưởng */}
                                {user.loyaltyPoints !== undefined && (
                                    <div className="mt-4 w-full">
                                        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg p-3 border border-yellow-200">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-2xl">🎁</span>
                                                    <div className="text-left">
                                                        <p className="text-xs text-gray-600">Điểm tích lũy</p>
                                                        <p className="text-lg font-bold text-orange-600">{user.loyaltyPoints} điểm</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-xs text-gray-600">Giá trị</p>
                                                    <p className="text-sm font-semibold text-green-600">
                                                        {(user.loyaltyPoints * 1000).toLocaleString()}đ
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                        <p className="text-xs text-gray-500 mt-2 text-center">
                                            Tích 10% giá trị đơn hàng • 1 điểm = 1.000đ
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* 2. Menu */}
                            <nav className="bg-surface p-4 rounded-lg shadow-lg space-y-1">
                                <TabButton tabKey={TABS.PROFILE} icon={<FaUser />} label="Hồ sơ cá nhân" />
                                <TabButton tabKey={TABS.PASSWORD} icon={<FaLock />} label="Đổi mật khẩu" />
                                <TabButton tabKey={TABS.ADDRESSES} icon={<FaMapMarkerAlt />} label="Địa chỉ" />
                                <TabButton tabKey={TABS.ORDERS} icon={<FaShoppingBag />} label="Đơn mua" />
                                <TabButton tabKey={TABS.VOUCHERS} icon={<FaGift />} label="Đổi điểm" />
                                <TabButton tabKey={TABS.MY_VOUCHERS} icon={<FaTicketAlt />} label="Voucher của tôi" />
                            </nav>
                        </div>
                    </aside>

                    {/* Cột phải: Nội dung */}
                    <main className="md:col-span-3">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3 }}
                        >
                            {renderTabContent()}
                        </motion.div>
                    </main>
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;