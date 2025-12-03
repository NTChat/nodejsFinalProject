// src/pages/ProductsPage.jsx
import { useEffect, useMemo, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { LayoutGrid, List as ListIcon, Home, ChevronRight } from "lucide-react"; 

import SidebarFilter from "../components/products/filters/SidebarFilter";
import ProductCard from "../components/Home/ProductCard";
import Pagination from "../components/common/Pagination";
import { ProductController } from '../controllers/productController';
import api from '../services/api';

function isAbort(err) {
  return err?.name === "AbortError" || /abort/i.test(String(err?.message));
}

export default function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  // --- STATE ---
  const [brands, setBrands] = useState([]);
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, pages: 1 });
  
  // Mặc định grid view
  const [viewMode, setViewMode] = useState('grid'); 
  const [loading, setLoading] = useState(false);

  // --- FILTER STATE ---
  const [filter, setFilter] = useState({
    keyword: searchParams.get("search") || "", // Đọc từ khóa tìm kiếm từ URL
    brand: (searchParams.get("brand") || "").split(",").filter(Boolean),
    minPrice: searchParams.get("minPrice") ? Number(searchParams.get("minPrice")) : undefined,
    maxPrice: searchParams.get("maxPrice") ? Number(searchParams.get("maxPrice")) : undefined,
    categoryId: (searchParams.get("categoryId") || "").split(",").filter(Boolean),
    ratingMin: searchParams.get("ratingMin") ? Number(searchParams.get("ratingMin")) : undefined,
    sortBy: searchParams.get("sortBy") || "newest",
    sortOrder: searchParams.get("sortOrder") || "desc",
    page: Number(searchParams.get("page") || 1),
    limit: Number(searchParams.get("limit") || 12),
  });

  // Sync URL search params to filter state (khi navigate từ Header search)
  useEffect(() => {
    const urlKeyword = searchParams.get("search") || "";
    if (urlKeyword !== filter.keyword) {
      setFilter(prev => ({ ...prev, keyword: urlKeyword, page: 1 }));
    }
    // eslint-disable-next-line
  }, [searchParams]);

  // 1. Load Facets
  useEffect(() => {
    const ctrl = new AbortController();
    (async () => {
      try {
        const { CategoryController } = await import('../controllers/categoryController');
        const [brandsRes, categoriesList] = await Promise.all([
          api.get('/products/brands', { signal: ctrl.signal }),
          CategoryController.getAll()
        ]);
        setBrands(brandsRes?.data?.brands || []);
        setCategories(categoriesList || []);
      } catch (e) {
        if (!isAbort(e)) console.error("Load facets failed:", e);
      }
    })();
    return () => ctrl.abort();
    // eslint-disable-next-line
  }, []);

  // 2. Memo query params
  const queryParams = useMemo(() => {
    const qp = new URLSearchParams();
    if (filter.keyword) qp.set("search", filter.keyword); // Thêm từ khóa tìm kiếm
    if (filter.brand?.length) qp.set("brand", filter.brand.join(","));
    if (filter.categoryId?.length) qp.set("categoryId", filter.categoryId.join(","));
    if (filter.minPrice != null) qp.set("minPrice", filter.minPrice);
    if (filter.maxPrice != null) qp.set("maxPrice", filter.maxPrice);
    if (filter.ratingMin != null) qp.set("ratingMin", filter.ratingMin);
    qp.set("sortBy", filter.sortBy);
    qp.set("sortOrder", filter.sortOrder);
    qp.set("page", String(filter.page));
    qp.set("limit", String(filter.limit));
    return qp;
  }, [filter]);

  // 3. Fetch products
  useEffect(() => {
    setSearchParams(queryParams, { replace: true });
    
    const ctrl = new AbortController();
    (async () => {
      setLoading(true);
      try {
        const res = await ProductController.getProducts(Object.fromEntries(queryParams));
        setItems(res?.products || []);
        setMeta({
          total: res?.total || 0,
          page: res?.currentPage || 1,
          pages: res?.totalPages || 1,
        });
      } catch (e) {
        if (!isAbort(e)) console.error("Load products failed:", e);
      } finally {
        setLoading(false);
      }
      // eslint-disable-next-line
    })();
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
    return () => ctrl.abort();
  }, [queryParams, setSearchParams]);

  const handlePageChange = (newPage) => setFilter((prev) => ({ ...prev, page: newPage }));

  const handleSortChange = (e) => {
    const value = e.target.value;
    let sortBy = 'newest', sortOrder = 'desc';
    if (value === 'price_asc') { sortBy = 'price'; sortOrder = 'asc'; }
    else if (value === 'price_desc') { sortBy = 'price'; sortOrder = 'desc'; }
    else if (value === 'name_asc') { sortBy = 'name'; sortOrder = 'asc'; }
    else if (value === 'name_desc') { sortBy = 'name'; sortOrder = 'desc'; }
    setFilter(prev => ({ ...prev, sortBy, sortOrder, page: 1 }));
  };

  return (
    <div className="bg-[#f4f6f8] min-h-screen font-sans pb-12">
      
      {/* --- BREADCRUMB (Thanh điều hướng) --- */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4 py-3">
            <div className="flex items-center gap-2 text-sm text-gray-500">
                <Link to="/" className="hover:text-blue-600 flex items-center gap-1 transition-colors">
                    <Home size={14} /> Trang chủ
                </Link>
                <ChevronRight size={14} />
                <span className="text-gray-900 font-medium">Tất cả sản phẩm</span>
            </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-[270px_1fr] gap-6">
            
            {/* SIDEBAR */}
            <div className="hidden lg:block">
                <SidebarFilter
                    brands={brands}
                    categories={categories}
                    value={filter}
                    onChange={(v) => setFilter((s) => ({ ...s, ...v, page: 1 }))}
                />
            </div>

            {/* MAIN CONTENT */}
            <main>
                {/* TOOLBAR (Thanh công cụ) */}
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div>
                        <h1 className="text-lg font-bold text-gray-800">
                            {filter.keyword ? (
                                <>Kết quả tìm kiếm cho: <span className="text-blue-600">"{filter.keyword}"</span></>
                            ) : (
                                <>Sản phẩm</>
                            )}
                            <span className="text-sm font-normal text-gray-500 ml-2">({meta.total} kết quả)</span>
                        </h1>
                        {filter.keyword && (
                            <button 
                                onClick={() => setFilter(s => ({...s, keyword: "", page: 1}))}
                                className="text-sm text-blue-600 hover:underline mt-1"
                            >
                                ← Xem tất cả sản phẩm
                            </button>
                        )}
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-medium">Sắp xếp:</span>
                            <select
                                value={`${filter.sortBy}_${filter.sortOrder}` === 'price_asc' ? 'price_asc' 
                                        : `${filter.sortBy}_${filter.sortOrder}` === 'price_desc' ? 'price_desc'
                                        : `${filter.sortBy}_${filter.sortOrder}` === 'name_asc' ? 'name_asc'
                                        : `${filter.sortBy}_${filter.sortOrder}` === 'name_desc' ? 'name_desc'
                                        : 'newest'}
                                onChange={handleSortChange}
                                className="appearance-none pl-16 pr-8 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:outline-none focus:border-blue-500 focus:bg-white transition-all cursor-pointer font-medium text-gray-700 hover:border-gray-300"
                            >
                                <option value="newest">Mới nhất</option>
                                <option value="price_asc">Giá thấp - cao</option>
                                <option value="price_desc">Giá cao - thấp</option>
                                <option value="name_asc">Tên A-Z</option>
                                <option value="name_desc">Tên Z-A</option>
                            </select>
                            <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={14}/>
                        </div>

                        {/* View Toggle */}
                        <div className="flex bg-gray-100 rounded-lg p-1 border border-gray-200">
                            <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}>
                                <LayoutGrid size={18} />
                            </button>
                            <button onClick={() => setViewMode('list')} className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}>
                                <ListIcon size={18} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* PRODUCT GRID */}
                {loading ? (
                    <div className={`grid gap-4 ${viewMode === 'grid' ? 'grid-cols-2 md:grid-cols-3 xl:grid-cols-4' : 'grid-cols-1'}`}>
                        {[...Array(8)].map((_, i) => (
                            <div key={i} className="bg-white h-[340px] rounded-xl shadow-sm border border-gray-100 animate-pulse"></div>
                        ))}
                    </div>
                ) : items.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 bg-white rounded-xl border border-dashed border-gray-300 shadow-sm">
                        <img src="/img/empty-box.png" onError={(e) => e.target.style.display='none'} className="w-32 opacity-50 mb-4" alt="Empty"/>
                        {filter.keyword ? (
                            <>
                                <p className="text-gray-700 text-lg font-medium">
                                    Không tìm thấy sản phẩm nào với từ khóa "{filter.keyword}"
                                </p>
                                <p className="text-gray-500 text-sm mt-2">Gợi ý:</p>
                                <ul className="text-gray-500 text-sm list-disc list-inside mt-1">
                                    <li>Kiểm tra chính tả của từ khóa</li>
                                    <li>Thử dùng từ khóa ngắn hơn hoặc tổng quát hơn</li>
                                    <li>Thử tìm kiếm theo tên thương hiệu hoặc loại sản phẩm</li>
                                </ul>
                                <div className="flex gap-4 mt-6">
                                    <button 
                                        onClick={() => setFilter(s => ({...s, keyword: "", page: 1}))}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                                    >
                                        Xem tất cả sản phẩm
                                    </button>
                                </div>
                            </>
                        ) : (
                            <>
                                <p className="text-gray-500 text-lg font-medium">Không tìm thấy sản phẩm nào.</p>
                                <button onClick={() => setFilter(s => ({...s, brand: [], categoryId: [], minPrice: undefined, maxPrice: undefined}))} className="mt-4 text-blue-600 font-medium hover:underline">
                                    Xóa bộ lọc để thử lại
                                </button>
                            </>
                        )}
                    </div>
                ) : (
                    <div className={
                        viewMode === 'grid'
                        ? "grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4"
                        : "flex flex-col gap-4"
                    }>
                        {items.map((p) => (
                            <div key={p._id || p.productId} className={viewMode === 'list' ? "w-full" : ""}>
                                <ProductCard product={p} viewMode={viewMode} />
                            </div>
                        ))}
                    </div>
                )}

                {/* PAGINATION */}
                {!loading && items.length > 0 && (
                    <div className="mt-10 flex justify-center">
                        <div className="bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-100">
                            <Pagination
                                currentPage={meta.page}
                                totalPages={meta.pages}
                                onPageChange={handlePageChange}
                            />
                        </div>
                    </div>
                )}
            </main>
        </div>
      </div>
    </div>
  );
}

// Icon mũi tên nhỏ cho select box
const ChevronDownIcon = ({ className, size }) => (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
)