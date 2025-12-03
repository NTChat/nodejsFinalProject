// frontend/src/components/catalog/SortBar.jsx
export default function SortBar({ value = "newest", onChange }) {
  // value nhận: name_asc | name_desc | price_asc | price_desc | newest | oldest
  return (
    <div className="bg-white p-3 rounded-lg shadow flex items-center gap-2 mb-4">
      <span className="text-sm text-gray-600">Sắp xếp:</span>
      <select
        value={value}
        onChange={(e)=>onChange?.(e.target.value)}
        className="border rounded px-3 py-2 bg-white"
      >
        <option value="newest">Mới nhất</option>
        <option value="oldest">Cũ nhất</option>
        <option value="name_asc">Tên (A–Z)</option>
        <option value="name_desc">Tên (Z–A)</option>
        <option value="price_asc">Giá tăng dần</option>
        <option value="price_desc">Giá giảm dần</option>
      </select>
    </div>
  );
}
