import apiClient from './axiosInstance';

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

export interface UserPresencePayload {
  userId: number;
  activityStatus: 'ONLINE' | 'OFFLINE';
  lastSeenAt?: string | null;
}

export interface AuthResponse {
  token: string | null;
  user: UserPayload;
}

export const loginUser = async (username: string, password: string): Promise<AuthResponse> => {
  const response = await apiClient.post('/users/login', { username, password });
  return response.data;
};

// Registration: Remove role and agentType to prevent client from specifying them.
// The backend should assign a default role (e.g., CUSTOMER).
export const registerUser = async (data: {
  username: string;
  password: string;
  name: string;
  email?: string;
  phone?: string;
}): Promise<AuthResponse> => {
  const response = await apiClient.post('/users/register', data);
  return response.data;
};

export const getAllUsers = async (role?: string): Promise<UserPayload[]> => {
  const url = role ? `/users?role=${role}` : '/users';
  const response = await apiClient.get(url);
  return response.data;
};

export const getUserPresence = async (): Promise<UserPresencePayload[]> => {
  const response = await apiClient.get('/users/presence');
  return response.data;
};

// To prevent IDOR, updateUserStatus should only be called with the current user's ID
// or with proper authorization from the backend. The frontend sends only status.
export const updateUserStatus = async (userId: number, status: string): Promise<UserPayload> => {
  const response = await apiClient.patch(`/users/${userId}/status`, { status });
  return response.data;
};

// To prevent IDOR and mass assignment, updateUserRole sends only role and agentType.
export const updateUserRole = async (userId: number, role: string, agentType?: string): Promise<UserPayload> => {
  const response = await apiClient.patch(`/users/${userId}/role`, { role, agentType });
  return response.data;
};

// Admin creation: Remove role and agentType to avoid mass assignment risk.
// Backend should assign a default role (e.g., CUSTOMER) and ignore client-supplied role.
export const adminCreateUser = async (data: {
  username: string;
  password: string;
  name: string;
  email?: string;
  phone?: string;
}): Promise<UserPayload> => {
  const response = await apiClient.post('/users', data);
  return response.data;
};

export const deleteUser = async (userId: number): Promise<UserPayload> => {
  const response = await apiClient.delete(`/users/${userId}`);
  return response.data;
};

// ─── User Detail API ──────────────────────────────────────────────────────────
// To mitigate IDOR, this endpoint now returns the details of the currently authenticated user.
// Use a separate admin endpoint (if needed) that enforces server-side authorization.

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

export const getUserDetail = async (): Promise<UserDetail> => {
  const response = await apiClient.get('/users/me');
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