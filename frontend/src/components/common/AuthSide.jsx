// frontend/src/components/common/AuthSide.jsx
import React from 'react';

const AuthSide = ({ imgSrc }) => {
    return (
        // Hidden trên Mobile, Flex trên Desktop (md), chiếm 1/2 màn hình, nền xanh nhạt
        <div className="hidden md:flex w-1/2 bg-[#f3f5ff] items-center justify-center relative">
            {/* Hình minh họa chính */}
            <img
                src={imgSrc}
                alt="Illustration"
                className="max-w-md w-4/5"
                // Fallback nếu ảnh lỗi
                onError={(e) => (e.target.src = "/img/illustration.svg")}
            />
            
            {/* Logo góc trên bên trái */}
            <div className="absolute top-6 left-6 flex items-center space-x-2">
                <img src="/img/logo.svg" alt="Logo" className="h-24 w-auto" />
            </div>
        </div>
    );
};

export default AuthSide;