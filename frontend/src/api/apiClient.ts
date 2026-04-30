import axios from 'axios';
import type { Ticket, TicketCreateRequest } from '../types/ticket';

const apiClient = axios.create({
  baseURL: '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach auth headers from logged-in user
apiClient.interceptors.request.use((config) => {
  const savedUser = localStorage.getItem('auth_user');
  if (savedUser) {
    const user = JSON.parse(savedUser);
    config.headers['X-User-Id'] = user.id;
    config.headers['X-User-Role'] = user.role;
    if (user.name) {
      config.headers['X-User-Name'] = user.name;
    }
  }
  return config;
});

const getResponseMessage = (data: unknown): string | null => {
  if (typeof data === 'string') return data;
  if (data && typeof data === 'object' && 'message' in data) {
    const message = (data as { message?: unknown }).message;
    if (typeof message === 'string') return message;
  }
  return null;
};

export const getErrorMessage = (error: unknown, fallback: string): string => {
  if (axios.isAxiosError(error)) {
    return getResponseMessage(error.response?.data) ?? error.message ?? fallback;
  }
  if (error instanceof Error) return error.message;
  return fallback;
};

// ─── Ticket APIs ────────────────────────────────────────────────────────────

export interface TicketFilterParams {
  status?: string;
  priority?: string;
  overdue?: boolean;
  keyword?: string;
}

export const getTickets = async (params?: TicketFilterParams): Promise<Ticket[]> => {
  const response = await apiClient.get('/tickets', { params });
  return response.data;
};

export const getAssignedTickets = async (): Promise<Ticket[]> => {
  const response = await apiClient.get('/tickets/assigned');
  return response.data;
};

export const getTicketById = async (id: number): Promise<Ticket> => {
  const response = await apiClient.get(`/tickets/${id}`);
  return response.data;
};

export const createTicket = async (ticket: TicketCreateRequest): Promise<Ticket> => {
  const response = await apiClient.post('/tickets', ticket);
  return response.data;
};

export const updateTicketStatus = async (id: number, status: string): Promise<Ticket> => {
  const response = await apiClient.put(`/tickets/${id}/status`, { status });
  return response.data;
};

export const assignTicket = async (id: number, assigneeId: number): Promise<Ticket> => {
  const response = await apiClient.put(`/tickets/${id}/assign`, { assigneeId });
  return response.data;
};

// ─── Comment APIs ────────────────────────────────────────────────────────────

export interface Comment {
  id: number;
  ticketId: number;
  content: string;
  authorId: number;
  authorName: string;
  createdAt: string;
}

export const getComments = async (ticketId: number): Promise<Comment[]> => {
  const response = await apiClient.get(`/tickets/${ticketId}/comments`);
  return response.data;
};

export const postComment = async (ticketId: number, content: string): Promise<Comment> => {
  const response = await apiClient.post(`/tickets/${ticketId}/comments`, { content });
  return response.data;
};

// ─── Notification APIs ───────────────────────────────────────────────────────

export interface Notification {
  id: number;
  userId: number;
  message: string;
  type: string;
  ticketId?: number;
  isRead: boolean;
  createdAt: string;
}

export const getNotifications = async (): Promise<Notification[]> => {
  const response = await apiClient.get('/notifications');
  return response.data;
};

export const markNotificationAsRead = async (id: number): Promise<Notification> => {
  const response = await apiClient.put(`/notifications/${id}/read`);
  return response.data;
};

export const markAllNotificationsAsRead = async (): Promise<void> => {
  await apiClient.put('/notifications/read-all');
};

export const getUnreadNotificationCount = async (): Promise<number> => {
  const response = await apiClient.get('/notifications/unread-count');
  return response.data.count;
};

// ─── User APIs ────────────────────────────────────────────────────────────────

export interface UserPayload {
  id: number;
  username: string;
  name: string;
  email?: string;
  phone?: string;
  role: 'ADMIN' | 'AGENT' | 'CUSTOMER';
  agentType?: string;
  status: 'ACTIVE' | 'PENDING' | 'INACTIVE';
}

export const loginUser = async (username: string, password: string): Promise<UserPayload> => {
  const response = await apiClient.post('/users/login', { username, password });
  return response.data;
};

export const registerUser = async (data: {
  username: string;
  password: string;
  name: string;
  email?: string;
  phone?: string;
  role: string;
  agentType?: string;
}): Promise<UserPayload> => {
  const response = await apiClient.post('/users/register', data);
  return response.data;
};

export const getAllUsers = async (role?: string): Promise<UserPayload[]> => {
  const url = role ? `/users?role=${role}` : '/users';
  const response = await apiClient.get(url);
  return response.data;
};

export const updateUserStatus = async (userId: number, status: string): Promise<UserPayload> => {
  const response = await apiClient.patch(`/users/${userId}/status`, { status });
  return response.data;
};

export const deleteUser = async (userId: number): Promise<UserPayload> => {
  const response = await apiClient.delete(`/users/${userId}`);
  return response.data;
};

// ─── Rating APIs ────────────────────────────────────────────────────────────

export interface RatingPayload {
  id: number;
  ticketId: number;
  agentId: number;
  agentName: string;
  customerId: number;
  customerName: string;
  score: number;
  comment?: string;
  createdAt: string;
}

export interface AgentRatingStats {
  agentId: number;
  agentName: string;
  averageScore: number;
  totalRatings: number;
  recentRatings: RatingPayload[];
}

export const submitRating = async (ticketId: number, score: number, comment?: string): Promise<RatingPayload> => {
  const response = await apiClient.post('/ratings', { ticketId, score, comment });
  return response.data;
};

export const getRatingByTicket = async (ticketId: number): Promise<RatingPayload | null> => {
  const response = await apiClient.get(`/ratings/ticket/${ticketId}`);
  if (response.status === 204) return null;
  return response.data;
};

export const getAgentRatings = async (agentId: number): Promise<RatingPayload[]> => {
  const response = await apiClient.get(`/ratings/agent/${agentId}`);
  return response.data;
};

export const getAgentRatingStats = async (agentId: number): Promise<AgentRatingStats> => {
  const response = await apiClient.get(`/ratings/agent/${agentId}/stats`);
  return response.data;
};

export const getAllAgentRatingStats = async (): Promise<AgentRatingStats[]> => {
  const response = await apiClient.get('/ratings/stats');
  return response.data;
};

// ─── Agent Mini Dashboard API ─────────────────────────────────────────────────

export interface AgentMiniDashboard {
  assigned: number;
  inProgress: number;
  overdue: number;
  resolvedToday: number;
}

export const getAgentMiniDashboard = async (): Promise<AgentMiniDashboard> => {
  const response = await apiClient.get('/dashboard/agent/me');
  return response.data;
};

// ─── User Detail API ──────────────────────────────────────────────────────────

export interface UserDetail {
  id: number;
  username: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  agentType?: string;
  status: string;
  totalTickets: number;
  openTickets: number;
}

export const getUserDetail = async (userId: number): Promise<UserDetail> => {
  const response = await apiClient.get(`/users/${userId}`);
  return response.data;
};

// ─── Messaging APIs ──────────────────────────────────────────────────────────

export interface MemberInfo {
  userId: number;
  userName: string;
  userRole: string;
}

export interface DirectMessagePayload {
  id: number;
  conversationId: number;
  senderId: number;
  senderName: string;
  content: string;
  messageType: 'TEXT' | 'IMAGE' | 'FILE' | 'VOICE';
  fileUrl?: string;
  fileName?: string;
  createdAt: string;
}

export interface ConversationPayload {
  id: number;
  name?: string;
  type: 'DM' | 'GROUP';
  createdBy: number;
  createdAt: string;
  members: MemberInfo[];
  lastMessage?: DirectMessagePayload;
}

export const getConversations = async (userId: number): Promise<ConversationPayload[]> => {
  const response = await apiClient.get(`/messages/conversations?userId=${userId}`);
  return response.data;
};

export const createConversation = async (
  creatorId: number,
  data: { type: string; name?: string; memberIds: number[] }
): Promise<ConversationPayload> => {
  const response = await apiClient.post(`/messages/conversations?creatorId=${creatorId}`, data);
  return response.data;
};

export const getConversationMessages = async (
  conversationId: number,
  userId: number
): Promise<DirectMessagePayload[]> => {
  const response = await apiClient.get(`/messages/conversations/${conversationId}/messages?userId=${userId}`);
  return response.data;
};

export const uploadMessageFile = async (file: File): Promise<{ fileUrl: string; fileName: string }> => {
  const form = new FormData();
  form.append('file', file);
  const response = await apiClient.post('/messages/upload', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export const addConversationMember = async (
  conversationId: number,
  userId: number,
  requestingUserId: number
): Promise<void> => {
  await apiClient.post(`/messages/conversations/${conversationId}/members?userId=${userId}&requestingUserId=${requestingUserId}`);
};

export const removeConversationMember = async (
  conversationId: number,
  userId: number,
  requestingUserId: number
): Promise<void> => {
  await apiClient.delete(`/messages/conversations/${conversationId}/members/${userId}?requestingUserId=${requestingUserId}`);
};

// ─── Dashboard APIs ──────────────────────────────────────────────────────────

export interface SlaStats {
  totalTickets: number;
  onTime: number;
  overdue: number;
  nearDeadline: number;
  slaCompliance: number;
}

export interface AgentPerformance {
  agentId: number;
  name: string;
  totalAssigned: number;
  totalResolved: number;
  avgResolutionTime: number;
  overdueTickets: number;
}

export const getSlaStats = async (): Promise<SlaStats> => {
  const response = await apiClient.get('/dashboard/sla');
  return response.data;
};

export const getAgentPerformance = async (): Promise<AgentPerformance[]> => {
  const response = await apiClient.get('/dashboard/agents');
  return response.data;
};

export const getEscalatedTickets = async (): Promise<Ticket[]> => {
  const response = await apiClient.get('/tickets/escalated');
  return response.data;
};

// ─── Settings APIs ────────────────────────────────────────────────────────────

export interface SystemSettings {
  notificationsEnabled: boolean;
  notifyInApp: boolean;
  notifyEmail: boolean;
  notifyTicketAssigned: boolean;
  notifyTicketResolved: boolean;
  notifySlaWarning: boolean;
  notifyEscalation: boolean;
  maxResponseTimeMinutes: number;
  escalationThresholdMinutes: number;
  slaWarningThresholdMinutes: number;
  sessionTimeoutMinutes: number;
  agentCanViewAllTickets: boolean;
  agentCanExportData: boolean;
  aiServiceUrl: string;
}

export const getSettings = async (): Promise<SystemSettings> => {
  const response = await apiClient.get('/settings');
  return response.data;
};

export const updateSettings = async (data: Partial<SystemSettings>): Promise<SystemSettings> => {
  const response = await apiClient.put('/settings', data);
  return response.data;
};

// ─── Support Request APIs ───────────────────────────────────────────────────

export interface SupportRequestPayload {
  id: number;
  customerId: number;
  customerName: string;
  topic: string;
  status: 'WAITING' | 'ACTIVE' | 'CLOSED';
  agentId?: number;
  agentName?: string;
  conversationId?: number;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export const createSupportRequest = async (data: { topic: string; description?: string }): Promise<SupportRequestPayload> => {
  const response = await apiClient.post('/support/requests', data);
  return response.data;
};

export const getWaitingSupportRequests = async (): Promise<SupportRequestPayload[]> => {
  const response = await apiClient.get('/support/requests/waiting');
  return response.data;
};

export const getMySupportRequests = async (): Promise<SupportRequestPayload[]> => {
  const response = await apiClient.get('/support/requests/my');
  return response.data;
};

export const getMyActiveSupportChats = async (): Promise<SupportRequestPayload[]> => {
  const response = await apiClient.get('/support/requests/active');
  return response.data;
};

export const acceptSupportRequest = async (id: number): Promise<SupportRequestPayload> => {
  const response = await apiClient.post(`/support/requests/${id}/accept`);
  return response.data;
};

export const closeSupportRequest = async (id: number): Promise<SupportRequestPayload> => {
  const response = await apiClient.post(`/support/requests/${id}/close`);
  return response.data;
};

export const getWaitingSupportCount = async (): Promise<number> => {
  const response = await apiClient.get('/support/requests/waiting/count');
  return response.data;
};

export default apiClient;
