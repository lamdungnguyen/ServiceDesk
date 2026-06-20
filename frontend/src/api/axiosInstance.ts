import axios from 'axios';

const apiClient = axios.create({
  baseURL: '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT auth token from logged-in user
apiClient.interceptors.request.use((config) => {
  const savedUser = localStorage.getItem('auth_user');
  let token: string | null = null;

  if (savedUser) {
    try {
      const user = JSON.parse(savedUser);
      if (user && typeof user === 'object' && 'token' in user) {
        token = user.token;
      }
    } catch {
      // If savedUser is not valid JSON, treat it as the token itself
      token = savedUser;
    }
  }

  // Fallback to common token keys
  if (!token) {
    token = localStorage.getItem('token') || localStorage.getItem('jwt') || localStorage.getItem('accessToken');
  }

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
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