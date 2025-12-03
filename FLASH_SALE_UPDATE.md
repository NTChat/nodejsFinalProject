# ⚡ CẬP NHẬT FLASH SALE FORM - TỰ ĐỘNG TÍNH GIÁ

## 🎯 Thay đổi

### Trước đây:
- Admin phải nhập thủ công cả **Giá gốc** và **Giá Flash Sale**
- Dễ sai sót, không nhất quán với giá sản phẩm thực tế

### Bây giờ:
✅ **Giá gốc**: Tự động lấy từ `product.price` (read-only, hiển thị sẵn)
✅ **Admin chỉ nhập 1 trong 2**:
   - **% Giảm giá** (0-100%) → Giá Flash Sale tự động tính
   - **Giá Flash Sale** → % Giảm giá tự động tính
✅ **Tiết kiệm**: Tự động hiển thị số tiền giảm

---

## 📋 Cách sử dụng

### Cách 1: Nhập % Giảm giá (Khuyến nghị)
```
1. Chọn sản phẩm → Giá gốc tự động hiện: 20,000,000₫
2. Nhập % Giảm: 30
3. Giá Flash Sale tự động tính: 14,000,000₫
4. Tiết kiệm: 6,000,000₫ (tự động hiện)
```

### Cách 2: Nhập Giá Flash Sale trực tiếp
```
1. Chọn sản phẩm → Giá gốc tự động hiện: 20,000,000₫
2. Nhập Giá Flash Sale: 15,000,000₫
3. % Giảm tự động tính: 25%
4. Tiết kiệm: 5,000,000₫ (tự động hiện)
```

---

## 🎨 Giao diện mới

### Layout 3 cột:
```
┌─────────────────────┬─────────────────────┬─────────────────────┐
│ 💚 Giảm %          │ 💸 Giá Flash Sale  │ 📦 Số lượng        │
│ Input (0-100)      │ Input (VNĐ)        │ Input (số)         │
│ [     30     ]     │ [  14,000,000  ]   │ [    50     ]      │
└─────────────────────┴─────────────────────┴─────────────────────┘

💵 Giá gốc: 20,000,000₫ (Read-only, hiển thị trên cùng)

┌──────────────────────────────────────────────────────────────────┐
│ Giảm 30% → Tiết kiệm: 6,000,000₫                                │
└──────────────────────────────────────────────────────────────────┘
```

---

## 🔧 Chi tiết kỹ thuật

### State mới:
```javascript
{
  productId: "xxx",
  originalPrice: 20000000,    // Lấy từ product.price (read-only)
  flashPrice: 14000000,       // Tính từ % hoặc nhập trực tiếp
  discountPercent: 30,        // Tính từ flashPrice hoặc nhập trực tiếp
  totalStock: 50
}
```

### Logic tính toán:
```javascript
// Khi thay đổi % → Tính flashPrice
if (field === 'discountPercent') {
  flashPrice = originalPrice * (100 - discountPercent) / 100
}

// Khi thay đổi flashPrice → Tính %
if (field === 'flashPrice') {
  discountPercent = (1 - flashPrice / originalPrice) * 100
}
```

### Validation:
- `discountPercent`: 0-100%
- `flashPrice`: >= 0
- `totalStock`: >= 1
- `originalPrice`: Read-only, không cho sửa

---

## 📦 Files thay đổi

### 1. `frontend/src/pages/AdminFlashSaleManagement.jsx`
- ✅ `handleProductSelect()`: Lấy originalPrice từ product.price, thêm discountPercent: 30
- ✅ `updateSelectedProduct()`: Logic tính 2 chiều (% ⇄ giá)
- ✅ `openEditModal()`: Tính discountPercent khi edit
- ✅ UI: Thêm input "Giảm %", giá gốc read-only

---

## 🧪 Test

### Scenario 1: Tạo Flash Sale mới
1. Login admin → Flash Sale Management
2. Click "Tạo Flash Sale mới"
3. Chọn sản phẩm (VD: iPhone 15 Pro Max)
4. Kiểm tra giá gốc hiển thị đúng
5. Nhập % giảm: 40
6. Kiểm tra giá Flash Sale tự động = giá gốc * 0.6
7. Thay đổi giá Flash Sale thủ công
8. Kiểm tra % tự động cập nhật
9. Submit → Lưu thành công

### Scenario 2: Edit Flash Sale hiện tại
1. Click "Sửa" Flash Sale đang có
2. Kiểm tra giá gốc, flashPrice, % hiển thị đúng
3. Thay đổi % → Giá Flash Sale tự động cập nhật
4. Submit → Cập nhật thành công

---

## ✅ Lợi ích

1. **Giảm sai sót**: Giá gốc lấy từ database, không thể sửa
2. **Tiện lợi**: Admin chỉ nhập % hoặc giá, không cần tính toán
3. **Trực quan**: Hiển thị rõ tiết kiệm bao nhiêu
4. **Nhất quán**: Giá Flash Sale luôn khớp với giá sản phẩm thực tế
5. **UX tốt**: Real-time update khi thay đổi

---

## 🎯 Demo

### Ví dụ thực tế:
```
Sản phẩm: iPhone 15 Pro Max
Giá gốc: 29,990,000₫ (tự động lấy)

Admin nhập:
  ✏️ Giảm %: 35
  
Kết quả tự động:
  ✅ Giá Flash Sale: 19,493,500₫
  ✅ Tiết kiệm: 10,496,500₫
  
Hoặc admin nhập:
  ✏️ Giá Flash Sale: 20,000,000₫
  
Kết quả tự động:
  ✅ Giảm: 33%
  ✅ Tiết kiệm: 9,990,000₫
```

---

## 🚀 Triển khai

```bash
# Đã update file
frontend/src/pages/AdminFlashSaleManagement.jsx

# Không cần migrate database
# Không cần update backend API
# Chỉ thay đổi frontend logic + UI
```

---

## 📞 Hỗ trợ

Nếu gặp vấn đề:
1. Kiểm tra product.price có tồn tại
2. Kiểm tra console logs
3. Test với nhiều sản phẩm khác nhau
4. Verify % và giá tính đúng
