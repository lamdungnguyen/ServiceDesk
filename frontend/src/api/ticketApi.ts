import apiClient from './axiosInstance';
import type { Ticket, TicketCreateRequest, CustomFieldConfig } from '../types/ticket';

export interface TicketFilterParams {
  status?: string;
  priority?: string;
  overdue?: boolean;
  keyword?: string;
  assignedToMe?: boolean;
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

export const getCustomFieldsByCategory = async (category: string): Promise<CustomFieldConfig[]> => {
  const response = await apiClient.get(`/custom-fields/${category}`);
  return response.data;
};
