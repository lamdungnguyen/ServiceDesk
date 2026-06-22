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

export const getConversations = async (): Promise<ConversationPayload[]> => {
  const response = await apiClient.get('/messages/conversations');
  return response.data;
};

export const createConversation = async (
  data: { type: string; name?: string; memberIds: number[] }
): Promise<ConversationPayload> => {
  const response = await apiClient.post('/messages/conversations', data);
  return response.data;
};

export const getConversationMessages = async (
  conversationId: number
): Promise<DirectMessagePayload[]> => {
  const response = await apiClient.get(`/messages/conversations/${conversationId}/messages`);
  return response.data;
};

const ALLOWED_FILE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'audio/mpeg',
  'audio/wav',
  'audio/ogg',
  'video/mp4',
];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

export const uploadMessageFile = async (file: File): Promise<{ fileUrl: string; fileName: string }> => {
  if (!ALLOWED_FILE_TYPES.includes(file.type)) {
    throw new Error('File type not allowed. Allowed types: images, PDF, Word, plain text, audio, video.');
  }
  if (file.size > MAX_FILE_SIZE) {
    throw new Error('File size exceeds 10 MB limit.');
  }

  const form = new FormData();
  form.append('file', file);
  const response = await apiClient.post('/messages/upload', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export const addConversationMember = async (
  conversationId: number,
  userId: number
): Promise<void> => {
  await apiClient.post(`/messages/conversations/${conversationId}/members/${userId}`);
};

export const removeConversationMember = async (
  conversationId: number,
  userId: number
): Promise<void> => {
  await apiClient.delete(`/messages/conversations/${conversationId}/members/${userId}`);
};