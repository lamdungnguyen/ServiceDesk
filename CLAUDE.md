# CLAUDE.md

## Project Overview

ServiceDesk is an IT ticketing/support system built as a microservices monorepo with three components:

- **Backend** (`backend/`) — Java 17 + Spring Boot 3.2.4, Spring Data JPA, MS SQL Server. REST API on port 8081.
- **Frontend** (`frontend/`) — React 19, TypeScript 6, Vite 8, Tailwind CSS 4. Three portals: Customer, Agent, Admin.
- **AI Service** (`ai-service/`) — Python FastAPI on port 8000. HuggingFace transformers for ticket classification (category, priority, sentiment).

## Commands

### Backend
```bash
cd backend
mvn clean package          # Build
mvn spring-boot:run        # Run (port 8081)
```

Requires MS SQL Server at `localhost:1433`, database `TicketDB`, credentials configured in `application.yml`.

### Frontend
```bash
cd frontend
npm install                # Install dependencies
npm run dev                # Dev server (proxies /api/* and /ws/* to localhost:8081)
npm run build              # Production build (tsc -b && vite build)
npm run lint               # ESLint
```

### AI Service
```bash
cd ai-service
pip install -r requirements.txt
python main.py             # Starts on port 8000 (first run downloads HF models ~1-2GB)
```

## Architecture

### Backend (`backend/ticket-service/src/main/java/com/servicedesk/ticket/`)

```
controller/   — 14 REST controllers (Ticket, User, Comment, Dashboard, Notification, Call, Chat, Conversation, Dm, FileUpload, Rating, Settings, SupportRequest)
service/      — Business logic interfaces + impl/ implementations
repository/   — Spring Data JPA repositories
entity/       — JPA entities (Ticket, User, Comment, Conversation, ConversationMember, DirectMessage, Notification, Rating, Settings, SupportRequest)
dto/          — Request/response DTOs
enums/        — Priority, TicketStatus, UserRole (CUSTOMER/AGENT/ADMIN), UserStatus
security/     — AuthInterceptor (custom header-based auth via X-User-Id, X-User-Role, X-User-Name)
config/       — DataSeeder, WebSocketConfig, StaticResourceConfig
exception/    — GlobalExceptionHandler, ResourceNotFoundException
task/         — SlaMonitorTask (scheduled SLA monitoring)
```

**Auth**: Custom header-based, NOT Spring Security. AuthInterceptor intercepts all `/api/**` paths. Frontend stores user in localStorage under `auth_user` and sends auth headers with every request.

**Database**: JPA with `ddl-auto: update` (Hibernate auto-manages schema). MS SQL Server dialect.

**AI integration**: `AIServiceImpl` calls the AI microservice at `http://localhost:8000/analyze`. Includes fallback logic if the AI service is unreachable.

### Frontend (`frontend/src/`)

```
api/          — apiClient.ts (Axios client, all API calls defined here)
components/   — Reusable UI components (Navbar, RoleRoute, TicketCard, modals, chat, call panels, agent workspace components)
pages/        — Route-based pages (CustomerPortal, AgentWorkspace, AdminDashboard/, Notifications, Login, StaffLogin)
context/      — AuthContext.tsx + auth.ts (auth state via localStorage)
services/     — websocket.ts (STOMP/SockJS), webrtc.ts
types/        — TypeScript interfaces (ticket.ts)
```

**Routing**: Three role-based portals — Customer (`/my-tickets`), Agent (`/staff/dashboard`), Admin (`/admin/dashboard`). `RoleRoute` component enforces access control on the frontend.

**Styling**: Tailwind CSS v4 with glassmorphism design (glass cards, backdrop blur, dark mode via `prefers-color-scheme`). Custom theme in the Tailwind config.

**Communication**: STOMP over SockJS for messaging, notifications, and WebRTC call signaling.

### AI Service (`ai-service/`)

- `main.py` — FastAPI app, `POST /analyze` endpoint
- `ai_logic.py` — Hybrid approach: rule-based keyword matching first, HuggingFace zero-shot classification (`typeform/distilbert-base-uncased-mnli`) as fallback
- `model.py` — Loads HF models at startup

## Code Patterns

- **Lombok**: Used throughout the backend for boilerplate reduction (`@Data`, `@AllArgsConstructor`, etc.)
- **No Spring Security**: Auth is purely via the custom `AuthInterceptor` and `UserContext`
- **Frontend auth**: `AuthContext` reads/writes `localStorage.auth_user`. Every API call attaches headers via Axios interceptors in `apiClient.ts`
- **Graceful degradation**: Backend continues functioning if the AI service is down

## Key Configuration Files

| File | Purpose |
|---|---|
| `backend/ticket-service/src/main/resources/application.yml` | DB connection, server port, AI service URL, upload settings |
| `frontend/vite.config.ts` | Dev server port, API/WS proxy to backend |
| `ai-service/main.py` | FastAPI server entry point |
