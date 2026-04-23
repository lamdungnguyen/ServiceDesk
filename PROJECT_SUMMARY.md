# Tổng quan Dự án Service Desk System

Dự án là một hệ thống quản lý yêu cầu hỗ trợ (Service Desk / Ticketing System) được xây dựng theo kiến trúc Microservices (hoặc Backend-Frontend tách biệt). Hiện tại, hệ thống đã hoàn thiện được nền tảng cốt lõi cho cả 2 phần:

## 1. Backend (Ticket Service)
Nền tảng: **Java 21, Spring Boot 3.2.4, Spring Data JPA, MS SQL Server**.
Cấu trúc: Áp dụng Clean Architecture (Controllers, Services, Repositories, Entities, DTOs).

**Các tính năng đã hoàn thiện:**
* **Quản lý Ticket (Yêu cầu):**
  - **Entities:** Khởi tạo `Ticket` với đầy đủ thông tin (Title, Description, Status, Priority, Category, Reporter, Assignee, Timestamps).
  - **Enums & SLA:** Đã thiết lập `TicketStatus` (NEW, ASSIGNED, IN_PROGRESS, RESOLVED, CLOSED) và `Priority` (LOW, MEDIUM, HIGH, URGENT). Hệ thống có khả năng tự động tính toán SLA (`due_date`) dựa trên mức độ ưu tiên của Ticket khi tạo mới.
  - **APIs:** 
    - Lấy danh sách toàn bộ Ticket.
    - Xem chi tiết một Ticket.
    - Tạo mới Ticket (với validation ràng buộc dữ liệu).
    - Cập nhật trạng thái Ticket (chỉ nhận các enum hợp lệ).

* **Quản lý Bình luận (Comment):**
  - **Entities:** Khởi tạo `Comment` (lưu trữ lịch sử trao đổi trên một Ticket).
  - **APIs:** Thêm bình luận mới, Lấy toàn bộ bình luận của một Ticket cụ thể.

* **Xử lý ngoại lệ (Exception Handling):**
  - `GlobalExceptionHandler` bắt và chuẩn hóa toàn bộ lỗi trả về cho Frontend (Lỗi 404 - Không tìm thấy, Lỗi 400 - Truyền thiếu/sai dữ liệu Validation hoặc Sai Enum).

* **Database:** Đã kết nối thành công với **SQL Server (TicketDB)** thông qua cổng `1433`. Hibernate tự động tạo bảng (auto-ddl).

---

## 2. Frontend (Giao diện người dùng)
Nền tảng: **React 19, TypeScript, Vite, TailwindCSS v4, Lucide React**.

**Các tính năng đã hoàn thiện:**
* **Thiết kế Premium (Glassmorphism):** Áp dụng thiết kế cao cấp, hiệu ứng kính mờ (glass card), đổ bóng tinh tế và các hiệu ứng chuyển động mượt mà (slide-in, fade-in) trong `index.css`.
* **Trang chủ Dashboard (`Dashboard.tsx`):**
  - Hiển thị 4 thẻ thống kê rực rỡ (Overview Stats) với gradient glow effect.
  - Tự động gọi API lấy dữ liệu thực tế từ Backend.
  - **Mock Data Fallback:** Nếu Backend chưa mở, hệ thống sẽ tự động hiển thị dữ liệu giả định (Preview Mode) để duy trì trải nghiệm liền mạch.
  - Thanh công cụ Tab và Filter cơ bản.
* **Thành phần giao diện (Components):**
  - **`TicketCard.tsx`:** Thẻ ticket hiển thị trạng thái và độ ưu tiên với màu sắc chuyên biệt. Có avatar giả lập cho người báo cáo và người xử lý.
  - **`Navbar.tsx`:** Thanh điều hướng trên cùng cố định (sticky) với ô tìm kiếm và các nút tiện ích.
* **Tích hợp API (`apiClient.ts`):** Đã cấu hình Axios sử dụng Vite Proxy để định tuyến `/api` về thẳng Backend `http://localhost:8081`, loại bỏ lỗi CORS khi phát triển.

---

## 3. Các bước dự kiến tiếp theo
Sau khi hệ thống đã có DB và giao diện cơ bản, đây là những tính năng chúng ta sẽ làm tiếp:
1. **Frontend:** Làm Modal / Trang để người dùng có thể tạo mới một Ticket (Create Ticket Form).
2. **Frontend:** Làm trang Chi tiết Ticket để người dùng có thể xem nội dung, đổi trạng thái và thêm Bình luận.
3. **Tích hợp AI:** Kết nối với mô hình AI (như đã quy hoạch) để tự động phân tích tiêu đề và nội dung nhằm tự động đưa ra `Priority` và `Category` thay vì để con người tự chọn.
