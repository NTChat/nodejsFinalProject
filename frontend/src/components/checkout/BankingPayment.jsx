import React, { useState } from 'react';
import { Upload, X, CheckCircle, AlertCircle } from 'lucide-react';

const BankingPayment = ({ onImageUpload, uploadedImage }) => {
    const [dragActive, setDragActive] = useState(false);
    const [previewImage, setPreviewImage] = useState(uploadedImage || null);

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        
        const files = e.dataTransfer.files;
        if (files && files[0]) {
            handleFile(files[0]);
        }
    };

    const handleFileInput = (e) => {
        const files = e.target.files;
        if (files && files[0]) {
            handleFile(files[0]);
        }
    };

    const handleFile = (file) => {
        // Validate file type
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        if (!validTypes.includes(file.type)) {
            alert('Chỉ chấp nhận file ảnh (JPG, PNG, WebP)');
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            alert('File không được vượt quá 5MB');
            return;
        }

        // Create preview
        const reader = new FileReader();
        reader.onload = (e) => {
            setPreviewImage(e.target.result);
        };
        reader.readAsDataURL(file);

        // Pass file to parent component
        onImageUpload(file);
    };

    const removeImage = () => {
        setPreviewImage(null);
        onImageUpload(null);
    };

    return (
        <div className="space-y-4">
            {/* Thông tin chuyển khoản */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <h4 className="font-bold text-blue-800 mb-3">Thông tin chuyển khoản:</h4>
                <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                        <span className="text-gray-600">Ngân hàng:</span>
                        <span className="font-medium">Vietcombank</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-600">Số tài khoản:</span>
                        <span className="font-medium">1234567890</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-600">Chủ tài khoản:</span>
                        <span className="font-medium">PHONEWORLD JSC</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-600">Nội dung:</span>
                        <span className="font-medium text-red-600">PW [SỐ ĐIỆN THOẠI]</span>
                    </div>
                </div>
            </div>

            {/* Upload hình ảnh xác nhận */}
            <div>
                <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                    <Upload size={18} />
                    Upload hình ảnh xác nhận chuyển khoản
                    <span className="text-red-500">*</span>
                </h4>
                
                {!previewImage ? (
                    <div
                        className={`relative border-2 border-dashed rounded-xl p-6 text-center transition-colors ${
                            dragActive 
                                ? 'border-blue-500 bg-blue-50' 
                                : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
                        }`}
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                    >
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleFileInput}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                        <p className="text-gray-600 font-medium mb-1">
                            Kéo thả ảnh vào đây hoặc nhấp để chọn
                        </p>
                        <p className="text-sm text-gray-500">
                            Hỗ trợ JPG, PNG, WebP (tối đa 5MB)
                        </p>
                    </div>
                ) : (
                    <div className="relative">
                        <div className="relative rounded-xl border-2 border-green-200 bg-green-50 p-4">
                            <button
                                onClick={removeImage}
                                className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition"
                            >
                                <X size={14} />
                            </button>
                            <img
                                src={previewImage}
                                alt="Preview"
                                className="w-full h-48 object-cover rounded-lg"
                            />
                            <div className="mt-3 flex items-center gap-2 text-green-700">
                                <CheckCircle size={16} />
                                <span className="text-sm font-medium">Ảnh đã được tải lên</span>
                            </div>
                        </div>
                    </div>
                )}
                
                <div className="mt-3 flex items-start gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3">
                    <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="font-medium mb-1">Lưu ý quan trọng:</p>
                        <ul className="space-y-1 text-xs">
                            <li>• Chụp rõ toàn bộ thông tin chuyển khoản</li>
                            <li>• Đảm bảo nội dung chuyển khoản chính xác</li>
                            <li>• Đơn hàng sẽ được xử lý sau khi xác nhận thanh toán</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BankingPayment;