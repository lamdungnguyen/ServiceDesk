import axios from 'axios';
import type { Ticket, TicketCreateRequest } from '../types/ticket';

const apiClient = axios.create({
  baseURL: '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  const savedUser = localStorage.getItem('auth_user');
  if (savedUser) {
    const user = JSON.parse(savedUser);
    config.headers['X-User-Id'] = user.id;
    config.headers['X-User-Role'] = user.role;
  }
  return config;
});

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
  const response = await apiClient.post(`/comments`, { ticketId, content });
  return response.data;
};

export default apiClient;
