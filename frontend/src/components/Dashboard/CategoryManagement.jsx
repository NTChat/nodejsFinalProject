// Frontend - Category Management Component
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const CategoryManagement = () => {
  const [categories, setCategories] = useState([]);
  const [treeView, setTreeView] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [viewMode, setViewMode] = useState('tree'); // 'tree' or 'list'
  
  const [formData, setFormData] = useState({
    categoryId: '',
    name: '',
    slug: '',
    description: '',
    image: '',
    icon: '',
    parentId: null,
    status: 'active',
    displayOrder: 0
  });

  const API_URL = '/api/categories';

  // Fetch categories
  useEffect(() => {
    fetchCategories();
  }, [viewMode]);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const endpoint = viewMode === 'tree' ? `${API_URL}/tree` : API_URL;
      const response = await axios.get(endpoint);
      
      if (viewMode === 'tree') {
        setTreeView(response.data.categories);
      } else {
        setCategories(response.data.categories);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      alert('Lỗi khi tải danh mục');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Auto-generate slug from name
    if (name === 'name') {
      const slug = value
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[đĐ]/g, 'd')
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');
      setFormData(prev => ({ ...prev, slug }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      if (editingCategory) {
        // Update
        await axios.put(`${API_URL}/${editingCategory._id}`, formData, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        alert('Cập nhật danh mục thành công!');
      } else {
        // Create
        await axios.post(API_URL, formData, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        alert('Tạo danh mục thành công!');
      }
      
      resetForm();
      fetchCategories();
    } catch (error) {
      console.error('Error saving category:', error);
      alert(error.response?.data?.message || 'Lỗi khi lưu danh mục');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (category) => {
    setEditingCategory(category);
    setFormData({
      categoryId: category.categoryId,
      name: category.name,
      slug: category.slug,
      description: category.description || '',
      image: category.image || '',
      icon: category.icon || '',
      parentId: category.parentId || null,
      status: category.status,
      displayOrder: category.displayOrder
    });
    setShowForm(true);
  };

  const handleDelete = async (category) => {
    if (!window.confirm(`Xác nhận xóa danh mục "${category.name}"?`)) return;
    
    try {
      setLoading(true);
      await axios.delete(`${API_URL}/${category._id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      alert('Xóa danh mục thành công!');
      fetchCategories();
    } catch (error) {
      console.error('Error deleting category:', error);
      alert(error.response?.data?.message || 'Lỗi khi xóa danh mục');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      categoryId: '',
      name: '',
      slug: '',
      description: '',
      image: '',
      icon: '',
      parentId: null,
      status: 'active',
      displayOrder: 0
    });
    setEditingCategory(null);
    setShowForm(false);
  };

  // Render tree node recursively
  const renderTreeNode = (category, level = 0) => {
    return (
      <div key={category.categoryId} style={{ marginLeft: `${level * 30}px` }} className="category-tree-node">
        <div className="category-item">
          <span className="category-icon">{category.icon}</span>
          <span className="category-name">{category.name}</span>
          <span className="category-badge">Level {category.level}</span>
          {category.productCount > 0 && (
            <span className="product-count">{category.productCount} SP</span>
          )}
          {category.children && category.children.length > 0 && (
            <span className="children-count">({category.children.length} con)</span>
          )}
          <div className="category-actions">
            <button onClick={() => handleEdit(category)} className="btn-edit">Sửa</button>
            <button onClick={() => handleDelete(category)} className="btn-delete">Xóa</button>
          </div>
        </div>
        
        {category.children && category.children.length > 0 && (
          <div className="category-children">
            {category.children.map(child => renderTreeNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="category-management">
      <div className="page-header">
        <h1>Quản lý Danh mục</h1>
        <div className="header-actions">
          <div className="view-toggle">
            <button 
              className={viewMode === 'tree' ? 'active' : ''}
              onClick={() => setViewMode('tree')}
            >
              🌳 Tree View
            </button>
            <button 
              className={viewMode === 'list' ? 'active' : ''}
              onClick={() => setViewMode('list')}
            >
              📋 List View
            </button>
          </div>
          <button onClick={() => setShowForm(!showForm)} className="btn-primary">
            {showForm ? '✖ Đóng' : '➕ Thêm Danh mục'}
          </button>
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <div className="category-form-container">
          <h2>{editingCategory ? 'Sửa Danh mục' : 'Thêm Danh mục Mới'}</h2>
          <form onSubmit={handleSubmit} className="category-form">
            <div className="form-row">
              <div className="form-group">
                <label>Mã danh mục *</label>
                <input
                  type="text"
                  name="categoryId"
                  value={formData.categoryId}
                  onChange={handleInputChange}
                  disabled={!!editingCategory}
                  required
                  placeholder="vd: laptop"
                />
              </div>
              
              <div className="form-group">
                <label>Tên danh mục *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  placeholder="vd: Laptop"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Slug *</label>
                <input
                  type="text"
                  name="slug"
                  value={formData.slug}
                  onChange={handleInputChange}
                  required
                  placeholder="Tự động tạo từ tên"
                />
              </div>
              
              <div className="form-group">
                <label>Icon (emoji)</label>
                <input
                  type="text"
                  name="icon"
                  value={formData.icon}
                  onChange={handleInputChange}
                  placeholder="vd: 💻"
                />
              </div>
            </div>

            <div className="form-group">
              <label>Mô tả</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows="3"
                placeholder="Mô tả ngắn về danh mục"
              />
            </div>

            <div className="form-group">
              <label>Hình ảnh (URL)</label>
              <input
                type="text"
                name="image"
                value={formData.image}
                onChange={handleInputChange}
                placeholder="https://cdn.tgdd.vn/..."
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Danh mục cha</label>
                <select
                  name="parentId"
                  value={formData.parentId || ''}
                  onChange={handleInputChange}
                >
                  <option value="">-- Không có (cấp 1) --</option>
                  {categories
                    .filter(c => c.level < 2 && c.categoryId !== formData.categoryId)
                    .map(cat => (
                      <option key={cat.categoryId} value={cat.categoryId}>
                        {'  '.repeat(cat.level)}└ {cat.name} (Level {cat.level})
                      </option>
                    ))}
                </select>
              </div>

              <div className="form-group">
                <label>Trạng thái</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                >
                  <option value="active">Hoạt động</option>
                  <option value="inactive">Không hoạt động</option>
                </select>
              </div>

              <div className="form-group">
                <label>Thứ tự hiển thị</label>
                <input
                  type="number"
                  name="displayOrder"
                  value={formData.displayOrder}
                  onChange={handleInputChange}
                  min="0"
                />
              </div>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? 'Đang lưu...' : editingCategory ? 'Cập nhật' : 'Tạo mới'}
              </button>
              <button type="button" onClick={resetForm} className="btn-secondary">
                Hủy
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Category Display */}
      <div className="categories-display">
        {loading ? (
          <div className="loading">Đang tải...</div>
        ) : viewMode === 'tree' ? (
          <div className="category-tree">
            {treeView.map(cat => renderTreeNode(cat))}
          </div>
        ) : (
          <table className="category-table">
            <thead>
              <tr>
                <th>Icon</th>
                <th>Tên</th>
                <th>Cấp</th>
                <th>Danh mục cha</th>
                <th>SP</th>
                <th>Con</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {categories.map(cat => (
                <tr key={cat._id}>
                  <td>{cat.icon}</td>
                  <td style={{ paddingLeft: `${cat.level * 20}px` }}>
                    {cat.name}
                  </td>
                  <td>
                    <span className="badge-level">L{cat.level}</span>
                  </td>
                  <td>{cat.parent?.name || '-'}</td>
                  <td>{cat.productCount}</td>
                  <td>{cat.childrenCount || 0}</td>
                  <td>
                    <span className={`badge-status ${cat.status}`}>
                      {cat.status === 'active' ? 'Hoạt động' : 'Tắt'}
                    </span>
                  </td>
                  <td>
                    <button onClick={() => handleEdit(cat)} className="btn-edit">Sửa</button>
                    <button onClick={() => handleDelete(cat)} className="btn-delete">Xóa</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <style jsx>{`
        .category-management {
          padding: 20px;
          max-width: 1400px;
          margin: 0 auto;
        }
        
        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 30px;
        }
        
        .header-actions {
          display: flex;
          gap: 15px;
        }
        
        .view-toggle button {
          padding: 8px 16px;
          margin-right: 5px;
          border: 1px solid #ddd;
          background: white;
          cursor: pointer;
        }
        
        .view-toggle button.active {
          background: #007bff;
          color: white;
          border-color: #007bff;
        }
        
        .category-form-container {
          background: white;
          padding: 25px;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          margin-bottom: 30px;
        }
        
        .form-row {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 20px;
          margin-bottom: 20px;
        }
        
        .form-group label {
          display: block;
          font-weight: 600;
          margin-bottom: 8px;
        }
        
        .form-group input,
        .form-group select,
        .form-group textarea {
          width: 100%;
          padding: 10px;
          border: 1px solid #ddd;
          border-radius: 4px;
        }
        
        .category-tree-node {
          margin: 10px 0;
        }
        
        .category-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px;
          background: white;
          border: 1px solid #e0e0e0;
          border-radius: 6px;
          margin-bottom: 5px;
        }
        
        .category-icon {
          font-size: 24px;
        }
        
        .category-name {
          font-weight: 600;
          flex: 1;
        }
        
        .category-badge,
        .product-count,
        .children-count {
          padding: 4px 8px;
          background: #f0f0f0;
          border-radius: 4px;
          font-size: 12px;
        }
        
        .category-actions {
          display: flex;
          gap: 8px;
        }
        
        .btn-primary {
          background: #007bff;
          color: white;
          padding: 10px 20px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }
        
        .btn-edit {
          background: #ffc107;
          color: #000;
          padding: 6px 12px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }
        
        .btn-delete {
          background: #dc3545;
          color: white;
          padding: 6px 12px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }
        
        .category-table {
          width: 100%;
          background: white;
          border-collapse: collapse;
        }
        
        .category-table th,
        .category-table td {
          padding: 12px;
          text-align: left;
          border-bottom: 1px solid #eee;
        }
        
        .category-table th {
          background: #f8f9fa;
          font-weight: 600;
        }
        
        .badge-level {
          background: #17a2b8;
          color: white;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 11px;
        }
        
        .badge-status {
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 12px;
        }
        
        .badge-status.active {
          background: #d4edda;
          color: #155724;
        }
        
        .badge-status.inactive {
          background: #f8d7da;
          color: #721c24;
        }
      `}</style>
    </div>
  );
};

export default CategoryManagement;
