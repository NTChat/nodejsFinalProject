 # 📂 Hệ Thống Quản Lý Danh Mục Đa Cấp

## ✨ Tính năng đã triển khai

### Backend
1. **Model nâng cấp** (`categoryModel.js`)
   - ✅ Hỗ trợ cấu trúc đa cấp (parentId, level, path)
   - ✅ Virtual fields cho children
   - ✅ Methods: getFullPath(), getTree(), updatePath()
   - ✅ Index tối ưu cho tìm kiếm và filter

2. **Controller đầy đủ** (`categoryController.js`)
   - ✅ CRUD hoàn chỉnh với validation
   - ✅ getCategoryTree() - Lấy cấu trúc cây
   - ✅ Kiểm tra circular reference
   - ✅ Giới hạn 3 cấp (level 0, 1, 2)
   - ✅ Tự động cập nhật path khi đổi parent
   - ✅ Kiểm tra children trước khi xóa

3. **Routes** (`categoryRoutes.js`)
   - ✅ GET `/api/categories` - List với filter
   - ✅ GET `/api/categories/tree` - Tree structure
   - ✅ POST `/api/categories` - Tạo mới (admin)
   - ✅ PUT `/api/categories/:id` - Cập nhật (admin)
   - ✅ DELETE `/api/categories/:id` - Xóa (admin)

### Frontend
1. **Component quản lý** (`CategoryManagement.jsx`)
   - ✅ Tree View - Hiển thị cấu trúc cây
   - ✅ List View - Bảng dạng danh sách
   - ✅ Form CRUD đầy đủ
   - ✅ Auto-generate slug từ tên
   - ✅ Select parent với indentation
   - ✅ Hiển thị icon emoji
   - ✅ Badge level, product count, children count

### Data Seeding
1. **seedCategoriesFromTGDD.js** - 27 danh mục
   - 5 cấp 1: Điện thoại, Laptop, Tablet, Phụ kiện, Đồng hồ
   - 20 cấp 2: Thương hiệu (iPhone, Samsung, Dell, HP...)
   - 2 cấp 3: Chi tiết (AirPods, Tai nghe Samsung...)
   - Tất cả có image từ CDN TGDD
   - Icon emoji cho mỗi category

2. **seedProductsFromTGDD.js** - 9 sản phẩm mẫu
   - Map đúng với category hierarchy
   - 3 ảnh thật từ TGDD cho mỗi sản phẩm
   - Nhiều variant với giá khác nhau
   - Thông tin đầy đủ (brand, description, stock...)

## 🚀 Cách sử dụng

### 1. Seed dữ liệu

```bash
# Backend folder
cd backend

# Seed categories (chạy trước)
node seedCategoriesFromTGDD.js

# Seed products (chạy sau)
node seedProductsFromTGDD.js
```

### 2. Test API

```bash
# Lấy tất cả categories (list)
GET https://localhost:3001/api/categories

# Lấy tree structure
GET https://localhost:3001/api/categories/tree

# Lấy chi tiết 1 category
GET https://localhost:3001/api/categories/:id

# Filter
GET https://localhost:3001/api/categories?level=0
GET https://localhost:3001/api/categories?parentId=dien-thoai
GET https://localhost:3001/api/categories?status=active

# Tạo mới (cần auth admin)
POST https://localhost:3001/api/categories
Content-Type: application/json
Authorization: Bearer <token>

{
  "categoryId": "realme",
  "name": "Realme",
  "slug": "realme",
  "description": "Điện thoại Realme chính hãng",
  "icon": "📱",
  "parentId": "dien-thoai",
  "status": "active",
  "displayOrder": 6
}

# Cập nhật (cần auth admin)
PUT https://localhost:3001/api/categories/:id
# Đổi parent, đổi tên, đổi icon...

# Xóa (cần auth admin)
DELETE https://localhost:3001/api/categories/:id
```

### 3. Sử dụng Frontend Component

```jsx
// Trong Dashboard route
import CategoryManagement from '../components/Dashboard/CategoryManagement';

<Route path="/admin/categories" element={<CategoryManagement />} />
```

## 📊 Cấu trúc dữ liệu

### Category Schema
```javascript
{
  categoryId: String,      // 'iphone', 'samsung'
  name: String,            // 'iPhone (Apple)'
  slug: String,            // 'iphone'
  description: String,     // Mô tả
  image: String,           // URL ảnh từ TGDD
  icon: String,            // Emoji '📱'
  
  // Đa cấp
  parentId: String,        // null = cấp 1, 'dien-thoai' = con của điện thoại
  level: Number,           // 0, 1, 2
  path: String,            // 'dien-thoai/iphone'
  
  status: String,          // 'active' | 'inactive'
  displayOrder: Number,    // Thứ tự hiển thị
  productCount: Number,    // Số sản phẩm (auto)
  
  timestamps: true         // createdAt, updatedAt
}
```

### Tree Structure Example
```
📱 Điện thoại (level 0)
    └─ 🍎 iPhone (Apple) (level 1)
    └─ 📱 Samsung (level 1)
    └─ 📱 Xiaomi (level 1)
💻 Laptop (level 0)
    └─ 🍎 MacBook (Apple) (level 1)
    └─ 💻 Dell (level 1)
🎧 Phụ kiện (level 0)
    └─ 🎧 Tai nghe (level 1)
        └─ 🎧 AirPods (level 2)
        └─ 🎧 Tai nghe Samsung (level 2)
```

## ✅ Features Checklist

- [x] **CRUD đầy đủ**
  - [x] Thêm danh mục mới
  - [x] Sửa danh mục (bao gồm đổi parent)
  - [x] Xóa danh mục (với validation)
  - [x] Xem danh sách và chi tiết

- [x] **Danh mục đa cấp**
  - [x] Tối đa 3 cấp (0, 1, 2)
  - [x] Tự động cập nhật path
  - [x] Prevent circular reference
  - [x] Tree structure API

- [x] **Validation & Safety**
  - [x] Không xóa khi có children
  - [x] Không xóa khi có products
  - [x] Không chọn chính nó làm parent
  - [x] Không chọn con/cháu làm parent
  - [x] Kiểm tra duplicate slug

- [x] **Frontend UI**
  - [x] Tree View với indentation
  - [x] List View dạng bảng
  - [x] Form với auto-slug
  - [x] Icon emoji picker
  - [x] Parent selector với hierarchy
  - [x] Badges (level, count, status)

- [x] **Data Integration**
  - [x] Seed 27 categories từ TGDD
  - [x] Seed 9 products với category mapping
  - [x] Real images từ cdn.tgdd.vn
  - [x] Product count tự động

## 🎯 Use Cases

### 1. Tạo danh mục cấp 1
```javascript
{
  categoryId: 'dien-thoai',
  name: 'Điện thoại',
  slug: 'dien-thoai',
  parentId: null  // Cấp 1
}
// → level: 0, path: 'dien-thoai'
```

### 2. Tạo danh mục cấp 2
```javascript
{
  categoryId: 'iphone',
  name: 'iPhone (Apple)',
  slug: 'iphone',
  parentId: 'dien-thoai'  // Con của điện thoại
}
// → level: 1, path: 'dien-thoai/iphone'
```

### 3. Tạo danh mục cấp 3
```javascript
{
  categoryId: 'airpods',
  name: 'AirPods',
  slug: 'airpods',
  parentId: 'tai-nghe'  // Con của tai nghe (level 1)
}
// → level: 2, path: 'phu-kien/tai-nghe/airpods'
```

### 4. Đổi parent
```javascript
PUT /api/categories/:id
{
  parentId: 'laptop'  // Chuyển từ điện thoại sang laptop
}
// → Tự động cập nhật level và path cho category + tất cả children
```

## 🔧 Technical Details

### Path Management
- Path tự động tạo khi insert/update
- Format: `parent1/parent2/current`
- Tự động update children khi parent thay đổi

### Level Calculation
- Level 0: parentId = null
- Level 1: parent.level = 0
- Level 2: parent.level = 1
- Max level = 2 (giới hạn 3 cấp)

### Circular Reference Prevention
```javascript
// Không cho phép:
- Chọn chính nó làm parent
- Chọn con/cháu làm parent (check path.includes)
```

### Performance Optimization
- Indexed: parentId, path, status
- Text search: name, description
- Aggregate cho stats và tree

## 📝 Notes

- **Database**: Đã seed 27 categories + 9 products
- **Images**: Tất cả từ cdn.tgdd.vn
- **API**: RESTful với auth middleware
- **Frontend**: React component standalone
- **Validation**: Backend + Frontend đều có

## 🎉 Demo

Sau khi seed data, truy cập:
- API Tree: `https://localhost:3001/api/categories/tree`
- Admin UI: `https://localhost:3000/admin/categories`
