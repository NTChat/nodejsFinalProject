import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import Filters from "../components/catalog/Filters";
import SortBar from "../components/catalog/SortBar";
import { ProductController } from '../controllers/productController';
import { currency } from "../utils/format";
import { getStockStatus, StockStatusBadge, STOCK_STATUS } from '../utils/stockStatus';

function ProductCard({ p }) {
  const name = p.name || p.productName || "(Không tên)";
  const price = p.lowestPrice ?? p.minPrice ?? p.price ?? 0;
  const img = (Array.isArray(p.images) && p.images[0]) || "/img/default.png";
  const detailId = p.productId || p._id || "";
  
  // Calculate stock status
  const totalStock = (() => {
    if (typeof p.totalStock === "number") return p.totalStock;
    if (Array.isArray(p.variants) && p.variants.length > 0) {
      return p.variants.reduce((sum, v) => sum + (Number(v.stock) || 0), 0);
    }
    if (p.stock != null) return Number(p.stock) || 0;
    return 0;
  })();
  
  const stockStatus = getStockStatus(totalStock);
  const isOutOfStock = stockStatus === STOCK_STATUS.OUT_OF_STOCK || stockStatus === STOCK_STATUS.DISCONTINUED;
  
  return (
    <Link 
      to={`/products/${detailId}`} 
      className={`group bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 ${isOutOfStock ? 'opacity-75' : ''}`}
    >
      <div className="relative overflow-hidden bg-gray-50">
        <img 
          src={img} 
          alt={name} 
          className={`w-full aspect-square object-cover group-hover:scale-110 transition-transform duration-300 ${isOutOfStock ? 'grayscale' : ''}`} 
          onError={(e) => {
            console.log('❌ Search result image failed to load:', img);
            e.target.src = '/img/default.png';
          }}
        />
        <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-10 transition-opacity" />
        {/* Stock Status Badge */}
        {stockStatus !== STOCK_STATUS.IN_STOCK && (
          <div className="absolute top-2 right-2">
            <StockStatusBadge status={stockStatus} />
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-gray-800 line-clamp-2 mb-2 group-hover:text-blue-600 transition-colors">
          {name}
        </h3>
        <div className="flex items-center justify-between">
          <span className={`text-lg font-bold ${isOutOfStock ? 'text-gray-500' : 'text-blue-600'}`}>
            {currency(price)}
          </span>
          <span className="text-sm text-gray-500 group-hover:text-blue-600 transition-colors">
            Xem chi tiết →
          </span>
        </div>
      </div>
    </Link>
  );
}

export default function ProductsSearch() {
  const [sp] = useSearchParams();
  const keyword = sp.get("query") || sp.get("q") || "";

  const [products, setProducts] = useState([]);
  const [total, setTotal]       = useState(0);
  const [loading, setLoading]   = useState(false);

  const [brands, setBrands]         = useState([]);
  const [categories, setCategories] = useState([]);

  const [filters, setFilters] = useState({
    brand: [], minPrice: "", maxPrice: "", categoryId: "", minRating: 0, inStock: false, isNew: false, bestSeller: false
  });
  const [sort, setSort] = useState("newest");

  const [page, setPage] = useState(1);
  const limit = 12;

  useEffect(() => {
    (async () => {
      try {
        console.log('🔄 Fetching brands and categories...');
        const brandsData = await ProductController.getBrands();
        const categoriesData = await ProductController.getCategories();
        console.log('🏷️ Brands loaded:', brandsData, 'Length:', brandsData?.length);
        console.log('📂 Categories loaded:', categoriesData, 'Length:', categoriesData?.length);
        setBrands(brandsData || []);
        setCategories(categoriesData || []);
        console.log('✅ State updated - Brands:', brandsData?.length, 'Categories:', categoriesData?.length);
      } catch (e) {
        console.error("❌ Load facets failed:", e);
      }
    })();
  }, []);

  useEffect(() => { setPage(1); }, [keyword]);

  async function load() {
    setLoading(true);
    try {
      const params = {
        page, 
        limit, 
        sort,
        search: keyword || undefined,
        category: filters.categoryId || undefined,
        brand: (filters.brand || []).join(",") || undefined,
        minPrice: filters.minPrice || undefined,
        maxPrice: filters.maxPrice || undefined,
        ratingMin: filters.minRating || undefined,
      };
      const j = await ProductController.getProducts(params);
      const items = j?.products || j?.data || j?.items || [];
      setProducts(items);
      setTotal(j?.pagination?.totalProducts || j?.total || items.length);
    } catch (error) {
      console.error("Load products failed:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, sort, keyword, JSON.stringify(filters)]);

  const totalPages = Math.max(Math.ceil(total / limit), 1);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto p-4 md:p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            {keyword ? (
              <>
                Kết quả tìm kiếm cho <span className="text-blue-600">"{keyword}"</span>
              </>
            ) : (
              "Tất cả sản phẩm"
            )}
          </h1>
          <p className="text-gray-600">
            {total > 0 ? `Tìm thấy ${total} sản phẩm` : "Không có sản phẩm nào"}
          </p>
        </div>

        {/* Filters */}
        <Filters
          brands={brands}
          categories={categories}
          initial={filters}
          onApply={(f)=>{ setPage(1); setFilters(f); }}
          onReset={()=>{ setPage(1); setFilters({ brand: [], minPrice: "", maxPrice: "", categoryId: "", minRating: 0, inStock:false, isNew:false, bestSeller:false }); }}
        />

        {/* Sort Bar */}
        <SortBar value={sort} onChange={(v)=>{ setPage(1); setSort(v); }} />

        {/* Products Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20">
            <svg className="mx-auto h-24 w-24 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">Không tìm thấy sản phẩm</h3>
            {keyword && (
              <p className="text-gray-500 mb-2">
                Không tìm thấy kết quả cho "<span className="font-semibold text-gray-700">{keyword}</span>"
              </p>
            )}
            <p className="text-gray-500 mb-6">Gợi ý: Kiểm tra chính tả hoặc thử từ khóa khác</p>
            <div className="space-y-3">
              <div className="flex flex-wrap justify-center gap-2 mb-4">
                <span className="text-sm text-gray-500">Thử tìm:</span>
                {['Laptop', 'MacBook', 'ASUS', 'Dell', 'Gaming'].map(term => (
                  <Link 
                    key={term}
                    to={`/products/search?query=${term}`}
                    className="px-3 py-1 bg-gray-100 hover:bg-blue-100 text-gray-700 hover:text-blue-600 rounded-full text-sm transition-colors"
                  >
                    {term}
                  </Link>
                ))}
              </div>
              <button 
                onClick={() => {
                  setPage(1);
                  setFilters({ brand: [], minPrice: "", maxPrice: "", categoryId: "", minRating: 0, inStock:false, isNew:false, bestSeller:false });
                }}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Xóa tất cả bộ lọc
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
              {products.map((p) => (
                <ProductCard key={p._id || p.productId || p.code} p={p} />
              ))}
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-center gap-2 mt-10">
              <button 
                className="px-4 py-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-medium"
                onClick={()=>setPage(p=>Math.max(1, p-1))} 
                disabled={page<=1}
              >
                ← Trước
              </button>
              
              <div className="flex items-center gap-2">
                {[...Array(Math.min(totalPages, 5))].map((_, idx) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = idx + 1;
                  } else if (page <= 3) {
                    pageNum = idx + 1;
                  } else if (page >= totalPages - 2) {
                    pageNum = totalPages - 4 + idx;
                  } else {
                    pageNum = page - 2 + idx;
                  }
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      className={`w-10 h-10 rounded-lg font-medium transition-colors ${
                        page === pageNum
                          ? 'bg-blue-600 text-white'
                          : 'bg-white border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              <button 
                className="px-4 py-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-medium"
                onClick={()=>setPage(p=>Math.min(totalPages, p+1))} 
                disabled={page>=totalPages}
              >
                Sau →
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
