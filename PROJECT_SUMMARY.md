# Tổng quan Dự án Service Desk System

Dự án là một hệ thống quản lý yêu cầu hỗ trợ (Service Desk / Ticketing System) được xây dựng theo kiến trúc Microservices. Hiện tại, hệ thống đã hoàn thiện nền tảng cốt lõi, tích hợp trí tuệ nhân tạo (AI), giao tiếp thời gian thực và chia tách rõ ràng các phân hệ:

## 1. Backend (Ticket Service & API)
Nền tảng: **Java 17, Spring Boot 3.2.4, Spring Data JPA, MS SQL Server**.
Cấu trúc: Áp dụng Clean Architecture (Controllers, Services, Repositories, Entities, DTOs).

**Các tính năng đã hoàn thiện:**
* **Quản lý Người dùng & Phân quyền (RBAC):**
  - **Entities:** Quản lý `User` với các vai trò chuyên biệt (CUSTOMER, AGENT, ADMIN).
  - **Auth API:** Hệ thống đăng nhập và phân quyền hoàn chỉnh, dữ liệu lưu trên Database SQL Server. Giao tiếp xác thực qua Custom Headers (`X-User-Id`, `X-User-Role`).
* **Quản lý Ticket (Yêu cầu):**
  - **Entities:** Khởi tạo `Ticket` với đầy đủ thông tin (Title, Description, Status, Priority, Category, Reporter, Assignee, Timestamps).
  - **Enums & SLA:** Cấu hình `TicketStatus` và `Priority`. Hệ thống tự động tính toán SLA (`due_date`) dựa trên mức độ ưu tiên.
  - **APIs:** Đầy đủ CRUD API cho Ticket với validation chặt chẽ.
* **Giao tiếp thời gian thực (Real-time Communication):**
  - Tích hợp **WebSocket (STOMP/SockJS)** xử lý thông báo (Notification), Chat trực tiếp, Direct Message (DM) và Conversation.
  - Tích hợp **WebRTC Signaling** (`CallController`) cho phép gọi điện thoại Audio trực tiếp giữa Khách hàng và Nhân viên hỗ trợ.
* **Đánh giá & File đính kèm:**
  - `RatingController`: Khách hàng có thể đánh giá (1-5 sao) và để lại phản hồi cho Agent sau khi xử lý ticket.
  - `FileUploadController`: Hỗ trợ đính kèm file trong ticket và trong các luồng tin nhắn.
* **Tự động hóa (Scheduled Tasks):**
  - `SlaMonitorTask`: Tiến trình chạy ngầm mỗi phút để kiểm tra ticket quá hạn (Overdue) hoặc sắp vi phạm SLA, tự động gửi cảnh báo và đánh dấu leo thang (Escalate) cho Admin.
* **Cấu hình hệ thống linh hoạt:**
  - `SettingsController`: Cho phép Admin tùy chỉnh các thông số SLA, bật/tắt luồng thông báo, thay đổi cấu hình AI URL trực tiếp mà không cần khởi động lại server.
* **Kiến trúc DB & Xử lý lỗi:**
  - Kết nối thành công MS SQL Server, Hibernate tự động quản lý schema qua `ddl-auto`.
  - `GlobalExceptionHandler` bắt và chuẩn hóa toàn bộ lỗi (404, 400, 500).

## 2. AI Service (Microservice Phân loại)
Nền tảng: **Python, FastAPI, HuggingFace Transformers**.

**Các tính năng đã hoàn thiện:**
* **Phân loại Ticket Thông minh:** Cung cấp API dự đoán độ ưu tiên (Priority), danh mục (Category) và phân tích cảm xúc (Sentiment) tự động dựa trên Tiêu đề và Mô tả của Ticket bằng mô hình NLP (`typeform/distilbert-base-uncased-mnli`).
* **Tích hợp Backend:** Giao tiếp ổn định với Spring Boot, có cơ chế Fallback (Rule-based) để đảm bảo hệ thống Ticket vẫn hoạt động xuyên suốt nếu AI Service bị gián đoạn.

## 3. Frontend (Giao diện người dùng)
Nền tảng: **React 19, TypeScript, Vite, TailwindCSS v4, Lucide React**.

**Các tính năng đã hoàn thiện:**
* **Cổng thông tin riêng biệt & Bảo mật (RBAC Routing):**
  - Component `RoleRoute` bảo vệ các trang theo quyền truy cập.
  - **Customer Portal:** Khách hàng theo dõi ticket cá nhân, tạo yêu cầu mới, nhắn tin trực tiếp và gọi Audio cho hỗ trợ viên qua bong bóng chat (`CustomerChatBubble`).
  - **Agent Workspace:** Môi trường làm việc tập trung cho nhân viên tiếp nhận, xử lý yêu cầu, có Sidebar, bộ lọc (`FilterBar`) chuyên sâu. Tích hợp `CallPanel` để nhận/gọi cuộc gọi thoại.
  - **Admin Dashboard:** Bảng điều khiển quản trị toàn diện với nhiều phân hệ (Dashboard tổng quan, Quản lý Tickets, Users, SLA Monitoring, Agent Performance, Escalation Tickets, Ratings, Settings).
  - Tách biệt trang đăng nhập: `Login.tsx` (Khách hàng) và `StaffLogin.tsx` (Nhân viên).
* **Thiết kế Premium (Glassmorphism):** Áp dụng giao diện hiện đại, hiệu ứng kính mờ (glass card), đổ bóng tinh tế và hỗ trợ giao diện Tối/Sáng (Dark Mode) mượt mà.
* **Thành phần tương tác nâng cao:**
  - `CreateTicketModal`: Form tạo ticket có tích hợp tự động phân loại nhờ AI.
  - `TicketDetail` & `CustomerTicketDetailModal`: Giao diện chi tiết xử lý ticket, bao gồm lịch sử bình luận và thay đổi trạng thái.
  - `MessagesTab`: Khu vực quản lý toàn bộ các luồng hội thoại và tin nhắn trực tiếp.

## 4. Các bước dự kiến tiếp theo
1. **Tối ưu hóa Trải nghiệm WebRTC:** Nâng cấp độ ổn định của cuộc gọi thoại, bổ sung tính năng chia sẻ màn hình (Screen sharing) hoặc Video call.
2. **Luồng phân công tự động (Auto-assignment):** Bổ sung logic tự động phân bổ (Round-robin hoặc theo khối lượng công việc) để giao ticket ngay cho Agent phù hợp nhất.
3. **Mở rộng báo cáo quản trị (Advanced Analytics):** Bổ sung chức năng xuất (Export) dữ liệu báo cáo hiệu suất, SLA dưới dạng Excel/PDF cho mục đích lưu trữ.
4. **Quản lý Tri thức (Knowledge Base):** Xây dựng hệ thống tài liệu/FAQ nội bộ cho phép AI gợi ý câu trả lời tự động cho khách hàng trước khi cần đến Agent.
