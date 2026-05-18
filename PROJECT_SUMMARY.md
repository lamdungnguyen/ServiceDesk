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
* **Quản lý Hồ sơ (User Profile):** Trang thông tin người dùng chi tiết và cài đặt cá nhân, truy cập trực tiếp từ menu người dùng.
* **Thiết kế Premium (Glassmorphism):** Áp dụng giao diện hiện đại, hiệu ứng kính mờ (glass card), đổ bóng tinh tế và hỗ trợ giao diện Tối/Sáng (Dark Mode) mượt mà.
* **Thành phần tương tác nâng cao:**
  - `CreateTicketModal`: Form tạo ticket hỗ trợ đính kèm file/video và tự động phân loại nhờ AI.
  - `TicketDetail` & `CustomerTicketDetailModal`: Giao diện chi tiết xử lý ticket, xem số lượng bình luận thực tế, lịch sử bình luận và thay đổi trạng thái.
  - `MessagesTab`: Khu vực quản lý toàn bộ các luồng hội thoại và tin nhắn trực tiếp.

## 4. Các hướng và ý tưởng phát triển dự án tiếp theo
1. **Quản lý Tri thức (Knowledge Base) & AI Chatbot:** Xây dựng hệ thống tài liệu (FAQ/Wiki) nội bộ. Cung cấp AI Chatbot tự động gợi ý cách giải quyết dựa trên tri thức có sẵn trước khi khách hàng phải tạo ticket.
2. **Luồng phân công tự động thông minh (Smart Auto-assignment):** Bổ sung logic phân bổ ticket tự động cho Agent dựa trên kỹ năng (skills), khối lượng công việc hiện tại (workload) hoặc phân bổ xoay vòng (Round-robin).
3. **Mở rộng Đa kênh (Omnichannel Support):** Tích hợp Email, Zalo, Telegram, Facebook Messenger hoặc Slack/Teams để khách hàng có thể gửi yêu cầu và nhận hỗ trợ từ bất kỳ đâu, tất cả đồng bộ về một nguồn duy nhất.
4. **Tự động hóa luồng làm việc (Automation Rules/Triggers):** Cho phép Admin tự cấu hình các quy tắc tự động hóa (Ví dụ: "Nếu ticket Ưu tiên cao không có người nhận sau 10 phút, tự động gửi email cảnh báo cho Quản lý").
5. **Mở rộng báo cáo quản trị (Advanced Analytics & Dashboards):** Bổ sung biểu đồ trực quan động (sử dụng Recharts/Chart.js), thống kê chi tiết thời gian phản hồi, tỉ lệ hoàn thành SLA, và xuất dữ liệu báo cáo (Export Excel/PDF).
6. **Tối ưu WebRTC và Collaboration:** Bổ sung tính năng chia sẻ màn hình (Screen sharing), Video call để Agent dễ dàng hỗ trợ khách hàng khắc phục lỗi trực quan hơn.
7. **Quản lý Tài sản / Cấu hình (CMDB/Asset Management):** Tích hợp quản lý thiết bị công nghệ. Khách hàng có thể gắn ticket với một tài sản cụ thể (ví dụ: máy in bị hỏng, laptop trục trặc) để theo dõi lịch sử bảo trì.
