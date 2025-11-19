# Demo bảo mật API + lazy loading sản phẩm

## Yêu cầu
- Node.js 18+
- MongoDB chạy local (hoặc dùng cloud URI)

## Cài đặt
```bash
npm install
cp .env.example .env
```
Chỉnh sửa `MONGO_URI` và `JWT_SECRET` trong `.env` nếu cần.

## Seed dữ liệu
```bash
npm run seed
```

## Chạy server
```bash
npm run dev
```

Server sẽ chạy mặc định ở `http://localhost:4000`. Frontend tĩnh nằm trong thư mục `public` với 3 trang chính:
- `login.html` + `js/login.js`
- `products.html` + `js/products.js`
- `admin.html` + `js/admin.js`
Trang chủ (`/`) tự động hiển thị `login.html`; sau khi đăng nhập hệ thống chuyển hướng user sang trang sản phẩm và admin sang trang quản trị.

## Tính năng chính
1. **Validation form frontend**: `public/login.html` kiểm tra dữ liệu trước khi gọi API.
2. **Bảo mật API 4 lớp**:
   - Input validation bằng `express-validation` + `joi`.
   - Rate limiting với `express-rate-limit`.
   - Authentication sử dụng JWT (`middleware/authMiddleware.js`).
   - Authorization phân quyền user/admin.
3. **Lazy loading sản phẩm**: `public/products.html` + `js/products.js` tải sản phẩm theo từng trang với IntersectionObserver.
4. **MongoDB**: dữ liệu sản phẩm & user lưu trong MongoDB.

## Dữ liệu mẫu
- File `seed/sampleData.json` chứa 4 user + 10 sản phẩm loại Điện thoại/Laptop/Phụ kiện.
- Có thể chỉnh sửa file JSON trước khi chạy `npm run seed`.

### Tài khoản có sẵn
- Admin: `admin@example.com` / `admin123`
- Admin: `lead@example.com` / `admin123`
- User: `user1@example.com` / `user1234`
- User: `user2@example.com` / `user1234`
