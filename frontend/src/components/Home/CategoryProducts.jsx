// src/components/CategoryProducts.jsx
import React, { useEffect, useState } from 'react';
import { ProductController } from '../../controllers/productController'; // Import controller
import ProductCard from './ProductCard';

const CategoryProducts = ({ categoryId, title }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // States cho sắp xếp và phân trang
  const [sortBy, setSortBy] = useState('newest');
  const [sortOrder, setSortOrder] = useState('desc');
  const [page, setPage] = useState(1);
  const [limit] = useState(8); // Giới hạn số sản phẩm trên mỗi trang
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1); // Để hiển thị trang hiện tại

  // Xử lý khi người dùng thay đổi tùy chọn sắp xếp
  const handleSortChange = (e) => {
    const [newSortBy, newSortOrder] = e.target.value.split(':');
    setSortBy(newSortBy || 'newest');
    setSortOrder(newSortOrder || 'desc');
    setPage(1); // Reset về trang 1 khi thay đổi sắp xếp
  };

  useEffect(() => {
    // Không fetch nếu categoryId không hợp lệ
    if (!categoryId) {
      setLoading(false);
      setProducts([]);
      setError('');
      return;
    }

    const fetchCategoryProducts = async () => {
      setLoading(true);
      setError(''); // Reset lỗi
      try {
        // Gọi hàm từ ProductController
        const data = await ProductController.getProductsByCategory(categoryId, {
          sortBy,
          sortOrder,
          page,
          limit
        });

        setProducts(data.products || []);
        setTotalPages(data.totalPages || 1);
        setCurrentPage(data.currentPage || page); // Cập nhật trang hiện tại từ response
      } catch (err) {
        console.error(`Lỗi fetch sản phẩm danh mục ${categoryId} (Component):`, err.message);
        setError('Không thể tải sản phẩm. Vui lòng thử lại sau.');
        setProducts([]); // Xóa sản phẩm nếu có lỗi
        setTotalPages(1); // Reset phân trang
        setCurrentPage(1); // Reset trang hiện tại
      } finally {
        setLoading(false);
      }
    };

    fetchCategoryProducts();
  }, [categoryId, sortBy, sortOrder, page, limit]); // Dependencies cho useEffect


  return (
    <section className="mb-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">{title}</h2>
        <div className="flex items-center space-x-2">
          <label htmlFor="sort" className="text-sm font-medium text-gray-700">Sắp xếp:</label>
          <select
            id="sort"
            name="sort"
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
            onChange={handleSortChange}
            value={`${sortBy}:${sortOrder}`}
          >
            <option value="newest:desc">Mới nhất</option>
            <option value="oldest:asc">Cũ nhất</option>
            <option value="name:asc">Tên A–Z</option>
            <option value="name:desc">Tên Z–A</option>
            <option value="price:asc">Giá tăng dần</option>
            <option value="price:desc">Giá giảm dần</option>
          </select>
        </div>
      </div>

      {loading && <p className="text-center py-4 text-gray-600">Đang tải sản phẩm {title}...</p>}
      {error && <p className="text-red-500 text-center py-4">{error}</p>}

      {!loading && !error && products.length === 0 && (
        <p className="text-center py-4 text-gray-600">Không tìm thấy sản phẩm nào cho danh mục này.</p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {!loading && !error && products.map((product) => (
          <ProductCard key={product._id || product.productId} product={product} />
        ))}
      </div>

      {!loading && !error && totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button
            className="px-4 py-2 border rounded-md text-gray-700 bg-white hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={currentPage <= 1}
            aria-label="Previous page"
          >
            &larr; Previous
          </button>
          {/* Hiển thị các nút số trang */}
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`px-4 py-2 border rounded-md transition-colors 
                                ${p === currentPage ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-700 bg-white hover:bg-gray-100'}`}
              aria-current={p === currentPage ? 'page' : undefined}
            >
              {p}
            </button>
          ))}
          <button
            className="px-4 py-2 border rounded-md text-gray-700 bg-white hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage >= totalPages}
            aria-label="Next page"
          >
            Next &rarr;
          </button>
        </div>
      )}
    </section>
  );
};

export default CategoryProducts;