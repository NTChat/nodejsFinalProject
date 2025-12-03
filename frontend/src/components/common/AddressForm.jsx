import React, { useState, useEffect, useCallback } from 'react';
import { UserController } from '../../controllers/userController';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';

const AddressForm = ({ initialData, onSubmit, onCancel }) => {
    const [formData, setFormData] = useState(
        initialData || {
            fullName: '', phoneNumber: '', address: '',
            ward: '', district: '', city: '', isDefault: false
        }
    );

    // Các state cho GHN API (Province/District/Ward)
    const [provinces, setProvinces] = useState([]);
    const [districts, setDistricts] = useState([]);
    const [wards, setWards] = useState([]);
    
    // Giữ state cho ID để điều khiển dropdown (Vì API cần ID để load cấp con)
    const [selectedProvinceId, setSelectedProvinceId] = useState(null);
    const [selectedDistrictId, setSelectedDistrictId] = useState(null);

    // --- 1. LOGIC LOAD DATA ---

    // Load Tỉnh/Thành
    const loadProvinces = useCallback(async () => {
        try {
            const data = await UserController.getProvinces();
            setProvinces(data);
            return data; 
        } catch (error) {
            console.error("Lỗi load tỉnh thành:", error);
            toast.error("Lỗi khi tải danh sách Tỉnh/Thành.");
            return [];
        }
    }, []);

    // Load Quận/Huyện
    const loadDistricts = useCallback(async (provinceId) => {
        try {
            const data = await UserController.getDistricts(provinceId);
            setDistricts(data);
            setWards([]); // Reset xã khi đổi huyện
            return data;
        } catch (error) {
            console.error("Lỗi load quận huyện:", error);
            toast.error("Lỗi khi tải danh sách Quận/Huyện.");
            return [];
        }
    }, []);

    // Load Xã/Phường
    const loadWards = useCallback(async (districtId) => {
        try {
            const data = await UserController.getWards(districtId);
            setWards(data);
        } catch (error) {
            console.error("Lỗi load xã phường:", error);
            toast.error("Lỗi khi tải danh sách Xã/Phường.");
        }
    }, []);

    // --- 2. LOGIC SETUP FORM (ĐẶC BIỆT CHO EDIT MODE) ---
    useEffect(() => {
        const setupEditForm = async () => {
            // Luôn load tỉnh trước
            const allProvinces = await loadProvinces();

            // Nếu đang sửa (có initialData) và đã load được tỉnh
            if (initialData && allProvinces.length > 0) {
                // Tìm ID Tỉnh dựa vào tên (city) lưu trong DB
                const currentProvince = allProvinces.find(p => p.name === initialData.city || p.ProvinceName === initialData.city);
                
                if (currentProvince) {
                    const pId = currentProvince.code || currentProvince.ProvinceID;
                    setSelectedProvinceId(pId);

                    // Load Quận dựa vào ID Tỉnh vừa tìm được
                    const allDistricts = await loadDistricts(pId);
                    
                    if (allDistricts.length > 0) {
                        // Tìm ID Quận dựa vào tên (district)
                        const currentDistrict = allDistricts.find(d => d.name === initialData.district || d.DistrictName === initialData.district);
                        
                        if (currentDistrict) {
                            const dId = currentDistrict.code || currentDistrict.DistrictID;
                            setSelectedDistrictId(dId);
                            
                            // Load Xã dựa vào ID Quận
                            await loadWards(dId);
                        }
                    }
                }
            }
        };
        setupEditForm();
    }, [initialData, loadProvinces, loadDistricts, loadWards]);

    // --- 3. HANDLERS ---

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    const handleProvinceChange = (e) => {
        const provinceId = e.target.value;
        // Lấy tên hiển thị để lưu vào DB
        const provinceName = provinceId ? e.target.options[e.target.selectedIndex].text : "";
        
        setSelectedProvinceId(provinceId);
        setFormData(prev => ({ ...prev, city: provinceName, district: '', ward: '' }));
        
        if (provinceId) {
            loadDistricts(provinceId);
        } else {
            setDistricts([]);
            setWards([]);
        }
    };

    const handleDistrictChange = (e) => {
        const districtId = e.target.value;
        const districtName = districtId ? e.target.options[e.target.selectedIndex].text : "";
        
        setSelectedDistrictId(districtId);
        setFormData(prev => ({ ...prev, district: districtName, ward: '' }));
        
        if (districtId) {
            loadWards(districtId);
        } else {
            setWards([]);
        }
    };

    const handleWardChange = (e) => {
        const wardName = e.target.value ? e.target.options[e.target.selectedIndex].text : "";
        setFormData(prev => ({ ...prev, ward: wardName }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(formData);
    };

    // --- 4. RENDER UI ---
    return (
        <form onSubmit={handleSubmit} className="space-y-4 animate-fade-in-up">

            {/* Hàng 1: Tên, SĐT */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="label-field">Họ và tên</label>
                    <input type="text" name="fullName" value={formData.fullName} onChange={handleChange} required className="input-field" placeholder="Nguyễn Văn A" />
                </div>
                <div>
                    <label className="label-field">Số điện thoại</label>
                    <input type="tel" name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} required className="input-field" placeholder="0901234567" />
                </div>
            </div>

            {/* Hàng 2: Tỉnh, Quận, Xã */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                    <label className="label-field">Tỉnh/Thành phố</label>
                    <select value={selectedProvinceId || ''} onChange={handleProvinceChange} required className="input-field">
                        <option value="">Chọn Tỉnh/Thành</option>
                        {provinces.map(p => (
                            <option key={p.code || p.ProvinceID} value={p.code || p.ProvinceID}>
                                {p.name || p.ProvinceName}
                            </option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="label-field">Quận/Huyện</label>
                    <select value={selectedDistrictId || ''} onChange={handleDistrictChange} required className="input-field" disabled={!districts.length}>
                        <option value="">Chọn Quận/Huyện</option>
                        {districts.map(d => (
                            <option key={d.code || d.DistrictID} value={d.code || d.DistrictID}>
                                {d.name || d.DistrictName}
                            </option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="label-field">Xã/Phường</label>
                    {/* Lưu ý: Value ở đây là TÊN (ward name) vì DB lưu tên */}
                    <select name="ward" value={formData.ward} onChange={handleWardChange} required className="input-field" disabled={!wards.length}>
                        <option value="">Chọn Xã/Phường</option>
                        {wards.map(w => (
                            <option key={w.code || w.WardCode} value={w.name || w.WardName}>
                                {w.name || w.WardName}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Hàng 3: Địa chỉ cụ thể */}
            <div>
                <label className="label-field">Địa chỉ cụ thể</label>
                <input type="text" name="address" value={formData.address} onChange={handleChange} required className="input-field" placeholder="Số nhà, tên đường..." />
            </div>

            {/* Hàng 4: Checkbox */}
            <div className="flex items-center">
                <input type="checkbox" name="isDefault" checked={formData.isDefault} onChange={handleChange} id="isDefault" className="h-4 w-4 text-accent border-gray-300 rounded focus:ring-accent-hover cursor-pointer" />
                <label htmlFor="isDefault" className="ml-2 block text-sm text-text-primary cursor-pointer">Đặt làm địa chỉ mặc định</label>
            </div>

            {/* Hàng 5: Buttons */}
            <div className="flex gap-4 pt-2 border-t mt-4">
                <motion.button
                    type="submit"
                    className="btn-accent-profile flex-1 md:flex-none"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.95 }}
                >
                    {initialData ? 'Cập nhật' : 'Lưu địa chỉ'}
                </motion.button>
                
                {onCancel && (
                    <button type="button" onClick={onCancel} className="btn-secondary-profile flex-1 md:flex-none">
                        Hủy bỏ
                    </button>
                )}
            </div>
        </form>
    );
};

export default AddressForm;