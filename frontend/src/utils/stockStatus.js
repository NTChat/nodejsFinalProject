// frontend/src/utils/stockStatus.js
export const STOCK_STATUS = {
  IN_STOCK: 'in_stock',
  LOW_STOCK: 'low_stock', 
  OUT_OF_STOCK: 'out_of_stock',
  COMING_SOON: 'coming_soon',
  DISCONTINUED: 'discontinued'
};

export const STOCK_THRESHOLD = {
  LOW_STOCK: 10,
  CRITICAL_STOCK: 3
};

/**
 * Tính toán trạng thái stock cho sản phẩm
 * @param {Object} product - Sản phẩm
 * @param {string} selectedVariant - Variant được chọn (optional)
 * @returns {Object} { status, message, badge, canOrder, totalStock }
 */
export const getStockStatus = (product, selectedVariant = null) => {
  if (!product) return null;
  
  let totalStock = 0;
  let variantStock = 0;
  
  // Tính tổng stock từ tất cả variants
  if (product.variants && product.variants.length > 0) {
    totalStock = product.variants.reduce((sum, variant) => sum + (variant.stock || 0), 0);
    
    // Nếu có variant được chọn, lấy stock của variant đó
    if (selectedVariant) {
      const variant = product.variants.find(v => v.variantId === selectedVariant);
      variantStock = variant ? variant.stock || 0 : 0;
    } else {
      // Nếu không chọn variant, lấy stock cao nhất
      variantStock = Math.max(...product.variants.map(v => v.stock || 0));
    }
  }
  
  const currentStock = selectedVariant ? variantStock : totalStock;
  
  // Nếu sản phẩm bị vô hiệu hóa
  if (product.status === 'unavailable') {
    return {
      status: STOCK_STATUS.DISCONTINUED,
      message: 'Ngừng kinh doanh',
      badge: 'bg-gray-500 text-white',
      canOrder: false,
      totalStock: 0,
      variantStock: 0
    };
  }
  
  // Logic trạng thái dựa trên stock
  if (currentStock === 0) {
    return {
      status: STOCK_STATUS.OUT_OF_STOCK,
      message: 'Hết hàng',
      badge: 'bg-red-500 text-white',
      canOrder: false,
      totalStock,
      variantStock
    };
  } else if (currentStock <= STOCK_THRESHOLD.CRITICAL_STOCK) {
    return {
      status: STOCK_STATUS.LOW_STOCK,
      message: `Chỉ còn ${currentStock} sản phẩm`,
      badge: 'bg-orange-500 text-white animate-pulse',
      canOrder: true,
      totalStock,
      variantStock,
      urgency: 'critical'
    };
  } else if (currentStock <= STOCK_THRESHOLD.LOW_STOCK) {
    return {
      status: STOCK_STATUS.LOW_STOCK,
      message: `Còn ${currentStock} sản phẩm`,
      badge: 'bg-yellow-500 text-white',
      canOrder: true,
      totalStock,
      variantStock,
      urgency: 'low'
    };
  } else {
    return {
      status: STOCK_STATUS.IN_STOCK,
      message: 'Còn hàng',
      badge: 'bg-green-500 text-white',
      canOrder: true,
      totalStock,
      variantStock
    };
  }
};

/**
 * Component hiển thị badge trạng thái
 */
export const StockStatusBadge = ({ product, selectedVariant, className = '' }) => {
  const stockInfo = getStockStatus(product, selectedVariant);
  
  if (!stockInfo) return null;
  
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${stockInfo.badge} ${className}`}>
      {stockInfo.urgency === 'critical' && (
        <span className="w-2 h-2 bg-red-300 rounded-full mr-1 animate-ping"></span>
      )}
      {stockInfo.message}
    </span>
  );
};

/**
 * Component hiển thị thông tin stock chi tiết
 */
export const StockInfo = ({ product, selectedVariant, showAdminInfo = false }) => {
  const stockInfo = getStockStatus(product, selectedVariant);
  
  if (!stockInfo) return null;
  
  const renderStockMessage = () => {
    switch (stockInfo.status) {
      case STOCK_STATUS.OUT_OF_STOCK:
        return (
          <div className="text-red-600">
            <p className="font-semibold">❌ Hết hàng</p>
            <p className="text-sm">Sản phẩm tạm thời không có sẵn</p>
          </div>
        );
        
      case STOCK_STATUS.LOW_STOCK:
        return (
          <div className={stockInfo.urgency === 'critical' ? 'text-red-600' : 'text-orange-600'}>
            <p className="font-semibold">
              {stockInfo.urgency === 'critical' ? '🔥' : '⚠️'} {stockInfo.message}
            </p>
            <p className="text-sm">
              {stockInfo.urgency === 'critical' 
                ? 'Đặt hàng ngay để không bỏ lỡ!'
                : 'Số lượng có giới hạn'
              }
            </p>
          </div>
        );
        
      case STOCK_STATUS.IN_STOCK:
        return (
          <div className="text-green-600">
            <p className="font-semibold">✅ Còn hàng</p>
            <p className="text-sm">
              {/* Hiển thị số lượng thông minh */}
              {stockInfo.variantStock > 50 
                ? 'Sẵn sàng giao hàng' 
                : stockInfo.variantStock > 20
                ? 'Còn nhiều sản phẩm'
                : `Còn ${stockInfo.variantStock} sản phẩm`
              }
            </p>
          </div>
        );
        
      case STOCK_STATUS.DISCONTINUED:
        return (
          <div className="text-gray-600">
            <p className="font-semibold">⛔ Ngừng kinh doanh</p>
            <p className="text-sm">Sản phẩm không còn được bán</p>
          </div>
        );
        
      default:
        return null;
    }
  };
  
  return (
    <div className="my-4 p-3 bg-gray-50 rounded-lg">
      {renderStockMessage()}
      
      {/* Chỉ hiển thị thống kê stock chi tiết cho admin */}
      {showAdminInfo && (
        <div className="mt-2 text-xs text-gray-500 border-t pt-2">
          <p>📊 Admin Info:</p>
          <p>Total Stock: {stockInfo.totalStock}</p>
          {selectedVariant && <p>Variant Stock: {stockInfo.variantStock}</p>}
        </div>
      )}
    </div>
  );
};