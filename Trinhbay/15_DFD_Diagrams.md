# Danh sách 15 Sơ đồ DFD (Data Flow Diagram) - Hệ thống Service Desk

Dưới đây là 15 sơ đồ luồng dữ liệu (DFD) được thiết kế chuyên nghiệp bằng cú pháp **PlantUML**, tương thích hoàn toàn với Draw.io. Các sơ đồ tuân thủ thiết kế đồng bộ (Font Times New Roman, màu sắc quy chuẩn, bo góc 25) để phù hợp với tài liệu dự án của bạn.

---

## 1. DFD Mức 0 (Context Diagram) - Tổng quan Hệ thống
Mô tả các thực thể bên ngoài (External Entities) tương tác với toàn bộ Hệ thống Service Desk.

```plantuml
@startuml
left to right direction
skinparam defaultFontName "Times New Roman"
skinparam rectangle {
    BackgroundColor #E3F2FD
    BorderColor #1E88E5
    RoundCorner 25
    FontColor #000000
    FontStyle bold
}
skinparam actor {
    BackgroundColor #E8F5E9
    BorderColor #43A047
}
skinparam arrowColor #546E7A
skinparam Nodesep 50
skinparam Ranksep 50

actor "Khách hàng" as KH
actor "Nhân viên (Agent)" as AG
actor "Quản trị viên (Admin)" as AD
actor "AI Service (Microservice)" as AI

rectangle "0.0\nHệ thống Service Desk" as SYS

KH --> SYS : Tạo yêu cầu, Chat, Gọi thoại\nĐánh giá
SYS --> KH : Thông báo trạng thái\nKết quả xử lý

AG --> SYS : Cập nhật tiến độ, Nhắn tin\nNhận cuộc gọi
SYS --> AG : Giao việc, Cảnh báo SLA

AD --> SYS : Cấu hình hệ thống, Quản lý User
SYS --> AD : Báo cáo thống kê, Cảnh báo leo thang

SYS --> AI : Tiêu đề, Mô tả Ticket
AI --> SYS : Mức độ ưu tiên, Danh mục, Cảm xúc
@enduml
```

---

## 2. DFD Mức 1 - Tổng quát Hệ thống
Phân rã Hệ thống thành các Tiến trình (Process) chính và các Kho dữ liệu (Data Stores).

```plantuml
@startuml
skinparam defaultFontName "Times New Roman"
skinparam rectangle {
    BackgroundColor #E3F2FD
    BorderColor #1E88E5
    RoundCorner 25
}
skinparam database {
    BackgroundColor #FFF3E0
    BorderColor #FB8C00
}
skinparam actor {
    BackgroundColor #E8F5E9
    BorderColor #43A047
}
skinparam arrowColor #546E7A
skinparam Nodesep 40
skinparam Ranksep 50

actor "Người dùng\n(KH, Agent, Admin)" as User
actor "AI Service" as AI

rectangle "1.0\nQuản lý Tài khoản\n& Xác thực" as P1
rectangle "2.0\nQuản lý Ticket\n& SLA" as P2
rectangle "3.0\nGiao tiếp\nThời gian thực" as P3
rectangle "4.0\nBáo cáo &\nCấu hình hệ thống" as P4

database "D1: Users DB" as D1
database "D2: Tickets DB" as D2
database "D3: Chat & Call DB" as D3

User --> P1 : Đăng nhập, Hồ sơ
P1 --> D1 : Đọc/Ghi dữ liệu User

User --> P2 : Tạo, Cập nhật Ticket
P2 --> D2 : Đọc/Ghi Ticket
P2 <--> AI : Gửi/Nhận dự đoán AI

User --> P3 : Chat, Gọi thoại (WebRTC)
P3 --> D3 : Lưu lịch sử tin nhắn

User --> P4 : Xem Dashboard, Cấu hình
P4 --> D2 : Trích xuất dữ liệu
@enduml
```

---

## 3. DFD Mức 2 (Tiến trình 1.0) - Quản lý Tài khoản & Xác thực
Chi tiết quá trình phân quyền (RBAC) và quản lý người dùng.

```plantuml
@startuml
left to right direction
skinparam defaultFontName "Times New Roman"
skinparam rectangle {
    BackgroundColor #E3F2FD
    BorderColor #1E88E5
    RoundCorner 25
}
skinparam database {
    BackgroundColor #FFF3E0
    BorderColor #FB8C00
}
skinparam actor {
    BackgroundColor #E8F5E9
    BorderColor #43A047
}
skinparam arrowColor #546E7A

actor "Người dùng" as User
actor "Admin" as AD

rectangle "1.1\nĐăng nhập & Xác thực" as P11
rectangle "1.2\nQuản lý Hồ sơ" as P12
rectangle "1.3\nPhân quyền (RBAC)" as P13

database "D1: Users DB" as D1

User --> P11 : Thông tin đăng nhập
P11 --> D1 : Kiểm tra Account
P11 --> User : Token / Phiên đăng nhập (Role)

User --> P12 : Thông tin cập nhật
P12 --> D1 : Lưu Profile mới

AD --> P13 : Gán vai trò (Agent/Admin)
P13 --> D1 : Cập nhật Role
@enduml
```

---

## 4. DFD Mức 2 (Tiến trình 2.1) - Khởi tạo Yêu cầu & Phân loại AI
Chi tiết quá trình khách hàng tạo Ticket và tích hợp tự động phân loại bằng AI.

```plantuml
@startuml
skinparam defaultFontName "Times New Roman"
skinparam rectangle {
    BackgroundColor #E3F2FD
    BorderColor #1E88E5
    RoundCorner 25
}
skinparam database {
    BackgroundColor #FFF3E0
    BorderColor #FB8C00
}
skinparam actor {
    BackgroundColor #E8F5E9
    BorderColor #43A047
}
skinparam arrowColor #546E7A

actor "Khách hàng" as KH
actor "AI Service" as AI

rectangle "2.1.1\nTiếp nhận thông tin" as P211
rectangle "2.1.2\nGọi AI Phân tích" as P212
rectangle "2.1.3\nLưu trữ Ticket" as P213
rectangle "2.1.4\nTính toán SLA" as P214

database "D2: Tickets DB" as D2
database "D5: Settings DB" as D5

KH --> P211 : Form (Tiêu đề, Mô tả)
P211 --> P212 : Dữ liệu Text
P212 --> AI : Request Text
AI --> P212 : JSON (Priority, Category)
P212 --> P214 : Dữ liệu ưu tiên
P214 --> D5 : Lấy cấu hình SLA
P214 --> P213 : Dữ liệu đã có Due Date
P213 --> D2 : Insert Ticket
P213 --> KH : Xác nhận thành công
@enduml
```

---

## 5. DFD Mức 2 (Tiến trình 2.2) - Tiếp nhận & Xử lý Yêu cầu
Quá trình Agent làm việc với Ticket, cập nhật trạng thái.

```plantuml
@startuml
skinparam defaultFontName "Times New Roman"
skinparam rectangle {
    BackgroundColor #E3F2FD
    BorderColor #1E88E5
    RoundCorner 25
}
skinparam database {
    BackgroundColor #FFF3E0
    BorderColor #FB8C00
}
skinparam actor {
    BackgroundColor #E8F5E9
    BorderColor #43A047
}
skinparam arrowColor #546E7A

actor "Agent" as AG

rectangle "2.2.1\nTra cứu Ticket" as P221
rectangle "2.2.2\nCập nhật Trạng thái" as P222
rectangle "2.2.3\nBình luận / Ghi chú" as P223

database "D2: Tickets DB" as D2
database "D7: File Storage" as D7

AG --> P221 : Tiêu chí lọc
P221 --> D2 : Truy vấn
D2 --> P221 : Danh sách Ticket
P221 --> AG : Hiển thị

AG --> P222 : Trạng thái mới (In Progress, Resolved)
P222 --> D2 : Update Status

AG --> P223 : Nội dung bình luận, File đính kèm
P223 --> D7 : Upload File
P223 --> D2 : Thêm Comment
@enduml
```

---

## 6. DFD Mức 2 (Tiến trình 2.3) - Đánh giá & Phản hồi
Khách hàng đánh giá mức độ hài lòng sau khi Ticket được đóng.

```plantuml
@startuml
skinparam defaultFontName "Times New Roman"
skinparam rectangle {
    BackgroundColor #E3F2FD
    BorderColor #1E88E5
    RoundCorner 25
}
skinparam database {
    BackgroundColor #FFF3E0
    BorderColor #FB8C00
}
skinparam actor {
    BackgroundColor #E8F5E9
    BorderColor #43A047
}
skinparam arrowColor #546E7A

actor "Khách hàng" as KH
actor "Agent" as AG

rectangle "2.3.1\nGửi yêu cầu đánh giá" as P231
rectangle "2.3.2\nNhận & Lưu Rating" as P232
rectangle "2.3.3\nCập nhật Điểm Agent" as P233

database "D2: Tickets DB" as D2
database "D4: Ratings DB" as D4
database "D1: Users DB" as D1

D2 --> P231 : Ticket đã đóng
P231 --> KH : Form Đánh giá
KH --> P232 : Rating (1-5 sao), Feedback
P232 --> D4 : Lưu Record
P232 --> P233 : Dữ liệu điểm
P233 --> D1 : Update Average Rating của Agent
P233 --> AG : Thông báo nhận đánh giá
@enduml
```

---

## 7. DFD Mức 2 (Tiến trình 3.1) - Giao tiếp Chat & Nhắn tin
Luồng truyền tải tin nhắn thời gian thực qua WebSockets (STOMP).

```plantuml
@startuml
skinparam defaultFontName "Times New Roman"
skinparam rectangle {
    BackgroundColor #E3F2FD
    BorderColor #1E88E5
    RoundCorner 25
}
skinparam database {
    BackgroundColor #FFF3E0
    BorderColor #FB8C00
}
skinparam actor {
    BackgroundColor #E8F5E9
    BorderColor #43A047
}
skinparam arrowColor #546E7A

actor "Người gửi" as Sender
actor "Người nhận" as Receiver

rectangle "3.1.1\nXác định Hội thoại" as P311
rectangle "3.1.2\nXử lý WebSocket\n(STOMP)" as P312
rectangle "3.1.3\nLưu trữ Tin nhắn" as P313
rectangle "3.1.4\nPhát tin nhắn (Broadcast)" as P314

database "D3: Chat DB" as D3

Sender --> P311 : Gửi tin nhắn (Text, File)
P311 --> P312 : Payload
P312 --> P313 : Dữ liệu tin nhắn
P313 --> D3 : Insert Message
P312 --> P314 : Điều hướng Event
P314 --> Receiver : Hiển thị tin nhắn Real-time
@enduml
```

---

## 8. DFD Mức 2 (Tiến trình 3.2) - Gọi thoại WebRTC (Audio Call)
Quá trình thiết lập cuộc gọi P2P giữa Khách hàng và Agent.

```plantuml
@startuml
skinparam defaultFontName "Times New Roman"
skinparam rectangle {
    BackgroundColor #E3F2FD
    BorderColor #1E88E5
    RoundCorner 25
}
skinparam actor {
    BackgroundColor #E8F5E9
    BorderColor #43A047
}
skinparam arrowColor #546E7A

actor "Caller\n(Khách hàng)" as Caller
actor "Callee\n(Agent)" as Callee

rectangle "3.2.1\nYêu cầu kết nối (Offer)" as P321
rectangle "3.2.2\nXử lý ICE Candidates" as P322
rectangle "3.2.3\nTrả lời kết nối (Answer)" as P323
rectangle "3.2.4\nKiểm soát luồng gọi" as P324

Caller --> P321 : Gửi Offer SDP
P321 --> Callee : Đổ chuông / Đẩy Offer
Callee --> P323 : Gửi Answer SDP
P323 --> Caller : Chấp nhận kết nối

Caller --> P322 : Gửi ICE
Callee --> P322 : Gửi ICE
P322 --> Caller : Trao đổi ICE
P322 --> Callee : Trao đổi ICE

Caller <--> P324 : Audio Stream (P2P)
Callee <--> P324 : Audio Stream (P2P)
@enduml
```

---

## 9. DFD Mức 2 (Tiến trình 5.0) - Giám sát SLA & Leo thang
Tiến trình chạy ngầm quét các ticket vi phạm hạn chót xử lý.

```plantuml
@startuml
skinparam defaultFontName "Times New Roman"
skinparam rectangle {
    BackgroundColor #E3F2FD
    BorderColor #1E88E5
    RoundCorner 25
}
skinparam database {
    BackgroundColor #FFF3E0
    BorderColor #FB8C00
}
skinparam actor {
    BackgroundColor #E8F5E9
    BorderColor #43A047
}
skinparam arrowColor #546E7A

actor "Hệ thống\n(Cron Job)" as SYS
actor "Admin" as AD

rectangle "5.0.1\nQuét Ticket quá hạn" as P51
rectangle "5.0.2\nĐánh dấu Escalate" as P52
rectangle "5.0.3\nGửi cảnh báo" as P53

database "D2: Tickets DB" as D2
database "D6: Notifications DB" as D6

SYS --> P51 : Trigger mỗi phút
P51 --> D2 : Truy vấn Tickets chưa đóng (due_date < now)
D2 --> P51 : Danh sách vi phạm SLA
P51 --> P52 : Tickets cần leo thang
P52 --> D2 : Cập nhật Status = Escalated
P52 --> P53 : Tạo sự kiện cảnh báo
P53 --> D6 : Lưu Notification
P53 --> AD : Gửi cảnh báo UI
@enduml
```

---

## 10. DFD Mức 2 (Tiến trình 4.1) - Quản lý Cấu hình Hệ thống
Admin thay đổi các tham số động của hệ thống (SLA, AI URL).

```plantuml
@startuml
skinparam defaultFontName "Times New Roman"
skinparam rectangle {
    BackgroundColor #E3F2FD
    BorderColor #1E88E5
    RoundCorner 25
}
skinparam database {
    BackgroundColor #FFF3E0
    BorderColor #FB8C00
}
skinparam actor {
    BackgroundColor #E8F5E9
    BorderColor #43A047
}
skinparam arrowColor #546E7A

actor "Admin" as AD

rectangle "4.1.1\nHiển thị cấu hình" as P411
rectangle "4.1.2\nCập nhật tham số" as P412
rectangle "4.1.3\nÁp dụng Runtime" as P413

database "D5: Settings DB" as D5

AD --> P411 : Yêu cầu xem Settings
D5 --> P411 : Trả về dữ liệu
P411 --> AD : Hiển thị form

AD --> P412 : Gửi giá trị mới (SLA, AI URL)
P412 --> D5 : Lưu cấu hình
P412 --> P413 : Reload Config
P413 --> Hệ thống : Cập nhật biến môi trường/Cache
@enduml
```

---

## 11. DFD Mức 2 (Tiến trình 4.2) - Dashboard & Báo cáo
Tổng hợp dữ liệu và xuất báo cáo hiệu suất hoạt động.

```plantuml
@startuml
skinparam defaultFontName "Times New Roman"
skinparam rectangle {
    BackgroundColor #E3F2FD
    BorderColor #1E88E5
    RoundCorner 25
}
skinparam database {
    BackgroundColor #FFF3E0
    BorderColor #FB8C00
}
skinparam actor {
    BackgroundColor #E8F5E9
    BorderColor #43A047
}
skinparam arrowColor #546E7A

actor "Admin / Manager" as AD

rectangle "4.2.1\nTổng hợp dữ liệu" as P421
rectangle "4.2.2\nTính toán hiệu suất" as P422
rectangle "4.2.3\nXuất dữ liệu" as P423

database "D1: Users DB" as D1
database "D2: Tickets DB" as D2
database "D4: Ratings DB" as D4

AD --> P421 : Mở Dashboard
D1 --> P421 : Dữ liệu Agent
D2 --> P421 : Dữ liệu Ticket (Status, SLA)
D4 --> P421 : Dữ liệu Rating
P421 --> P422 : Raw Data
P422 --> AD : Hiển thị Biểu đồ / Chỉ số
AD --> P423 : Yêu cầu Export (Excel/PDF)
P423 --> AD : Tải file Báo cáo
@enduml
```

---

## 12. DFD Mức 3 (Tiến trình 2.1.2) - Chi tiết Giao tiếp Microservice AI
Sự trao đổi luồng dữ liệu chuyên sâu giữa Backend Java và AI Python.

```plantuml
@startuml
skinparam defaultFontName "Times New Roman"
skinparam rectangle {
    BackgroundColor #E3F2FD
    BorderColor #1E88E5
    RoundCorner 25
}
skinparam actor {
    BackgroundColor #E8F5E9
    BorderColor #43A047
}
skinparam arrowColor #546E7A

rectangle "2.1.2.1\nĐịnh dạng Payload Text" as P1
rectangle "2.1.2.2\nGọi API FastAPI" as P2
rectangle "2.1.2.3\nXử lý Fallback" as P3
rectangle "2.1.2.4\nPhân tích JSON Response" as P4

actor "Spring Boot Backend" as Backend
actor "AI Service (Python)" as AI

Backend --> P1 : Ticket Title & Desc
P1 --> P2 : JSON Payload
P2 --> AI : HTTP POST /api/predict
AI --> P4 : Success Response (JSON)
AI --> P3 : Timeout / Lỗi (500)
P3 --> Backend : Trả về giá trị mặc định (Rule-based)
P4 --> Backend : Trả về AI Predictions
@enduml
```

---

## 13. DFD Mức 3 (Tiến trình 3.1.3) - Chi tiết Hệ thống Thông báo (Notifications)
Luồng sự kiện đẩy thông báo real-time tới giao diện.

```plantuml
@startuml
skinparam defaultFontName "Times New Roman"
skinparam rectangle {
    BackgroundColor #E3F2FD
    BorderColor #1E88E5
    RoundCorner 25
}
skinparam database {
    BackgroundColor #FFF3E0
    BorderColor #FB8C00
}
skinparam actor {
    BackgroundColor #E8F5E9
    BorderColor #43A047
}
skinparam arrowColor #546E7A

actor "Hệ thống / Sự kiện" as SYS
actor "Người dùng (UI)" as Client

rectangle "N.1\nTạo sự kiện (Event)" as P1
rectangle "N.2\nLưu Notification DB" as P2
rectangle "N.3\nĐẩy qua STOMP Channel" as P3
rectangle "N.4\nĐánh dấu đã đọc" as P4

database "D6: Notifications DB" as D6

SYS --> P1 : Gửi Event (Ticket New, Escalated)
P1 --> P2 : Object thông báo
P2 --> D6 : Lưu Trạng thái (Unread)
P1 --> P3 : Định tuyến User/Topic
P3 --> Client : Nhận thông báo Real-time
Client --> P4 : Click vào thông báo
P4 --> D6 : Cập nhật Status (Read)
@enduml
```

---

## 14. DFD Mức 3 (Tiến trình 2.4) - Chi tiết Quản lý File Đính kèm
Cách file đính kèm được upload, lưu trữ và mapping với Database.

```plantuml
@startuml
skinparam defaultFontName "Times New Roman"
skinparam rectangle {
    BackgroundColor #E3F2FD
    BorderColor #1E88E5
    RoundCorner 25
}
skinparam database {
    BackgroundColor #FFF3E0
    BorderColor #FB8C00
}
skinparam actor {
    BackgroundColor #E8F5E9
    BorderColor #43A047
}
skinparam arrowColor #546E7A

actor "Người dùng" as User
actor "Storage Service" as Storage

rectangle "F.1\nKiểm tra định dạng & Dung lượng" as P1
rectangle "F.2\nTạo tên file định danh (UUID)" as P2
rectangle "F.3\nLưu trữ vật lý" as P3
rectangle "F.4\nLưu Meta Data" as P4

database "D7: File Meta DB" as D7

User --> P1 : Upload Multipart File
P1 --> P2 : File hợp lệ
P2 --> P3 : Blob Data
P3 --> Storage : Ghi File
Storage --> P3 : File Path / URL
P3 --> P4 : Thông tin Path
P4 --> D7 : Insert File Info (TicketID/MessageID)
P4 --> User : Trả về File URL
@enduml
```

---

## 15. DFD Mức 3 (Tiến trình 2.2.x) - Chi tiết Phân công Ticket (Assignment)
Logic hệ thống quyết định gán Ticket cho Agent nào.

```plantuml
@startuml
skinparam defaultFontName "Times New Roman"
skinparam rectangle {
    BackgroundColor #E3F2FD
    BorderColor #1E88E5
    RoundCorner 25
}
skinparam database {
    BackgroundColor #FFF3E0
    BorderColor #FB8C00
}
skinparam actor {
    BackgroundColor #E8F5E9
    BorderColor #43A047
}
skinparam arrowColor #546E7A

actor "Hệ thống" as SYS
actor "Admin / Manager" as AD
actor "Agent" as AG

rectangle "A.1\nPhân tích khối lượng công việc" as P1
rectangle "A.2\nPhân công tự động (Round-robin)" as P2
rectangle "A.3\nPhân công thủ công" as P3
rectangle "A.4\nCập nhật Assignee" as P4

database "D1: Users DB" as D1
database "D2: Tickets DB" as D2

SYS --> P1 : Ticket mới sinh ra
D1 --> P1 : Danh sách Agents & Load hiện tại
P1 --> P2 : Lựa chọn Agent tối ưu
P2 --> P4 : Tự động gán

AD --> P3 : Lựa chọn Agent thủ công
P3 --> P4 : Ghi đè gán

P4 --> D2 : Update Assignee_ID
P4 --> AG : Gửi thông báo phân công
@enduml
```
