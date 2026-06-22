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

export const exportAITrainingJSONL = (): string => {
  return '/api/v1/ai-feedback/export/jsonl';
};

// ─── AI Feedback APIs ────────────────────────────────────────────────────────

export interface AIPredictionPayload {
  id: number;
  ticketId: number;
  predictedCategory: string | null;
  predictedPriority: string | null;
  predictedSentiment: string | null;
  /** Business impact level: NONE | SINGLE_USER | MULTIPLE_USERS | BUSINESS_BLOCKING | SYSTEM_OUTAGE */
  predictedImpact: string | null;
  impactReason: string | null;
  /** Pipe-separated urgency signal string stored by the backend */
  urgencySignals: string | null;
  correctedCategory: string | null;
  correctedPriority: string | null;
  agentCorrected: boolean;
  predictionSource: string | null;
  confidenceScore: number | null;
  confidence?: number | null;
  modelVersion?: string | null;
  decisionStatus?: 'AUTO_APPLIED' | 'SUGGESTED' | 'FALLBACK' | string | null;
  aiApplied?: boolean | null;
  createdAt: string;
}

export interface AIFeedbackRequest {
  ticketId: number;
  correctedCategory: string;
  correctedPriority: string;
  agentId: number;
}

export interface AIFeedbackResponse {
  predictionId: number;
  ticketId: number;
  predictedCategory: string | null;
  predictedPriority: string | null;
  predictedImpact: string | null;
  impactReason: string | null;
  urgencySignals: string | null;
  correctedCategory: string;
  correctedPriority: string;
  agentCorrected: boolean;
  predictionSource?: string | null;
  confidenceScore?: number | null;
  modelVersion?: string | null;
  decisionStatus?: string | null;
  aiApplied?: boolean | null;
  message: string;
}

/** Get the latest AI prediction for a ticket */
export const getAIPredictionForTicket = async (ticketId: number): Promise<AIPredictionPayload | null> => {
  try {
    const response = await apiClient.get(`/ai-feedback/ticket/${ticketId}`);
    const data = response.data as AIPredictionPayload;
    return {
      ...data,
      confidenceScore: data.confidenceScore ?? data.confidence ?? null,
    };
  } catch {
    return null;
  }
};

/** Agent submits correction to train AI */
export const submitAIFeedback = async (data: AIFeedbackRequest): Promise<AIFeedbackResponse> => {
  const response = await apiClient.post('/ai-feedback', data);
  return response.data;
};
