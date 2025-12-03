import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { 
    MapPin, Truck, CreditCard, Ticket, ChevronRight, Edit2, 
    ShieldCheck, Coins, X, Check, Plus, ArrowLeft, Loader 
} from 'lucide-react';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion'; // 👈 Import Motion

import { OrderController } from '../controllers/OrderController';
import { UserController } from '../controllers/userController';
import { getImageUrl } from '../services/api';
import api from '../services/api';

import AddressForm from '../components/common/AddressForm'; // Gọi đúng đường dẫn AddressForm mới
import PaymentMethods from '../components/checkout/PaymentMethods';
import BankingPayment from '../components/checkout/BankingPayment';

export default function CheckoutPage() {
    const { cartItems: allCartItems, clearCart, loadingCart, setCartItems } = useCart();
    const { user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    
    // Lấy danh sách sản phẩm được chọn từ CartPage (nếu có)
    const selectedItemsFromCart = location.state?.selectedItems;
    
    // Sử dụng selectedItems nếu được truyền từ CartPage, nếu không thì dùng toàn bộ giỏ hàng
    const cartItems = selectedItemsFromCart || allCartItems;

    // --- STATE ---
    const [loading, setLoading] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState('cod');
    const [shippingMethod, setShippingMethod] = useState('express');
    const [note, setNote] = useState('');
    
    // State Địa chỉ
    const [addresses, setAddresses] = useState([]);
    const [selectedAddress, setSelectedAddress] = useState(null);
    const [showAddressList, setShowAddressList] = useState(false); // Hiện danh sách chọn
    const [isEditing, setIsEditing] = useState(false); // Hiện form sửa/thêm

    // State Mã giảm giá & Điểm
    const [couponCode, setCouponCode] = useState('');
    const [appliedCoupon, setAppliedCoupon] = useState(null);
    const [usePoints, setUsePoints] = useState(false);
    const [checkingCoupon, setCheckingCoupon] = useState(false);
    
    // State cho voucher suggestions
    const [availableVouchers, setAvailableVouchers] = useState([]);
    const [showVoucherSuggestions, setShowVoucherSuggestions] = useState(false);
    const [loadingVouchers, setLoadingVouchers] = useState(false);
    
    // State cho upload hình ảnh xác nhận chuyển khoản
    const [bankingImage, setBankingImage] = useState(null);
    
    // Ref để track đã đặt hàng thành công (tránh hiện thông báo giỏ hàng trống)
    const orderPlacedRef = useRef(false);

    // --- 1. LOAD DATA ---
    useEffect(() => {
        // Đợi giỏ hàng load xong trước khi kiểm tra
        if (loadingCart) return;
        
        // Nếu đã đặt hàng thành công, không redirect
        if (orderPlacedRef.current) return;
        
        if (cartItems.length === 0) {
            toast.info("Giỏ hàng trống, vui lòng mua sắm thêm!");
            navigate('/products');
            return;
        }
        fetchAddresses();
    }, [cartItems, navigate, loadingCart]);

    const fetchAddresses = async () => {
        try {
            const data = await UserController.getMyAddresses();
            const list = data.addresses || [];
            setAddresses(list);
            
            // Tự động chọn địa chỉ mặc định hoặc cái đầu tiên
            const defaultAddr = list.find(a => a.isDefault) || list[0];
            if (defaultAddr) setSelectedAddress(defaultAddr);
            else setIsEditing(true); // Nếu chưa có địa chỉ nào, mở form tạo mới ngay

        } catch (error) {
            console.error("Lỗi tải địa chỉ:", error);
        }
    };

    // --- 2. TÍNH TOÁN TIỀN ---
    const subtotal = useMemo(() => cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0), [cartItems]);
    const shippingFee = shippingMethod === 'express' ? 30000 : 55000;
    
    const couponDiscount = useMemo(() => {
        if (!appliedCoupon) return 0;
        const discount = (subtotal * appliedCoupon.percent) / 100;
        return discount; 
    }, [subtotal, appliedCoupon]);

    const pointDiscount = useMemo(() => {
        if (!usePoints || !user?.loyaltyPoints) return 0;
        // Quy đổi: 1 điểm = 1.000đ (Ví dụ)
        const maxDiscount = Math.min(user.loyaltyPoints * 1000, (subtotal - couponDiscount) * 0.5); // Tối đa 50% đơn
        return maxDiscount;
    }, [usePoints, user, subtotal, couponDiscount]);

    const finalTotal = Math.max(0, subtotal + shippingFee - couponDiscount - pointDiscount);

    // --- 3. XỬ LÝ ĐỊA CHỈ ---
    const handleSelectAddress = (addr) => {
        setSelectedAddress(addr);
        setShowAddressList(false);
        setIsEditing(false);
    };

    const handleAddNewAddress = () => {
        setSelectedAddress(null); // Reset để form hiểu là tạo mới
        setIsEditing(true);
        setShowAddressList(false);
    };

    const handleSaveAddress = async (formData) => {
        try {
            if (selectedAddress?._id) {
                await UserController.updateAddress(selectedAddress._id, formData);
                toast.success("Cập nhật địa chỉ thành công!");
            } else {
                await UserController.addAddress(formData);
                toast.success("Thêm địa chỉ mới thành công!");
            }
            await fetchAddresses(); // Tải lại danh sách mới
            setIsEditing(false);
            setShowAddressList(false);
        } catch (error) {
            toast.error(error.message || "Lỗi lưu địa chỉ");
        }
    };

    // --- 4. XỬ LÝ COUPON ---
    const handleApplyCoupon = async () => {
        if (!couponCode.trim()) return;
        setCheckingCoupon(true);
        try {
            // Giả lập check coupon (Thay bằng API thật: await OrderController.validateCoupon(code))
            await new Promise(r => setTimeout(r, 800)); 
            
            if (couponCode === 'SALE50') {
                setAppliedCoupon({ code: 'SALE50', percent: 50 });
                toast.success("Áp dụng mã giảm giá 50% thành công!");
            } else {
                toast.error("Mã giảm giá không hợp lệ hoặc hết hạn.");
                setAppliedCoupon(null);
            }
        } finally {
            setCheckingCoupon(false);
        }
    };

    // --- 4.5. FETCH AVAILABLE VOUCHERS ---
    const fetchAvailableVouchers = async () => {
        try {
            setLoadingVouchers(true);
            const response = await api.get('/discounts/available');
            if (response.data.success) {
                setAvailableVouchers(response.data.vouchers);
            }
        } catch (error) {
            console.error('Error fetching vouchers:', error);
        } finally {
            setLoadingVouchers(false);
        }
    };

    const handleApplyVoucher = (voucher) => {
        setCouponCode(voucher.code);
        setAppliedCoupon({ code: voucher.code, percent: voucher.percent });
        setShowVoucherSuggestions(false);
        toast.success(`Áp dụng voucher ${voucher.code} giảm ${voucher.percent}% thành công!`);
    };

    // --- 5. ĐẶT HÀNG ---
    const handlePlaceOrder = async () => {
        if (!selectedAddress) {
            toast.error("Vui lòng thêm địa chỉ giao hàng!");
            return;
        }

        // Kiểm tra bắt buộc upload hình ảnh khi chọn chuyển khoản
        if (paymentMethod === 'banking' && !bankingImage) {
            toast.error("Vui lòng upload hình ảnh xác nhận chuyển khoản!");
            return;
        }

        setLoading(true);
        try {
            const orderData = {
                items: cartItems.map(item => ({
                    productId: item.productId || item._id, // ID sản phẩm
                    variantId: item.variantId,
                    quantity: item.quantity,
                    price: item.price,
                    name: item.productName || item.name,
                    variantName: item.variantName,
                    image: item.image
                })),
                shippingAddress: {
                    recipientName: selectedAddress.fullName,      // Backend expects recipientName
                    phoneNumber: selectedAddress.phoneNumber,     // Backend expects phoneNumber
                    street: selectedAddress.address,              // Backend expects street
                    ward: selectedAddress.ward || '',
                    district: selectedAddress.district || '',
                    city: selectedAddress.city,
                },
                paymentMethod,
                subTotal: subtotal,                               // Backend requires subTotal
                shippingPrice: shippingFee,
                tax: 0,                                           // Backend requires tax
                totalPrice: finalTotal,
                note
            };

            // Nếu có hình ảnh xác nhận, thêm vào orderData
            if (paymentMethod === 'banking' && bankingImage) {
                // Tạo FormData để gửi file
                const formData = new FormData();
                formData.append('orderData', JSON.stringify(orderData));
                formData.append('paymentConfirmation', bankingImage);
                
                // Gọi API tạo đơn với file upload
                const res = await OrderController.createOrderWithPaymentImage(formData);
                handleOrderSuccess(res);
            } else {
                // Gọi API tạo đơn bình thường
                const res = await OrderController.createOrder(orderData);
                handleOrderSuccess(res);
            }

        } catch (error) {
            console.error(error);
            toast.error(error.message || "Đặt hàng thất bại, vui lòng thử lại.");
        } finally {
            setLoading(false);
        }
    };

    const handleOrderSuccess = (res) => {
        if (res.success || res.order) {
            orderPlacedRef.current = true; // Đánh dấu đã đặt hàng thành công
            
            // Emit event để Header admin refresh notifications
            window.dispatchEvent(new CustomEvent('orderCreated', {
                detail: { 
                    orderId: res.order?.orderId || res.order?._id,
                    paymentMethod 
                }
            }));
            console.log('🛍️ Checkout: orderCreated event dispatched');
            
            // Nếu chỉ checkout một số sản phẩm, chỉ xóa những sản phẩm đã checkout
            if (selectedItemsFromCart && selectedItemsFromCart.length < allCartItems.length) {
                // Lọc ra những sản phẩm chưa được checkout
                const selectedKeys = selectedItemsFromCart.map(item => item.variantId || item.sku || `${item._id || item.productMongoId || item.productId}-noVariant`);
                const remainingItems = allCartItems.filter(item => {
                    const key = item.variantId || item.sku || `${item._id || item.productMongoId || item.productId}-noVariant`;
                    return !selectedKeys.includes(key);
                });
                setCartItems(remainingItems);
            } else {
                clearCart();
            }
            
            const newOrderId = res.order?.orderId || res.order?._id;
            
            // Lưu flag vào sessionStorage để trang OrderSuccess hiển thị toast
            sessionStorage.setItem('orderSuccess', 'true');
            
            navigate(`/order-success?code=00&orderId=${newOrderId}&method=${paymentMethod}`);
        }
    };

    // Hiển thị loading khi giỏ hàng đang load
    if (loadingCart) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <Loader className="w-8 h-8 animate-spin mx-auto text-blue-600 mb-4" />
                    <p className="text-gray-600">Đang tải giỏ hàng...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4 md:px-8 font-sans text-gray-800">
            <div className="max-w-7xl mx-auto">
                
                {/* Header */}
                <div className="mb-8 flex items-center gap-2">
                    <Link to="/cart" className="text-gray-500 hover:text-blue-600 transition"><ArrowLeft /></Link>
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Thanh toán</h1>
                </div>

                <div className="flex flex-col lg:flex-row gap-8">
                    
                    {/* === CỘT TRÁI: THÔNG TIN (ĐỊA CHỈ, VẬN CHUYỂN, THANH TOÁN) === */}
                    <div className="flex-1 space-y-6">
                        
                        {/* 1. ĐỊA CHỈ GIAO HÀNG (CÓ MOTION) */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="p-5 border-b border-gray-50 bg-gray-50/50 flex justify-between items-center">
                                <h2 className="text-lg font-bold flex items-center gap-2 text-blue-800">
                                    <MapPin size={20} /> Địa chỉ nhận hàng
                                </h2>
                                {/* Nút quay lại khi đang chọn list hoặc edit */}
                                {(showAddressList || isEditing) && addresses.length > 0 && (
                                    <button 
                                        onClick={() => {setShowAddressList(false); setIsEditing(false)}}
                                        className="text-sm text-blue-600 hover:underline"
                                    >
                                        Quay lại
                                    </button>
                                )}
                            </div>
                            
                            <div className="p-6 relative min-h-[160px]">
                                <AnimatePresence mode="wait">
                                    
                                    {/* VIEW 1: HIỂN THỊ ĐỊA CHỈ ĐANG CHỌN */}
                                    {!showAddressList && !isEditing && selectedAddress && (
                                        <motion.div
                                            key="view-selected"
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: 20 }}
                                            transition={{ duration: 0.2 }}
                                            className="flex flex-col md:flex-row md:items-center justify-between gap-4"
                                        >
                                            <div>
                                                <p className="font-bold text-gray-800 text-lg">
                                                    {selectedAddress.fullName} 
                                                    <span className="mx-2 font-normal text-gray-400">|</span> 
                                                    <span className="text-gray-600 font-medium">{selectedAddress.phoneNumber}</span>
                                                </p>
                                                <p className="text-gray-600 mt-1 text-sm leading-relaxed">
                                                    {selectedAddress.address}, {selectedAddress.ward}, {selectedAddress.district}, {selectedAddress.city}
                                                </p>
                                                {selectedAddress.isDefault && (
                                                    <span className="inline-block mt-2 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full font-bold border border-blue-200">
                                                        Mặc định
                                                    </span>
                                                )}
                                            </div>
                                            <button 
                                                onClick={() => setShowAddressList(true)}
                                                className="px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 font-medium transition text-sm whitespace-nowrap"
                                            >
                                                Thay đổi
                                            </button>
                                        </motion.div>
                                    )}

                                    {/* VIEW 2: FORM THÊM/SỬA */}
                                    {isEditing && (
                                        <motion.div
                                            key="form-edit"
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -20 }}
                                        >
                                            <AddressForm 
                                                initialData={selectedAddress} // Nếu null thì là thêm mới
                                                onSubmit={handleSaveAddress}
                                                onCancel={() => {setIsEditing(false); if(addresses.length === 0) navigate('/cart');}}
                                            />
                                        </motion.div>
                                    )}

                                    {/* VIEW 3: DANH SÁCH CHỌN ĐỊA CHỈ */}
                                    {showAddressList && !isEditing && (
                                        <motion.div
                                            key="list-select"
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: "auto" }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="space-y-3"
                                        >
                                            <div className="space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                                                {addresses.map(addr => (
                                                    <div 
                                                        key={addr._id}
                                                        onClick={() => handleSelectAddress(addr)}
                                                        className={`p-3 border rounded-xl cursor-pointer transition flex items-start gap-3
                                                            ${selectedAddress?._id === addr._id 
                                                                ? 'border-blue-500 bg-blue-50/50 ring-1 ring-blue-500' 
                                                                : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                                                            }
                                                        `}
                                                    >
                                                        <div className={`mt-1 w-4 h-4 rounded-full border flex items-center justify-center flex-shrink-0
                                                            ${selectedAddress?._id === addr._id ? 'border-blue-600 bg-blue-600' : 'border-gray-300'}
                                                        `}>
                                                            {selectedAddress?._id === addr._id && <div className="w-1.5 h-1.5 bg-white rounded-full"/>}
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-sm text-gray-800">{addr.fullName} - {addr.phoneNumber}</p>
                                                            <p className="text-xs text-gray-500 mt-0.5">{addr.address}, {addr.ward}, {addr.district}, {addr.city}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                            
                                            <button 
                                                onClick={handleAddNewAddress}
                                                className="w-full py-2.5 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50 transition flex items-center justify-center gap-2 font-medium"
                                            >
                                                <Plus size={18} /> Thêm địa chỉ mới
                                            </button>
                                        </motion.div>
                                    )}

                                    {/* VIEW 4: CHƯA CÓ ĐỊA CHỈ NÀO (EMPTY) */}
                                    {!loading && addresses.length === 0 && !isEditing && (
                                        <motion.div initial={{opacity:0}} animate={{opacity:1}} className="text-center py-8">
                                            <p className="text-gray-500 mb-4">Bạn chưa có địa chỉ nhận hàng nào.</p>
                                            <button onClick={handleAddNewAddress} className="btn-primary px-6 py-2 rounded-full">Thêm địa chỉ ngay</button>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>

                        {/* 2. VẬN CHUYỂN */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                            <h2 className="text-lg font-bold flex items-center gap-2 mb-4 text-blue-800">
                                <Truck size={20} /> Phương thức vận chuyển
                            </h2>
                            <div className="space-y-3">
                                <label className={`flex items-center justify-between p-4 border rounded-xl cursor-pointer transition ${shippingMethod === 'express' ? 'border-blue-500 bg-blue-50/30' : 'hover:bg-gray-50'}`}>
                                    <div className="flex items-center gap-3">
                                        <input type="radio" name="shipping" checked={shippingMethod === 'express'} onChange={() => setShippingMethod('express')} className="text-blue-600 focus:ring-blue-500" />
                                        <div>
                                            <p className="font-medium text-gray-800">Giao hàng nhanh</p>
                                            <p className="text-xs text-gray-500">Nhận hàng trong 2-4 ngày</p>
                                        </div>
                                    </div>
                                    <span className="font-bold text-blue-600">30.000 ₫</span>
                                </label>

                                <label className={`flex items-center justify-between p-4 border rounded-xl cursor-pointer transition ${shippingMethod === 'instant' ? 'border-blue-500 bg-blue-50/30' : 'hover:bg-gray-50'}`}>
                                    <div className="flex items-center gap-3">
                                        <input type="radio" name="shipping" checked={shippingMethod === 'instant'} onChange={() => setShippingMethod('instant')} className="text-blue-600 focus:ring-blue-500" />
                                        <div>
                                            <p className="font-medium text-gray-800">Hỏa tốc (Nội thành)</p>
                                            <p className="text-xs text-gray-500">Nhận hàng trong 2 giờ</p>
                                        </div>
                                    </div>
                                    <span className="font-bold text-blue-600">55.000 ₫</span>
                                </label>
                            </div>
                        </div>

                        {/* 3. PHƯƠNG THỨC THANH TOÁN */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                            <h2 className="text-lg font-bold flex items-center gap-2 mb-4 text-blue-800">
                                <CreditCard size={20} /> Phương thức thanh toán
                            </h2>
                            <PaymentMethods selected={paymentMethod} onSelect={setPaymentMethod} />
                            
                            {/* Hiển thị phần upload khi chọn chuyển khoản ngân hàng */}
                            {paymentMethod === 'banking' && (
                                <div className="mt-6 p-4 bg-gray-50 rounded-xl border">
                                    <BankingPayment 
                                        onImageUpload={setBankingImage}
                                        uploadedImage={bankingImage}
                                    />
                                </div>
                            )}
                        </div>

                        {/* 4. GHI CHÚ */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                            <h2 className="text-lg font-bold flex items-center gap-2 mb-4 text-blue-800">
                                <Edit2 size={20} /> Ghi chú đơn hàng
                            </h2>
                            <textarea 
                                rows="3"
                                className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none text-sm text-gray-700 bg-gray-50"
                                placeholder="Lưu ý cho người bán (VD: Giao giờ hành chính...)"
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* === CỘT PHẢI: TỔNG KẾT ĐƠN HÀNG (Sticky) === */}
                    <div className="w-full lg:w-96 flex-shrink-0">
                        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 sticky top-24">
                            <h2 className="text-xl font-bold mb-6 text-gray-800">Tổng kết đơn hàng</h2>
                            
                            {/* List sản phẩm rút gọn */}
                            <div className="space-y-4 mb-6 max-h-60 overflow-y-auto custom-scrollbar pr-1">
                                {cartItems.map((item) => (
                                    <div key={item._id} className="flex gap-3">
                                        <div className="w-14 h-14 rounded-lg border border-gray-200 overflow-hidden flex-shrink-0">
                                            <img src={getImageUrl(item.image)} alt={item.productName} className="w-full h-full object-cover" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-800 line-clamp-2">{item.productName}</p>
                                            <div className="flex justify-between items-center mt-1">
                                                <p className="text-xs text-gray-500">x{item.quantity}</p>
                                                <p className="text-sm font-bold text-gray-700">{(item.price * item.quantity).toLocaleString()}đ</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Mã giảm giá */}
                            <div className="mb-6">
                                <label className="text-sm font-medium text-gray-700 mb-2 block flex items-center gap-2"><Ticket size={16}/> Mã giảm giá</label>
                                <div className="flex gap-2">
                                    <input 
                                        type="text" 
                                        placeholder="Nhập mã voucher" 
                                        className="flex-1 px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none uppercase font-bold text-blue-600 placeholder:font-normal placeholder:text-gray-400"
                                        value={couponCode}
                                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                                        disabled={!!appliedCoupon}
                                    />
                                    {appliedCoupon ? (
                                        <button onClick={() => {setAppliedCoupon(null); setCouponCode('');}} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><X size={20}/></button>
                                    ) : (
                                        <>
                                            <button 
                                                onClick={handleApplyCoupon}
                                                disabled={checkingCoupon || !couponCode}
                                                className="px-4 py-2 bg-gray-800 text-white text-sm font-medium rounded-lg hover:bg-gray-700 disabled:opacity-50 transition"
                                            >
                                                {checkingCoupon ? <Loader size={16} className="animate-spin"/> : "Áp dụng"}
                                            </button>
                                            <button 
                                                onClick={() => {
                                                    setShowVoucherSuggestions(!showVoucherSuggestions);
                                                    if (!showVoucherSuggestions && availableVouchers.length === 0) {
                                                        fetchAvailableVouchers();
                                                    }
                                                }}
                                                className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg border border-orange-200 transition"
                                                title="Xem voucher khả dụng"
                                            >
                                                <Ticket size={20}/>
                                            </button>
                                        </>
                                    )}
                                </div>
                                {appliedCoupon && <p className="text-xs text-green-600 mt-2 flex items-center gap-1"><Check size={12}/> Đã giảm {appliedCoupon.percent}%</p>}
                                
                                {/* Voucher Suggestions (giống Shopee) */}
                                <AnimatePresence>
                                    {showVoucherSuggestions && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="mt-3 border border-orange-200 rounded-lg overflow-hidden bg-orange-50"
                                        >
                                            <div className="p-3 bg-orange-100 flex items-center justify-between">
                                                <span className="text-sm font-medium text-orange-800 flex items-center gap-2">
                                                    🎫 Voucher dành cho bạn
                                                </span>
                                                <button 
                                                    onClick={() => setShowVoucherSuggestions(false)}
                                                    className="text-orange-600 hover:text-orange-800"
                                                >
                                                    <X size={16}/>
                                                </button>
                                            </div>
                                            
                                            <div className="p-3 space-y-2">
                                                {loadingVouchers ? (
                                                    <div className="flex items-center justify-center py-4">
                                                        <Loader size={16} className="animate-spin text-orange-600"/>
                                                        <span className="ml-2 text-sm text-orange-600">Đang tải voucher...</span>
                                                    </div>
                                                ) : availableVouchers.length === 0 ? (
                                                    <p className="text-sm text-gray-500 text-center py-4">Không có voucher khả dụng</p>
                                                ) : (
                                                    availableVouchers.map((voucher, index) => (
                                                        <motion.div
                                                            key={voucher.code}
                                                            initial={{ opacity: 0, x: -20 }}
                                                            animate={{ opacity: 1, x: 0 }}
                                                            transition={{ delay: index * 0.1 }}
                                                            className="flex items-center justify-between p-3 bg-white rounded-lg border border-orange-200 hover:border-orange-300 transition cursor-pointer"
                                                            onClick={() => handleApplyVoucher(voucher)}
                                                        >
                                                            <div className="flex-1">
                                                                <div className="flex items-center gap-2 mb-1">
                                                                    <span className="px-2 py-1 bg-red-500 text-white text-xs font-bold rounded">
                                                                        -{voucher.percent}%
                                                                    </span>
                                                                    <span className="font-bold text-orange-800 text-sm">{voucher.code}</span>
                                                                </div>
                                                                <p className="text-xs text-gray-600">{voucher.name}</p>
                                                                <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                                                                    <span>Còn {voucher.remaining} lượt</span>
                                                                    {voucher.minOrder > 0 && <span>Đơn tối thiểu {voucher.minOrder.toLocaleString()}đ</span>}
                                                                    {voucher.expiry && <span>HSD: {new Date(voucher.expiry).toLocaleDateString('vi-VN')}</span>}
                                                                </div>
                                                            </div>
                                                            <ChevronRight size={16} className="text-orange-500"/>
                                                        </motion.div>
                                                    ))
                                                )}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Điểm thưởng */}
                            {user?.loyaltyPoints > 0 && (
                                <div className="mb-6 p-3 bg-yellow-50 rounded-xl border border-yellow-100">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-sm font-medium text-yellow-800 flex items-center gap-1"><Coins size={16}/> Dùng điểm thưởng?</span>
                                        <input type="checkbox" checked={usePoints} onChange={(e) => setUsePoints(e.target.checked)} className="w-4 h-4 text-yellow-600 rounded focus:ring-yellow-500"/>
                                    </div>
                                    <p className="text-xs text-yellow-700">Bạn có <span className="font-bold">{user.loyaltyPoints}</span> điểm (Giảm tối đa {Math.min(user.loyaltyPoints * 1000, subtotal * 0.5).toLocaleString()}đ)</p>
                                </div>
                            )}

                            {/* Bảng tính tiền */}
                            <div className="space-y-3 pt-4 border-t border-gray-100 text-sm">
                                <div className="flex justify-between text-gray-600"><span>Tạm tính</span><span>{subtotal.toLocaleString()}đ</span></div>
                                <div className="flex justify-between text-gray-600"><span>Phí vận chuyển</span><span>{shippingFee.toLocaleString()}đ</span></div>
                                {appliedCoupon && <div className="flex justify-between text-green-600"><span>Mã giảm giá</span><span>-{couponDiscount.toLocaleString()}đ</span></div>}
                                {pointDiscount > 0 && <div className="flex justify-between text-yellow-600 font-bold"><span>Điểm thưởng</span><span>-{pointDiscount.toLocaleString()}đ</span></div>}
                                <div className="flex justify-between text-xl font-bold text-red-600 pt-3 border-t mt-2"><span>Tổng cộng</span><span>{finalTotal.toLocaleString()}đ</span></div>
                            </div>

                            <button 
                                onClick={handlePlaceOrder} 
                                disabled={loading || isEditing || showAddressList} 
                                className={`w-full mt-6 py-3.5 rounded-xl font-bold text-white text-lg shadow-lg flex items-center justify-center gap-2 transition-all transform active:scale-95 
                                    ${loading || isEditing || showAddressList ? 'bg-gray-400 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700 shadow-red-200'}
                                `}
                            >
                                {loading ? <><Loader size={20} className="animate-spin"/> Đang xử lý...</> : ((isEditing || showAddressList) ? 'VUI LÒNG CHỌN ĐỊA CHỈ' : 'ĐẶT HÀNG NGAY')}
                            </button>
                            
                            {(isEditing || showAddressList) && (
                                <p className="text-xs text-center text-orange-600 mt-3 bg-orange-50 p-2 rounded-lg border border-orange-100">
                                    ⚠️ Vui lòng hoàn tất chọn địa chỉ trước khi đặt hàng
                                </p>
                            )}

                            <p className="text-xs text-center text-gray-400 mt-4 flex items-center justify-center gap-1">
                                <ShieldCheck size={14} /> Bảo mật thanh toán 100%
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}