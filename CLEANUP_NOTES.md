# 🧹 Script dọn dẹp project - Xóa các file test/check cũ

# CÁC FILE CẦN XÓA:

## Backend Test/Check Files (16 files)
backend/checkData.js
backend/checkFlashSale.js
backend/checkImages.js
backend/checkOrder.js
backend/checkProducts.js
backend/checkRecentOrders.js
backend/checkUserOrders.js
backend/checkVouchers.js
backend/fixAdmin.js
backend/seedCart.js
backend/seedCategories.js
backend/seedOrder.js
backend/seedProducts.js
backend/seedTestOrders.js
backend/testLoyaltyPoints.js
backend/seedAdmin.js

## GIỮ LẠI:
backend/testAllFeatures.js     # Script test tổng quan
backend/seedSampleData.js       # Script seed data mẫu
backend/createTestUsers.js      # Script tạo test users

## CÁC FILE QUAN TRỌNG KHÔNG XÓA:
- backend/server.js
- backend/package.json
- backend/models/*
- backend/controllers/*
- backend/routes/*
- backend/middleware/*
- backend/config/*
- backend/utils/*

## Frontend - Không có file rác
- Frontend clean, không cần xóa file nào

## Root Level
- .env (GIỮ - chứa config)
- docker-compose.yml (GIỮ)
- README (GIỮ)
- SCRIPTNOTE (GIỮ)
- FLASH_SALE_IMPLEMENTATION.md (GIỮ - documentation)
- TEST_GUIDE.md (GIỮ)
- FEATURES_LIST.md (GIỮ - vừa tạo)
