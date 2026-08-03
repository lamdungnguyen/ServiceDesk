import apiClient from './axiosInstance';

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
  businessStartTime: string;
  businessEndTime: string;
  workDays: string;
  sessionTimeoutMinutes: number;
  agentCanViewAllTickets: boolean;
  agentCanExportData: boolean;
  aiServiceUrl: string;
  aiAutoApplyEnabled: boolean;
  aiAutoApplyThreshold: number;
  aiSuggestThreshold: number;
}

const getAuthToken = (): string | null => localStorage.getItem('authToken');

export const getSettings = async (): Promise<SystemSettings> => {
  const token = getAuthToken();
  const response = await apiClient.get('/settings', {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

export const updateSettings = async (data: Partial<SystemSettings>): Promise<SystemSettings> => {
  const token = getAuthToken();
  const response = await apiClient.put('/settings', data, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};