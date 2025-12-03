// frontend/src/components/FlashSale/FlashSaleCard.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { getImageUrl } from '../../services/api';

const FlashSaleCard = ({ product, flashSale, isUpcoming = false }) => {
    const navigate = useNavigate();
    
    const soldPercent = Math.round((product.soldCount / product.totalStock) * 100);
    const remaining = product.totalStock - product.soldCount;

    return (
        <div 
            className={`bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow cursor-pointer overflow-hidden group ${isUpcoming ? 'opacity-90' : ''}`}
            onClick={() => navigate(`/products/${product.productId?._id || product.productId}`)}
        >
            {/* Image Container */}
            <div className="relative overflow-hidden">
                <img 
                    src={getImageUrl(product.productId?.images?.[0])}
                    alt={product.productId?.productName || 'Product'}
                    className={`w-full h-48 object-cover group-hover:scale-110 transition-transform duration-300 ${isUpcoming ? 'grayscale-[30%]' : ''}`}
                />
                
                {/* Flash Sale Badge */}
                <div className={`absolute top-2 left-2 text-white text-xs font-bold px-2 py-1 rounded flex items-center gap-1 ${isUpcoming ? 'bg-orange-500' : 'bg-red-600'}`}>
                    <span>{isUpcoming ? '⏰' : '🔥'}</span>
                    <span>{isUpcoming ? 'SẮP MỞ BÁN' : 'FLASH SALE'}</span>
                </div>

                {/* Discount Badge */}
                <div className="absolute top-2 right-2 bg-yellow-400 text-red-700 text-lg font-bold px-2 py-1 rounded">
                    -{product.discountPercent || 0}%
                </div>

                {/* Stock Badge */}
                {!isUpcoming && remaining <= 10 && remaining > 0 && (
                    <div className="absolute bottom-2 left-2 bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded animate-pulse">
                        CHỈ CÒN {remaining}
                    </div>
                )}
            </div>

            {/* Product Info */}
            <div className="p-4">
                {/* Product Name */}
                <h3 className="text-sm font-medium text-gray-800 line-clamp-2 h-10 mb-2">
                    {product.productId?.productName || 'Sản phẩm'}
                </h3>

                {/* Price Section */}
                <div className="mb-3">
                    <div className="flex items-center gap-2">
                        <span className="text-xl font-bold text-red-600">
                            {(product.flashPrice || 0).toLocaleString('vi-VN')}₫
                        </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="text-sm text-gray-400 line-through">
                            {(product.originalPrice || 0).toLocaleString('vi-VN')}₫
                        </span>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-3">
                    <div className="flex justify-between text-xs text-gray-600 mb-1">
                        <span>{isUpcoming ? `Số lượng: ${product.totalStock}` : `Đã bán ${product.soldCount}/${product.totalStock}`}</span>
                        {!isUpcoming && <span>{soldPercent}%</span>}
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                        <div 
                            className={`h-full transition-all duration-300 flex items-center justify-center text-white text-xs font-bold ${
                                isUpcoming 
                                    ? 'bg-gradient-to-r from-orange-400 to-yellow-400' 
                                    : 'bg-gradient-to-r from-red-500 to-orange-500'
                            }`}
                            style={{ width: isUpcoming ? '100%' : `${Math.min(soldPercent, 100)}%` }}
                        >
                            {!isUpcoming && soldPercent > 30 && `${soldPercent}%`}
                        </div>
                    </div>
                </div>

                {/* Action Button */}
                {isUpcoming ? (
                    <button 
                        className="w-full bg-orange-500 text-white font-bold py-2 rounded cursor-default"
                        disabled
                    >
                        ⏰ SẮP MỞ BÁN
                    </button>
                ) : remaining > 0 ? (
                    <button 
                        className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 rounded transition-colors"
                        onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/products/${product.productId?._id || product.productId}`);
                        }}
                    >
                        MUA NGAY
                    </button>
                ) : (
                    <button 
                        className="w-full bg-gray-400 text-white font-bold py-2 rounded cursor-not-allowed"
                        disabled
                    >
                        HẾT HÀNG
                    </button>
                )}
            </div>
        </div>
    );
};

export default FlashSaleCard;
