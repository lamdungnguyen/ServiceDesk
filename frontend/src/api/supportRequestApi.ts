import apiClient from './axiosInstance';

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
