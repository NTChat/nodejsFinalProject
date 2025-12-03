// frontend/src/components/common/Pagination.jsx
import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

/**
 * Component Phân trang Tái sử dụng
 * @param {object} props
 * @param {number} props.currentPage - Trang hiện tại
 * @param {number} props.totalPages - Tổng số trang
 * @param {function} props.onPageChange - Hàm callback khi đổi trang (nhận vào số trang mới)
 */
const Pagination = ({ currentPage, totalPages, onPageChange }) => {

    const renderPageButtons = () => {
        const pageButtons = [];
        let startPage = Math.max(1, currentPage - 2);
        let endPage = Math.min(totalPages, currentPage + 2);

        if (currentPage - 2 <= 1) {
            endPage = Math.min(totalPages, 5);
        }
        if (currentPage + 2 >= totalPages) {
            startPage = Math.max(1, totalPages - 4);
        }

        if (startPage > 1) {
            pageButtons.push(<span key="start-dots" className="px-2 py-1 text-text-secondary">...</span>);
        }

        for (let i = startPage; i <= endPage; i++) {
            pageButtons.push(
                <button
                    key={i}
                    onClick={() => onPageChange(i)}
                    className={`p-2 w-10 h-10 flex justify-center items-center rounded-lg transition
                        ${i === currentPage
                            ? 'bg-accent text-text-on-dark font-bold shadow-sm' // 👈 Dùng theme
                            : 'hover:bg-gray-100 text-text-secondary'
                        }`}
                >
                    {i}
                </button>
            );
        }

        if (endPage < totalPages) {
            pageButtons.push(<span key="end-dots" className="px-2 py-1 text-text-secondary">...</span>);
        }
        return pageButtons;
    };

    return (
        <div className="mt-4 flex justify-between items-center">
            <span className="text-sm text-text-secondary">
                Trang {currentPage} trên {totalPages}
            </span>
            <div className="flex items-center space-x-1">
                {/* Nút Về Trang Đầu */}
                <button
                    disabled={currentPage === 1}
                    onClick={() => onPageChange(1)}
                    className="p-2 w-10 h-10 flex justify-center items-center rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-100 transition"
                    aria-label="Trang đầu"
                >
                    <ChevronsLeft size={18} className="text-text-secondary" />
                </button>
                {/* Nút Lùi 1 Trang */}
                <button
                    disabled={currentPage === 1}
                    onClick={() => onPageChange(currentPage - 1)}
                    className="p-2 w-10 h-10 flex justify-center items-center rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-100 transition"
                    aria-label="Trang trước"
                >
                    <ChevronLeft size={18} className="text-text-secondary" />
                </button>

                {/* Các nút số trang */}
                <div className="flex items-center space-x-1">
                    {renderPageButtons()}
                </div>

                {/* Nút Tiến 1 Trang */}
                <button
                    disabled={currentPage === totalPages}
                    onClick={() => onPageChange(currentPage + 1)}
                    className="p-2 w-10 h-10 flex justify-center items-center rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-100 transition"
                    aria-label="Trang sau"
                >
                    <ChevronRight size={18} className="text-text-secondary" />
                </button>
                {/* Nút Về Trang Cuối */}
                <button
                    disabled={currentPage === totalPages}
                    onClick={() => onPageChange(totalPages)}
                    className="p-2 w-10 h-10 flex justify-center items-center rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-100 transition"
                    aria-label="Trang cuối"
                >
                    <ChevronsRight size={18} className="text-text-secondary" />
                </button>
            </div>
        </div>
    );
};

export default Pagination;