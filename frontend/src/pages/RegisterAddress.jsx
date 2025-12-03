// frontend/src/pages/Auth/RegisterAddress.jsx
import { useNavigate } from "react-router-dom";
import AddressForm from "../components/Home/AddressForm"; // Lưu ý check đường dẫn này
import Calendar from "../components/common/Calendar"; // 👈 Thêm Calendar
import { AuthController } from "../controllers/AuthController";
import { UserController } from "../controllers/userController";
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import AuthSide from "../components/common/AuthSide"; // Import Component mới

const RegisterAddress = () => {
    const navigate = useNavigate();
    const { user } = useAuth();

    // State cho form (Họ tên, SĐT, Ngày sinh)
    const [fullName, setFullName] = useState(user?.name || "");
    const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || "");
    const [dateOfBirth, setDateOfBirth] = useState("");

    // State cho AddressForm
    const [addressDetail, setAddressDetail] = useState("");
    const [isDefault, setIsDefault] = useState(true);
    const [isLoading, setIsLoading] = useState(false);

    // State cho data Tỉnh/Quận/Phường
    const [provinces, setProvinces] = useState([]);
    const [districts, setDistricts] = useState([]);
    const [wards, setWards] = useState([]);

    const [selectedProvince, setSelectedProvince] = useState("");
    const [selectedDistrict, setSelectedDistrict] = useState("");
    const [selectedWard, setSelectedWard] = useState("");

    useEffect(() => {
        const fetchProvinces = async () => {
            try {
                const data = await UserController.getProvinces();
                console.log('📦 Provinces data:', data);
                console.log('📦 First province:', data?.[0]);
                setProvinces(Array.isArray(data) ? data : []);
            } catch (error) {
                console.error("❌ Lỗi tải tỉnh thành:", error);
            }
        };
        fetchProvinces();
    }, []);

    const handleProvinceChange = useCallback(async (e) => {
        const provinceId = e.target.value;
        setSelectedProvince(provinceId);
        setSelectedDistrict("");
        setSelectedWard("");
        setDistricts([]);
        setWards([]);

        if (provinceId) {
            try {
                const data = await UserController.getDistricts(provinceId);
                setDistricts(Array.isArray(data) ? data : []);
            } catch (error) {
                console.error("Lỗi tải quận huyện:", error);
            }
        }
    }, []);

    const handleDistrictChange = useCallback(async (e) => {
        const districtId = e.target.value;
        setSelectedDistrict(districtId);
        setSelectedWard("");
        setWards([]);

        if (districtId) {
            try {
                const data = await UserController.getWards(districtId);
                setWards(Array.isArray(data) ? data : []);
            } catch (error) {
                console.error("Lỗi tải phường xã:", error);
            }
        }
    }, []);

    const handleWardChange = useCallback((e) => {
        setSelectedWard(e.target.value);
    }, []);

    const handleSubmit = async (e) => {
        try {
            e.preventDefault();
            setIsLoading(true);

            if (!user || !user._id) {
                toast.error("Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại.");
                setIsLoading(false);
                return;
            }

            // Validate required fields
            if (!fullName.trim()) {
                toast.error("Vui lòng nhập họ tên.");
                setIsLoading(false);
                return;
            }
            if (!phoneNumber.trim()) {
                toast.error("Vui lòng nhập số điện thoại.");
                setIsLoading(false);
                return;
            }
            if (!addressDetail.trim()) {
                toast.error("Vui lòng nhập chi tiết địa chỉ.");
                setIsLoading(false);
                return;
            }
            if (!selectedProvince) {
                toast.error("Vui lòng chọn Tỉnh/Thành phố.");
                setIsLoading(false);
                return;
            }
            if (!selectedDistrict) {
                toast.error("Vui lòng chọn Quận/Huyện.");
                setIsLoading(false);
                return;
            }
            if (!selectedWard) {
                toast.error("Vui lòng chọn Phường/Xã.");
                setIsLoading(false);
                return;
            }

            // Tìm tên tỉnh/quận/phường từ code (convert string to number)
            const provinceCode = parseInt(selectedProvince, 10);
            const districtCode = parseInt(selectedDistrict, 10);
            const wardCode = parseInt(selectedWard, 10);

            const provinceName = provinces.find(p => p.code === provinceCode)?.name || "";
            const districtName = districts.find(d => d.code === districtCode)?.name || "";
            const wardName = wards.find(w => w.code === wardCode)?.name || "";

            console.log('📍 Sending address:', {
                selectedProvince, selectedDistrict, selectedWard,
                provinceName, districtName, wardName, addressDetail, fullName, phoneNumber
            });

            if (!provinceName || !districtName || !wardName) {
                toast.error("Không tìm thấy thông tin Tỉnh/Quận/Phường. Vui lòng chọn lại.");
                setIsLoading(false);
                return;
            }

            // Format data theo cấu trúc mà backend mong đợi
            const addressData = {
                fullName: fullName.trim(),
                phoneNumber: phoneNumber.trim(),
                address: addressDetail.trim(),
                city: provinceName,
                district: districtName,
                ward: wardName,
                isDefault: isDefault
            };

            console.log("📦 Sending address data:", addressData);
            await UserController.addAddress(addressData);

            toast.success("Lưu địa chỉ thành công!");

            setTimeout(() => {
                navigate("/");
            }, 1500);

        } catch (error) {
            console.error("❌ Lỗi submit:", error);
            toast.error(error.message || "Có lỗi xảy ra khi lưu địa chỉ");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSkip = () => {
        navigate("/");
    };

    return (
        <div className="flex flex-col md:flex-row h-screen overflow-hidden">

            {/* SỬ DỤNG COMPONENT MỚI */}
            {/* Bạn có thể dùng chung hình register hoặc một hình khác như address-illustration */}
            <AuthSide imgSrc="/img/register-illustration.svg" />

            {/* Right Side - Form */}
            <div className="flex flex-col justify-start items-center w-full md:w-1/2 px-8 py-10 overflow-y-auto bg-white">

                {/* Logo Mobile */}
                <div className="md:hidden absolute top-6 left-6 flex items-center space-x-2">
                    <img src="/img/logo.svg" alt="Logo" className="h-24 w-auto" />
                </div>

                <div className="max-w-md w-full mt-24 md:mt-0">
                    <h1 className="text-2xl font-semibold text-gray-800 mb-1">
                        Cập nhật địa chỉ
                    </h1>
                    <h3 className="text-gray-600 mb-6">
                        Giúp chúng tôi giao hàng đến bạn chính xác hơn.
                    </h3>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Thông tin liên hệ */}
                        <div className="space-y-4">
                            <h4 className="font-medium text-gray-700 border-b pb-2">Thông tin liên hệ</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Họ và tên</label>
                                    <input
                                        type="text"
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        required
                                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Số điện thoại</label>
                                    <input
                                        type="tel"
                                        value={phoneNumber}
                                        onChange={(e) => setPhoneNumber(e.target.value)}
                                        required
                                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>

                            {/* Ngày sinh - Calendar Component */}
                            <Calendar
                                value={dateOfBirth}
                                onChange={setDateOfBirth}
                                label="Ngày sinh (Tùy chọn)"
                                placeholder="Chọn ngày sinh..."
                                enableTime={false}
                            />
                        </div>

                        {/* Form Địa chỉ - Component con */}
                        <AddressForm
                            provinces={provinces}
                            districts={districts}
                            wards={wards}

                            selectedProvince={selectedProvince}
                            selectedDistrict={selectedDistrict}
                            selectedWard={selectedWard}

                            onProvinceChange={handleProvinceChange}
                            onDistrictChange={handleDistrictChange}
                            onWardChange={handleWardChange}

                            addressDetail={addressDetail}
                            onAddressDetailChange={setAddressDetail}

                            isDefault={isDefault}
                            onIsDefaultChange={setIsDefault}

                            isLoading={isLoading}
                        />

                        {/* Nút bấm */}
                        <div className="mt-8 flex flex-col gap-3 pt-4">
                            <button
                                type="submit"
                                disabled={isLoading || !selectedProvince || !selectedDistrict || !selectedWard}
                                className="w-full bg-blue-600 text-white rounded-md py-3 font-medium hover:bg-blue-700 transition disabled:bg-blue-300"
                            >
                                {isLoading ? "Đang lưu..." : "Lưu địa chỉ"}
                            </button>
                            <button
                                type="button"
                                onClick={handleSkip}
                                className="w-full bg-gray-100 text-gray-700 rounded-md py-3 font-medium hover:bg-gray-200 transition"
                            >
                                Bỏ qua, về trang chủ
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default RegisterAddress;