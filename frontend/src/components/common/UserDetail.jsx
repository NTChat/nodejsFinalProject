import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    X, Save, ChevronRight, Calendar as CalendarIcon, 
    User, Mail, Phone, Gift 
} from 'lucide-react';
import { toast } from 'react-toastify';

import { UserController } from '../../controllers/userController';
import { useAuth } from '../../context/AuthContext';

import Calendar from './Calendar';

// === HÀM TÍNH TUỔI ===
const calculateAge = (dobString) => {
    if (!dobString) return 'N/A';
    try {
        const dateValue = typeof dobString === 'string' ? dobString.replace(/-/g, '/') : dobString;
        const birthDate = new Date(dateValue);
        if (isNaN(birthDate.getTime())) return 'N/A';
        
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
    } catch (e) { return 'N/A'; }
};

// === HÀM TÍNH HẠNG THÀNH VIÊN ===
const getMemberTier = (points) => {
    const p = parseInt(points) || 0;
    if (p >= 5000) return { name: 'Kim Cương', color: 'bg-blue-100 text-blue-700 border-blue-200', icon: '💎' };
    if (p >= 2000) return { name: 'Vàng', color: 'bg-yellow-100 text-yellow-700 border-yellow-200', icon: '🥇' };
    if (p >= 1000) return { name: 'Bạc', color: 'bg-gray-100 text-gray-700 border-gray-200', icon: '🥈' };
    return { name: 'Đồng', color: 'bg-orange-50 text-orange-700 border-orange-100', icon: '🥉' };
};

// --- VARIANTS ANIMATION ---
const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1,
            delayChildren: 0.2
        }
    }
};

const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { 
        y: 0, 
        opacity: 1,
        transition: { type: "spring", stiffness: 100 }
    }
};

const UserDetail = ({ user, onClose, onSave, context = 'user', onNext }) => {
    const isModal = context === 'admin';
    
    const { setUser: setAuthUser } = useAuth();

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phoneNumber: '',
        dateOfBirth: '',
        points: 0, 
    });

    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (user) {
            setFormData({
                name: user.name || '',
                email: user.email || '',
                phoneNumber: user.phoneNumber || '',
                dateOfBirth: user.dateOfBirth || '',
                points: user.points || 0,
            });
            setIsEditing(false);
        }
    }, [user]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            const updatedData = { ...user, ...formData };

            if (context === 'admin' && onSave) {
                await onSave(updatedData);
                setIsEditing(false);
            }
            else if (context === 'user') {
                const response = await UserController.updateProfile(formData);
                if (response) {
                    const updatedUser = response.user || response;
                    setAuthUser(updatedUser);
                    toast.success('Cập nhật thông tin thành công');
                    setIsEditing(false);
                }
            }
        } catch (error) {
            console.error(error);
            toast.error('Lỗi khi lưu thông tin');
        } finally {
            setLoading(false);
        }
    };

    // --- LOGIC UI ---
    const age = calculateAge(formData.dateOfBirth);
    const calendarRightContent = (age !== 'N/A') ? (
        <span className={`text-xs px-2 py-1 rounded-full font-medium z-20 bg-white shadow-sm border
            ${!isEditing ? 'text-gray-600 border-gray-200' : 'text-blue-600 border-blue-100'}
        `}>
            {age} tuổi
        </span>
    ) : null;

    const tier = getMemberTier(formData.points);

    // 🛠️ SỬA LỖI: Chuyển từ Component Func sang biến JSX
    const formContent = (
        <motion.div 
            className="space-y-6"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >

            {/* Hạng thành viên */}
            <motion.div variants={itemVariants} className={`p-4 rounded-xl border flex items-center justify-between ${tier.color}`}>
                <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-white/50 flex items-center justify-center text-2xl shadow-sm">
                        {tier.icon}
                    </div>
                    <div>
                        <p className="text-xs uppercase font-bold opacity-70 tracking-wider">Hạng thành viên</p>
                        <h3 className="text-lg font-bold">{tier.name} Member</h3>
                    </div>
                </div>
                <div className="text-right hidden sm:block">
                    <div className="flex items-center gap-1 justify-end font-medium">
                        <Gift size={16} />
                        <span>Ưu đãi của bạn</span>
                    </div>
                    <p className="text-sm opacity-80">Tích điểm để nhận thêm quà</p>
                </div>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <motion.div variants={itemVariants} className="space-y-2">
                    <label className="text-sm font-medium text-text-secondary flex items-center gap-2">
                        <User size={16} /> Họ và tên
                    </label>
                    <input
                        type="text" name="name" value={formData.name} onChange={handleChange} disabled={!isEditing}
                        className={`w-full px-4 py-2.5 rounded-lg border transition-all duration-200 outline-none ${!isEditing ? 'bg-gray-50 border-gray-200 text-text-secondary' : 'bg-white border-gray-300 text-text-primary focus:border-accent focus:ring-2 focus:ring-accent/20'}`}
                    />
                </motion.div>
                
                <motion.div variants={itemVariants} className="space-y-2">
                    <label className="text-sm font-medium text-text-secondary flex items-center gap-2">
                        <Mail size={16} /> Email
                    </label>
                    <input type="email" value={formData.email} disabled={true} className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-gray-100 text-text-secondary cursor-not-allowed" />
                </motion.div>

                <motion.div variants={itemVariants} className="space-y-2">
                    <label className="text-sm font-medium text-text-secondary flex items-center gap-2">
                        <Phone size={16} /> Số điện thoại
                    </label>
                    <input
                        type="tel" name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} disabled={!isEditing}
                        className={`w-full px-4 py-2.5 rounded-lg border transition-all duration-200 outline-none ${!isEditing ? 'bg-gray-50 border-gray-200 text-text-secondary' : 'bg-white border-gray-300 text-text-primary focus:border-accent focus:ring-2 focus:ring-accent/20'}`}
                    />
                </motion.div>

                <motion.div variants={itemVariants}>
                    <Calendar 
                        label="Ngày sinh" 
                        value={formData.dateOfBirth}
                        onChange={(newDate) => setFormData(prev => ({ ...prev, dateOfBirth: newDate }))}
                        disabled={!isEditing}
                        rightContent={calendarRightContent}
                        placeholder="Chọn ngày sinh"
                    />
                </motion.div>
            </div>
        </motion.div>
    );

    // 🛠️ SỬA LỖI: Chuyển từ Component Func sang biến JSX
    const actionButtons = (
        <motion.div 
            className="flex items-center justify-end gap-4 mt-8 pt-6 border-t border-gray-100"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
        >
            {!isEditing ? (
                <>
                    <button onClick={() => onClose()} className="px-6 py-2.5 rounded-lg border border-gray-300 text-text-secondary hover:bg-gray-50 transition-colors font-medium">Đóng</button>
                    <button onClick={() => setIsEditing(true)} className="px-6 py-2.5 rounded-lg bg-accent text-white hover:bg-accent/90 transition-colors font-medium shadow-md hover:shadow-lg transform active:scale-95 duration-200">Chỉnh sửa</button>
                </>
            ) : (
                <>
                    <button onClick={() => { setIsEditing(false); if(user) setFormData({ 
                        name: user.name || '', email: user.email || '', phoneNumber: user.phoneNumber || '', dateOfBirth: user.dateOfBirth || '', points: user.points || 0
                    }); }} className="px-6 py-2.5 rounded-lg border border-gray-300 text-text-secondary hover:bg-gray-50 transition-colors font-medium">Hủy bỏ</button>
                    <button onClick={handleSave} disabled={loading} className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-accent text-white hover:bg-accent/90 transition-colors font-medium shadow-md hover:shadow-lg transform active:scale-95 duration-200 disabled:opacity-70">
                        {loading ? 'Đang lưu...' : <><Save size={18} /> Lưu thay đổi</>}
                    </button>
                </>
            )}
        </motion.div>
    );

    if (!isModal) {
        return <div className="bg-surface rounded-lg">{formContent}{actionButtons}</div>;
    }

    return (
        <AnimatePresence>
            {user && (
                <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    exit={{ opacity: 0 }} 
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" 
                    onClick={onClose}
                >
                    <motion.div 
                        initial={{ scale: 0.9, opacity: 0, y: 20 }} 
                        animate={{ scale: 1, opacity: 1, y: 0 }} 
                        exit={{ scale: 0.9, opacity: 0, y: 20 }} 
                        transition={{ type: "spring", duration: 0.5 }}
                        onClick={(e) => e.stopPropagation()} 
                        className="bg-surface w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden relative flex flex-col max-h-[90vh]"
                    >
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                            <div className="flex items-center gap-3">
                                <h2 className="text-lg font-bold text-text-primary">Thông tin tài khoản</h2>
                            </div>
                            <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors"><X size={24} /></button>
                        </div>
                        <div className="p-6 overflow-y-auto custom-scrollbar">{formContent}{actionButtons}</div>
                        {context === 'admin' && onNext && (
                            <motion.button 
                                className="absolute right-4 top-1/2 -translate-y-1/2 z-10 p-2 bg-black/20 rounded-full text-white hover:bg-black/50 transition-colors" 
                                onClick={(e) => { e.stopPropagation(); onNext(); }} 
                                whileHover={{ scale: 1.1 }} 
                                whileTap={{ scale: 0.9 }}
                            >
                                <ChevronRight size={32} />
                            </motion.button>
                        )}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default UserDetail;