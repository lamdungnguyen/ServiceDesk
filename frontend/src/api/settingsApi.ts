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
}

export const getSettings = async (): Promise<SystemSettings> => {
  const response = await apiClient.get('/settings');
  return response.data;
};

export const updateSettings = async (data: Partial<SystemSettings>): Promise<SystemSettings> => {
  const response = await apiClient.put('/settings', data);
  return response.data;
};
