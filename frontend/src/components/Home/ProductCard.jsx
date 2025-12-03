// src/components/Home/ProductCard.jsx
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { ProductController } from "../../controllers/productController";
import { FaCartPlus } from "react-icons/fa";
import { useCart } from "../../context/CartContext";
import { toast } from "react-toastify";
import { motion } from "framer-motion";
import { BACKEND_URL } from "../../services/api";
import { getStockStatus, StockStatusBadge, STOCK_STATUS } from "../../utils/stockStatus";

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export default function ProductCard({ product, viewMode = "grid" }) {
  const { addItem } = useCart();
  const [busy, setBusy] = useState(false);

  const p = product ?? {};
  const isList = viewMode === "list";

  // Id dùng cho route /products/:id
  const detailId = p.productId || p._id || p.id || "";

  // ========== Helper function: Pick sellable variant ==========
  const pickSellableVariant = (obj) => {
    if (!obj) return null;

    if (Array.isArray(obj.variants) && obj.variants.length > 0) {
      // ưu tiên variant còn stock
      const withStock = obj.variants.filter(
        (v) => Number(v.stock ?? 0) > 0
      );
      const v = withStock[0] || obj.variants[0];

      if (v) {
        return {
          variantId: v.variantId || v._id || "default",
          price: Number(v.price ?? v.salePrice ?? 0),
          originalPrice: Number(v.originalPrice ?? v.oldPrice ?? 0),
          discount: Number(v.discount ?? 0),
          stock: Number(v.stock ?? 0),
          name: v.name || v.variantName || '',
          description: v.description || v.variantDescription || '',
          sku: v.sku || v.productId || '',
          ...v
        };
      }
    }

    // Fallback nếu không có variants
    return {
      variantId: "default",
      price: Number(obj.price ?? obj.lowestPrice ?? obj.minPrice ?? 0),
      originalPrice: Number(obj.originalPrice ?? obj.oldPrice ?? 0),
      discount: Number(obj.discount ?? 0),
      stock: Number(obj.stock ?? 0),
      name: obj.name || obj.productName || '',
      description: obj.description || obj.productDescription || '',
      sku: obj.sku || obj.productId || obj._id || ''
    };
  };

  // ========== 1. Tổng tồn kho và trạng thái ==========
  const totalStock = (() => {
    if (typeof p.totalStock === "number") {
      return p.totalStock;
    }

    if (Array.isArray(p.variants) && p.variants.length > 0) {
      return p.variants.reduce(
        (sum, v) => sum + (Number(v.stock) || 0),
        0
      );
    }

    if (p.stock != null) {
      return Number(p.stock) || 0;
    }

    return 0;
  })();

  // Sử dụng stock status system mới
  const stockStatus = getStockStatus(totalStock);
  const isOutOfStock = stockStatus === STOCK_STATUS.OUT_OF_STOCK || stockStatus === STOCK_STATUS.DISCONTINUED;

  // ========== 3. Tính toán giảm giá và chương trình khuyến mãi ==========
  const discountInfo = (() => {
    const selectedVariant = pickSellableVariant(p);
    const currentPrice = selectedVariant ? selectedVariant.price : Number(p.lowestPrice ?? p.minPrice ?? p.price ?? 0);
    
    // Lấy thông tin giảm giá từ product hoặc variant
    const originalPrice = Number(p.originalPrice || p.oldPrice || selectedVariant?.originalPrice || selectedVariant?.oldPrice || 0);
    const discount = Number(p.discount || selectedVariant?.discount || 0);
    
    // Nếu không có originalPrice, tự tính dựa trên discount %
    let calculatedOriginalPrice = originalPrice;
    if (!originalPrice && discount > 0) {
      calculatedOriginalPrice = Math.round(currentPrice / (1 - discount / 100));
    }
    
    // Tính % giảm giá thực tế
    const actualDiscountPercent = calculatedOriginalPrice > currentPrice 
      ? Math.round(((calculatedOriginalPrice - currentPrice) / calculatedOriginalPrice) * 100)
      : 0;
    
    // Tên chương trình khuyến mãi
    const promotionName = p.promotionName || p.saleProgram || 
      (actualDiscountPercent > 0 ? getPromotionName(actualDiscountPercent, p.category?.categoryName) : "");
    
    return {
      currentPrice,
      originalPrice: calculatedOriginalPrice,
      discountPercent: actualDiscountPercent,
      promotionName,
      hasDiscount: actualDiscountPercent > 0
    };
  })();
  
  // Hàm tạo tên chương trình dựa trên % giảm và danh mục
  function getPromotionName(discountPercent, category = "") {
    const categoryName = category.toLowerCase();
    
    if (discountPercent >= 50) {
      return "🔥 Flash Sale 50%";
    } else if (discountPercent >= 30) {
      if (categoryName.includes('laptop')) return "💻 Laptop Sale 30%";
      if (categoryName.includes('phone') || categoryName.includes('smartphone')) return "📱 Smartphone Festival";
      return "✨ Mega Sale 30%";
    } else if (discountPercent >= 20) {
      return "🎉 Weekend Sale 20%";
    } else if (discountPercent >= 10) {
      return "🏆 Súper Oferta";
    } else if (discountPercent >= 5) {
      return "🔥 Hot Deal";
    }
    return "";
  }

  // ========== 2. Ảnh hiển thị ==========
  const imageUrl = (() => {
    // Ưu tiên: images array > image string > thumbnail > mainImage > placeholder
    // Backend trả về images array từ Pexels CDN
    if (Array.isArray(p.images) && p.images.length > 0 && p.images[0]) {
      const imgPath = p.images[0];
      console.log(`🖼️ [${p.productName}] Using images[0]:`, imgPath);
      
      // Pexels URLs can be used directly (no proxy needed)
      const url = imgPath.startsWith('/images') ? `${BACKEND_URL}${imgPath}` : imgPath;
      console.log(`📍 Final URL:`, url);
      return url;
    }
    
    // Fallback: single image field
    if (p.image && typeof p.image === 'string' && p.image.trim()) {
      console.log(`🖼️ [${p.productName}] Using p.image`);
      const url = p.image.startsWith('/images') ? `${BACKEND_URL}${p.image}` : p.image;
      return url;
    }
    
    if (p.thumbnail) {
      return p.thumbnail.startsWith('/images') ? `${BACKEND_URL}${p.thumbnail}` : p.thumbnail;
    }
    if (p.mainImage) {
      return p.mainImage.startsWith('/images') ? `${BACKEND_URL}${p.mainImage}` : p.mainImage;
    }
    
    // Fallback to placeholder
    console.log(`⚠️ [${p.productName}] No image found, using placeholder`);
    return "/img/default.png";
  })();

  // ========== 4. Thêm vào giỏ ==========
  const handleAddToCart = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (isOutOfStock) {
      if (stockStatus === STOCK_STATUS.OUT_OF_STOCK) {
        toast.info("Sản phẩm này tạm thời hết hàng.");
      } else if (stockStatus === STOCK_STATUS.DISCONTINUED) {
        toast.info("Sản phẩm này đã ngừng kinh doanh.");
      }
      return;
    }

    if (stockStatus === STOCK_STATUS.LOW_STOCK) {
      toast.warning(`Chỉ còn ${totalStock} sản phẩm trong kho!`);
    }

    try {
      setBusy(true);

      // Backend đã gửi đủ thông tin: _id, variants, totalStock
      const mongoId = p._id;
      if (!mongoId) {
        toast.error("Lỗi dữ liệu sản phẩm (thiếu _id).");
        return;
      }

      const v = pickSellableVariant(p);

      if (!v || v.stock <= 0) {
        toast.error("Phiên bản này đã hết hàng.");
        return;
      }

      await addItem({
        productId: mongoId,
        productStringId: detailId,
        productName: p.productName || p.name || "Sản phẩm",
        image: imageUrl,
        variantId: v.variantId,
        variantName: v.name,
        price: v.price,
        stock: v.stock,
        quantity: 1,
      });

      toast.success("Đã thêm vào giỏ!");
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err.message ||
        "Lỗi thêm giỏ hàng";

      if (msg.toLowerCase().includes("tồn kho")) {
        toast.warning("Sản phẩm không đủ số lượng tồn kho.");
      } else {
        toast.error(msg);
      }
    } finally {
      setBusy(false);
    }
  };

  // Nếu không có id thì không render (tránh crash)
  if (!detailId) return null;

  // ========== 6. JSX ==========
  return (
    <motion.div variants={itemVariants} className="h-full">
      <div
        className={`
          group bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden 
          transition-all duration-300 hover:shadow-xl hover:border-indigo-100
          ${isList ? "flex flex-row items-center p-4 gap-6" : "flex flex-col h-full"}
          ${isOutOfStock ? "opacity-80" : ""} 
        `}
      >
        {/* Hình ảnh */}
        <Link
          to={`/products/${detailId}`}
          className={`
            block relative overflow-hidden flex-shrink-0
            ${isList ? "w-48 h-48 rounded-lg bg-gray-50" : "w-full h-48"}
          `}
        >
          <img
            src={imageUrl}
            alt={p.productName}
            className={`
              w-full h-full object-contain mix-blend-multiply p-4 transition-transform duration-500 
              ${!isOutOfStock && "group-hover:scale-110"}
              ${isOutOfStock ? "grayscale" : ""}
            `}
            loading="lazy"
            onError={(e) => {
              console.log('❌ ProductCard image failed to load:', imageUrl);
              e.target.src = '/img/default.png';
            }}
          />

          {/* Stock Status Badge Overlay */}
          {stockStatus !== STOCK_STATUS.IN_STOCK && (
            <div className="absolute top-2 right-2 z-10">
              <StockStatusBadge status={stockStatus} />
            </div>
          )}
          
          {/* Discount Badge Overlay */}
          {discountInfo.hasDiscount && (
            <div className="absolute top-2 left-2 z-10">
              <div className="bg-gradient-to-r from-red-500 to-red-600 text-white text-xs font-bold px-2 py-1 rounded-md shadow-lg">
                -{discountInfo.discountPercent}%
              </div>
            </div>
          )}
          
          {/* New Product Badge */}
          {p.isNewProduct && (
            <div className="absolute top-2 left-2 z-20" style={{ top: discountInfo.hasDiscount ? '2.5rem' : '0.5rem' }}>
              <div className="bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded-md shadow-lg">
                MỚI
              </div>
            </div>
          )}
          
          {/* Best Seller Badge */}
          {p.isBestSeller && (
            <div className="absolute top-2 left-2 z-20" style={{ 
              top: (discountInfo.hasDiscount && p.isNewProduct) ? '5rem' : 
                   (discountInfo.hasDiscount || p.isNewProduct) ? '2.5rem' : '0.5rem' 
            }}>
              <div className="bg-yellow-500 text-white text-xs font-bold px-2 py-1 rounded-md shadow-lg">
                BÁN CHẠY
              </div>
            </div>
          )}
        </Link>

        {/* Nội dung */}
        <div
          className={`flex flex-col flex-1 ${
            isList ? "justify-between h-full" : "p-4"
          }`}
        >
          <div>
            {p?.brand && (
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
                {p.brand}
              </p>
            )}

            <Link
              to={`/products/${detailId}`}
              className={`
                block font-bold text-gray-800 hover:text-indigo-600 transition-colors
                ${isList ? "text-xl mb-2" : "text-base mb-2 line-clamp-2 min-h-[3rem]"}
              `}
              title={p?.productName}
            >
              {p?.productName || p?.name || "Sản phẩm không tên"}
            </Link>

            {isList && (
              <p className="text-sm text-gray-500 line-clamp-2 mb-4 pr-4">
                {p.productDescription ||
                  p.description ||
                  "Mô tả đang cập nhật..."}
              </p>
            )}
          </div>

          <div
            className={`flex items-center justify-between ${
              isList ? "mt-0" : "mt-4"
            }`}
          >
            <div className="flex flex-col flex-1 pr-2">
              {/* Tên chương trình khuyến mãi */}
              {discountInfo.promotionName && (
                <div className="mb-1 animate-pulse">
                  <span className="text-xs px-2 py-0.5 bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-full font-semibold tracking-wide shadow-md">
                    {discountInfo.promotionName}
                  </span>
                </div>
              )}
              
              {/* Giá gốc và % giảm (nếu có) */}
              {discountInfo.hasDiscount && (
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="text-sm text-gray-400 line-through">
                    {discountInfo.originalPrice.toLocaleString("vi-VN")} ₫
                  </span>
                  <span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-bold border border-red-200">
                    -{discountInfo.discountPercent}%
                  </span>
                </div>
              )}
              
              {/* Giá hiện tại */}
              <div className="flex items-center gap-2 flex-wrap">
                {!discountInfo.hasDiscount && (
                  <span className="text-xs text-gray-400">Giá chỉ từ</span>
                )}
                <span
                  className={`text-lg font-bold ${
                    isOutOfStock ? "text-gray-500" : 
                    discountInfo.hasDiscount ? "text-red-600" : "text-blue-600"
                  }`}
                >
                  {discountInfo.currentPrice.toLocaleString("vi-VN")} ₫
                </span>
              </div>
              
              {/* Tiết kiệm tiền (hiển thị riêng cho mobile) */}
              {discountInfo.hasDiscount && (
                <div className="mt-1">
                  <span className="text-xs text-green-600 font-semibold bg-green-50 px-1.5 py-0.5 rounded">
                    💰 Tiết kiệm {(discountInfo.originalPrice - discountInfo.currentPrice).toLocaleString("vi-VN")}₫
                  </span>
                </div>
              )}
            </div>

            {/* Nút mua */}
            <button
              onClick={handleAddToCart}
              disabled={busy || isOutOfStock}
              className={`
                flex items-center gap-2 rounded-full shadow-md transition-all duration-300 font-medium
                ${isList ? "px-6 py-2" : "p-3"}
                ${
                  isOutOfStock
                    ? "bg-gray-200 text-gray-500 cursor-not-allowed shadow-none"
                    : stockStatus === STOCK_STATUS.LOW_STOCK
                    ? "bg-orange-50 text-orange-600 hover:bg-orange-600 hover:text-white"
                    : "bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white"
                }
              `}
              title={
                isOutOfStock 
                  ? stockStatus === STOCK_STATUS.DISCONTINUED ? "Ngừng kinh doanh" : "Hết hàng"
                  : stockStatus === STOCK_STATUS.LOW_STOCK
                  ? "Sắp hết hàng - Mua ngay!"
                  : "Thêm vào giỏ hàng"
              }
            >
              {isOutOfStock ? (
                <span className="text-xs font-bold px-1">
                  {stockStatus === STOCK_STATUS.DISCONTINUED ? "NGỪNG" : "HẾT"}
                </span>
              ) : (
                <>
                  <FaCartPlus className="h-5 w-5" />
                  {isList && (
                    <span>
                      {stockStatus === STOCK_STATUS.LOW_STOCK ? "Mua ngay!" : "Thêm giỏ hàng"}
                    </span>
                  )}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
