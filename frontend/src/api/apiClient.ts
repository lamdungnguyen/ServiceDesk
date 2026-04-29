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

export const getTickets = async (): Promise<Ticket[]> => {
  const response = await apiClient.get('/tickets');
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

export const getAllUsers = async (): Promise<UserPayload[]> => {
  const response = await apiClient.get('/users');
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

export default apiClient;
