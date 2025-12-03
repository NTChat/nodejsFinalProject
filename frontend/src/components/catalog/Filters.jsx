// frontend/src/components/catalog/Filters.jsx
import { useEffect, useState } from "react";
import { ChevronDown, ChevronUp, X } from "lucide-react";

const RatingStar = ({ active }) => (
  <svg viewBox="0 0 20 20" className={`w-5 h-5 ${active ? "fill-yellow-400" : "fill-gray-300"}`}>
    <path d="M10 15l-5.878 3.09L5.09 11.545.18 7.41l6.092-.887L10 1l2.728 5.523 6.092.887-4.909 4.136 1.969 6.545z" />
  </svg>
);

export default function Filters({
  brands = [],
  categories = [],
  initial = { brand: [], minPrice: "", maxPrice: "", categoryId: "", minRating: 0, inStock: false, isNew: false, bestSeller: false },
  onApply,
  onReset,
}) {
  const [brand, setBrand] = useState(initial.brand || []);
  const [minPrice, setMinPrice] = useState(initial.minPrice || "");
  const [maxPrice, setMaxPrice] = useState(initial.maxPrice || "");
  const [categoryId, setCategoryId] = useState(initial.categoryId || "");
  const [minRating, setMinRating] = useState(initial.minRating || 0);
  const [inStock, setInStock] = useState(initial.inStock || false);
  const [isNew, setIsNew] = useState(initial.isNew || false);
  const [bestSeller, setBestSeller] = useState(initial.bestSeller || false);
  
  const [showFilters, setShowFilters] = useState(true);

  useEffect(() => {
    setBrand(initial.brand || []);
    setMinPrice(initial.minPrice || "");
    setMaxPrice(initial.maxPrice || "");
    setCategoryId(initial.categoryId || "");
    setMinRating(initial.minRating || 0);
    setInStock(!!initial.inStock);
    setIsNew(!!initial.isNew);
    setBestSeller(!!initial.bestSeller);
  }, [initial]);

  const toggleBrand = (b) => {
    setBrand((prev) => prev.includes(b) ? prev.filter(x => x !== b) : [...prev, b]);
  };

  const apply = () => {
    onApply?.({
      brand,
      minPrice: minPrice === "" ? "" : Number(minPrice),
      maxPrice: maxPrice === "" ? "" : Number(maxPrice),
      categoryId,
      minRating: Number(minRating) || 0,
      inStock,
      isNew,
      bestSeller
    });
  };

  const reset = () => {
    setBrand([]);
    setMinPrice("");
    setMaxPrice("");
    setCategoryId("");
    setMinRating(0);
    setInStock(false);
    setIsNew(false);
    setBestSeller(false);
    onReset?.();
  };

  const activeFiltersCount = [
    brand.length > 0,
    minPrice !== "" || maxPrice !== "",
    categoryId !== "",
    minRating > 0,
    inStock,
    isNew,
    bestSeller
  ].filter(Boolean).length;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6 overflow-hidden">
      {/* Header */}
      <div 
        className="flex items-center justify-between p-4 cursor-pointer bg-gradient-to-r from-blue-50 to-purple-50 border-b border-gray-200"
        onClick={() => setShowFilters(!showFilters)}
      >
        <div className="flex items-center gap-3">
          <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          <h2 className="text-lg font-bold text-gray-800">Bộ lọc tìm kiếm</h2>
          {activeFiltersCount > 0 && (
            <span className="px-2 py-1 text-xs font-semibold bg-blue-600 text-white rounded-full">
              {activeFiltersCount}
            </span>
          )}
        </div>
        {showFilters ? <ChevronUp className="w-5 h-5 text-gray-600" /> : <ChevronDown className="w-5 h-5 text-gray-600" />}
      </div>

      {/* Filters Content */}
      {showFilters && (
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6">
            {/* BRAND */}
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
                Thương hiệu
              </label>
              <div className="flex flex-wrap gap-2 mt-2">
                {brands.length > 0 ? brands.map((b) => (
                  <button
                    key={b}
                    onClick={() => toggleBrand(b)}
                    className={`px-3 py-1.5 rounded-lg border-2 text-sm font-medium transition-all duration-200 ${
                      brand.includes(b) 
                        ? "bg-blue-600 text-white border-blue-600 shadow-md scale-105" 
                        : "bg-white text-gray-700 border-gray-300 hover:border-blue-400 hover:text-blue-600"
                    }`}
                  >
                    {b}
                  </button>
                )) : (
                  <div className="text-gray-400 text-sm italic">Không có dữ liệu</div>
                )}
              </div>
            </div>

            {/* PRICE */}
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Khoảng giá (₫)
              </label>
              <div className="flex items-center gap-3 mt-2">
                <input 
                  type="number" 
                  min={0} 
                  value={minPrice} 
                  onChange={(e) => setMinPrice(e.target.value)} 
                  placeholder="Từ"
                  className="w-full border-2 border-gray-300 rounded-lg px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                />
                <span className="text-gray-400 font-bold">—</span>
                <input 
                  type="number" 
                  min={0} 
                  value={maxPrice} 
                  onChange={(e) => setMaxPrice(e.target.value)} 
                  placeholder="Đến"
                  className="w-full border-2 border-gray-300 rounded-lg px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                />
              </div>
            </div>

            {/* CATEGORY */}
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
                Danh mục
              </label>
              <select 
                value={categoryId} 
                onChange={(e) => setCategoryId(e.target.value)} 
                className="w-full border-2 border-gray-300 rounded-lg px-3 py-2 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all mt-2"
              >
                <option value="">Tất cả danh mục</option>
                {categories.length > 0 ? categories.map((c) => (
                  <option key={c.categoryId || c.id} value={c.categoryId || c.id}>
                    {c.categoryName || c.name || c.categoryId || c.id}
                  </option>
                )) : (
                  <option disabled>Không có dữ liệu</option>
                )}
              </select>
            </div>

            {/* RATING */}
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <svg className="w-4 h-4 fill-yellow-400" viewBox="0 0 20 20">
                  <path d="M10 15l-5.878 3.09L5.09 11.545.18 7.41l6.092-.887L10 1l2.728 5.523 6.092.887-4.909 4.136 1.969 6.545z" />
                </svg>
                Đánh giá tối thiểu
              </label>
              <div className="grid grid-cols-3 gap-2 mt-2">
                {[0,1,2,3,4,5].map((r) => (
                  <button 
                    key={r}
                    onClick={() => setMinRating(r)}
                    className={`px-2 py-2 rounded-lg border-2 transition-all duration-200 ${
                      minRating===r 
                        ? "bg-yellow-50 border-yellow-400 shadow-md" 
                        : "bg-white border-gray-300 hover:border-yellow-300"
                    }`}
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span className="text-sm font-bold">{r}</span>
                      <RatingStar active={true} />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Additional Filters */}
          <div className="flex flex-wrap items-center gap-4 mt-6 pt-6 border-t border-gray-200">
            <label className="inline-flex items-center gap-2 cursor-pointer group">
              <input 
                type="checkbox" 
                checked={inStock} 
                onChange={(e)=>setInStock(e.target.checked)} 
                className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700 group-hover:text-blue-600">Còn hàng</span>
            </label>
            <label className="inline-flex items-center gap-2 cursor-pointer group">
              <input 
                type="checkbox" 
                checked={isNew} 
                onChange={(e)=>setIsNew(e.target.checked)} 
                className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700 group-hover:text-blue-600">Hàng mới</span>
            </label>
            <label className="inline-flex items-center gap-2 cursor-pointer group">
              <input 
                type="checkbox" 
                checked={bestSeller} 
                onChange={(e)=>setBestSeller(e.target.checked)} 
                className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700 group-hover:text-blue-600">Bán chạy</span>
            </label>

            <div className="ml-auto flex items-center gap-3">
              <button 
                onClick={reset} 
                className="px-5 py-2.5 rounded-lg border-2 border-gray-300 bg-white text-gray-700 font-medium hover:bg-gray-50 hover:border-gray-400 transition-all flex items-center gap-2"
              >
                <X className="w-4 h-4" />
                Xóa lọc
              </button>
              <button 
                onClick={apply} 
                className="px-6 py-2.5 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Áp dụng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
