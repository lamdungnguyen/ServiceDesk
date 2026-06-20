import apiClient from './axiosInstance';

// ─── AI Accuracy APIs ────────────────────────────────────────────────────────

export interface AIAccuracyStats {
  categoryAccuracy: Record<string, number>;
  categoryVerifiedCount: Record<string, number>;
  priorityAccuracy: Record<string, number>;
  priorityVerifiedCount: Record<string, number>;
  sourceAccuracy: Record<string, number>;
  sourceVerifiedCount: Record<string, number>;
  overallCategoryAccuracy: number;
  overallPriorityAccuracy: number;
  totalVerified: number;
  totalCorrected: number;
  totalCorrect: number;
}

export const getAIAccuracyStats = async (): Promise<AIAccuracyStats> => {
  const response = await apiClient.get('/dashboard/ai-accuracy');
  return response.data;
};

export const exportAITrainingCSV = (): string => {
  return '/api/v1/ai-feedback/export/csv';
};

// ─── AI Feedback APIs ────────────────────────────────────────────────────────

export interface AIPredictionPayload {
  id: number;
  ticketId: number;
  predictedCategory: string | null;
  predictedPriority: string | null;
  predictedSentiment: string | null;
  correctedCategory: string | null;
  correctedPriority: string | null;
  agentCorrected: boolean;
  predictionSource: string | null;
  confidence: number | null;
  createdAt: string;
}

export interface AIFeedbackRequest {
  ticketId: number;
  correctedCategory: string;
  correctedPriority: string;
  agentId: number;
}

export interface AIFeedbackResponse {
  id: number;
  ticketId: number;
  predictedCategory: string | null;
  predictedPriority: string | null;
  correctedCategory: string;
  correctedPriority: string;
  agentCorrected: boolean;
  message: string;
}

/** Lấy AI prediction mới nhất cho một ticket */
export const getAIPredictionForTicket = async (ticketId: number): Promise<AIPredictionPayload | null> => {
  try {
    const response = await apiClient.get(`/ai-feedback/ticket/${ticketId}`);
    return response.data;
  } catch {
    return null;
  }
};

/** Agent submit correction để huấn luyện AI */
export const submitAIFeedback = async (data: AIFeedbackRequest): Promise<AIFeedbackResponse> => {
  const response = await apiClient.post('/ai-feedback', data);
  return response.data;
};
