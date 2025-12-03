// src/components/Dashboard/ProductManagement.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ProductController } from '../../controllers/productController';
import { toast } from "react-toastify";
import api, { getImageUrl } from '../../services/api';
import { getStockStatus, StockStatusBadge, STOCK_STATUS } from '../../utils/stockStatus';

const fmtVND = (n) =>
  (Number.isFinite(Number(n)) ? Number(n) : 0).toLocaleString("vi-VN") + " đ";

export default function ProductManagement() {
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const ctrl = new AbortController();
    setLoading(true);

    ProductController.getProducts({ page, limit, search, sort, admin: true }, ctrl.signal)
      .then((resData) => {
        // hỗ trợ nhiều kiểu shape trả về từ BE
        const raw =
          resData?.products ||
          resData?.items ||
          resData?.data ||
          resData ||
          [];

        const arr = Array.isArray(raw) ? raw : [];

        const mapped = arr.map((p) => {
          // 1. Tính tổng tồn kho để xác định trạng thái Hết hàng
          // SỬA: Ưu tiên lấy totalStock từ API nếu có, nếu không mới tính từ variants
          let calculatedStock = 0;

          if (p.totalStock !== undefined && p.totalStock !== null) {
            // Trường hợp 1: API danh sách đã tính sẵn totalStock
            calculatedStock = Number(p.totalStock);
          } else if (Array.isArray(p.variants) && p.variants.length > 0) {
            // Trường hợp 2: Có variants (thường là trang chi tiết), tự cộng dồn
            calculatedStock = p.variants.reduce((sum, v) => sum + (Number(v.stock) || 0), 0);
          } else {
            // Trường hợp 3: Fallback các trường khác
            calculatedStock = Number(p.stock) || Number(p.quantity) || 0;
          }

          // Sử dụng stock status system mới
          const stockStatus = getStockStatus(calculatedStock);
          
          // DEBUG: Log image data
          const rawImage = (Array.isArray(p.images) && p.images[0]) || p.image;
          if (!rawImage) {
            console.warn(`⚠️ No image for ${p.productName}:`, { hasImages: Array.isArray(p.images), imagesLength: p.images?.length, p_image: p.image });
          }

          return {
            id: p.productId || p._id,
            name: p.productName || p.name || "(Không tên)",
            category: p.category?.categoryName || p.category?.name || "—",
            brand: p.brand || "—",
            lowestPrice: p.lowestPrice ?? p.minPrice ?? 0,
            image: getImageUrl(rawImage || "/img/no_image.png"),

            // Cập nhật giá trị cuối cùng vào đây
            totalStock: calculatedStock,
            stockStatus: stockStatus,
          };
        });
        setRows(mapped);
      })
      .catch((err) => {
        if (err?.aborted) return;
        console.error("LOAD PRODUCTS ERROR", err);
        toast.error(
          err?.message || "Không tải được danh sách sản phẩm (admin)"
        );
        setRows([]);
      })
      .finally(() => setLoading(false));

    return () => ctrl.abort();
  }, [page, limit, search, sort]);

  return (
    <div className="p-3 sm:p-4 md:p-6">
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <button
          onClick={() => navigate("/admin/management")}
          className="px-3 py-2 rounded bg-gray-300 text-gray-800 hover:bg-gray-400 transition flex items-center gap-2 text-sm"
          title="Quay lại Management Hub"
        >
          ← Quay lại
        </button>
        <h2 className="text-lg sm:text-xl font-semibold">Product Management</h2>
      </div>

      {/* Search & Filter - Stack on mobile */}
      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <input
          className="border rounded px-3 py-2 flex-1 text-sm"
          placeholder="Tìm theo tên/mã/brand…"
          value={search}
          onChange={(e) => {
            setPage(1);
            setSearch(e.target.value);
          }}
        />
        <div className="flex gap-2">
          <button
            className="px-3 sm:px-4 py-2 rounded bg-blue-600 text-white text-sm whitespace-nowrap flex-1 sm:flex-none"
            onClick={() => navigate("/admin/products/new")}
          >
            + Thêm sản phẩm
          </button>
          <select
            className="border rounded px-2 sm:px-3 py-2 text-sm bg-white"
            value={sort}
            onChange={(e) => {
              setPage(1);
              setSort(e.target.value);
            }}
          >
            <option value="newest">Mới nhất</option>
            <option value="oldest">Cũ nhất</option>
            <option value="price_asc">Giá tăng dần</option>
            <option value="price_desc">Giá giảm dần</option>
            <option value="name_asc">Tên A→Z</option>
            <option value="name_desc">Tên Z→A</option>
          </select>
        </div>
      </div>

      {/* Desktop Table - Hidden on mobile */}
      <div className="hidden md:block bg-white rounded-lg shadow overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-4 py-3 text-sm">Ảnh</th>
              <th className="text-left px-4 py-3 text-sm">Tên</th>
              <th className="text-left px-4 py-3 text-sm">Danh mục</th>
              <th className="text-left px-4 py-3 text-sm">Brand</th>
              <th className="text-left px-4 py-3 text-sm">Giá thấp nhất</th>
              <th className="px-4 py-3 text-center text-sm">Tồn kho</th>
              <th className="text-left px-4 py-3 text-sm">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td className="px-4 py-4 text-gray-500" colSpan={7}>
                  Đang tải…
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td className="px-4 py-4 text-gray-500" colSpan={7}>
                  Không có sản phẩm
                </td>
              </tr>
            ) : (
              rows.map((r) => {
                return (
                  <tr key={r.id} className={`border-t hover:bg-gray-50 ${r.stockStatus === STOCK_STATUS.OUT_OF_STOCK ? 'bg-red-50/30' : r.stockStatus === STOCK_STATUS.LOW_STOCK ? 'bg-orange-50/30' : ''}`}>
                    <td className="px-4 py-3">
                      <img src={r.image} alt={r.name} className="w-12 h-12 object-cover rounded" />
                    </td>
                    <td className="px-4 py-3 font-medium">{r.name}</td>
                    <td className="px-4 py-3 text-gray-600">{r.category}</td>
                    <td className="px-4 py-3">{r.brand}</td>
                    <td className="px-4 py-3">{fmtVND(r.lowestPrice)}</td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <StockStatusBadge status={r.stockStatus} />
                        <span className="text-xs text-gray-500">{r.totalStock} sản phẩm</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 space-x-2">
                      <button
                        className="px-3 py-1.5 rounded border hover:bg-gray-100"
                        onClick={() => navigate(`/admin/products/${encodeURIComponent(r.id)}/edit`)}
                      >
                        Sửa
                      </button>
                      <button
                        className="px-3 py-1.5 rounded border border-red-500 text-red-600 hover:bg-red-50"
                        onClick={async () => {
                          if (!window.confirm("Bạn có chắc muốn xóa sản phẩm này?")) return;
                          try {
                            await api.delete(`/products/${encodeURIComponent(r.id)}`);
                            toast.success("Xóa sản phẩm thành công");
                            setRows((prev) => prev.filter((x) => x.id !== r.id));
                          } catch (err) {
                            console.error("DELETE ERROR", err.response || err);
                            const msg = err.response?.data?.message || err.response?.statusText || err.message || "Xóa sản phẩm thất bại";
                            toast.error(msg);
                          }
                        }}
                      >
                        Xóa
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards - Show on mobile only */}
      <div className="md:hidden space-y-3">
        {loading ? (
          <div className="bg-white rounded-lg shadow p-4 text-gray-500 text-center">Đang tải…</div>
        ) : rows.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-4 text-gray-500 text-center">Không có sản phẩm</div>
        ) : (
          rows.map((r) => {
            return (
              <div key={r.id} className={`bg-white rounded-lg shadow p-3 ${r.stockStatus === STOCK_STATUS.OUT_OF_STOCK ? 'border-l-4 border-red-500' : r.stockStatus === STOCK_STATUS.LOW_STOCK ? 'border-l-4 border-orange-500' : ''}`}>
                <div className="flex gap-3">
                  <img src={r.image} alt={r.name} className="w-16 h-16 object-cover rounded flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-sm truncate">{r.name}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">{r.category} • {r.brand}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-sm font-semibold text-blue-600">{fmtVND(r.lowestPrice)}</span>
                      <StockStatusBadge status={r.stockStatus} size="small" />
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      Tồn kho: {r.totalStock} sản phẩm
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 mt-3 pt-3 border-t">
                  <button
                    className="flex-1 px-3 py-2 rounded border text-sm hover:bg-gray-100"
                    onClick={() => navigate(`/admin/products/${encodeURIComponent(r.id)}/edit`)}
                  >
                    ✏️ Sửa
                  </button>
                  <button
                    className="flex-1 px-3 py-2 rounded border border-red-500 text-red-600 text-sm hover:bg-red-50"
                    onClick={async () => {
                      if (!window.confirm("Bạn có chắc muốn xóa sản phẩm này?")) return;
                      try {
                        await api.delete(`/products/${encodeURIComponent(r.id)}`);
                        toast.success("Xóa sản phẩm thành công");
                        setRows((prev) => prev.filter((x) => x.id !== r.id));
                      } catch (err) {
                        console.error("DELETE ERROR", err.response || err);
                        const msg = err.response?.data?.message || err.response?.statusText || err.message || "Xóa sản phẩm thất bại";
                        toast.error(msg);
                      }
                    }}
                  >
                    🗑️ Xóa
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}