import axios from 'axios';

const apiClient = axios.create({
  baseURL: '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT auth token from logged-in user
// Note: Using sessionStorage instead of localStorage to reduce XSS impact
apiClient.interceptors.request.use((config) => {
  const savedUser = sessionStorage.getItem('auth_user');
  if (savedUser) {
    const user = JSON.parse(savedUser);
    if (user.token) {
      config.headers.Authorization = `Bearer ${user.token}`;
    }
  }
  return config;
});

const getResponseMessage = (data: unknown): string | null => {
  if (typeof data === 'string') return data;
  if (data && typeof data === 'object' && 'message' in data) {
    const message = (data as { message?: unknown }).message;
    if (typeof message === 'string') return message;
  }
  return null;
};

export const getErrorMessage = (error: unknown, fallback: string): string => {
  if (axios.isAxiosError(error)) {
    return getResponseMessage(error.response?.data) ?? error.message ?? fallback;
  }
  if (error instanceof Error) return error.message;
  return fallback;
};

export default apiClient;