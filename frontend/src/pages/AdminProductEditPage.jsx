// src/pages/AdminProductEditPage.jsx
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import api, { getImageUrl } from '../services/api';
import Calendar from '../components/common/Calendar';

const emptyVariant = () => ({
  variantId: "",
  name: "",
  oldPrice: "",
  discount: 0, 
  price: 0, 
  stock: 0,
});

// Helper: Format số với dấu chấm phân cách hàng nghìn
const formatPrice = (value) => {
  if (!value && value !== 0) return "";
  const num = String(value).replace(/\D/g, ""); // Chỉ giữ số
  if (!num) return "";
  return Number(num).toLocaleString("vi-VN");
};

// Helper: Parse giá từ string có dấu chấm về số
const parsePrice = (formattedValue) => {
  if (!formattedValue) return 0;
  return Number(String(formattedValue).replace(/\./g, "")) || 0;
};

export default function AdminProductEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState([]);
  const [isNewCategory, setIsNewCategory] = useState(false);
  const [primaryCategorySearch, setPrimaryCategorySearch] = useState("");
  const [showPrimaryCategoryDropdown, setShowPrimaryCategoryDropdown] = useState(false);
  
  const [product, setProduct] = useState({
    productName: "",
    productId: "",
    brand: "",
    category: { categoryId: "", name: "" },
    categories: [], // Danh sách danh mục
    description: "",
    images: [], 
    variants: [emptyVariant()],
    createdAt: "",
  });

  // Load danh mục từ Category model (giống trang New)
  useEffect(() => {
    import('../controllers/categoryController').then(({ CategoryController }) => {
      CategoryController.getAll().then((cats) => setCategories(cats)).catch((err) => console.error(err));
    });
  }, []);

  useEffect(() => {
    let ignore = false;
    async function fetchProduct() {
      try {
        setLoading(true);
        const res = await api.get(`/products/${id}`);
        const data = res.data?.product || res.data;
        if (!data) throw new Error("No data");
        if (ignore) return;

        setProduct({
          productName: data.productName || data.name || "",
          productId: data.productId || "",
          brand: data.brand || "",
          category: data.category || { categoryId: "", name: "" },
          description: data.productDescription || data.description || "",
          images: Array.isArray(data.images) ? data.images : [], 
          variants: Array.isArray(data.variants) && data.variants.length
            ? data.variants.map((v) => ({
                variantId: v.variantId || "",
                name: v.name || "",
                oldPrice: v.oldPrice ?? 0,
                discount: v.discount ?? 0, 
                price: v.price ?? 0,
                stock: v.stock ?? 0,
                images: Array.isArray(v.images) ? v.images : ["", ""],
              }))
            : [emptyVariant()],
          createdAt: data.createdAt ? new Date(data.createdAt).toISOString().split('T')[0] : "",
        });
      } catch (err) { toast.error(err.message); } finally { if (!ignore) setLoading(false); }
    }
    fetchProduct();
    return () => { ignore = true; };
  }, [id]);

  const updateField = (field, value) => setProduct((prev) => ({ ...prev, [field]: value }));
  
  // Logic tính toán khi nhập liệu (Giống trang New)
  const updateVariantField = (index, field, value) => {
    setProduct((prev) => {
      const variants = [...prev.variants];
      const variant = { ...variants[index] };
      
      // Xử lý giá gốc - format với dấu chấm
      if (field === 'oldPrice') {
        const numericValue = parsePrice(value);
        variant.oldPrice = numericValue;
        // Tính lại giá bán
        const disc = Number(variant.discount) || 0;
        variant.price = Math.max(0, Math.round(numericValue * (100 - disc) / 100));
      } else if (field === 'discount') {
        variant.discount = value;
        const old = parsePrice(variant.oldPrice);
        const disc = Number(value) || 0;
        variant.price = Math.max(0, Math.round(old * (100 - disc) / 100));
      } else {
        variant[field] = value;
      }

      variants[index] = variant;
      return { ...prev, variants };
    });
  };

  // Fuzzy search function for categories
  const fuzzySearch = (searchTerm, items) => {
    if (!searchTerm.trim()) return items;
    const search = searchTerm.toLowerCase();
    return items.filter((item) => {
      const name = (item.name || item.categoryName || "").toLowerCase();
      // Simple fuzzy: check if search chars appear in order
      let searchIdx = 0;
      for (let i = 0; i < name.length && searchIdx < search.length; i++) {
        if (name[i] === search[searchIdx]) searchIdx++;
      }
      return searchIdx === search.length;
    });
  };

  const handlePrimaryCategorySelect = (category) => {
    setProduct((prev) => ({
      ...prev,
      category: { categoryId: category.categoryId, name: category.name || category.categoryName }
    }));
    setPrimaryCategorySearch("");
    setShowPrimaryCategoryDropdown(false);
  };

  const addCategory = (categoryId) => {
    const selected = categories.find((c) => c.categoryId === categoryId);
    if (selected) {
      setProduct((prev) => ({
        ...prev,
        categories: [...(prev.categories || []), { categoryId: selected.categoryId, categoryName: selected.name || selected.categoryName }]
      }));
    }
  };

  const removeCategory = (categoryId) => {
    setProduct((prev) => ({
      ...prev,
      categories: (prev.categories || []).filter((cat) => cat.categoryId !== categoryId)
    }));
  };

  const handleCategorySelect = (e) => { 
      const val = e.target.value; 
      if(val==="NEW"){setIsNewCategory(true);setProduct(p=>({...p,category:{categoryId:"",name:""}}))}
      else{setIsNewCategory(false);const s=categories.find(c=>c.categoryId===val);setProduct(p=>({...p,category:s?{categoryId:s.categoryId,name:s.name||s.categoryName}:{categoryId:"",name:""}}))}
  };
  const handleImageChange = (index, value) => { const img=[...product.images]; img[index]=value; setProduct(p=>({...p,images:img})) };
  const addImageField = () => setProduct(p=>({...p,images:[...p.images,""]}));
  const removeImageField = (i) => setProduct(p=>({...p,images:p.images.filter((_,idx)=>idx!==i)}));
  
  // Xử lý upload file ảnh
  const handleFileUpload = async (index, event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Kiểm tra loại file
    if (!file.type.startsWith('image/')) {
      toast.error('Vui lòng chọn file ảnh!');
      return;
    }

    // Kiểm tra kích thước file (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File ảnh quá lớn! Vui lòng chọn file nhỏ hơn 5MB.');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('image', file);

      // Upload file lên backend
      const response = await api.post('/upload/image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // Cập nhật đường dẫn ảnh vào state
      const imagePath = response.data.imagePath || response.data.path;
      handleImageChange(index, imagePath);
      toast.success('Upload ảnh thành công!');
      
    } catch (error) {
      console.error('Upload failed:', error);
      toast.error('Upload ảnh thất bại: ' + (error.response?.data?.message || error.message));
    }
  };
  
  const addVariant = () => setProduct(p=>({...p,variants:[...p.variants,emptyVariant()]}));
  const removeVariant = (i) => setProduct(p=>({...p,variants:p.variants.filter((_,idx)=>idx!==i)}));

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const catName = product.category?.name?.trim() || "Uncategorized";
      let catId = product.category?.categoryId?.trim();
      if (!catId || isNewCategory) catId = catName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "-");

      const payload = {
        productName: product.productName,
        brand: product.brand,
        productDescription: product.description,
        category: { categoryId: catId, categoryName: catName },
        images: product.images.filter(img => img && img.trim() !== ""),
        variants: product.variants.map((v) => ({
          variantId: v.variantId,
          name: v.name,
          oldPrice: parsePrice(v.oldPrice),
          discount: Number(v.discount) || 0,
          price: Number(v.price) || 0,
          stock: Number(v.stock) || 0,
        })),
        createdAt: product.createdAt ? new Date(product.createdAt) : undefined,
      };

      await api.put(`/products/${id}`, payload);
      toast.success("Cập nhật thành công");
      navigate("/admin/products");
    } catch (err) {
      toast.error(err.response?.data?.message || "Lỗi cập nhật");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-6 text-center">Đang tải...</div>;

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white shadow-sm mt-4 rounded">
      <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Chỉnh sửa sản phẩm</h1>
          <button type="button" onClick={() => navigate("/admin/products")} className="text-gray-500 hover:text-blue-600 text-sm">&larr; Quay lại danh sách</button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div><label className="block text-sm font-medium mb-1">Tên sản phẩm</label><input className="w-full border rounded px-3 py-2" value={product.productName} onChange={e => updateField("productName", e.target.value)} required /></div>
          <div><label className="block text-sm font-medium mb-1">Mã (Read-only)</label><input className="w-full border rounded px-3 py-2 bg-gray-100 text-gray-500" value={product.productId} disabled /></div>
          <div><label className="block text-sm font-medium mb-1">Thương hiệu</label><input className="w-full border rounded px-3 py-2" value={product.brand} onChange={e => updateField("brand", e.target.value)} /></div>
          <div><label className="block text-sm font-medium mb-1">Danh mục chính *</label><select className="w-full border rounded px-3 py-2 bg-white" onChange={handleCategorySelect} value={product.category?.categoryId || ""}><option value="">-- Chọn --</option>{categories.map((c) => (<option key={c.categoryId} value={c.categoryId}>{c.name || c.categoryName}</option>))}</select></div>
          <div>
            <label className="block text-sm font-medium mb-2">Danh mục khác</label>
            <div className="flex flex-col gap-2 max-h-48 overflow-y-auto border rounded p-2 bg-gray-50">
              {categories.map((c) => {
                const isSelected = Array.isArray(product.categories) && product.categories.some(cat => cat.categoryId === c.categoryId);
                return (
                  <label key={c.categoryId} className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 p-2 rounded">
                    <input 
                      type="checkbox" 
                      checked={isSelected}
                      onChange={(e) => {
                        if (e.target.checked) addCategory(c.categoryId);
                        else removeCategory(c.categoryId);
                      }}
                      className="rounded"
                    />
                    <span className="text-sm">{c.name || c.categoryName}</span>
                  </label>
                );
              })}
            </div>
            {product.categories.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {product.categories.map((cat) => (
                  <span key={cat.categoryId} className="inline-flex items-center gap-1 bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded">
                    {cat.categoryName}
                    <button type="button" onClick={() => removeCategory(cat.categoryId)} className="text-red-600 hover:text-red-800">✕</button>
                  </span>
                ))}
              </div>
            )}
          </div>
          <div>
            <Calendar
              label="Ngày tạo (Sản phẩm mới)"
              value={product.createdAt}
              onChange={(val) => updateField("createdAt", val ? val.split('T')[0] : "")}
              placeholder="Chọn ngày tạo..."
            />
            <p className="text-xs text-gray-500 mt-1">Sản phẩm trong 30 ngày gần đây sẽ hiển thị ở "Sản phẩm mới"</p>
          </div>
        </div>

        <div><label className="block text-sm font-medium mb-1">Mô tả</label><textarea className="w-full border rounded px-3 py-2 h-24" value={product.description} onChange={e => updateField("description", e.target.value)} /></div>

        {/* DANH MỤC */}
        <div className="border rounded p-4 bg-white">
          <h3 className="font-bold text-gray-800 mb-4">Danh mục sản phẩm</h3>
          
          {/* Danh mục chính đã chọn */}
          {product.category?.categoryId && (
            <div className="mb-4 pb-4 border-b">
              <p className="text-xs font-semibold text-gray-600 mb-2">Danh mục chính:</p>
              <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
                {product.category.categoryName || product.category.categoryId}
                <button 
                  type="button" 
                  onClick={() => setProduct(p => ({ ...p, category: { categoryId: "", name: "" }, categories: [] }))}
                  className="ml-1 text-blue-700 hover:text-blue-900 font-bold"
                >
                  ✕
                </button>
              </div>
            </div>
          )}

          {/* Danh mục phụ đã chọn */}
          {Array.isArray(product.categories) && product.categories.length > 0 && (
            <div className="mb-4 pb-4 border-b">
              <p className="text-xs font-semibold text-gray-600 mb-2">Danh mục khác:</p>
              <div className="flex flex-wrap gap-2">
                {product.categories.map((cat) => (
                  <div key={cat.categoryId} className="inline-flex items-center gap-1 bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium">
                    {cat.categoryName}
                    <button 
                      type="button" 
                      onClick={() => removeCategory(cat.categoryId)}
                      className="ml-1 text-green-700 hover:text-green-900 font-bold"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Chọn danh mục chính */}
          <div className="mb-4 relative">
            <label className="block text-sm font-medium mb-2">Chọn danh mục chính *</label>
            <div className="relative">
              <input
                type="text"
                placeholder="Nhập để tìm danh mục..."
                value={primaryCategorySearch}
                onChange={(e) => {
                  setPrimaryCategorySearch(e.target.value);
                  setShowPrimaryCategoryDropdown(true);
                }}
                onFocus={() => setShowPrimaryCategoryDropdown(true)}
                onBlur={() => setTimeout(() => setShowPrimaryCategoryDropdown(false), 200)}
                className="w-full border rounded px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {product.category?.categoryId && (
                <div className="mt-2 inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
                  {product.category.name}
                  <button
                    type="button"
                    onClick={() => {
                      setProduct(p => ({ ...p, category: { categoryId: "", name: "" }, categories: [] }));
                      setPrimaryCategorySearch("");
                    }}
                    className="ml-1 text-blue-700 hover:text-blue-900 font-bold"
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>

            {/* Dropdown danh mục */}
            {showPrimaryCategoryDropdown && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded shadow-lg z-10 max-h-56 overflow-y-auto">
                {fuzzySearch(primaryCategorySearch, categories).length > 0 ? (
                  fuzzySearch(primaryCategorySearch, categories).map((c) => (
                    <button
                      key={c.categoryId}
                      type="button"
                      onClick={() => handlePrimaryCategorySelect(c)}
                      className="w-full text-left px-3 py-2 hover:bg-blue-50 transition border-b last:border-b-0"
                    >
                      {c.name || c.categoryName}
                    </button>
                  ))
                ) : (
                  <div className="px-3 py-2 text-gray-500 text-sm">Không tìm thấy danh mục</div>
                )}
              </div>
            )}
          </div>

          {/* Danh sách danh mục */}
          <div>
            <label className="block text-sm font-medium mb-2">Danh sách danh mục</label>
            <div className="border rounded p-3 bg-gray-50 max-h-56 overflow-y-auto space-y-2">
              {Array.isArray(categories) && fuzzySearch(primaryCategorySearch, categories).map((c) => {
                const isSelected = Array.isArray(product.categories) && product.categories.some(cat => cat.categoryId === c.categoryId);
                const isPrimary = product.category?.categoryId === c.categoryId;
                return (
                  <label key={c.categoryId} className="flex items-center gap-2 cursor-pointer hover:bg-white p-2 rounded transition">
                    <input 
                      type="checkbox" 
                      checked={isSelected}
                      disabled={isPrimary}
                      onChange={(e) => {
                        if (e.target.checked) addCategory(c.categoryId);
                        else removeCategory(c.categoryId);
                      }}
                      className="rounded"
                    />
                    <span className={`text-sm ${isPrimary ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
                      {c.name || c.categoryName}
                      {isPrimary && <span className="text-xs text-gray-500 ml-1">(chính)</span>}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>
        </div>

        <div className="border p-4 rounded bg-gray-50">
          <div className="flex justify-between items-center mb-3">
            <label className="block text-sm font-bold text-gray-700">Hình ảnh</label>
            <button type="button" onClick={addImageField} className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded">+ Thêm ảnh</button>
          </div>
          <div className="space-y-4">
            {product.images.map((imgUrl, idx) => (
              <div key={idx} className="border rounded p-3 bg-white">
                <div className="flex gap-3 items-start">
                  {/* Preview Image */}
                  <div className="flex-shrink-0">
                    {imgUrl && (
                      <img 
                        src={getImageUrl(imgUrl)} 
                        alt="" 
                        className="w-16 h-16 object-cover rounded border bg-white"
                        onError={(e) => {
                          e.target.src = '/img/default.png';
                        }}
                      />
                    )}
                  </div>
                  
                  {/* Input Options */}
                  <div className="flex-1 space-y-2">
                    {/* URL Input */}
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">Đường dẫn ảnh hoặc URL</label>
                      <input 
                        type="text" 
                        className="w-full border rounded px-3 py-2 text-sm" 
                        value={imgUrl} 
                        onChange={(e) => handleImageChange(idx, e.target.value)}
                        placeholder="Nhập URL (https://...) hoặc đường dẫn (/images/...)"
                      />
                    </div>
                    
                    {/* File Upload */}
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">Hoặc chọn file từ máy tính</label>
                      <input 
                        type="file" 
                        accept="image/*"
                        className="w-full text-sm"
                        onChange={(e) => handleFileUpload(idx, e)}
                      />
                    </div>
                    
                    {/* Quick Select from Backend Images */}
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">Hoặc chọn từ thư viện có sẵn</label>
                      <select 
                        className="w-full border rounded px-3 py-2 text-sm"
                        value=""
                        onChange={(e) => {
                          if (e.target.value) {
                            handleImageChange(idx, e.target.value);
                          }
                        }}
                      >
                        <option value="">-- Chọn ảnh có sẵn --</option>
                        <option value="/images/ASUSTUFGamingF15.png">ASUS TUF Gaming F15</option>
                        <option value="/images/MSIKatanaGF66.png">MSI Katana GF66</option>
                        <option value="/images/AcerNitro5.jpg">Acer Nitro 5</option>
                        <option value="/images/HPVictus16.png">HP Victus 16</option>
                        <option value="/images/MacBookAirM2.png">MacBook Air M2</option>
                        <option value="/images/LenovoThinkPadX1Carbon.jpg">ThinkPad X1 Carbon</option>
                        <option value="/images/ASUSZenBookOLED.jpg">ASUS ZenBook OLED</option>
                        <option value="/images/Samsung990Pro.jpg">Samsung 990 Pro SSD</option>
                        <option value="/images/LGUltraGear27.jpg">LG UltraGear 27 Monitor</option>
                        <option value="/images/AOC24G2.jpg">AOC 24G2 Monitor</option>
                      </select>
                    </div>
                  </div>
                  
                  {/* Remove Button */}
                  <button 
                    type="button" 
                    onClick={() => removeImageField(idx)} 
                    className="text-red-500 hover:text-red-700 font-bold px-2 py-1 text-sm"
                    title="Xóa ảnh này"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* BIẾN THỂ & GIÁ */}
        <div className="border rounded overflow-hidden">
            <div className="bg-gray-100 p-2 flex justify-between items-center"><h3 className="font-bold text-gray-700">Biến thể & Giá bán</h3><button type="button" onClick={addVariant} className="text-sm bg-white border px-2 py-1 rounded shadow-sm">+ Thêm</button></div>
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-600"><tr><th className="px-3 py-2 w-48">Tên</th><th className="px-3 py-2 w-24">Mã</th><th className="px-3 py-2 w-32">Giá gốc</th><th className="px-3 py-2 w-24 text-center">% Giảm</th><th className="px-3 py-2 w-32">Giá bán (Auto)</th><th className="px-3 py-2 w-24">Kho</th><th className="px-3 py-2 w-10"></th></tr></thead>
              <tbody>
                {product.variants.map((v, idx) => (
                  <tr key={idx} className="border-b last:border-0">
                    <td className="p-2"><input className="w-full border rounded px-2 py-1" value={v.name} onChange={e=>updateVariantField(idx,"name",e.target.value)}/></td>
                    <td className="p-2"><input className="w-full border rounded px-2 py-1" value={v.variantId} onChange={e=>updateVariantField(idx,"variantId",e.target.value)}/></td>
                    
                    {/* GIÁ GỐC - Format với dấu chấm */}
                    <td className="p-2">
                      <input 
                        type="text" 
                        className="w-full border rounded px-2 py-1" 
                        value={formatPrice(v.oldPrice)} 
                        onChange={e => updateVariantField(idx, "oldPrice", e.target.value)} 
                        placeholder="0"
                      />
                    </td>
                    
                    {/* % GIẢM - Không hiện số 0 ở đầu */}
                    <td className="p-2 relative">
                        <input 
                          type="text" 
                          inputMode="numeric"
                          className="w-full border rounded px-2 py-1 text-center font-bold text-green-600" 
                          value={v.discount === 0 ? "" : v.discount} 
                          onChange={e => {
                            const val = e.target.value.replace(/\D/g, "");
                            updateVariantField(idx, "discount", val === "" ? 0 : Number(val));
                          }} 
                          placeholder="0"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none">%</span>
                    </td>

                    {/* GIÁ BÁN (READONLY) - Format với dấu chấm */}
                    <td className="p-2">
                      <input 
                        type="text" 
                        className="w-full border rounded px-2 py-1 bg-green-50 font-bold text-green-600 cursor-not-allowed" 
                        value={formatPrice(v.price)} 
                        readOnly 
                      />
                    </td>

                    {/* KHO - Không hiện số 0 ở đầu */}
                    <td className="p-2">
                      <input 
                        type="text" 
                        inputMode="numeric"
                        className="w-full border rounded px-2 py-1" 
                        value={v.stock === 0 ? "" : v.stock} 
                        onChange={e => {
                          const val = e.target.value.replace(/\D/g, "");
                          updateVariantField(idx, "stock", val === "" ? 0 : Number(val));
                        }}
                        placeholder="0"
                      />
                    </td>
                    <td className="p-2 text-center"><button type="button" onClick={()=>removeVariant(idx)} className="text-red-500 hover:text-red-700">Xóa</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
        </div>

        <div className="flex gap-3 pt-4 border-t sticky bottom-0 bg-white py-4">
          <button type="submit" disabled={saving} className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 shadow-sm disabled:opacity-50">
            {saving ? "Đang lưu..." : "Lưu thay đổi"}
          </button>
          <button type="button" onClick={() => navigate("/admin/products")} className="px-6 py-2 border rounded hover:bg-gray-50 text-gray-700">
            Trở về danh sách
          </button>
        </div>
      </form>
    </div>
  );
}