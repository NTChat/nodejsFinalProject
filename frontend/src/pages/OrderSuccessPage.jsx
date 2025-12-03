// src/pages/OrderSuccessPage.jsx
import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle, XCircle, Home, ShoppingBag, Copy, Building2, Upload, Image as ImageIcon } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { toast } from 'react-toastify';
import api from '../services/api';

export default function OrderSuccessPage() {
    const [searchParams] = useSearchParams();
    const { clearCart } = useCart();
    const [copied, setCopied] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [proofUploaded, setProofUploaded] = useState(false);
    const toastShownRef = useRef(false); // Track toast đã hiển thị chưa

    // 1. Lấy thông tin từ URL
    const responseCode = searchParams.get('code'); 
    const orderId = searchParams.get('orderId');
    const paymentMethod = searchParams.get('method'); // banking, cod
    
    // Check mã (00 = thành công, banking = chuyển khoản)
    const isSuccess = responseCode === '00' || responseCode === 'banking' || !responseCode;
    const isBanking = responseCode === 'banking';

    // Thông tin ngân hàng
    const bankInfo = {
        bankName: 'Vietcombank',
        accountNumber: '1234567890',
        accountName: 'CONG TY TNHH ABC',
        amount: searchParams.get('amount') || '0',
        content: `DH ${orderId}`
    };

    const copyToClipboard = (text, label) => {
        navigator.clipboard.writeText(text);
        toast.success(`Đã copy ${label}!`);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleUploadProof = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        console.log('📤 Selected file:', file.name, file.type, file.size);

        // Validate file type
        if (!file.type.startsWith('image/')) {
            toast.error('Vui lòng chọn file ảnh!');
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            toast.error('Ảnh không được vượt quá 5MB!');
            return;
        }

        setUploading(true);
        const formData = new FormData();
        formData.append('image', file);

        console.log('📤 Uploading to /products/upload-image...');

        try {
            // Upload to Cloudinary via backend
            const uploadRes = await api.post('/products/upload-image', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            
            console.log('✅ Upload response:', uploadRes.data);
            const imageUrl = uploadRes.data.imageUrl || uploadRes.data.url;

            if (!imageUrl) {
                throw new Error('Không nhận được URL ảnh từ server');
            }

            console.log('📤 Saving proof to order:', orderId, imageUrl);

            // Save to order
            const saveRes = await api.post(`/orders/${orderId}/upload-proof`, { imageUrl });
            console.log('✅ Save response:', saveRes.data);
            
            setProofUploaded(true);
            toast.success('Upload ảnh chứng từ thành công! Admin sẽ xác nhận sớm.');
        } catch (error) {
            console.error('❌ Upload error:', error);
            console.error('❌ Error response:', error.response);
            const errorMsg = error.response?.data?.message || error.message || 'Upload thất bại';
            toast.error('Upload thất bại: ' + errorMsg);
        } finally {
            setUploading(false);
        }
    };

    // Hiện toast ngay khi vào trang (chạy trước mọi thứ)
    useEffect(() => {
        const shouldShowToast = sessionStorage.getItem('orderSuccess');
        console.log('📢 OrderSuccessPage - shouldShowToast:', shouldShowToast);
        
        if (shouldShowToast) {
            sessionStorage.removeItem('orderSuccess');
            toast.success('🎉 Đặt hàng thành công!');
            
            // Delay 500ms để backend kịp tạo notification, rồi mới refresh
            setTimeout(() => {
                window.dispatchEvent(new Event('refreshNotifications'));
            }, 500);
        }
    }, []);

    // Xóa giỏ hàng (tách riêng để không ảnh hưởng toast)
    useEffect(() => {
        if (isSuccess) {
            clearCart();
        }
        // eslint-disable-next-line
    }, [isSuccess]);

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="bg-white p-8 rounded-2xl shadow-lg max-w-md w-full">
                
                {/* Icon Trạng Thái */}
                <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${isSuccess ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                    {isSuccess ? <CheckCircle size={48} /> : <XCircle size={48} />}
                </div>

                {/* Tiêu đề & Thông báo */}
                <h1 className={`text-2xl font-bold mb-2 text-center ${isSuccess ? 'text-green-700' : 'text-red-700'}`}>
                    {isSuccess ? 'Đặt hàng thành công!' : 'Thanh toán thất bại'}
                </h1>
                
                <p className="text-gray-600 mb-6 text-sm leading-relaxed text-center">
                    {isSuccess 
                        ? (
                            <>
                                Cảm ơn bạn đã mua hàng. Mã đơn hàng: <strong className="text-gray-800">#{orderId}</strong>
                            </>
                        )
                        : (
                            <>
                                Đơn hàng không thành công
                                {orderId && <div className="mt-2">Mã đơn hàng: <strong>#{orderId}</strong></div>}
                            </>
                        )
                    }
                </p>

                {/* Thông tin chuyển khoản (chỉ hiện khi chọn banking) */}
                {isBanking && (
                    <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                        <div className="flex items-center gap-2 mb-3 text-blue-700 font-bold">
                            <Building2 size={20} />
                            <span>Thông tin chuyển khoản</span>
                        </div>
                        
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between items-center p-2 bg-white rounded">
                                <span className="text-gray-600">Ngân hàng:</span>
                                <span className="font-bold">{bankInfo.bankName}</span>
                            </div>
                            
                            <div className="flex justify-between items-center p-2 bg-white rounded">
                                <span className="text-gray-600">Số tài khoản:</span>
                                <div className="flex items-center gap-2">
                                    <span className="font-bold">{bankInfo.accountNumber}</span>
                                    <button
                                        onClick={() => copyToClipboard(bankInfo.accountNumber, 'số tài khoản')}
                                        className="text-blue-600 hover:text-blue-700"
                                    >
                                        <Copy size={16} />
                                    </button>
                                </div>
                            </div>
                            
                            <div className="flex justify-between items-center p-2 bg-white rounded">
                                <span className="text-gray-600">Chủ tài khoản:</span>
                                <span className="font-bold">{bankInfo.accountName}</span>
                            </div>
                            
                            <div className="flex justify-between items-center p-2 bg-white rounded">
                                <span className="text-gray-600">Nội dung CK:</span>
                                <div className="flex items-center gap-2">
                                    <span className="font-bold text-red-600">{bankInfo.content}</span>
                                    <button
                                        onClick={() => copyToClipboard(bankInfo.content, 'nội dung')}
                                        className="text-blue-600 hover:text-blue-700"
                                    >
                                        <Copy size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>
                        
                        <p className="mt-3 text-xs text-gray-600 italic">
                            ⚠️ Vui lòng chuyển khoản đúng nội dung để đơn hàng được xử lý nhanh chóng.
                        </p>

                        {/* Upload ảnh chứng từ */}
                        <div className="mt-4 pt-4 border-t border-blue-200">
                            {!proofUploaded ? (
                                <label className="flex flex-col items-center gap-2 cursor-pointer p-3 bg-white border-2 border-dashed border-blue-300 rounded-lg hover:bg-blue-50 transition">
                                    <input 
                                        type="file" 
                                        accept="image/*" 
                                        onChange={handleUploadProof}
                                        className="hidden"
                                        disabled={uploading}
                                    />
                                    {uploading ? (
                                        <div className="flex items-center gap-2 text-blue-600">
                                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                                            <span className="text-sm">Đang upload...</span>
                                        </div>
                                    ) : (
                                        <>
                                            <Upload className="text-blue-600" size={24} />
                                            <span className="text-sm text-blue-700 font-medium">
                                                Upload ảnh chứng từ chuyển khoản
                                            </span>
                                            <span className="text-xs text-gray-500">
                                                (JPG, PNG - Tối đa 5MB)
                                            </span>
                                        </>
                                    )}
                                </label>
                            ) : (
                                <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                                    <CheckCircle className="text-green-600" size={20} />
                                    <span className="text-sm text-green-700 font-medium">
                                        Đã upload ảnh chứng từ. Admin sẽ xác nhận sớm.
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Buttons */}
                <div className="space-y-3">
                    {isSuccess ? (
                        <Link 
                            to={`/order/${orderId}`} 
                            className="flex items-center justify-center gap-2 w-full py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition shadow-md"
                        >
                            <ShoppingBag size={20}/> Xem chi tiết đơn hàng
                        </Link>
                    ) : (
                        <Link 
                            to="/checkout" 
                            className="block w-full py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition text-center"
                        >
                            Thử lại thanh toán
                        </Link>
                    )}
                    
                    <Link 
                        to="/" 
                        className="flex items-center justify-center gap-2 w-full py-3 border border-gray-300 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition"
                    >
                        <Home size={20}/> Về trang chủ
                    </Link>
                </div>

            </div>
        </div>
    );
}