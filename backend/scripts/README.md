# Backend Scripts

Thư mục này chứa tất cả các script test, seed, check, fetch dữ liệu cho backend.

## Danh sách Scripts

### Check & Test
- `checkAllData.js` - Kiểm tra toàn bộ dữ liệu
- `checkImages.js` - Kiểm tra ảnh sản phẩm
- `checkProductPrices.js` - Kiểm tra giá sản phẩm
- `testAllFeatures.js` - Test tất cả features
- `testBackendAPI.js` - Test API backend
- `testBanFeature.js` - Test feature ban
- `testNewProducts.js` - Test sản phẩm mới
- `testProductAutoNaming.js` - Test auto naming
- `testProductImageUpload.js` - Test upload ảnh

### Seed Data
- `seedCategoriesFromTGDD.js` - Seed 27 categories từ TGDD
- `seedProductsFromTGDD.js` - Seed products từ TGDD
- `seedSampleData.js` - Seed sample data
- `createTestUsers.js` - Tạo test users

### Fetch & Update Images
- `fetchFromPexels.js` - Fetch từ Pexels CDN ✅ (HIỆN TẠI)
- `fetchFromUnsplashAPI.js` - Fetch từ Unsplash API (cần auth)
- `fetchRealProductImages.js` - Fetch từ Unsplash Source API
- `updateProductImages.js` - Update ảnh sản phẩm
- `updateSpecificProducts.js` - Update specific products
- `updateWithPicsumPhotos.js` - Update với Picsum
- `updateWithPixabay.js` - Update với Pixabay
- `updateWithUnsplash.js` - Update với Unsplash
- `restorePexelsAndRemoveImages.js` - Restore Pexels CDN

## Cách Chạy

```bash
# Fetch ảnh từ Pexels (recommended)
node scripts/fetchFromPexels.js

# Restore Pexels CDN
node scripts/restorePexelsAndRemoveImages.js

# Test API
node scripts/testBackendAPI.js

# Seed categories
node scripts/seedCategoriesFromTGDD.js
```

## CDN Hiện Tại
- **Pexels** - Free, no auth, high quality ✅

## Lưu Ý
- Scripts này chỉ dùng cho development/testing
- Không chạy trên production
- Cần MongoDB running trước
