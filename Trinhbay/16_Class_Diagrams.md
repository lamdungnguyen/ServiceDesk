# Sơ đồ Lớp (Class Diagram) - Hệ thống Service Desk

Tài liệu này bao gồm sơ đồ lớp (Class Diagram) của hệ thống Service Desk, thể hiện cấu trúc các thực thể dữ liệu (Entities) và các mối quan hệ (Associations) giữa chúng trong cơ sở dữ liệu.

Sơ đồ được viết bằng cú pháp PlantUML. Bạn có thể copy mã nguồn này và dán vào [Draw.io](https://app.diagrams.net/) (vào mục **Arrange > Insert > Advanced > PlantUML...**) hoặc xem trực tiếp bằng các plugin hỗ trợ PlantUML.

## Sơ đồ Lớp Tổng Quan (Core Entities)

Sơ đồ này mô tả cấu trúc dữ liệu tổng quan bao gồm Quản lý Người dùng, Ticket, Giao tiếp (Tin nhắn, Bình luận) và các cấu hình liên quan.

```plantuml
@startuml
!theme plain
skinparam backgroundColor #FFFFFF
skinparam class {
    BackgroundColor #F9F9F9
    ArrowColor #2C3E50
    BorderColor #2C3E50
    FontName "Times New Roman"
    FontSize 12
}

' ==============================
' ENUMS
' ==============================
enum UserRole {
  CUSTOMER
  AGENT
  ADMIN
}

enum UserStatus {
  ACTIVE
  INACTIVE
  SUSPENDED
}

enum TicketStatus {
  OPEN
  IN_PROGRESS
  RESOLVED
  CLOSED
}

enum Priority {
  LOW
  MEDIUM
  HIGH
  URGENT
}

enum SupportRequestStatus {
  WAITING
  ASSIGNED
  COMPLETED
  CANCELLED
}

' ==============================
' ENTITIES
' ==============================
class User {
  + id: Long
  + username: String
  + password: String
  + name: String
  + email: String
  + phone: String
  + role: UserRole
  + agentType: String
  + status: UserStatus
  + createdAt: LocalDateTime
  + updatedAt: LocalDateTime
}

class Ticket {
  + id: Long
  + title: String
  + description: String
  + status: TicketStatus
  + priority: Priority
  + category: String
  + createdAt: LocalDateTime
  + updatedAt: LocalDateTime
  + dueDate: LocalDateTime
  + reporterId: Long
  + reporterName: String
  + reporterEmail: String
  + assigneeId: Long
  + slaNotified: Boolean
  + overdueNotified: Boolean
  + escalated: Boolean
  + resolvedAt: LocalDateTime
}

class Comment {
  + id: Long
  + ticketId: Long
  + authorId: Long
  + authorName: String
  + content: String
  + createdAt: LocalDateTime
  + isInternal: Boolean
}

class Rating {
  + id: Long
  + ticketId: Long
  + customerId: Long
  + agentId: Long
  + score: Integer
  + feedback: String
  + createdAt: LocalDateTime
}

class Notification {
  + id: Long
  + recipientId: Long
  + type: String
  + title: String
  + message: String
  + relatedEntityId: Long
  + relatedEntityType: String
  + isRead: Boolean
  + createdAt: LocalDateTime
}

class SupportRequest {
  + id: Long
  + customerId: Long
  + customerName: String
  + topic: String
  + status: SupportRequestStatus
  + agentId: Long
  + agentName: String
  + conversationId: Long
  + description: String
  + createdAt: LocalDateTime
  + updatedAt: LocalDateTime
}

class Conversation {
  + id: Long
  + type: String
  + title: String
  + createdAt: LocalDateTime
  + updatedAt: LocalDateTime
  + status: String
}

class ConversationMember {
  + id: Long
  + conversationId: Long
  + userId: Long
  + role: String
  + joinedAt: LocalDateTime
  + lastReadAt: LocalDateTime
}

class DirectMessage {
  + id: Long
  + conversationId: Long
  + senderId: Long
  + senderName: String
  + content: String
  + createdAt: LocalDateTime
  + type: String
  + readBy: String
}

class Settings {
  + id: Long
  + notificationsEnabled: Boolean
  + notifyInApp: Boolean
  + notifyEmail: Boolean
  + notifyTicketAssigned: Boolean
  + notifyTicketResolved: Boolean
  + notifySlaWarning: Boolean
  + ...
}

' ==============================
' RELATIONSHIPS (Logically Mapped)
' ==============================
User "1" --> "0..*" Ticket : "creates (reporter)"
User "1" --> "0..*" Ticket : "handles (assignee)"
User "1" --> "0..*" Comment : "writes"
User "1" --> "0..*" Rating : "receives/submits"
User "1" --> "0..*" Notification : "receives"
User "1" --> "0..*" SupportRequest : "requests/handles"

Ticket "1" *-- "0..*" Comment : "contains"
Ticket "1" -- "0..1" Rating : "has"

Conversation "1" *-- "1..*" ConversationMember : "has"
Conversation "1" *-- "0..*" DirectMessage : "contains"
User "1" --> "0..*" ConversationMember : "joins"

SupportRequest "0..1" --> "1" Conversation : "creates"

@enduml
```

## Diễn giải chi tiết

1.  **User (Người dùng):** Thực thể trung tâm quản lý tài khoản, thông tin cá nhân và quyền truy cập (`UserRole`). `User` liên kết trực tiếp với nhiều thực thể khác như người tạo (reporter) hoặc người xử lý (assignee) `Ticket`, người viết `Comment`, v.v.
2.  **Ticket (Yêu cầu hỗ trợ):** Quản lý toàn bộ vòng đời của một yêu cầu. Bao gồm các trạng thái (`TicketStatus`), mức độ ưu tiên (`Priority`) và các thông tin SLA (`dueDate`, `escalated`). Một `Ticket` có thể chứa nhiều `Comment` và một `Rating` (Đánh giá) duy nhất khi đóng.
3.  **Comment (Bình luận):** Cấu trúc lưu trữ quá trình trao đổi trực tiếp trên một `Ticket`. Có thuộc tính `isInternal` để dành riêng cho Agent trao đổi nội bộ.
4.  **Rating (Đánh giá):** Phản hồi và chấm điểm (score) của khách hàng về chất lượng phục vụ của Agent.
5.  **Hệ thống Giao tiếp (Conversation, ConversationMember, DirectMessage):** Xử lý nhắn tin thời gian thực. `Conversation` là phòng chat hoặc luồng tin nhắn, bao gồm các thành viên (`ConversationMember`) tham gia và lưu lại lịch sử nội dung (`DirectMessage`).
6.  **SupportRequest:** Yêu cầu hỗ trợ trực tuyến thông qua Chat hoặc Call, sẽ tự động sinh ra một `Conversation` tương ứng để tương tác.
7.  **Notification:** Hệ thống thông báo đẩy, cảnh báo SLA, có quan hệ đến các thực thể khác qua `relatedEntityId` và `relatedEntityType` (Đa hình ảo).
8.  **Settings:** Cấu hình hệ thống chung (thường chỉ có 1 bản ghi duy nhất) phục vụ tắt/bật tính năng thông báo và SLA.
