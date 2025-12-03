// frontend/src/pages/NotFoundPage.jsx
import React from 'react';
import { Link } from 'react-router-dom';

const NotFoundPage = () => {
    return (
        <div className="text-center p-20">
            <h1 className="text-9xl font-bold text-indigo-600">404</h1>
            <h2 className="text-3xl font-semibold mt-4 mb-2">Trang không tồn tại</h2>
            <p className="text-gray-600 mb-6">Rất tiếc, chúng tôi không tìm thấy trang bạn yêu cầu.</p>
            <Link 
                to="/" 
                className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition"
            >
                Quay về Trang chủ
            </Link>
        </div>
    );
};

export default NotFoundPage;