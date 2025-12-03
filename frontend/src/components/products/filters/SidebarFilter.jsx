// src/components/products/filters/SidebarFilter.jsx
import { useMemo, useState } from "react";
import { Filter, ChevronDown, ChevronUp, Star, RotateCcw, Check } from "lucide-react";
import PriceRange from "./PriceRange";

export default function SidebarFilter({
  brands = [],
  categories = [],
  value,
  onChange,
  priceMin = 0,
  priceMax = 100_000_000,
}) {
  const [showAllBrands, setShowAllBrands] = useState(false);
  const topBrands = useMemo(() => brands.slice(0, 6), [brands]);
  const moreBrands = useMemo(() => brands.slice(6), [brands]);

  function toggleBrand(b) {
    const s = new Set(value.brand || []);
    s.has(b) ? s.delete(b) : s.add(b);
    onChange({ ...value, brand: Array.from(s) });
  }

  function toggleCategory(id) {
    const s = new Set(value.categoryId || []);
    s.has(id) ? s.delete(id) : s.add(id);
    onChange({ ...value, categoryId: Array.from(s) });
  }

  function setRating(r) {
    // Nếu bấm lại vào rating đang chọn thì bỏ chọn
    onChange({ ...value, ratingMin: value.ratingMin === r ? undefined : r });
  }

  const clearAll = () => {
    onChange({ brand: [], categoryId: [], minPrice: undefined, maxPrice: undefined, ratingMin: undefined });
  };

  return (
    <aside className="w-full bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-lg border border-gray-200 overflow-hidden lg:sticky lg:top-24 h-fit">
      
      {/* HEADER: Tiêu đề + Nút xóa với gradient */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-white flex items-center gap-2 text-base">
            <Filter size={20} className="drop-shadow" /> Bộ Lọc Tìm Kiếm
          </h3>
          <button 
              onClick={clearAll} 
              className="text-xs bg-white/20 hover:bg-white/30 text-white font-medium flex items-center gap-1 px-3 py-1.5 rounded-full transition-all backdrop-blur-sm"
          >
              <RotateCcw size={12} /> Đặt lại
          </button>
        </div>
      </div>

      <div className="p-5 space-y-6">

      {/* 1. KHOẢNG GIÁ */}
      <section className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <h4 className="font-bold text-sm text-gray-800 mb-4 flex items-center gap-2">
          <span className="w-1 h-4 bg-blue-600 rounded-full"></span>
          Khoảng giá
        </h4>
        <PriceRange
          min={priceMin}
          max={priceMax}
          valueMin={value.minPrice ?? priceMin}
          valueMax={value.maxPrice ?? priceMax}
          onChange={({ min, max }) =>
            onChange({ ...value, minPrice: min, maxPrice: max })
          }
        />
      </section>

      {/* 2. DANH MỤC (Custom Checkbox) */}
      <section className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <h4 className="font-bold text-sm text-gray-800 mb-4 flex items-center gap-2">
          <span className="w-1 h-4 bg-green-600 rounded-full"></span>
          Danh mục sản phẩm
        </h4>
        <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar pr-1">
          {categories.map((c) => {
            const isChecked = (value.categoryId || []).includes(c.categoryId || c.id);
            return (
                <label key={c.categoryId || c.id} className="flex items-center gap-3 cursor-pointer group p-2 hover:bg-blue-50 rounded-lg transition-all">
                {/* Custom Checkbox UI with animation */}
                <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all duration-200 ${isChecked ? 'bg-gradient-to-br from-blue-600 to-blue-700 border-blue-600 scale-110' : 'border-gray-300 bg-white group-hover:border-blue-400 group-hover:shadow-sm'}`}>
                    {isChecked && <Check size={14} className="text-white" strokeWidth={3} />}
                </div>
                
                <input
                    type="checkbox"
                    className="hidden"
                    checked={isChecked}
                    onChange={() => toggleCategory(c.categoryId || c.id)}
                />
                <span className={`text-sm transition-colors ${isChecked ? 'text-blue-700 font-semibold' : 'text-gray-600 group-hover:text-blue-600'}`}>
                    {c.categoryName || c.name}
                </span>
                </label>
            );
          })}
        </div>
      </section>

      {/* 3. THƯƠNG HIỆU */}
      <section className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <h4 className="font-bold text-sm text-gray-800 mb-4 flex items-center gap-2">
          <span className="w-1 h-4 bg-purple-600 rounded-full"></span>
          Thương hiệu
        </h4>
        <div className="space-y-2">
          {(showAllBrands ? brands : topBrands).map((b) => {
            const isChecked = (value.brand || []).includes(b);
            return (
                <label key={b} className="flex items-center gap-3 cursor-pointer group p-2 hover:bg-purple-50 rounded-lg transition-all">
                <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all duration-200 ${isChecked ? 'bg-gradient-to-br from-purple-600 to-purple-700 border-purple-600 scale-110' : 'border-gray-300 bg-white group-hover:border-purple-400 group-hover:shadow-sm'}`}>
                    {isChecked && <Check size={14} className="text-white" strokeWidth={3} />}
                </div>
                <input
                    type="checkbox"
                    className="hidden"
                    checked={isChecked}
                    onChange={() => toggleBrand(b)}
                />
                <span className={`text-sm transition-colors ${isChecked ? 'text-purple-700 font-semibold' : 'text-gray-600 group-hover:text-purple-600'}`}>
                    {b}
                </span>
                </label>
            );
          })}
          
          {moreBrands.length > 0 && (
            <button
              className="text-purple-600 text-sm font-medium flex items-center gap-1 hover:bg-purple-50 px-3 py-1.5 rounded-lg transition-all ml-1 mt-2"
              onClick={() => setShowAllBrands((s) => !s)}
            >
              {showAllBrands ? <>Thu gọn <ChevronUp size={14}/></> : <>Xem thêm {moreBrands.length} hãng <ChevronDown size={14}/></>}
            </button>
          )}
        </div>
      </section>

      {/* 4. ĐÁNH GIÁ (Compact Style) */}
      <section className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <h4 className="font-bold text-sm text-gray-800 mb-4 flex items-center gap-2">
          <span className="w-1 h-4 bg-yellow-500 rounded-full"></span>
          Đánh giá
        </h4>
        <div className="flex flex-col gap-1.5">
          {[5, 4, 3, 2, 1].map((n) => (
            <button
              key={n}
              onClick={() => setRating(n)}
              className={`flex items-center justify-between px-3 py-2 rounded-lg border text-sm transition-all ${
                value.ratingMin === n
                  ? "border-yellow-400 bg-gradient-to-r from-yellow-50 to-orange-50 text-yellow-800 shadow-sm"
                  : "border-transparent text-gray-600 hover:bg-yellow-50 hover:border-yellow-200"
              }`}
            >
              <div className="flex items-center gap-2">
                <div className="flex text-yellow-400">
                  {[...Array(5)].map((_, i) => (
                      <Star key={i} size={14} fill={i < n ? "currentColor" : "none"} className={`${i >= n ? "text-gray-300" : ""}`} strokeWidth={2} />
                  ))}
                </div>
                <span className={`text-xs ${value.ratingMin === n ? "font-semibold" : ""}`}>trở lên</span>
              </div>
              {value.ratingMin === n && (
                <Check size={16} className="text-yellow-600" strokeWidth={3} />
              )}
            </button>
          ))}
        </div>
      </section>
      
      </div>
    </aside>
  );
}