// src/pages/ProductDetail.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ProductController } from '../controllers/productController';
import { useCart } from '../context/CartContext';
import { toast } from 'react-toastify';
import { initSocket, onEvent, offEvent } from '../services/socket';
import { 
    ShoppingCart, ShieldCheck, RefreshCw, 
    Gift, ChevronRight, Star as StarIcon, Send, CheckCircle, Package
} from 'lucide-react';
import { getStockStatus, StockStatusBadge, StockInfo } from '../utils/stockStatus';
import useAuth from '../hooks/useAuth';

const money = (n) => `${(Number(n) || 0).toLocaleString("vi-VN")} đ`;
const isAbort = (e) => e?.name === "AbortError" || /abort/i.test(String(e?.message || ""));

function Star({ filled = false, onClick, size = 20 }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`transition-colors ${filled ? "text-yellow-400" : "text-gray-300"} hover:text-yellow-500`}
    >
      <StarIcon size={size} fill={filled ? "currentColor" : "none"} />
    </button>
  );
}

export default function ProductDetail() {
  const params = useParams();
  const { addItem } = useCart();
  const { isAdmin, user, isAuthenticated } = useAuth();
  const urlId = params.id || params.productId || params.slug || "";

  // --- STATE ---
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [product, setProduct] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null); 
  const [quantity, setQuantity] = useState(1);
  const [activeIdx, setActiveIdx] = useState(0);

  // Forms
  const [cName, setCName] = useState("");
  const [cText, setCText] = useState("");
  const [myRate, setMyRate] = useState(0);
  const [rateMsg, setRateMsg] = useState("");

  // --- AUTO-FILL USER INFO ---
  useEffect(() => {
    if (user?.name && !cName) {
      setCName(user.name);
    }
  }, [user, cName]);

  // --- 1. FETCH DATA ---
  useEffect(() => {
    if (!urlId) {
      setError("Thiếu mã sản phẩm.");
      setLoading(false);
      return;
    }
    const ctrl = new AbortController();
    (async () => {
      setLoading(true);
      try {
        const j = await ProductController.getProductById(urlId);
        const data = j?.data || j?.product || j;
        if (!data || j?.success === false) throw new Error("Không tìm thấy sản phẩm.");
        
        console.log('📦 ProductDetail loaded - Product data:', {
          name: data.productName,
          hasImages: !!data.images,
          imagesLength: Array.isArray(data.images) ? data.images.length : 'N/A',
          images: data.images
        });
        
        setProduct(data);
        setActiveIdx(0);
        // Tự động chọn biến thể đầu tiên
        if (data.variants && data.variants.length > 0) setSelectedVariant(data.variants[0]);
      } catch (e) {
        if (!isAbort(e)) setError(e?.message);
      } finally {
        setLoading(false);
      }
    })();
    return () => ctrl.abort();
    // eslint-disable-next-line
  }, [urlId]);

  // --- 2. SOCKET REALTIME ---
  useEffect(() => {
      // Sử dụng socket service chung
      initSocket();
      
      const handleNewActivity = (data) => {
          const currentId = product?._id || product?.productId;
          if (data.productSlug === urlId || data.productId === urlId || data.mongoId === currentId) {
              refetch(); 
              // Không hiển thị thông báo cho user tự comment
          }
      };
      
      // Lắng nghe event 'new_activity'
      onEvent('new_activity', handleNewActivity);
      
      // Cleanup: remove listener khi component unmount
      return () => {
          offEvent('new_activity', handleNewActivity);
      };
      // eslint-disable-next-line
  }, [urlId, product]);

  async function refetch() {
    try {
      const j = await ProductController.getProductById(urlId);
      const newData = j?.data || j?.product || j;
      if (newData) setProduct(prev => ({ ...prev, ...newData }));
    } catch (e) { console.error(e); }
  }

  // --- LOGIC GIỎ HÀNG ---
  const handleAddToCart = async () => {
      if (!product) return;
      if (product.variants?.length > 0 && !selectedVariant) return toast.error("Vui lòng chọn phiên bản!");
      
      const currentStock = selectedVariant ? selectedVariant.stock : (product.stock || 0);
      if (currentStock <= 0) return toast.error("Sản phẩm tạm hết hàng.");

      try {
          // Lấy giá hiện tại (Sau khi giảm)
          const finalPrice = priceData.current;

          await addItem({
              productId: product._id,
              productStringId: product.productId,
              productName: product.productName,
              image: images[0],
              variantId: selectedVariant?.variantId || 'default',
              variantName: selectedVariant?.name || 'Mặc định',
              price: finalPrice,
              stock: currentStock,
              quantity: quantity
          });
          toast.success("Đã thêm vào giỏ hàng!");
      } catch (err) { toast.error(err.message); }
  };

  // --- BÌNH LUẬN & ĐÁNH GIÁ ---
  async function onSubmitComment(e) {
    e.preventDefault();
    if (!cText.trim()) return;
    
    // Lấy thông tin user trực tiếp từ sessionStorage
    const userDataStr = sessionStorage.getItem('userData');
    const currentUser = userDataStr ? JSON.parse(userDataStr) : null;
    
    // Prepare comment data với user từ sessionStorage
    const commentData = { 
      name: currentUser?.name || user?.name || cName || "Khách hàng", 
      comment: cText.trim(),
      userAvatar: currentUser?.avatar || user?.avatar || null,
      userId: currentUser?._id || user?._id || null
    };
    
    try {
      await ProductController.addComment(product?._id || urlId, commentData);
      setCName(""); 
      setCText("");
      await refetch();
      toast.success("Đã thêm bình luận!");
    } catch (e) { 
      console.error("Comment error:", e);
      toast.error("Lỗi gửi bình luận"); 
    }
  }

  async function onRate() {
    if (!myRate) return setRateMsg("Chọn số sao nhé!");
    try {
      setRateMsg("Đang gửi...");
      await ProductController.rateProduct(product?._id || urlId, { rating: myRate });
      await refetch();
      setRateMsg("Đánh giá thành công!");
    } catch (e) { setRateMsg("Cần đăng nhập để đánh giá."); }
  }

  // --- HELPERS HIỂN THỊ ---
  const images = useMemo(() => {
    const arr = (Array.isArray(product?.images) ? product.images : []).filter(Boolean);
    console.log('🖼️ ProductDetail - images from product:', {
      hasImages: !!product?.images,
      isArray: Array.isArray(product?.images),
      length: Array.isArray(product?.images) ? product.images.length : 'N/A',
      images: product?.images
    });
    const conv = arr.map(img => ProductController.getImageUrl(img));
    while (conv.length < 1) conv.push("/img/default.png");
    console.log('📸 Final converted images:', conv);
    return conv.slice(0, 8);
  }, [product]);

  // === 💡 LOGIC TÍNH GIÁ KHUYẾN MÃI ===
  const priceData = useMemo(() => {
      // 1. Xác định giá bán hiện tại
      let current = 0;
      if (selectedVariant) {
          current = Number(selectedVariant.price) || 0;
      } else {
          current = Number(typeof product?.lowestPrice === "number" ? product.lowestPrice : product?.price) || 0;
      }

      // 2. Xác định giá gốc (Giả lập tăng 15% để demo khuyến mãi nếu DB không có field oldPrice)
      // Nếu bạn có field oldPrice trong variant, hãy thay logic này: let original = selectedVariant?.oldPrice || ...
      let original = Number(product?.oldPrice) || 0;
      
      // Nếu không có giá cũ trong DB, ta tự tạo giá ảo để hiển thị "Giảm giá" cho đẹp (theo yêu cầu)
      if (original <= current) {
          original = current * 1.15; // Tăng 15% làm giá gốc
      }

      // 3. Tính % giảm
      const percent = original > current ? Math.round(((original - current) / original) * 100) : 0;

      return { current, original, percent };
  }, [product, selectedVariant]);

  // Rating
  const { avgRating, ratingCount } = useMemo(() => {
    const arr = Array.isArray(product?.ratings) ? product.ratings : [];
    const val = arr.map(r => Number(r?.stars)).filter(Number.isFinite);
    const avg = val.length ? val.reduce((a, b) => a + b, 0) / val.length : 0;
    return { avgRating: Number(product?.avgRating) || avg, ratingCount: Number(product?.ratingsCount) || val.length };
  }, [product]);

  if (loading) return <div className="h-screen flex justify-center items-center"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-blue-600"></div></div>;
  if (!product) return <div className="text-center py-20 text-gray-500">Sản phẩm không tồn tại</div>;

  return (
    <div className="bg-[#f4f6f8] min-h-screen pb-12 font-sans">
        
        {/* BREADCRUMB */}
        <div className="bg-white border-b border-gray-200 py-3 sticky top-0 z-10 shadow-sm">
            <div className="container mx-auto px-4 flex items-center gap-2 text-sm text-gray-500">
                <Link to="/" className="hover:text-blue-600">Trang chủ</Link>
                <ChevronRight size={14} />
                <span className="hover:text-blue-600 cursor-pointer">{product.category?.categoryName || "Sản phẩm"}</span>
                <ChevronRight size={14} />
                <span className="text-gray-800 font-medium truncate max-w-[200px]">{product.productName}</span>
            </div>
        </div>

        <div className="container mx-auto px-4 py-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
                    
                    {/* LEFT: GALLERY */}
                    <div className="lg:col-span-5 p-6 border-r border-gray-100">
                        <div className="relative aspect-square w-full bg-white rounded-lg overflow-hidden mb-4 group border border-gray-100">
                            <img 
                                src={images[activeIdx]} 
                                alt="Main" 
                                className="w-full h-full object-contain p-4 transition-transform duration-500 group-hover:scale-105"
                                onError={(e) => {
                                    console.log('❌ Main image failed to load:', images[activeIdx]);
                                    e.target.src = '/img/default.png';
                                }}
                            />
                            {/* Badge Mới */}
                            {product.isNewProduct && <span className="absolute top-3 left-3 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm">MỚI</span>}
                            {/* Badge Giảm giá */}
                            {priceData.percent > 0 && <span className="absolute top-3 right-3 bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm">-{priceData.percent}%</span>}
                        </div>
                        <div className="flex gap-3 overflow-x-auto pb-2 custom-scrollbar">
                            {images.map((src, i) => (
                                <button key={i} onClick={() => setActiveIdx(i)} className={`flex-shrink-0 w-20 h-20 rounded-md border-2 overflow-hidden ${i === activeIdx ? "border-blue-600 ring-1 ring-blue-200" : "border-gray-200 hover:border-gray-400"}`}>
                                    <img 
                                        src={src} 
                                        alt="" 
                                        className="w-full h-full object-contain p-1"
                                        onError={(e) => {
                                            console.log('❌ Thumbnail image failed to load:', src);
                                            e.target.src = '/img/default.png';
                                        }}
                                    />
                                </button>
                            ))}
                        </div>
                        <div className="grid grid-cols-2 gap-4 mt-6">
                            <div className="flex items-center gap-2 text-sm text-gray-600 border p-2 rounded bg-gray-50"><ShieldCheck className="text-blue-600" size={20}/> Bảo hành 12 tháng</div>
                            <div className="flex items-center gap-2 text-sm text-gray-600 border p-2 rounded bg-gray-50"><RefreshCw className="text-blue-600" size={20}/> 1 đổi 1 trong 30 ngày</div>
                        </div>
                    </div>

                    {/* RIGHT: INFO */}
                    <div className="lg:col-span-7 p-6 lg:p-8">
                        <div className="mb-4">
                            <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2 leading-tight">{product.productName}</h1>
                            <div className="flex items-center gap-4 text-sm">
                                <div className="flex items-center gap-1 text-yellow-400">
                                    <span className="font-bold text-gray-900 text-base">{avgRating.toFixed(1)}</span>
                                    <StarIcon size={16} fill="currentColor"/>
                                </div>
                                <span className="text-blue-600 hover:underline cursor-pointer">{ratingCount} đánh giá</span>
                                <span className="text-gray-300">|</span>
                                <span className="text-gray-500">Thương hiệu: <span className="text-blue-600 font-medium uppercase">{product.brand || "Khác"}</span></span>
                            </div>
                        </div>

                        {/* === KHU VỰC GIÁ (QUAN TRỌNG) === */}
                        <div className="bg-red-50 rounded-xl p-4 mb-6 border border-red-100 flex flex-wrap items-end gap-3">
                            {/* Giá hiện tại (To nhất) */}
                            <span className="text-3xl md:text-4xl font-bold text-red-600 tracking-tight">
                                {money(priceData.current)}
                            </span>
                            
                            {/* Giá gốc (Gạch ngang) & % Giảm - Chỉ hiện nếu có giảm giá */}
                            {priceData.percent > 0 && (
                                <div className="flex items-center gap-2 mb-1.5">
                                    <span className="text-gray-400 line-through text-lg font-medium">
                                        {money(priceData.original)}
                                    </span>
                                    <span className="bg-red-600 text-white text-xs font-bold px-2 py-1 rounded shadow-sm">
                                        Giảm {priceData.percent}%
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Variants */}
                        {Array.isArray(product.variants) && product.variants.length > 0 && (
                            <div className="mb-6">
                                <p className="font-semibold text-gray-800 mb-3 text-sm uppercase tracking-wide">Chọn phiên bản:</p>
                                <div className="flex flex-wrap gap-3">
                                    {product.variants.map((v, idx) => {
                                        const isSelected = selectedVariant?.variantId === v.variantId;
                                        return (
                                            <button 
                                                key={idx} 
                                                onClick={() => setSelectedVariant(v)} 
                                                className={`
                                                    relative px-4 py-3 rounded-lg border text-sm font-medium transition-all min-w-[120px] text-left group
                                                    ${isSelected 
                                                        ? 'border-red-600 bg-white text-red-700 ring-1 ring-red-600 shadow-md' 
                                                        : 'border-gray-200 hover:border-gray-400 text-gray-700 bg-white hover:bg-gray-50'
                                                    }
                                                `}
                                            >
                                                <div className="font-bold">{v.name}</div>
                                                <div className={`text-xs mt-1 ${isSelected ? 'text-red-600' : 'text-gray-500'}`}>
                                                    {money(v.price)}
                                                </div>
                                                {/* Icon check khi chọn */}
                                                {isSelected && (
                                                    <div className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-0.5 shadow-sm">
                                                        <CheckCircle size={12}/>
                                                    </div>
                                                )}
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Stock & Quantity */}
                        <div className="flex items-center gap-6 mb-8">
                            <div>
                                <p className="font-semibold text-gray-800 mb-2 text-sm uppercase">Số lượng:</p>
                                <div className="flex items-center border border-gray-300 rounded-lg w-fit bg-white">
                                    <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="px-3 py-2 hover:bg-gray-100 text-gray-600">-</button>
                                    <input type="number" value={quantity} onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))} className="w-12 text-center focus:outline-none font-semibold text-gray-800" />
                                    <button onClick={() => setQuantity(quantity + 1)} className="px-3 py-2 hover:bg-gray-100 text-gray-600">+</button>
                                </div>
                            </div>
                            
                            {/* Stock Status - Mới */}
                            <StockInfo 
                              product={product} 
                              selectedVariant={selectedVariant?.variantId} 
                              showAdminInfo={isAdmin}
                            />
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col sm:flex-row gap-3 mb-6">
                            {(() => {
                                const stockInfo = getStockStatus(product, selectedVariant?.variantId);
                                const canOrder = stockInfo?.canOrder && selectedVariant;
                                
                                return (
                                    <>
                                        <button 
                                            onClick={canOrder ? handleAddToCart : undefined}
                                            disabled={!canOrder}
                                            className={`flex-1 py-4 rounded-xl font-bold text-lg transition-all shadow-lg flex flex-col items-center justify-center transform active:scale-95 ${
                                                canOrder 
                                                    ? 'bg-gradient-to-r from-red-600 to-red-500 text-white hover:from-red-700 hover:to-red-600 shadow-red-200' 
                                                    : 'bg-gray-400 text-gray-200 cursor-not-allowed'
                                            }`}
                                        >
                                            <span>{canOrder ? 'MUA NGAY' : 'HẾT HÀNG'}</span>
                                            <span className="text-xs font-normal opacity-90 uppercase tracking-wide">
                                                {canOrder ? 'Giao tận nơi hoặc nhận tại cửa hàng' : 'Sản phẩm tạm thời không có sẵn'}
                                            </span>
                                        </button>
                                        <button 
                                            onClick={canOrder ? handleAddToCart : undefined}
                                            disabled={!canOrder}
                                            className={`flex-1 sm:flex-none sm:w-1/3 py-4 rounded-xl font-bold text-lg transition-all flex flex-col items-center justify-center ${
                                                canOrder 
                                                    ? 'border-2 border-blue-600 text-blue-600 hover:bg-blue-50' 
                                                    : 'border-2 border-gray-300 text-gray-400 cursor-not-allowed'
                                            }`}
                                        >
                                            <span className="flex items-center gap-2">
                                                <ShoppingCart size={20}/> 
                                                {canOrder ? 'THÊM GIỎ' : 'HẾT HÀNG'}
                                            </span>
                                            <span className="text-xs font-normal opacity-90">
                                                {canOrder ? 'Thêm vào để mua sau' : 'Không thể đặt hàng'}
                                            </span>
                                        </button>
                                    </>
                                );
                            })()}
                        </div>

                        {/* Promotion */}
                        <div className="border border-green-200 rounded-xl overflow-hidden bg-white">
                            <div className="bg-green-50 px-4 py-2 border-b border-green-200 flex items-center gap-2 font-bold text-green-800">
                                <Gift size={18}/> Ưu đãi thêm
                            </div>
                            <div className="p-4 text-sm space-y-2 text-gray-700">
                                <p className="flex gap-2"><CheckCircle size={16} className="text-green-600 mt-0.5"/> <span>Giảm thêm <strong>5%</strong> tối đa 300k khi thanh toán qua VNPay</span></p>
                                <p className="flex gap-2"><CheckCircle size={16} className="text-green-600 mt-0.5"/> <span>Tặng gói cài đặt phần mềm trọn đời</span></p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* DESCRIPTION & REVIEWS */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
                <div className="lg:col-span-2 space-y-6">
                    {/* Description */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <h2 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">Mô tả sản phẩm</h2>
                        <div className="prose max-w-none text-gray-600 leading-relaxed whitespace-pre-line text-sm">
                            {product.description || product.productDescription || "Nội dung đang cập nhật..."}
                        </div>
                    </div>

                    {/* Review Block */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6" id="reviews">
                        <h2 className="text-xl font-bold text-gray-800 mb-6">Đánh giá & Bình luận</h2>
                        
                        <div className="bg-gray-50 p-5 rounded-xl mb-8">
                            <div className="flex gap-2 mb-4 justify-center">
                                {[1,2,3,4,5].map(n => <Star key={n} filled={n <= myRate} onClick={() => setMyRate(n)} size={32}/>)}
                            </div>
                            {rateMsg && <p className="text-center text-sm text-blue-600 mb-3 font-medium">{rateMsg}</p>}
                            <div className="flex gap-3">
                                {/* User Avatar for Comment Form */}
                                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold overflow-hidden flex-shrink-0">
                                    {(() => {
                                        const userDataStr = sessionStorage.getItem('userData');
                                        const currentUser = userDataStr ? JSON.parse(userDataStr) : null;
                                        const displayName = currentUser?.name || user?.name || 'Khách';
                                        const avatarUrl = currentUser?.avatar || user?.avatar;
                                        
                                        return avatarUrl ? (
                                            <img 
                                                src={ProductController.getImageUrl(avatarUrl)} 
                                                alt={displayName} 
                                                className="w-full h-full object-cover" 
                                                onError={(e) => { 
                                                    e.target.style.display = 'none'; 
                                                    e.target.parentElement.innerHTML = `<span class="w-full h-full bg-blue-100 text-blue-600 font-bold flex items-center justify-center">${displayName.charAt(0).toUpperCase()}</span>`; 
                                                }}
                                            />
                                        ) : (
                                            <span className="w-full h-full bg-blue-100 text-blue-600 font-bold flex items-center justify-center">
                                                {displayName.charAt(0).toUpperCase()}
                                            </span>
                                        );
                                    })()}
                                </div>
                                <div className="flex-1 space-y-3 relative">
                                    <input 
                                        value={(() => {
                                            const userDataStr = sessionStorage.getItem('userData');
                                            const currentUser = userDataStr ? JSON.parse(userDataStr) : null;
                                            return currentUser?.name || user?.name || cName;
                                        })()} 
                                        onChange={e => setCName(e.target.value)} 
                                        placeholder={(() => {
                                            const userDataStr = sessionStorage.getItem('userData');
                                            const currentUser = userDataStr ? JSON.parse(userDataStr) : null;
                                            return currentUser?.name || user?.name ? `Đã đăng nhập: ${currentUser?.name || user?.name}` : "Tên của bạn (bắt buộc)";
                                        })()} 
                                        className={`w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-blue-500 bg-white ${(() => {
                                            const userDataStr = sessionStorage.getItem('userData');
                                            const currentUser = userDataStr ? JSON.parse(userDataStr) : null;
                                            return currentUser?.name || user?.name ? 'bg-gray-50 text-gray-600' : '';
                                        })()}`}
                                        disabled={(() => {
                                            const userDataStr = sessionStorage.getItem('userData');
                                            const currentUser = userDataStr ? JSON.parse(userDataStr) : null;
                                            return !!(currentUser?.name || user?.name);
                                        })()}
                                    />
                                    <textarea value={cText} onChange={e=>setCText(e.target.value)} placeholder="Mời bạn để lại bình luận..." rows={3} className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-blue-500 resize-none bg-white"/>
                                    <button onClick={(e) => { onRate(); onSubmitComment(e); }} className="absolute bottom-3 right-3 p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors shadow-md">
                                        <Send size={16}/>
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6">
                            {(product.comments || []).slice().reverse().map((c, i) => (
                                <div key={i} className="flex gap-3">
                                    {/* Comment Avatar */}
                                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center font-bold text-gray-600 flex-shrink-0 overflow-hidden relative">
                                        {c.userAvatar ? (
                                            <>
                                                <img 
                                                    src={ProductController.getImageUrl(c.userAvatar)} 
                                                    alt={c.name || "User"} 
                                                    className="w-full h-full object-cover absolute inset-0" 
                                                    onError={(e) => { 
                                                        e.target.style.display = 'none'; 
                                                    }}
                                                />
                                                <span className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 text-white font-bold flex items-center justify-center">
                                                    {(c.name || "K").charAt(0).toUpperCase()}
                                                </span>
                                            </>
                                        ) : (
                                            <span className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 text-white font-bold flex items-center justify-center">
                                                {(c.name || "K").charAt(0).toUpperCase()}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex-1 bg-gray-50 p-3 rounded-2xl rounded-tl-none border border-gray-100">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="font-bold text-gray-800 text-sm">{c.name || "Khách hàng"}</span>
                                            <span className="text-xs text-gray-400">{c.createdAt ? new Date(c.createdAt).toLocaleDateString('vi-VN') : "Vừa xong"}</span>
                                        </div>
                                        <p className="text-gray-700 text-sm">{c.comment}</p>
                                    </div>
                                </div>
                            ))}
                            {!product.comments?.length && <p className="text-center text-gray-400 text-sm py-4">Chưa có bình luận nào.</p>}
                        </div>
                    </div>
                </div>

                {/* Sidebar Right (Specs) */}
                <div className="hidden lg:block">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 sticky top-24">
                        <h3 className="font-bold text-gray-800 mb-4 text-sm uppercase">Thông số kỹ thuật</h3>
                        <ul className="space-y-3 text-sm text-gray-600">
                            <li className="flex justify-between pb-2 border-b border-gray-50"><span>Thương hiệu</span> <span className="font-medium text-gray-800">{product.brand}</span></li>
                            <li className="flex justify-between pb-2 border-b border-gray-50"><span>Bảo hành</span> <span className="font-medium text-gray-800">12 - 24 tháng</span></li>
                            <li className="flex justify-between pb-2 border-b border-gray-50"><span>Tình trạng</span> <span className="font-medium text-green-600">Mới 100%</span></li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
}