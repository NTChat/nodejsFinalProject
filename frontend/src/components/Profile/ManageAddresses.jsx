import React, { useState, useEffect, useCallback } from 'react';
import { UserController } from '../../controllers/userController';
import { FaPlus, FaEdit, FaTrash, FaStar } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import AddressForm from '../common/AddressForm'; // 👈 Import component vừa tách

const ManageAddresses = () => {
    const [addresses, setAddresses] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingAddress, setEditingAddress] = useState(null);

    // (Load địa chỉ)
    const loadAddresses = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await UserController.getMyAddresses();
            setAddresses(data.addresses || []);
        } catch (error) {
            console.error("Lỗi load địa chỉ:", error);
            toast.error("Không thể tải danh sách địa chỉ.");
        }
        setIsLoading(false);
    }, []);

    useEffect(() => {
        loadAddresses();
    }, [loadAddresses]);

    // --- CÁC HÀM XỬ LÝ SỰ KIỆN ---

    const handleAddNew = () => {
        setEditingAddress(null);
        setIsFormOpen(true);
    };

    const handleEdit = (address) => {
        setEditingAddress(address);
        setIsFormOpen(true);
    };

    const handleCancelForm = () => {
        setIsFormOpen(false);
        setEditingAddress(null);
    };

    const handleDelete = async (addressId) => {
        if (window.confirm("Bạn có chắc muốn xóa địa chỉ này?")) {
            try {
                await UserController.deleteAddress(addressId);
                toast.success("Đã xóa địa chỉ.");
                loadAddresses(); // Tải lại list
            } catch (error) {
                console.error("Lỗi xóa địa chỉ:", error);
                toast.error(error.message || "Xóa địa chỉ thất bại.");
            }
        }
    };

    const handleSetDefault = async (addressId) => {
        // Logic đặt mặc định thường là update địa chỉ đó với isDefault = true
        // Backend sẽ tự động set các cái khác thành false
        try {
            const target = addresses.find(a => a._id === addressId);
            if (!target) return;
            
            const payload = { ...target, isDefault: true };
            // Loại bỏ _id để tránh lỗi nếu backend k cần
            delete payload._id; 

            await UserController.updateAddress(addressId, payload);
            toast.success("Đã đặt làm địa chỉ mặc định.");
            loadAddresses();
        } catch (error) {
            toast.error("Lỗi khi đặt mặc định.");
        }
    };

    // (Xử lý Submit Form từ AddressForm gửi lên)
    const handleSubmit = async (formData) => {
        try {
            if (editingAddress) {
                // Update
                await UserController.updateAddress(editingAddress._id, formData);
                toast.success("Đã cập nhật địa chỉ.");
            } else {
                // Create
                await UserController.addAddress(formData);
                toast.success("Đã thêm địa chỉ mới.");
            }
            setIsFormOpen(false);
            setEditingAddress(null);
            loadAddresses(); // Tải lại
        } catch (error) {
            console.error("Lỗi lưu địa chỉ:", error);
            toast.error(error.message || "Lưu địa chỉ thất bại.");
        }
    };

    return (
        <div className="bg-surface rounded-lg shadow-md p-6 min-h-[400px]">
            <AnimatePresence mode="wait">
                {isFormOpen ? (
                    // 1. Giao diện Form (Sử dụng component tách rời)
                    <motion.div
                        key="form"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.2 }}
                    >
                        <AddressForm
                            initialData={editingAddress}
                            onSubmit={handleSubmit}
                            onCancel={handleCancelForm}
                        />
                    </motion.div>
                ) : (
                    // 2. Giao diện Danh sách
                    <motion.div
                        key="list"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        <div className="flex justify-between items-center mb-6 border-b pb-4 border-gray-100">
                            <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
                                Địa chỉ nhận hàng
                                <span className="text-sm font-normal text-text-secondary">({addresses.length})</span>
                            </h2>
                            <motion.button
                                onClick={handleAddNew}
                                className="btn-accent-profile flex items-center gap-2 px-4 py-2"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                <FaPlus size={12} /> Thêm địa chỉ mới
                            </motion.button>
                        </div>

                        {/* Danh sách địa chỉ */}
                        {isLoading ? (
                            <div className="flex justify-center py-8">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {addresses.length === 0 ? (
                                    <div className="text-center py-8 text-text-secondary bg-gray-50 rounded-lg border border-dashed border-gray-200">
                                        <p>Bạn chưa có địa chỉ nào.</p>
                                        <button onClick={handleAddNew} className="text-accent hover:underline mt-2 text-sm">Thêm ngay</button>
                                    </div>
                                ) : (
                                    addresses.map(addr => (
                                        <motion.div 
                                            key={addr._id} 
                                            layout
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className={`relative p-4 border rounded-lg transition-all duration-200 
                                                ${addr.isDefault ? 'border-accent bg-blue-50/30 shadow-sm' : 'border-gray-200 hover:border-accent/50 hover:bg-gray-50'}
                                            `}
                                        >
                                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                                <div className="space-y-1 flex-1">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <h3 className="font-bold text-text-primary">{addr.fullName}</h3>
                                                        <span className="text-gray-300">|</span>
                                                        <p className="text-text-secondary font-medium">{addr.phoneNumber}</p>
                                                        {addr.isDefault && (
                                                            <span className="ml-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-accent/10 text-accent border border-accent/20 flex items-center gap-1">
                                                                <FaStar size={10} /> Mặc định
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-sm text-text-secondary leading-relaxed">
                                                        {addr.address}<br/>
                                                        {addr.ward}, {addr.district}, {addr.city}
                                                    </p>
                                                </div>

                                                <div className="flex items-center gap-3 md:border-l md:pl-4 md:border-gray-200 self-end md:self-center">
                                                    {!addr.isDefault && (
                                                        <button
                                                            onClick={() => handleSetDefault(addr._id)}
                                                            className="text-xs font-medium text-gray-500 hover:text-accent underline decoration-dotted"
                                                            title="Đặt làm địa chỉ mặc định"
                                                        >
                                                            Đặt mặc định
                                                        </button>
                                                    )}
                                                    
                                                    <div className="flex gap-2">
                                                        <motion.button
                                                            onClick={() => handleEdit(addr)}
                                                            className="p-2 text-blue-500 bg-blue-50 rounded-full hover:bg-blue-100 transition-colors"
                                                            whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                                                            title="Chỉnh sửa"
                                                        >
                                                            <FaEdit size={14} />
                                                        </motion.button>
                                                        <motion.button
                                                            onClick={() => handleDelete(addr._id)}
                                                            className="p-2 text-red-500 bg-red-50 rounded-full hover:bg-red-100 transition-colors"
                                                            whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                                                            title="Xóa"
                                                        >
                                                            <FaTrash size={14} />
                                                        </motion.button>
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))
                                )}
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ManageAddresses;