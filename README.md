# CT201E - Niên luận cơ sở ngành Khoa học máy tính
# Tây Bắc Travel - Hệ thống Đặt Tour & Trợ Lý Ảo AI

Dự án phát triển ứng dụng web hỗ trợ khách hàng khám phá, đặt tour du lịch vùng Tây Bắc và tương tác với trợ lý ảo AI thông minh. Đây là sản phẩm thuộc học phần **CT201E - Niên luận cơ sở ngành**.

**Tác giả:** Nguyễn Minh Trí  
**Đơn vị:** Trường Công nghệ Thông tin và Truyền thông, Đại học Cần Thơ  

---

## ✨ Tính năng nổi bật
* **Quản lý Đơn hàng (Booking):** Đặt tour, hủy đơn và tự động hoàn vé đối với các đơn hàng quá hạn thanh toán.
* **Trợ lý ảo AI Thông minh:** Tích hợp AI (linh hoạt chuyển đổi giữa Local AI hoặc Google Gemini API) để tư vấn tour du lịch trực tiếp cho khách hàng.
* **Giao diện thân thiện:** Được xây dựng bằng React, tối ưu hóa UI/UX và tích hợp hệ thống icon chuẩn từ Font Awesome.
* **Real-time:** Cập nhật trạng thái hệ thống và tin nhắn theo thời gian thực với Socket.io.

## 🛠️ Công nghệ sử dụng
* **Frontend:** React, Vite, Font Awesome.
* **Backend:** Node.js, Express.js, Socket.io.
* **Database:** MongoDB (Mongoose).
* **AI Engine:** Google Gemini API / Ollama.

---

## Hướng dẫn cài đặt và khởi chạy

### Yêu cầu hệ thống (Prerequisites)
Để chạy được dự án, máy tính của bạn cần được cài đặt sẵn 3 công cụ sau:
1. **Node.js:** Môi trường chạy JavaScript (Nên dùng bản v18 trở lên, đi kèm `npm`).
2. **MongoDB Community Server:** Cơ sở dữ liệu chạy trực tiếp trên máy (Localhost).
3. **MongoDB Compass (Tùy chọn):** Công cụ quản lý Database trực quan.

### Bước 1: Cài đặt thư viện (Dependencies)
Sau khi tải mã nguồn về máy, bạn cần cài đặt các gói thư viện cho cả Backend và Frontend. Mở Terminal tại thư mục gốc của dự án và chạy lần lượt các lệnh sau:

```bash
# Cài đặt thư viện cho Server
cd SERVER
npm install

# Quay lại thư mục gốc và cài đặt thư viện cho Client
cd ../CLIENT
npm install
```

### Bước 2: Thiết lập biến môi trường
1. Di chuyển vào thư mục `SERVER`.
2. Tạo một file tên là `.env` (hoặc copy từ file `.env.example`).
3. Điền các cấu hình cần thiết để kết nối Database và AI:
```env
PORT=3000
MONGO_URI=mongodb://127.0.0.1:27017/taybac_tourism_db
GEMINI_API_KEY=your_gemini_api_key_here
```
*(Lưu ý: Đảm bảo dịch vụ MongoDB trên máy tính Windows của bạn đang ở trạng thái Running trước khi sang bước tiếp theo).*

### Bước 3: Chạy dự án chỉ với 1 lệnh
Dự án đã được cấu hình để khởi động đồng thời cả Backend (Server) và Frontend (Client) chỉ bằng một câu lệnh duy nhất.

Mở Terminal, đi đến thư mục `SERVER` và chạy:

```bash
npm run dev:all
```

**Hoàn tất!** Hệ thống lúc này đã hoạt động:
* Giao diện người dùng (Frontend) truy cập tại: `http://localhost:5173`
* Máy chủ API (Backend) chạy ngầm tại cổng `3000`.

---
