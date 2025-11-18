import axios from 'axios';
import type {
  Session,
  Coordinate,
  MeanCenterStats,
  ApiResponse,
  SessionSummary,
  MoodleUser,
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Session API
export const sessionAPI = {
  create: async (sessionData: {
    studentId: string;
    studentName?: string;
    problemId?: string;
    problemTitle?: string;
    canvasWidth?: number;
    canvasHeight?: number;
  }): Promise<Session> => {
    const response = await api.post<ApiResponse<Session>>('/sessions', sessionData);
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'Failed to create session');
    }
    return response.data.data;
  },

  get: async (sessionId: string): Promise<Session> => {
    const response = await api.get<ApiResponse<Session>>(`/sessions/${sessionId}`);
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'Failed to get session');
    }
    return response.data.data;
  },

  getActive: async (studentId: string): Promise<Session> => {
    const response = await api.get<ApiResponse<Session>>(
      `/sessions/student/${studentId}/active`
    );
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'No active session found');
    }
    return response.data.data;
  },

  end: async (sessionId: string): Promise<Session> => {
    const response = await api.post<ApiResponse<Session>>(`/sessions/${sessionId}/end`);
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'Failed to end session');
    }
    return response.data.data;
  },
};

// Movement/Coordinate API
export const movementAPI = {
  addCoordinate: async (
    sessionId: string,
    x: number,
    y: number
  ): Promise<{ coordinate: Coordinate; stats: MeanCenterStats }> => {
    const response = await api.post<
      ApiResponse<{ coordinate: Coordinate; stats: MeanCenterStats }>
    >('/movement', { sessionId, x, y });

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'Failed to add coordinate');
    }
    return response.data.data;
  },

  getCoordinates: async (
    sessionId: string,
    limit?: number,
    offset?: number
  ): Promise<{ coordinates: Coordinate[]; total: number }> => {
    const params = new URLSearchParams();
    if (limit) params.append('limit', limit.toString());
    if (offset) params.append('offset', offset.toString());

    const response = await api.get<
      ApiResponse<{ coordinates: Coordinate[]; total: number }>
    >(`/movement/${sessionId}?${params.toString()}`);

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'Failed to get coordinates');
    }
    return response.data.data;
  },

  getSummary: async (sessionId: string): Promise<SessionSummary> => {
    const response = await api.get<ApiResponse<SessionSummary>>(
      `/movement/${sessionId}/summary`
    );
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'Failed to get summary');
    }
    return response.data.data;
  },
};

// Mean Center API
export const meanCenterAPI = {
  get: async (sessionId: string): Promise<MeanCenterStats> => {
    const response = await api.get<ApiResponse<MeanCenterStats>>(
      `/movement/mean-center/${sessionId}`
    );
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'Failed to get mean center stats');
    }
    return response.data.data;
  },

  recalculate: async (sessionId: string): Promise<MeanCenterStats> => {
    const response = await api.post<ApiResponse<MeanCenterStats>>(
      `/movement/mean-center/${sessionId}/recalculate`
    );
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'Failed to recalculate mean center');
    }
    return response.data.data;
  },
};

// Moodle API
export const moodleAPI = {
  authenticate: async (
    username: string,
    password: string
  ): Promise<MoodleUser> => {
    const response = await api.post<ApiResponse<MoodleUser>>('/moodle/auth', {
      username,
      password,
    });
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'Authentication failed');
    }
    return response.data.data;
  },

  testConnection: async (): Promise<boolean> => {
    try {
      const response = await api.get<ApiResponse<any>>('/moodle/test');
      return response.data.success;
    } catch {
      return false;
    }
  },
};

export default api;
