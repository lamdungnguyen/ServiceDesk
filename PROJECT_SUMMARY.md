# Tổng quan Dự án Service Desk System

Dự án là một hệ thống quản lý yêu cầu hỗ trợ (Service Desk / Ticketing System) được xây dựng theo kiến trúc Microservices. Hiện tại, hệ thống đã hoàn thiện nền tảng cốt lõi, tích hợp trí tuệ nhân tạo (AI) và chia tách rõ ràng các phân hệ:

## 1. Backend (Ticket Service & API)
Nền tảng: **Java 21, Spring Boot 3.2.4, Spring Data JPA, MS SQL Server**.
Cấu trúc: Áp dụng Clean Architecture (Controllers, Services, Repositories, Entities, DTOs).

**Các tính năng đã hoàn thiện:**
* **Quản lý Người dùng & Phân quyền (RBAC):**
  - **Entities:** Quản lý `User` với các vai trò chuyên biệt (CUSTOMER, AGENT, ADMIN).
  - **Auth API:** Hệ thống đăng nhập và phân quyền hoàn chỉnh, dữ liệu lưu trên Database SQL Server (loại bỏ localStorage tĩnh).
* **Quản lý Ticket (Yêu cầu):**
  - **Entities:** Khởi tạo `Ticket` với đầy đủ thông tin (Title, Description, Status, Priority, Category, Reporter, Assignee, Timestamps).
  - **Enums & SLA:** Cấu hình `TicketStatus` và `Priority`. Hệ thống tự động tính toán SLA (`due_date`) dựa trên mức độ ưu tiên.
  - **APIs:** Đầy đủ CRUD API cho Ticket với validation chặt chẽ.
* **Quản lý Bình luận (Comment):**
  - **Entities & APIs:** Lưu trữ và truy xuất lịch sử trao đổi trên Ticket giữa người dùng và nhân viên hỗ trợ.
* **Kiến trúc DB & Xử lý lỗi:**
  - Kết nối thành công SQL Server, Hibernate tự động quản lý schema.
  - `GlobalExceptionHandler` bắt và chuẩn hóa toàn bộ lỗi (404, 400).

## 2. AI Service (Microservice Phân loại)
Nền tảng: **Python, FastAPI**.

**Các tính năng đã hoàn thiện:**
* **Phân loại Ticket Thông minh:** Cung cấp API dự đoán độ ưu tiên (Priority), danh mục (Category) và phân tích cảm xúc (Sentiment) tự động dựa trên Tiêu đề và Mô tả của Ticket.
* **Tích hợp Backend:** Giao tiếp ổn định với Spring Boot, có xử lý lỗi (Timeout management, Fallback logic) để đảm bảo hệ thống Ticket vẫn hoạt động nếu AI Service gián đoạn.

## 3. Frontend (Giao diện người dùng)
Nền tảng: **React 19, TypeScript, Vite, TailwindCSS v4, Lucide React**.

**Các tính năng đã hoàn thiện:**
* **Cổng thông tin riêng biệt & Bảo mật (RBAC Routing):**
  - Component `RoleRoute` bảo vệ các trang theo quyền.
  - **Customer Portal:** Khách hàng theo dõi ticket cá nhân và tạo yêu cầu mới.
  - **Agent Workspace:** Môi trường làm việc cho nhân viên tiếp nhận và xử lý yêu cầu.
  - **Admin Dashboard:** Bảng điều khiển quản trị tổng quan.
  - Tách biệt trang đăng nhập: `Login.tsx` (Khách hàng) và `StaffLogin.tsx` (Nhân viên).
* **Thiết kế Premium (Glassmorphism):** Áp dụng giao diện cao cấp, hiệu ứng kính mờ (glass card), đổ bóng tĩnh và chuyển động mượt mà.
* **Thành phần tương tác nâng cao:**
  - `CreateTicketModal`: Form tạo ticket có tích hợp tự động phân loại nhờ AI.
  - `CustomerTicketDetailModal`: Giao diện xem chi tiết ticket và thảo luận (bình luận).
  - Dashboard thống kê dữ liệu trực quan bằng API.

## 4. Các bước dự kiến tiếp theo
1. **Tính năng cốt lõi:** Hoàn thiện luồng thông báo đa vai trò (Cross-role notifications) khi ticket được cập nhật.
2. **Quy trình tối ưu:** Hoàn thiện logic tự động giao việc (Auto-assignment) phân bổ ticket cho Agent phù hợp nhất.
3. **Quản trị & Phân tích:** Cải thiện và thêm các biểu đồ báo cáo chuyên sâu trên Admin Dashboard.
