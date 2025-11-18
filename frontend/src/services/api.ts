import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface BiasAnalysisRequest {
  analysis_type: string;
  time_period_start?: string;
  time_period_end?: string;
  grade_levels?: string[];
  performance_levels?: string[];
  tool_categories?: string[];
  use_cache?: boolean;
}

export interface BiasAnalysisResponse {
  id: string;
  analysis_type: string;
  analysis_date: string;
  results: any;
  statistical_significance?: any;
  recommendations?: string[];
  summary?: string;
}

export const BiasAnalysisService = {
  async analyzeFrequencyBias(request: BiasAnalysisRequest): Promise<BiasAnalysisResponse> {
    const response = await api.post('/analysis/frequency', request);
    return response.data;
  },

  async analyzeDemographicBias(request: BiasAnalysisRequest): Promise<BiasAnalysisResponse> {
    const response = await api.post('/analysis/demographic', request);
    return response.data;
  },

  async analyzeTemporalBias(request: BiasAnalysisRequest): Promise<BiasAnalysisResponse> {
    const response = await api.post('/analysis/temporal', request);
    return response.data;
  },

  async analyzeEffectivenessBias(request: BiasAnalysisRequest): Promise<BiasAnalysisResponse> {
    const response = await api.post('/analysis/effectiveness', request);
    return response.data;
  },

  async getAnalysisHistory(analysisType?: string, limit: number = 20): Promise<any> {
    const params: any = { limit };
    if (analysisType) params.analysis_type = analysisType;
    const response = await api.get('/analysis/history', { params });
    return response.data;
  },

  async getSessionStats(): Promise<any> {
    const response = await api.get('/sessions/stats');
    return response.data;
  },

  async listTools(): Promise<any> {
    const response = await api.get('/tools/');
    return response.data;
  },

  async listStudents(): Promise<any> {
    const response = await api.get('/students/');
    return response.data;
  },

  async importCSV(file: File, type: 'students' | 'sessions'): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post(`/import/csv/${type}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};

export default api;
