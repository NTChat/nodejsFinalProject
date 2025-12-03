// src/components/NewProducts.jsx
import React, { useState, useEffect } from 'react';
import { ProductController } from '../../controllers/productController'; // Import controller
import ProductCard from './ProductCard';

const NewProducts = () => {
    const [newProducts, setNewProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchNewProducts = async () => {
            setLoading(true);
            setError('');
            try {
                // Gọi hàm từ ProductController
                const products = await ProductController.getNewProducts();
                console.log('🎁 NewProducts fetched:', products.length, 'items');
                if (products.length > 0) {
                    console.log('📦 First product data:', {
                        name: products[0].productName,
                        hasImages: !!products[0].images,
                        imagesLength: Array.isArray(products[0].images) ? products[0].images.length : 0,
                        images: products[0].images
                    });
                }
                setNewProducts(products);
            } catch (err) {
                console.error("❌ Lỗi fetch sản phẩm mới (Component):", err.message);
                setError('Không thể tải sản phẩm mới. Vui lòng thử lại.');
                setNewProducts([]);
            } finally {
                setLoading(false);
            }
        };
        fetchNewProducts();
    }, []);

    return (
        <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Sản phẩm mới</h2>
            {loading && <p className="text-center py-4 text-gray-600">Đang tải sản phẩm mới...</p>}
            {error && <p className="text-red-500 text-center py-4">{error}</p>}
            {!loading && !error && newProducts.length === 0 && (
                <p className="text-center py-4 text-gray-600">Hiện chưa có sản phẩm mới nào.</p>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {!loading && !error && newProducts.map((product) => (
                    <ProductCard key={product._id || product.productId} product={product} />
                ))}
            </div>
        </section>
    );
};

export default NewProducts;