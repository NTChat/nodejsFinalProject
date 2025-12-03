# Hướng dẫn chạy dự án cho giảng viên

Tài liệu này hướng dẫn cách chạy project (frontend + backend) trên máy local để kiểm tra / chấm bài.
Nội dung tập trung vào Windows PowerShell (người dùng đang dùng PowerShell v5.1).

---

## 1. Yêu cầu trước

- Node.js (phiên bản >= 18) và `npm` hoặc `pnpm`
- MongoDB (local) hoặc một connection URI MongoDB (Atlas)
- Mạng internet để tải dependencies

## 2. Cấu trúc chính

- `backend/` : mã nguồn server Node.js (Express)
- `frontend/` : mã nguồn client (React)
- `.env` (ở thư mục gốc): chứa các biến môi trường chung (JWT, Cloudinary, email, VNPAY, FRONTEND_URL, v.v.)

> Lưu ý: file `.env` có sẵn trong repo gốc. Nếu muốn chạy backend từ `backend` folder, dotenv trong script `printEnv.js` đã trỏ lên `../.env`.

## 3. Thiết lập nhanh

Mở PowerShell và chạy từ thư mục gốc của dự án:

```powershell
# chuyển vào thư mục dự án (nếu chưa ở đó)
cd G:\\NodeJS\\nodejsFinalProject-2

# 1) Cài dependencies frontend và backend (tên lệnh chạy từng folder)
cd backend
npm install

cd ..\\frontend
npm install

# quay về gốc (tuỳ cách bạn muốn chạy)
cd ..
```

## 4. Cấu hình biến môi trường (`.env`)

- File `.env` nằm ở gốc dự án. Mở và bổ sung các biến quan trọng trước khi chạy:

- `MONGODB_URI` — chuỗi kết nối MongoDB (vd: `mongodb://localhost:27017/phoneworld`) 
- `FRONTEND_URL` — url frontend khi cần (vd: `http://localhost:3000` hoặc domain khi deploy)
- `JWT_SECRET`, `EMAIL_*`, `CLOUDINARY_*`, `VNP_*` nếu các chức năng tương ứng được dùng

Sau khi sửa `.env`, lưu lại.

## 5. Chạy backend (local)

- Cách đơn giản (node):

```powershell
cd backend
node server.js
```

- Hoặc dùng script ở root (root `package.json` có `start`):

```powershell
# từ thư mục gốc
npm start
```

Ghi chú: đôi khi `npm start` ở `backend` được cấu hình thành `cd backend && node server.js` ở root. Nếu bạn ở `backend` và chạy `npm start`, nó có thể cố gắng `cd backend` thêm một lần — nên an toàn nhất là dùng `node server.js` khi ở trong thư mục `backend`.

Server mặc định lắng nghe `process.env.PORT` hoặc `3001` nếu không có biến `PORT`.

## 6. Chạy frontend (local)

```powershell
cd frontend
npm start
```

Front-end mặc định chạy trên `3000`.

## 7. Chạy full project (từ gốc) — cách nhanh cho giảng viên

1. Từ gốc, đảm bảo đã cài xong dependencies ở cả 2 thư mục.
2. Mở 2 terminal (PowerShell):

Terminal A (backend):
```powershell
cd G:\\NodeJS\\nodejsFinalProject-2\\backend
node server.js
```

Terminal B (frontend):
```powershell
cd G:\\NodeJS\\nodejsFinalProject-2\\frontend
npm start
```

## 8. Build frontend và phục vụ (production)

```powershell
cd frontend
npm run build

# build rồi copy folder build sang backend/public nếu server có phục vụ static
# hoặc dùng một static server như serve
npx serve -s build
```

## 9. Seed dữ liệu / script tiện ích

- Các script seed nằm trong `backend/scripts/` (ví dụ `seedSampleData.js`). Chạy bằng node, ví dụ:

```powershell
cd backend
node scripts/seedSampleData.js
```

## 10. Kiểm tra biến môi trường (debug)

Trong repo có `backend/printEnv.js` để in ra các biến quan trọng. Chạy:

```powershell
cd backend
node printEnv.js
```

Nếu thấy nhiều `undefined`, kiểm tra xem `.env` đã được lưu ở đúng vị trí (gốc) và `printEnv.js` có đang load `../.env` không.

## 11. Vấn đề thường gặp & khắc phục nhanh

- Lỗi `Cannot find module 'mongoose'`: đảm bảo đã `npm install` trong `backend` và `mongoose` xuất hiện ở `backend/package.json`.
- Ứng dụng trả 499/502 khi truy cập: kiểm tra deploy logs; cục bộ, thường do server crash hoặc không lắng nghe đúng `PORT` (code phải dùng `process.env.PORT || 3001`).
- Nếu `process.env` không có giá trị: kiểm tra file `.env`, quyền đọc, hoặc dùng `require('dotenv').config({ path: '../.env' })` nếu chạy từ thư mục `backend`.

## 12. Liên hệ / Ghi chú cho giảng viên

- Nếu cần sandbox database, cung cấp URI MongoDB Atlas và cập nhật `MONGODB_URI` trong `.env`.
- Nếu cần chạy nhanh bằng Docker, có thể viết Dockerfile / docker-compose (không có sẵn trong repo hiện tại).

---

Nếu bạn muốn, tôi có thể:

- Thêm phần hướng dẫn cài MongoDB trên Windows.
- Tạo `docker-compose.yml` để chạy MongoDB + backend + frontend tự động.
