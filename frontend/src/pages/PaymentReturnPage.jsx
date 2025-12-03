// src/pages/PaymentReturnPage.jsx
import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import api from '../services/api';

export default function PaymentReturnPage() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState('processing'); // processing | success | error

    useEffect(() => {
        const verifyPayment = async () => {
            try {
                // Lấy tất cả query params từ VNPay
                const params = {};
                searchParams.forEach((value, key) => {
                    params[key] = value;
                });

                console.log('🔍 Verifying payment with params:', params);

                // Gọi API backend để verify
                const response = await api.get('/payment/verify', { params });
                
                console.log('✅ Verification response:', response.data);

                if (response.data.success) {
                    setStatus('success');
                    // Redirect về order success sau 2 giây
                    setTimeout(() => {
                        navigate(`/order-success?orderId=${response.data.orderId}&code=00`);
                    }, 2000);
                } else {
                    setStatus('error');
                    // Redirect về order success với mã lỗi
                    setTimeout(() => {
                        navigate(`/order-success?orderId=${response.data.orderId}&code=${response.data.code}`);
                    }, 2000);
                }
            } catch (error) {
                console.error('❌ Payment verification error:', error);
                setStatus('error');
                setTimeout(() => {
                    navigate('/order-success?code=97');
                }, 2000);
            }
        };

        verifyPayment();
    }, [searchParams, navigate]);

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="bg-white p-8 rounded-2xl shadow-lg max-w-md w-full text-center">
                
                {status === 'processing' && (
                    <>
                        <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 bg-blue-100">
                            <Loader2 size={48} className="text-blue-600 animate-spin" />
                        </div>
                        <h1 className="text-2xl font-bold mb-2 text-gray-800">
                            Đang xác thực thanh toán...
                        </h1>
                        <p className="text-gray-600 text-sm">
                            Vui lòng chờ trong giây lát
                        </p>
                    </>
                )}

                {status === 'success' && (
                    <>
                        <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 bg-green-100">
                            <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h1 className="text-2xl font-bold mb-2 text-green-700">
                            Xác thực thành công!
                        </h1>
                        <p className="text-gray-600 text-sm">
                            Đang chuyển hướng...
                        </p>
                    </>
                )}

                {status === 'error' && (
                    <>
                        <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 bg-red-100">
                            <svg className="w-12 h-12 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </div>
                        <h1 className="text-2xl font-bold mb-2 text-red-700">
                            Xác thực thất bại
                        </h1>
                        <p className="text-gray-600 text-sm">
                            Đang chuyển hướng...
                        </p>
                    </>
                )}

            </div>
        </div>
    );
}
