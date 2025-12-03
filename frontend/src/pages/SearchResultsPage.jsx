// frontend/src/pages/SearchResultsPage.jsx
import React from 'react';
import { useSearchParams } from 'react-router-dom';

const SearchResultsPage = () => {
    const [searchParams] = useSearchParams();
    const query = searchParams.get('query');

    // (Sau này fen sẽ thêm logic gọi API tìm kiếm ở đây)

    return (
        <div className="container mx-auto p-8">
            <h1 className="text-3xl font-bold mb-4">Kết quả tìm kiếm cho: "{query}"</h1>
            {/* (Hiển thị danh sách sản phẩm tìm được ở đây) */}
            <p>Đang phát triển tính năng tìm kiếm...</p>
        </div>
    );
};

export default SearchResultsPage;