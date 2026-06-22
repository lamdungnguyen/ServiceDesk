import apiClient from './axiosInstance';

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
  readByIds?: string;
  reactions?: string;
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
