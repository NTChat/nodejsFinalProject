import React, { useEffect, useState, useRef } from "react";
import { toast } from "react-toastify";
import { 
    Plus, Trash2, Ticket, Percent, Filter, X, ChevronDown, 
    Zap, Search, Package, CheckSquare, Truck, Users, CreditCard, Layers, Image as ImageIcon, Gift, Pencil
} from "lucide-react";

import api from "../services/api";
import Calendar from "../components/common/Calendar"; 
import Breadcrumb from "../components/common/Breadcrumb";
import Pagination from "../components/common/Pagination";

export default function DiscountManagement() {
  // --- STATE QUẢN LÝ ---
  const [discounts, setDiscounts] = useState([]);
  const [categories, setCategories] = useState([]); 
  const [loading, setLoading] = useState(true);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9; 

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState(null); // ID của discount đang sửa
  
  // --- STATE FLASH SALE (TÌM KIẾM & CHỌN SP) ---
  const [productSearchTerm, setProductSearchTerm] = useState("");
  const [suggestedProducts, setSuggestedProducts] = useState([]); // List gợi ý API trả về
  const [selectedProducts, setSelectedProducts] = useState([]);   // List đã chọn
  const [isSearchingProducts, setIsSearchingProducts] = useState(false);
  const searchTimeoutRef = useRef(null); 

  // Form Data
  const [formData, setFormData] = useState({
    discountName: "",
    discountCode: "",
    percent: "",
    maxUses: "1",
    startDate: "", 
    endDate: "",   
    conditionType: "all", 
    conditionValue: "",
    productIds: [],
    isStackable: false,
    isRedeemable: false, // Có thể đổi bằng điểm không
    pointsCost: "" // Số điểm cần để đổi
  });

  // --- 1. LOAD DỮ LIỆU ---
  useEffect(() => {
    fetchDiscounts();
    fetchCategories();
  }, []);

  // Cập nhật mảng ID khi list sản phẩm chọn thay đổi
  useEffect(() => {
    setFormData(prev => ({ ...prev, productIds: selectedProducts.map(p => p._id) }));
  }, [selectedProducts]);

  const fetchDiscounts = async () => {
    try {
      setLoading(true);
      const res = await api.get("/discounts"); 
      if (res.data.success) {
          const sorted = (res.data.discounts || []).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
          setDiscounts(sorted);
      }
    } catch (err) {
      toast.error("Lỗi tải danh sách mã");
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
        const res = await api.get("/categories"); 
        const data = Array.isArray(res.data) ? res.data : (res.data.categories || []);
        setCategories(data);
    } catch (error) {
        console.error("Lỗi tải danh mục:", error);
    }
  };

  // --- 2. LOGIC TÌM KIẾM SẢN PHẨM (AUTO SUGGEST) ---
  const handleSearchProduct = (keyword) => {
      setProductSearchTerm(keyword);
      
      // Debounce: Chờ 500ms sau khi ngừng gõ mới gọi API
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
      if (!keyword.trim()) { setSuggestedProducts([]); return; }
      
      setIsSearchingProducts(true);
      searchTimeoutRef.current = setTimeout(async () => {
          try {
              // Gọi API tìm kiếm sản phẩm
              const res = await api.get('/products', { params: { keyword } });
              const products = res.data.products || res.data || [];
              setSuggestedProducts(products);
          } catch (error) { 
              console.error(error); 
          } finally { 
              setIsSearchingProducts(false); 
          }
      }, 500);
  };

  const selectProduct = (product) => {
      // Kiểm tra trùng lặp
      if (!selectedProducts.find(p => p._id === product._id)) {
          setSelectedProducts([...selectedProducts, product]);
      }
      setProductSearchTerm(""); 
      setSuggestedProducts([]); // Ẩn gợi ý sau khi chọn
  };

  const removeProduct = (productId) => {
      setSelectedProducts(selectedProducts.filter(p => p._id !== productId));
  };

  // --- 3. XỬ LÝ FORM SUBMIT ---
  const handleCreate = async (e) => {
    e.preventDefault();
    if (formData.conditionType === 'flash_sale') {
        if (!formData.conditionValue) { toast.error("Vui lòng chọn khung giờ Flash Sale!"); return; }
        if (selectedProducts.length === 0) { toast.error("Vui lòng chọn ít nhất 1 sản phẩm!"); return; }
    } else if (formData.conditionType !== 'all' && !formData.conditionValue) {
        toast.error("Vui lòng chọn điều kiện chi tiết!"); return;
    }

    try {
      setCreating(true);
      
      // Kiểm tra là TẠO MỚI hay CẬP NHẬT
      let res;
      if (editingDiscount) {
        // CẬP NHẬT mã cũ
        res = await api.put(`/discounts/${editingDiscount}`, formData);
        if (res.data.success) {
          toast.success("Cập nhật mã thành công!");
          // Cập nhật lại trong list
          setDiscounts(prev => prev.map(d => d._id === editingDiscount ? res.data.discount : d));
        }
      } else {
        // TẠO mã mới
        res = await api.post("/discounts", formData);
        if (res.data.success) {
          toast.success("Tạo mã thành công!");
          // Thêm mã mới vào đầu list
          setDiscounts(prev => [res.data.discount, ...prev]);
        }
      }
      
      // Đóng modal và reset form
      setShowModal(false);
      setFormData({
          discountName: "", discountCode: "", percent: "", maxUses: "1",
          startDate: "", endDate: "", conditionType: "all", conditionValue: "", productIds: [], isStackable: false,
          isRedeemable: false, pointsCost: ""
      });
      setSelectedProducts([]);
      setEditingDiscount(null);
      setCurrentPage(1);
      
    } catch (err) {
      toast.error(err.response?.data?.message || (editingDiscount ? "Lỗi khi cập nhật mã" : "Lỗi khi tạo mã"));
    } finally {
      setCreating(false);
    }
  };

  // --- 4. SỬA MÃ ---
  const handleEdit = (discount) => {
    setEditingDiscount(discount._id);
    setFormData({
      discountName: discount.discountName || "",
      discountCode: discount.discountCode || "",
      percent: discount.percent || "",
      maxUses: discount.maxUses || "1",
      startDate: discount.startDate || "",
      endDate: discount.endDate || "",
      conditionType: discount.conditionType || "all",
      conditionValue: discount.conditionValue || "",
      productIds: discount.productIds || [],
      isStackable: discount.isStackable || false,
      isRedeemable: discount.isRedeemable || false,
      pointsCost: discount.pointsCost || ""
    });
    // Load selected products nếu có
    if (discount.productIds && discount.productIds.length > 0) {
      // Tìm thông tin sản phẩm từ API hoặc cache
      fetchProductsByIds(discount.productIds);
    }
    setShowModal(true);
  };

  // Helper: Fetch products by IDs for editing
  const fetchProductsByIds = async (productIds) => {
    try {
      const promises = productIds.map(id => api.get(`/products/${id}`));
      const results = await Promise.all(promises);
      const products = results.map(res => res.data.product || res.data).filter(Boolean);
      setSelectedProducts(products);
    } catch (err) {
      console.error("Lỗi tải sản phẩm:", err);
    }
  };

  const handleDelete = async (id) => {
    if(!window.confirm("Bạn chắc chắn muốn xóa?")) return;
    try {
      await api.delete(`/discounts/${id}`);
      toast.success("Đã xóa mã");
      setDiscounts(prev => prev.filter(d => d._id !== id));
    } catch (err) { toast.error("Lỗi xóa mã"); }
  };

  // --- 5. RESET FORM ---
  const resetForm = () => {
    setFormData({
      discountName: "",
      discountCode: "",
      percent: "",
      maxUses: "1",
      startDate: "",
      endDate: "",
      conditionType: "all",
      conditionValue: "",
      productIds: [],
      isStackable: false,
      isRedeemable: false,
      pointsCost: ""
    });
    setSelectedProducts([]);
    setProductSearchTerm("");
    setEditingDiscount(null);
  };

  // --- 6. PAGINATION ---
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentDiscounts = discounts.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(discounts.length / itemsPerPage);

  // --- 7. COMPONENT DROPDOWN TÁI SỬ DỤNG ---
  const Dropdown = ({ options, placeholder, icon: Icon, color = "text-gray-500", value, onChange }) => (
    <div className="relative">
        <select
            className="w-full border rounded-lg px-3 py-2.5 bg-white focus:ring-2 focus:ring-blue-500 outline-none appearance-none cursor-pointer pr-10"
            value={value || ""}
            onChange={onChange}
        >
            <option value="">{placeholder}</option>
            {options.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
        </select>
        <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
        {Icon && <Icon size={16} className={`absolute right-10 top-1/2 -translate-y-1/2 pointer-events-none ${color}`} />}
    </div>
  );

  // --- 8. RENDER NỘI DUNG ĐIỀU KIỆN (FLASH SALE LAYOUT) ---
  const renderConditionContent = () => {
    const MONEY_OPTIONS = [
        { value: 0, label: "Mọi đơn hàng (0đ)" },
        { value: 500000, label: "Từ 500.000 VNĐ" },
        { value: 1000000, label: "Từ 1.000.000 VNĐ" },
        { value: 3000000, label: "Từ 3.000.000 VNĐ" },
        { value: 5000000, label: "Từ 5.000.000 VNĐ" },
    ];
    const FLASH_SALE_OPTIONS = [
        { value: "09:00 - 12:00", label: "🌞 Sáng (09:00 - 12:00)" },
        { value: "12:00 - 14:00", label: "☀️ Trưa (12:00 - 14:00)" },
        { value: "18:00 - 21:00", label: "🌆 Tối (18:00 - 21:00)" },
        { value: "22:00 - 00:00", label: "🌙 Đêm (22:00 - 00:00)" },
    ];
    const MEMBER_OPTIONS = [
        { value: "bronze", label: "🥉 Thành viên Đồng (Bronze)" },
        { value: "silver", label: "🥈 Thành viên Bạc (Silver)" },
        { value: "gold", label: "🥇 Thành viên Vàng (Gold)" },
        { value: "diamond", label: "💎 Thành viên Kim Cương (Diamond)" },
    ];
    const PAYMENT_OPTIONS = [
        { value: "banking", label: "🏦 Chuyển khoản ngân hàng" },
        { value: "cod", label: "📦 Thanh toán khi nhận hàng (COD)" },
    ];

    // === FLASH SALE LAYOUT ĐẶC BIỆT (CHIA 2 CỘT) ===
    if (formData.conditionType === 'flash_sale') {
        return (
            <div className="col-span-1 md:col-span-2 mt-3 bg-white p-4 rounded-xl border border-dashed border-orange-200">
                <div className="flex flex-col lg:flex-row gap-6">
                    
                    {/* CỘT TRÁI: CẤU HÌNH & TÌM KIẾM (40%) */}
                    <div className="w-full lg:w-2/5 space-y-5">
                        {/* 1. Chọn giờ */}
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1">
                                <Zap size={14} className="text-orange-500"/> Khung giờ vàng
                            </label>
                            <Dropdown 
                                placeholder="-- Chọn khung giờ --" 
                                options={FLASH_SALE_OPTIONS} 
                                value={formData.conditionValue}
                                onChange={(e) => setFormData({...formData, conditionValue: e.target.value})}
                            />
                        </div>

                        {/* 2. Tìm kiếm sản phẩm (Auto Suggest) */}
                        <div className="space-y-1 relative">
                            <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1">
                                <Search size={14}/> Tìm sản phẩm
                            </label>
                            <div className="relative">
                                <input 
                                    className="w-full pl-9 pr-4 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none shadow-sm transition-all"
                                    placeholder="Gõ tên sản phẩm..."
                                    value={productSearchTerm}
                                    onChange={(e) => handleSearchProduct(e.target.value)}
                                />
                                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                {isSearchingProducts && <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-blue-500 animate-pulse">Đang tìm...</div>}
                            </div>

                            {/* Dropdown Gợi ý (Nổi lên trên) */}
                            {suggestedProducts.length > 0 && (
                                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl max-h-60 overflow-y-auto custom-scrollbar animate-fade-in-up">
                                    {suggestedProducts.map(p => (
                                        <div 
                                            key={p._id} 
                                            onClick={() => selectProduct(p)} 
                                            className="px-4 py-3 hover:bg-blue-50 cursor-pointer flex items-center gap-3 border-b border-gray-50 last:border-0 transition-colors"
                                        >
                                            <div className="w-10 h-10 rounded-lg bg-gray-100 flex-shrink-0 overflow-hidden border border-gray-200">
                                                {p.images?.[0]?.url ? <img src={p.images[0].url} className="w-full h-full object-cover" alt="" /> : <Package size={18} className="m-auto mt-2.5 text-gray-400"/>}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-gray-800 truncate">{p.name}</p>
                                                <p className="text-xs text-orange-600 font-semibold">{parseInt(p.price).toLocaleString()}đ</p>
                                            </div>
                                            <Plus size={16} className="text-blue-600"/>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* CỘT PHẢI: DANH SÁCH THẺ SẢN PHẨM (60%) */}
                    <div className="w-full lg:w-3/5 flex flex-col">
                        <div className="flex justify-between items-center mb-3">
                            <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-2">
                                <Package size={14}/> Sản phẩm đã chọn ({selectedProducts.length})
                            </label>
                            {selectedProducts.length > 0 && (
                                <button type="button" onClick={() => setSelectedProducts([])} className="text-xs text-red-500 hover:underline">Xóa tất cả</button>
                            )}
                        </div>

                        <div className="flex-1 bg-gray-50 rounded-xl border border-gray-200 p-3 min-h-[250px] relative">
                            {selectedProducts.length === 0 ? (
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 gap-2">
                                    <Package size={40} className="opacity-20" />
                                    <span className="text-sm">Chưa có sản phẩm nào được chọn</span>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 gap-3 max-h-[300px] overflow-y-auto custom-scrollbar pr-1">
                                    {selectedProducts.map(p => (
                                        <div key={p._id} className="relative group bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-all h-fit">
                                            {/* Ảnh sản phẩm */}
                                            <div className="h-28 w-full bg-gray-100 relative overflow-hidden">
                                                {p.images?.[0]?.url ? (
                                                    <img src={p.images[0].url} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" alt={p.name} />
                                                ) : (
                                                    <ImageIcon size={24} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-gray-300" />
                                                )}
                                                {/* Nút Xóa Nổi */}
                                                <button 
                                                    type="button"
                                                    onClick={() => removeProduct(p._id)}
                                                    className="absolute top-2 right-2 p-1.5 bg-white/90 rounded-full text-red-500 hover:bg-red-500 hover:text-white shadow-sm opacity-0 group-hover:opacity-100 transition-all z-10"
                                                    title="Xóa sản phẩm này"
                                                >
                                                    <X size={14} />
                                                </button>
                                            </div>
                                            {/* Thông tin */}
                                            <div className="p-2.5">
                                                <h4 className="text-sm font-medium text-gray-800 line-clamp-1 mb-1" title={p.name}>{p.name}</h4>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-[10px] text-gray-400 line-through">{parseInt(p.price).toLocaleString()}đ</span>
                                                    <span className="text-xs font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded">
                                                        {formData.percent ? `-${formData.percent}%` : "??%"}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // --- CÁC TRƯỜNG HỢP THƯỜNG (1 CỘT NHỎ) ---
    return (
        <div className="col-span-1 md:col-span-1 space-y-1">
            <label className="text-xs font-semibold text-gray-500 uppercase">Chi tiết áp dụng</label>
            {(() => {
                switch (formData.conditionType) {
                    case 'category': return <Dropdown placeholder="-- Chọn danh mục --" value={formData.conditionValue} onChange={(e) => setFormData({...formData, conditionValue: e.target.value})} options={categories.map(c => ({ value: c._id, label: c.name }))} />;
                    case 'min_bill': return <Dropdown placeholder="-- Chọn mức hóa đơn --" value={formData.conditionValue} onChange={(e) => setFormData({...formData, conditionValue: e.target.value})} options={MONEY_OPTIONS} />;
                    case 'freeship': return <Dropdown placeholder="-- Áp dụng cho đơn từ --" value={formData.conditionValue} onChange={(e) => setFormData({...formData, conditionValue: e.target.value})} options={MONEY_OPTIONS} icon={Truck} color="text-green-600"/>;
                    case 'customer_group': return <Dropdown placeholder="-- Chọn hạng thành viên --" value={formData.conditionValue} onChange={(e) => setFormData({...formData, conditionValue: e.target.value})} options={MEMBER_OPTIONS} icon={Users} color="text-purple-600"/>;
                    case 'payment_method': return <Dropdown placeholder="-- Chọn phương thức --" value={formData.conditionValue} onChange={(e) => setFormData({...formData, conditionValue: e.target.value})} options={PAYMENT_OPTIONS} icon={CreditCard} color="text-blue-600"/>;
                    case 'birthday': return <Dropdown placeholder="-- Chọn tháng sinh --" value={formData.conditionValue} onChange={(e) => setFormData({...formData, conditionValue: e.target.value})} options={Array.from({length: 12}, (_, i) => ({ value: i + 1, label: `Tháng ${i + 1}` }))} />;
                    default: return <input disabled className="w-full border rounded-lg px-3 py-2.5 bg-gray-100 cursor-not-allowed" placeholder="Áp dụng cho toàn bộ" />;
                }
            })()}
        </div>
    );
  };

  // --- RENDER UI CHÍNH ---
  return (
    <div className="p-6 min-h-screen bg-gray-50">
      <Breadcrumb crumbs={[{ label: "Dashboard", href: "/admin/dashboard" }, { label: "Mã giảm giá" }]} />

      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4 mt-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Quản lý Mã giảm giá</h1>
          <p className="text-sm text-gray-500">Tạo voucher, Flash sale & Khuyến mãi vận chuyển</p>
        </div>
        <button onClick={() => { resetForm(); setShowModal(true); }} className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl hover:bg-blue-700 transition shadow-lg shadow-blue-200">
          <Plus size={20} /> Tạo mã mới
        </button>
      </div>

      {/* LIST */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden min-h-[400px] flex flex-col">
        {loading ? <div className="p-8 text-center text-gray-500">Đang tải...</div> : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 flex-1 content-start">
             {currentDiscounts.map(item => (
                <div key={item._id} className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition bg-white relative group h-fit">
                    {item.isStackable && (
                        <div className="absolute -top-2 -right-2 bg-purple-600 text-white text-[10px] px-2 py-0.5 rounded-full z-10 shadow-sm flex items-center gap-1">
                            <Layers size={10} /> Cộng dồn
                        </div>
                    )}
                    <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                            {item.conditionType === 'flash_sale' ? <Zap className="text-orange-500" size={20} /> : 
                             item.conditionType === 'freeship' ? <Truck className="text-green-600" size={20} /> :
                             <Ticket className="text-blue-600" size={20} />}
                            <span className="font-bold text-lg text-gray-800">{item.discountCode}</span>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full font-bold ${
                            item.conditionType === 'flash_sale' ? 'bg-orange-100 text-orange-700' : 
                            item.conditionType === 'freeship' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                        }`}>
                            {item.conditionType === 'freeship' ? 'FREESHIP' : `-${item.percent}%`}
                        </span>
                    </div>
                    <h3 className="text-sm font-medium text-gray-600 mb-1">{item.discountName}</h3>
                    <div className="text-xs text-gray-400 space-y-1">
                        <p>SL: {item.maxUses}</p>
                        {item.conditionType === 'min_bill' && <p>Đơn từ: {parseInt(item.conditionValue).toLocaleString()}đ</p>}
                        {item.conditionType === 'freeship' && <p>Freeship đơn từ: {parseInt(item.conditionValue).toLocaleString()}đ</p>}
                        {item.conditionType === 'customer_group' && <p>Khách hàng: {item.conditionValue.toUpperCase()}</p>}
                        {item.conditionType === 'flash_sale' && (
                            <div>
                                <p className="text-orange-600 font-semibold">⚡ {item.conditionValue}</p>
                                <p className="truncate max-w-[200px] text-[10px] bg-gray-100 inline-block px-1 rounded">
                                    {item.productIds?.length || 0} sản phẩm
                                </p>
                            </div>
                        )}
                    </div>
                    <div className="absolute bottom-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition">
                        <button onClick={() => handleEdit(item)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition" title="Chỉnh sửa">
                            <Pencil size={18} />
                        </button>
                        <button onClick={() => handleDelete(item._id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition" title="Xóa">
                            <Trash2 size={18} />
                        </button>
                    </div>
                </div>
             ))}
          </div>
        )}
        {!loading && discounts.length > 0 && (
             <div className="p-4 border-t border-gray-100 flex justify-center"><Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} /></div>
        )}
      </div>

      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className={`bg-white rounded-2xl shadow-2xl overflow-hidden animate-fade-in-up flex flex-col max-h-[95vh] ${formData.conditionType === 'flash_sale' ? 'w-full max-w-4xl' : 'w-full max-w-2xl'}`}>
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 flex-shrink-0">
                <h2 className="text-lg font-bold text-gray-800">
                    {editingDiscount ? "Chỉnh sửa mã giảm giá" : "Tạo mã giảm giá mới"}
                </h2>
                <button onClick={() => { setShowModal(false); resetForm(); }} className="p-2 text-gray-400 hover:bg-gray-200 rounded-full"><X size={20} /></button>
            </div>

            <form onSubmit={handleCreate} className="p-6 space-y-5 overflow-y-auto custom-scrollbar flex-1">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1"><label className="text-sm font-medium text-gray-700">Tên chương trình</label><input required className="w-full border rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-blue-500" placeholder="vd: Siêu Sale" value={formData.discountName} onChange={e => setFormData({...formData, discountName: e.target.value})} /></div>
                    <div className="space-y-1"><label className="text-sm font-medium text-gray-700">Mã Voucher</label><input required className="w-full border rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 uppercase font-bold text-blue-600" placeholder="vd: SALE50" value={formData.discountCode} onChange={e => setFormData({...formData, discountCode: e.target.value.toUpperCase()})} /></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1"><label className="text-sm font-medium text-gray-700">Giảm (%)</label><div className="relative"><input type="number" min="1" max="100" required className="w-full border rounded-lg px-3 py-2.5 pl-9 outline-none focus:ring-2 focus:ring-blue-500" value={formData.percent} onChange={e => setFormData({...formData, percent: e.target.value})} /><Percent size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" /></div></div>
                    <div className="space-y-1"><label className="text-sm font-medium text-gray-700">Số lượng</label><input type="number" min="1" className="w-full border rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-blue-500" value={formData.maxUses} onChange={e => setFormData({...formData, maxUses: e.target.value})} /></div>
                </div>

                <div className={`p-4 rounded-xl border space-y-4 transition-colors ${formData.conditionType === 'flash_sale' ? 'bg-orange-50/50 border-orange-200' : 'bg-blue-50/50 border-blue-100'}`}>
                    <h3 className={`text-sm font-bold flex items-center gap-2 ${formData.conditionType === 'flash_sale' ? 'text-orange-700' : 'text-blue-700'}`}><Filter size={16} /> Điều kiện áp dụng</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-gray-500 uppercase">Loại mã</label>
                            <div className="relative">
                                <select className="w-full border rounded-lg px-3 py-2.5 bg-white focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer" value={formData.conditionType} onChange={(e) => setFormData({ ...formData, conditionType: e.target.value, conditionValue: "" })}>
                                    <option value="all">🎫 Tất cả đơn hàng</option>
                                    <option value="min_bill">💰 Hóa đơn từ (VNĐ)</option>
                                    <option value="freeship">🚚 Miễn phí vận chuyển</option>
                                    <option value="flash_sale">⚡ Flash Sale (Giờ vàng)</option>
                                    <option value="customer_group">👑 Hạng thành viên</option>
                                    <option value="category">📦 Danh mục sản phẩm</option>
                                    <option value="payment_method">💳 Phương thức thanh toán</option>
                                </select>
                                <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                            </div>
                        </div>
                        
                        {/* Render condition content based on type (Flash sale will render differently) */}
                        {formData.conditionType !== 'flash_sale' && renderConditionContent()}
                    </div>

                    {/* FLASH SALE RENDERS HERE TO TAKE FULL WIDTH */}
                    {formData.conditionType === 'flash_sale' && renderConditionContent()}

                    {/* CHECKBOX CỘNG DỒN */}
                    <div className="flex items-center gap-3 pt-3 border-t border-gray-200/50">
                        <div className="relative flex items-center">
                            <input 
                                type="checkbox" id="stackable"
                                className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border border-gray-300 transition-all checked:border-blue-600 checked:bg-blue-600 hover:shadow-sm"
                                checked={formData.isStackable}
                                onChange={(e) => setFormData({...formData, isStackable: e.target.checked})}
                            />
                            <CheckSquare className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 peer-checked:opacity-100" size={14} />
                        </div>
                        <label htmlFor="stackable" className="cursor-pointer text-sm text-gray-700 select-none flex items-center gap-2 font-medium">
                            <Layers size={16} className="text-blue-600"/>
                            Cho phép áp dụng cộng dồn với mã khác?
                        </label>
                    </div>

                    {/* CHECKBOX ĐỔI ĐIỂM */}
                    <div className="space-y-3 pt-3 border-t border-gray-200/50">
                        <div className="flex items-center gap-3">
                            <div className="relative flex items-center">
                                <input 
                                    type="checkbox" id="redeemable"
                                    className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border border-gray-300 transition-all checked:border-orange-600 checked:bg-orange-600 hover:shadow-sm"
                                    checked={formData.isRedeemable}
                                    onChange={(e) => setFormData({...formData, isRedeemable: e.target.checked})}
                                />
                                <CheckSquare className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 peer-checked:opacity-100" size={14} />
                            </div>
                            <label htmlFor="redeemable" className="cursor-pointer text-sm text-gray-700 select-none flex items-center gap-2 font-medium">
                                <Gift size={16} className="text-orange-600"/>
                                Có thể đổi bằng điểm thưởng?
                            </label>
                        </div>
                        
                        {formData.isRedeemable && (
                            <div className="ml-8">
                                <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Số điểm cần</label>
                                <input 
                                    type="number" 
                                    min="1"
                                    placeholder="Nhập số điểm cần để đổi voucher này"
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                    value={formData.pointsCost}
                                    onChange={(e) => setFormData({...formData, pointsCost: e.target.value})}
                                />
                                <p className="text-xs text-gray-500 mt-1">Ví dụ: 100 điểm = Voucher giảm {formData.percent}%</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <Calendar enableTime={true} label="Bắt đầu" value={formData.startDate} onChange={(date) => setFormData({...formData, startDate: date})} />
                     <Calendar enableTime={true} label="Kết thúc" value={formData.endDate} onChange={(date) => setFormData({...formData, endDate: date})} />
                </div>
            </form>
            
            <div className="p-4 border-t border-gray-100 flex gap-3 flex-shrink-0 bg-white">
                <button type="button" onClick={() => { setShowModal(false); resetForm(); }} className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition">Hủy bỏ</button>
                <button type="submit" onClick={handleCreate} disabled={creating} className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-70 transition shadow-lg shadow-blue-200">
                    {creating ? "Đang xử lý..." : (editingDiscount ? "Cập nhật" : "Xác nhận tạo")}
                </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}