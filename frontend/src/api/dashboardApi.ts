import apiClient from './axiosInstance';
import type { Ticket } from '../types/ticket';

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
