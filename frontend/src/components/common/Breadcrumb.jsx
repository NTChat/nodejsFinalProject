// frontend/src/components/common/Breadcrumb.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { Home, ChevronRight } from 'lucide-react';

/**
 * Component Breadcrumb Tái sử dụng
 * @param {object} props
 * @param {Array<{label: string, href?: string}>} props.crumbs - Mảng các đối tượng breadcrumb.
 */
const Breadcrumb = ({ crumbs }) => {
    return (
        <nav className="flex items-center space-x-2 text-sm text-text-secondary mb-4" aria-label="Breadcrumb">
            <Link to="/admin" className="text-text-secondary hover:text-accent transition-colors">
                <Home size={16} />
            </Link>
            {crumbs.map((crumb, index) => (
                <React.Fragment key={index}>
                    <ChevronRight size={16} />
                    {crumb.href ? (
                        // Đây là một phần có thể click (ví dụ: Dashboard)
                        <Link 
                            to={crumb.href} 
                            className="hover:text-accent transition-colors"
                        >
                            {crumb.label}
                        </Link>
                    ) : (
                        // Đây là trang hiện tại (không thể click)
                        <span className="font-medium text-text-primary">
                            {crumb.label}
                        </span>
                    )}
                </React.Fragment>
            ))}
        </nav>
    );
};

export default Breadcrumb;