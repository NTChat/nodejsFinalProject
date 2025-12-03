import React, { useState, useEffect, useRef } from 'react';
import {
    Search, Plus, Edit, Trash2, X, Image as ImageIcon,
    Home, ChevronRight, CheckCircle, XCircle, Package, Layers
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { CategoryController } from '../controllers/categoryController';

// Component Breadcrumb nhỏ gọn
const Breadcrumb = ({ items }) => (
    <nav className="flex items-center text-sm text-gray-500 mb-6">
        <Home size={16} className="mr-2" />
        {items.map((item, index) => (
            <React.Fragment key={index}>
                <ChevronRight size={16} className="mx-2" />
                <span className={index === items.length - 1 ? "font-semibold text-blue-600" : ""}>
                    {item}
                </span>
            </React.Fragment>
        ))}
    </nav>
);

const CategoriesManagement = () => {
    // --- STATE ---
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [parentSearchTerm, setParentSearchTerm] = useState('');
    const [selectedParentId, setSelectedParentId] = useState(null);
    const [parentSuggestions, setParentSuggestions] = useState([]); // Gợi ý danh mục cha
    const [showParentSuggestions, setShowParentSuggestions] = useState(false);
    const parentSearchTimeoutRef = useRef(null);
    const parentSearchContainerRef = useRef(null);

    // State Modal
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [formData, setFormData] = useState({
        categoryId: '', name: '', slug: '', description: '', status: 'active', image: '', displayOrder: 0, parentId: null
    });
    const [imagePreview, setImagePreview] = useState(''); // Preview ảnh upload
    const imageInputRef = useRef(null);

    // --- EFFECT ---
    useEffect(() => {
        fetchCategories();
    }, []);

    useEffect(() => {
        // Set first parent as default if not selected
        if (categories.length > 0 && !selectedParentId) {
            const parentCategories = categories.filter(cat => !cat.parentId);
            if (parentCategories.length > 0) {
                setSelectedParentId(parentCategories[0].categoryId);
            }
        }
    }, [categories, selectedParentId]);

    // Handle parent category search with fuzzy match
    const handleParentSearchChange = (e) => {
        const value = e.target.value;
        setParentSearchTerm(value);

        if (parentSearchTimeoutRef.current) clearTimeout(parentSearchTimeoutRef.current);

        if (!value.trim()) {
            setParentSuggestions([]);
            setShowParentSuggestions(false);
            return;
        }

        // Debounce 200ms - fuzzy matching
        parentSearchTimeoutRef.current = setTimeout(() => {
            const allParents = (categories || []).filter(cat => cat && !cat.parentId);
            
            // Fuzzy search: match characters in order
            const fuzzyMatch = (str, pattern) => {
                const patternLower = pattern.toLowerCase();
                const strLower = str.toLowerCase();
                let patternIdx = 0;
                
                for (let i = 0; i < strLower.length && patternIdx < patternLower.length; i++) {
                    if (strLower[i] === patternLower[patternIdx]) {
                        patternIdx++;
                    }
                }
                return patternIdx === patternLower.length;
            };

            // Score for sorting (more consecutive = higher score)
            const scoreMatch = (str, pattern) => {
                const strLower = str.toLowerCase();
                const patternLower = pattern.toLowerCase();
                
                // Exact match at start
                if (strLower.startsWith(patternLower)) return 1000;
                
                // Word boundary match
                if (strLower.includes(` ${patternLower}`)) return 500;
                
                // Substring match
                if (strLower.includes(patternLower)) return 100;
                
                // Fuzzy match
                return 1;
            };

            const matches = allParents
                .filter(cat => fuzzyMatch(cat.name, value))
                .sort((a, b) => scoreMatch(b.name, value) - scoreMatch(a.name, value))
                .slice(0, 8); // Giới hạn 8 gợi ý

            setParentSuggestions(matches);
            setShowParentSuggestions(matches.length > 0);
        }, 200);
    };

    // Handle click on parent suggestion
    const handleParentSuggestionClick = (parent) => {
        setSelectedParentId(parent.categoryId);
        setParentSearchTerm('');
        setParentSuggestions([]);
        setShowParentSuggestions(false);
        setSearchTerm('');
    };

    const fetchCategories = async () => {
        setLoading(true);
        const data = await CategoryController.getAll();
        setCategories(data);
        setLoading(false);
    };

    // --- HANDLERS ---
    const generateCategoryId = () => {
        // Tạo ID ngẫu nhiên: prefix + timestamp + random
        const timestamp = Date.now().toString(36); // Convert to base36
        const random = Math.random().toString(36).substring(2, 6); // 4 ký tự random
        return `cat_${timestamp}${random}`;
    };

    const handleNameChange = (e) => {
        const name = e.target.value;
        const slug = name.toLowerCase()
            .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
            .replace(/ /g, '-').replace(/[^\w-]+/g, '');
        
        // Giữ nguyên categoryId nếu đã có, không tự động thay đổi
        setFormData(prev => ({ 
            ...prev, 
            name, 
            slug: !editingCategory ? slug : prev.slug
        }));
    };

    // Handle file upload
    const handleImageFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                setImagePreview(event.target.result);
                setFormData(prev => ({
                    ...prev,
                    image: '' // Clear URL when file is selected
                }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleOpenModal = (category = null) => {
        if (category) {
            setEditingCategory(category);
            setFormData(category);
            setImagePreview(category.image || '');
        } else {
            setEditingCategory(null);
            setImagePreview('');
            // Tự động tạo categoryId ngẫu nhiên khi mở modal tạo mới
            const newCategoryId = generateCategoryId();
            setFormData({ 
                categoryId: newCategoryId, 
                name: '', 
                slug: '', 
                description: '', 
                status: 'active', 
                image: '', 
                displayOrder: 0,
                parentId: null // Optional parent
            });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Chuẩn bị FormData nếu có file upload
        const submitData = new FormData();
        
        // Nếu có file upload, thêm file vào FormData
        if (imageInputRef.current?.files[0]) {
            submitData.append('image', imageInputRef.current.files[0]);
        } else {
            // Nếu không có file, gửi URL text
            submitData.append('image', formData.image);
        }
        
        // Thêm các fields khác
        Object.keys(formData).forEach(key => {
            if (key !== 'image') {
                submitData.append(key, formData[key]);
            }
        });
        
        // Gửi FormData nếu có file, ngược lại gửi JSON
        if (imageInputRef.current?.files[0]) {
            if (editingCategory) {
                await CategoryController.update(editingCategory._id, submitData, true); // true = isFormData
            } else {
                await CategoryController.create(submitData, true); // true = isFormData
            }
        } else {
            // Gửi JSON bình thường nếu chỉ có URL
            if (editingCategory) {
                await CategoryController.update(editingCategory._id, formData);
            } else {
                await CategoryController.create(formData);
            }
        }
        
        setIsModalOpen(false);
        setImagePreview('');
        if (imageInputRef.current) imageInputRef.current.value = '';
        fetchCategories();
    };

    const handleDelete = async (id) => {
        if (window.confirm("Bạn có chắc chắn muốn xóa danh mục này?")) {
            await CategoryController.delete(id);
            fetchCategories();
        }
    };

    // Separate parent và child categories
    const allParentCategories = (categories || []).filter(cat => cat && !cat.parentId);
    
    // Filter parent categories by search term
    const filteredParentCategories = allParentCategories.filter(cat =>
        cat.name.toLowerCase().includes(parentSearchTerm.toLowerCase())
    );
    
    const childCategories = (categories || []).filter(cat => cat && cat.parentId === selectedParentId);

    // Filter
    const filteredCategories = childCategories.filter(cat =>
        cat && cat.name && cat.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Tính toán thống kê nhanh (Giống Users.jsx)
    const stats = [
        { label: 'Tổng danh mục', value: (categories || []).length, icon: Layers, color: 'bg-blue-100 text-blue-600' },
        { label: 'Danh mục cha', value: allParentCategories.length, icon: CheckCircle, color: 'bg-green-100 text-green-600' },
        { label: 'Danh mục con', value: (categories || []).filter(c => c && c.parentId).length, icon: XCircle, color: 'bg-red-100 text-red-600' },
    ];

    return (
        <div className="p-6 min-h-screen bg-gray-50">
            {/* 1. BREADCRUMB & HEADER */}
            <Breadcrumb items={["Admin", "Quản lý Danh mục"]} />

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Danh mục sản phẩm</h1>
                    <p className="text-sm text-gray-500 mt-1">Quản lý phân loại hàng hóa trên hệ thống</p>
                </div>
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleOpenModal()}
                    className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl hover:bg-blue-700 transition shadow-lg shadow-blue-200"
                >
                    <Plus size={20} /> Tạo mới
                </motion.button>
            </div>

            {/* 2. STATS CARDS (Thống kê nhanh) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {stats.map((stat, index) => (
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between"
                    >
                        <div>
                            <p className="text-sm text-gray-500 font-medium mb-1">{stat.label}</p>
                            <h3 className="text-2xl font-bold text-gray-800">{stat.value}</h3>
                        </div>
                        <div className={`p-3 rounded-xl ${stat.color}`}>
                            <stat.icon size={24} />
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* 3. PARENT CATEGORY TABS WITH FUZZY SEARCH */}
            {allParentCategories.length > 0 && (
                <div className="mb-6 bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                    <div className="mb-4">
                        <p className="text-sm font-semibold text-gray-700 mb-3">📂 Danh mục cha</p>
                        <div className="relative max-w-xs" ref={parentSearchContainerRef}>
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="text"
                                placeholder="Tìm danh mục cha..."
                                value={parentSearchTerm}
                                onChange={handleParentSearchChange}
                                onFocus={() => { if (parentSearchTerm) setShowParentSuggestions(true) }}
                                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            />
                            
                            {/* Suggestions Dropdown - Giống Header */}
                            <AnimatePresence>
                                {showParentSuggestions && parentSuggestions.length > 0 && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -5 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -5 }}
                                        className="absolute top-full left-0 right-0 mt-2 bg-white shadow-lg rounded-lg border border-gray-100 overflow-hidden z-50"
                                    >
                                        <div className="max-h-60 overflow-y-auto">
                                            {parentSuggestions.map((parent) => (
                                                <motion.div
                                                    key={parent.categoryId}
                                                    whileHover={{ backgroundColor: '#f3f4f6' }}
                                                    onClick={() => handleParentSuggestionClick(parent)}
                                                    className="flex items-center gap-3 p-3 cursor-pointer border-b border-gray-50 last:border-0 transition-colors hover:bg-gray-50"
                                                >
                                                    <div className="w-8 h-8 rounded overflow-hidden flex-shrink-0">
                                                        {parent.image ? (
                                                            <img src={parent.image} alt="" className="w-full h-full object-cover" />
                                                        ) : (
                                                            <div className="w-full h-full bg-gray-300" />
                                                        )}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium text-gray-800 truncate">{parent.name}</p>
                                                        <p className="text-xs text-gray-500 mt-0.5">{parent.description || 'Danh mục cha'}</p>
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>

                    {/* Grid tabs for quick select */}
                    {filteredParentCategories.length > 0 && !parentSearchTerm && (
                        <div>
                            <p className="text-xs text-gray-500 mb-2">Hoặc chọn nhanh:</p>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                                {filteredParentCategories.map((parent) => (
                                    <motion.button
                                        key={parent.categoryId}
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => {
                                            setSelectedParentId(parent.categoryId);
                                            setSearchTerm('');
                                        }}
                                        className={`p-3 rounded-lg font-medium transition flex flex-col items-center gap-2 ${
                                            selectedParentId === parent.categoryId
                                                ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                    >
                                        <div className="w-8 h-8 rounded overflow-hidden flex-shrink-0">
                                            {parent.image ? (
                                                <img src={parent.image} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full bg-gray-300" />
                                            )}
                                        </div>
                                        <span className="text-xs text-center line-clamp-2">{parent.name}</span>
                                    </motion.button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* 3. TOOLBAR */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6">
                <p className="text-sm font-semibold text-gray-700 mb-3">
                    🔍 Danh mục con của <span className="text-blue-600">{allParentCategories.find(p => p.categoryId === selectedParentId)?.name || 'Chọn danh mục'}</span>
                </p>
                <div className="relative max-w-md w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Tìm kiếm danh mục con..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    />
                </div>
            </div>

            {/* 4. CONTENT DISPLAY (RESPONSIVE) */}

            {/* === DESKTOP TABLE (Hidden on Mobile) === */}
            <div className="hidden md:block bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50/50 border-b border-gray-100">
                        <tr>
                            <th className="p-4 text-xs font-semibold text-gray-500 uppercase">Hình ảnh</th>
                            <th className="p-4 text-xs font-semibold text-gray-500 uppercase">Thông tin</th>
                            <th className="p-4 text-xs font-semibold text-gray-500 uppercase text-center">Sản phẩm</th>
                            <th className="p-4 text-xs font-semibold text-gray-500 uppercase text-center">Trạng thái</th>
                            <th className="p-4 text-xs font-semibold text-gray-500 uppercase text-right">Hành động</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {loading ? (
                            <tr><td colSpan="5" className="p-8 text-center text-gray-500">Đang tải...</td></tr>
                        ) : filteredCategories.map((item) => (
                            <tr key={item._id} className="hover:bg-blue-50/30 transition group">
                                <td className="p-4 w-20">
                                    <div className="w-12 h-12 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center overflow-hidden">
                                        {item.image ? <img src={item.image} alt="" className="w-full h-full object-cover" /> : <ImageIcon size={20} className="text-gray-400" />}
                                    </div>
                                </td>
                                <td className="p-4">
                                    <p className="font-semibold text-gray-800">{item.name}</p>
                                    <p className="text-xs text-gray-400 mt-1">/{item.slug}</p>
                                    <p className="text-sm text-gray-500 mt-1 truncate max-w-xs">{item.description}</p>
                                </td>
                                <td className="p-4 text-center">
                                    <span className="inline-flex items-center gap-1 bg-gray-100 px-3 py-1 rounded-full text-xs font-medium text-gray-600">
                                        <Package size={12} /> {item.productCount}
                                    </span>
                                </td>
                                <td className="p-4 text-center">
                                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${item.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                        {item.status === 'active' ? 'Hiển thị' : 'Ẩn'}
                                    </span>
                                </td>
                                <td className="p-4 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        <button onClick={() => handleOpenModal(item)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"><Edit size={18} /></button>
                                        <button onClick={() => handleDelete(item._id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"><Trash2 size={18} /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* === MOBILE CARD LIST (Hidden on Desktop) === */}
            <div className="md:hidden space-y-4">
                {loading ? (
                    <p className="text-center text-gray-500">Đang tải...</p>
                ) : filteredCategories.map((item) => (
                    <div key={item._id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                        <div className="flex items-start gap-4">
                            <div className="w-16 h-16 rounded-lg bg-gray-100 flex-shrink-0 overflow-hidden border border-gray-200">
                                {item.image ? <img src={item.image} alt="" className="w-full h-full object-cover" /> : <ImageIcon size={24} className="text-gray-400 m-auto mt-4" />}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start">
                                    <h3 className="font-semibold text-gray-800 truncate">{item.name}</h3>
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${item.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                        {item.status === 'active' ? 'Active' : 'Hidden'}
                                    </span>
                                </div>
                                <p className="text-xs text-blue-500 mt-0.5">/{item.slug}</p>
                                <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                                    <span className="flex items-center gap-1"><Package size={14} /> {item.productCount} SP</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center justify-end gap-3 mt-4 pt-3 border-t border-gray-50">
                            <button onClick={() => handleOpenModal(item)} className="flex items-center gap-1 text-sm text-gray-500 hover:text-blue-600 font-medium">
                                <Edit size={16} /> Sửa
                            </button>
                            <button onClick={() => handleDelete(item._id)} className="flex items-center gap-1 text-sm text-gray-500 hover:text-red-600 font-medium">
                                <Trash2 size={16} /> Xóa
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* 5. MODAL ADD/EDIT (Animated) */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                            onClick={() => setIsModalOpen(false)}
                        />
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            className="bg-white rounded-2xl shadow-xl w-full max-w-lg z-10 overflow-hidden relative"
                        >
                            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                                <h2 className="text-lg font-bold text-gray-800">{editingCategory ? "Cập nhật Danh mục" : "Thêm Danh mục mới"}</h2>
                                <button onClick={() => setIsModalOpen(false)} className="p-2 text-gray-400 hover:bg-gray-200 rounded-full transition"><X size={20} /></button>
                            </div>

                            <form onSubmit={handleSubmit} className="p-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center justify-between">
                                        <span>Mã danh mục <span className="text-red-500">*</span></span>
                                        {!editingCategory && (
                                            <button
                                                type="button"
                                                onClick={() => setFormData({ ...formData, categoryId: generateCategoryId() })}
                                                className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                                            >
                                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                                </svg>
                                                Tạo lại
                                            </button>
                                        )}
                                    </label>
                                    <input 
                                        type="text" 
                                        required 
                                        value={formData.categoryId} 
                                        onChange={(e) => setFormData({ ...formData, categoryId: e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, '') })}
                                        disabled={!!editingCategory}
                                        className={`w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition ${editingCategory ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'font-mono text-sm'}`}
                                        placeholder="cat_xxxxx (tự động)" 
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                        {editingCategory 
                                            ? 'Mã danh mục không thể thay đổi sau khi tạo.' 
                                            : 'Mã tự động tạo. Bạn có thể sửa hoặc nhấn "Tạo lại" để tạo mã mới.'}
                                    </p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Tên danh mục <span className="text-red-500">*</span></label>
                                    <input type="text" required value={formData.name} onChange={handleNameChange}
                                        className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition" placeholder="Ví dụ: Laptop" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Đường dẫn (Slug)</label>
                                    <input type="text" required value={formData.slug} onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                                        className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-gray-50 text-gray-500 focus:ring-2 focus:ring-blue-500 outline-none transition" />
                                </div>

                                {/* Chọn Danh mục cha (Optional) */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Danh mục cha (tùy chọn)
                                        {formData.parentId && <span className="text-blue-600 text-xs ml-1">← Đây là danh mục con</span>}
                                    </label>
                                    <select 
                                        value={formData.parentId || ''} 
                                        onChange={(e) => setFormData({ ...formData, parentId: e.target.value || null })}
                                        className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none transition"
                                    >
                                        <option value="">--- Không có (Danh mục cha) ---</option>
                                        {allParentCategories
                                            .filter(cat => cat.categoryId !== formData.categoryId) // Không chọn chính nó
                                            .map(cat => (
                                                <option key={cat.categoryId} value={cat.categoryId}>
                                                    {cat.name}
                                                </option>
                                            ))
                                        }
                                    </select>
                                    <p className="text-xs text-gray-500 mt-1">
                                        {formData.parentId 
                                            ? `Đây sẽ là danh mục con của ${allParentCategories.find(c => c.categoryId === formData.parentId)?.name || 'N/A'}`
                                            : 'Để trống nếu đây là danh mục cha'
                                        }
                                    </p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Hình ảnh <span className="text-blue-500 text-xs">(Upload hoặc Link URL)</span></label>
                                    <div className="space-y-3">
                                        {/* File Upload */}
                                        <div className="flex items-center justify-center w-full border-2 border-dashed border-gray-300 rounded-lg p-4 bg-gray-50 hover:bg-gray-100 cursor-pointer transition">
                                            <input 
                                                ref={imageInputRef}
                                                type="file" 
                                                accept="image/*" 
                                                onChange={handleImageFileChange}
                                                className="hidden" 
                                            />
                                            <div className="text-center" onClick={() => imageInputRef.current?.click()}>
                                                <ImageIcon size={32} className="text-gray-400 mx-auto mb-1" />
                                                <p className="text-sm text-gray-600">Click để chọn ảnh</p>
                                                <p className="text-xs text-gray-400 mt-1">PNG, JPG (Tối đa 5MB)</p>
                                            </div>
                                        </div>
                                        
                                        {/* URL Input */}
                                        <input 
                                            type="text" 
                                            value={formData.image} 
                                            onChange={(e) => {
                                                setFormData({ ...formData, image: e.target.value });
                                                setImagePreview(e.target.value);
                                            }}
                                            className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none transition text-sm" 
                                            placeholder="Hoặc dán URL hình ảnh..." 
                                        />
                                        
                                        {/* Preview */}
                                        {imagePreview && (
                                            <div className="w-full h-40 rounded-lg border border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden">
                                                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" onError={() => setImagePreview('')} />
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
                                    <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                        className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none">
                                        <option value="active">Hiển thị</option>
                                        <option value="inactive">Ẩn</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả ngắn</label>
                                    <textarea rows="3" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none transition resize-none" placeholder="Nhập mô tả..." />
                                </div>
                                <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 mt-4">
                                    <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 font-medium transition">Hủy bỏ</button>
                                    <button type="submit" className="px-5 py-2.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 font-medium transition shadow-lg shadow-blue-200">{editingCategory ? "Lưu thay đổi" : "Tạo mới"}</button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default CategoriesManagement;