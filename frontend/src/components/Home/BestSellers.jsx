// src/components/BestSellers.jsx
import React, { useEffect, useState } from 'react';
import { ProductController } from '../../controllers/productController'; // Import controller
import ProductCard from './ProductCard';

const BestSellers = () => {
    const [bestSellers, setBestSellers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchBestSellers = async () => {
            setLoading(true);
            setError('');
            try {
                // Gọi hàm từ ProductController
                const products = await ProductController.getBestSellers();
                setBestSellers(products);
            } catch (err) {
                console.error("Lỗi fetch Best Sellers (Component):", err.message);
                setError('Không thể tải sản phẩm bán chạy. Vui lòng thử lại.');
                setBestSellers([]);
            } finally {
                setLoading(false);
            }
        };
        fetchBestSellers();
    }, []);

    return (
        <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Sản phẩm bán chạy nhất</h2>
            {loading && <p className="text-center py-4 text-gray-600">Đang tải sản phẩm bán chạy...</p>}
            {error && <p className="text-red-500 text-center py-4">{error}</p>}
            {!loading && !error && bestSellers.length === 0 && (
                <p className="text-center py-4 text-gray-600">Hiện chưa có sản phẩm bán chạy nào.</p>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {!loading && !error && bestSellers.map(product => (
                    <ProductCard key={product._id || product.productId} product={product} />
                ))}
            </div>
        </section>
    );
};

export default BestSellers;