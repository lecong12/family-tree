# UI Showcase
![UI Showcase](./github/Example-UI.png)

# Hướng dẫn Triển khai (Deployment Guide)

Tài liệu này liệt kê các cấu hình cần thiết để triển khai ứng dụng Family Tree lên server.

## 1. Backend (NestJS),gi

### Cấu hình Environment Variables

Tạo file `.env` trong thư mục `backend/` dựa trên file `.env.example`.

| Biến                          | Mô tả                                      | Ví dụ                                                               |
| ----------------------------- | ------------------------------------------ | ------------------------------------------------------------------- |
| `PORT`                        | Port mà backend sẽ chạy                    | `9999`                                                              |
| `MONGO_URI`                   | Chuỗi kết nối MongoDB                      | `mongodb://root:123456@localhost:27017/familytree?authSource=admin` |
| `JWT_SECRET_KEY`              | Khóa bí mật để mã hóa token                | `chuoi_ngau_nhien_bao_mat`                                          |
| `JWT_ACCESS_TOKEN_EXPIRES_IN` | Thời gian hết hạn token                    | `7d`                                                                |
| `CLOUDINARY_CLOUD_NAME`       | Tên Cloudinary (lưu ảnh)                   | `my-cloud-name`                                                     |
| `CLOUDINARY_API_KEY`          | API Key Cloudinary                         | `123456789`                                                         |
| `CLOUDINARY_API_SECRET`       | API Secret Cloudinary                      | `abcdef123456`                                                      |
| `ADMIN_PASSWORD`              | Mật khẩu cho tài khoản Admin (user: admin) | `MatKhauAdminSieuManh`                                              |

### Lưu ý khi Deploy

-   Nếu dùng Docker Compose cho cả App và DB, `MONGO_URI` nên trỏ tới tên service (ví dụ: `mongodb://root:123456@mongodb:27017/...`).
-   `CORS` hiện tại đang để `origin: '*'`. Trong môi trường production, nên đổi lại thành domain của frontend để bảo mật hơn (sửa trong `backend/src/main.ts`).

## 2. Frontend (Next.js)

### Cấu hình Environment Variables

Tạo file `.env.local` (hoặc set biến môi trường trên server) trong thư mục `frontend/`.

| Biến                  | Mô tả                     | Ví dụ                                                               |
| --------------------- | ------------------------- | ------------------------------------------------------------------- |
| `NEXT_PUBLIC_API_URL` | Đường dẫn tới API Backend | `http://your-domain.com/api/v1` hoặc `http://IP-Server:9999/api/v1` |

### Lưu ý khi Build

-   Frontend cần biết `NEXT_PUBLIC_API_URL` **tại thời điểm build** (nếu là Static Site Generation) hoặc Runtime (nếu là Client-side fetching).
-   Trong dự án này, chúng ta dùng Client-side fetching (`axios` trong `src/services`), nên biến này sẽ được trình duyệt đọc. Đảm bảo URL này public (người dùng truy cập được).

## 3. Các bước Deploy cơ bản

1. **Database**: Chạy MongoDB, ví dụ dùng dịch vụ `mongodb` trong `docker-compose.yml` ở thư mục gốc.
2. **Backend**:
    - `cd backend`
    - `npm install`
    - `npm run build`
    - `npm run start:prod`
3. **Frontend**:
    - `cd frontend`
    - `npm install`
    - Cập nhật `.env.local` với IP/Domain của Backend.
    - `npm run build`
    - `npm start` (chạy Next.js server) hoặc export ra static file nếu cần.

## 4. Chạy toàn bộ ứng dụng bằng Docker Compose

Cài Docker Desktop (bao gồm Docker Compose), sau đó tại thư mục gốc của dự án:

1. Tạo file `.env` từ mẫu: `cp .env.example .env` (trên Windows PowerShell dùng `Copy-Item .env.example .env`).
2. Đổi `MONGO_ROOT_PASSWORD` và `JWT_SECRET` trong `.env` thành các giá trị riêng. Mật khẩu MongoDB nên dùng ký tự URL-safe.
3. Chạy `docker compose up --build`.
4. Mở frontend tại `http://localhost:3000`; API chạy tại `http://localhost:9999/api/v1`.

Compose sẽ đợi MongoDB sẵn sàng trước khi khởi động backend và lưu dữ liệu MongoDB trong volume `mongodb_data`. Frontend được build với `NEXT_PUBLIC_API_URL`; khi truy cập từ máy khác, hãy đặt biến này trong `.env` thành URL công khai của API trước khi build lại. Backend hiện chỉ cho phép CORS từ các origin đã cấu hình trong `backend/src/main.ts`, vì vậy cần bổ sung domain frontend nếu triển khai bằng domain riêng.

Nếu trang kiểm tra vẫn báo không kết nối được Backend, kiểm tra URL API là `http://localhost:9999/api/v1` khi mở frontend trên cùng máy và xem log bằng `docker compose logs -f backend`. Khi truy cập từ máy khác, thay `localhost` bằng IP/domain của máy chạy backend rồi build lại frontend.
