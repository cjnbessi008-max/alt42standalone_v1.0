import axios from 'axios';
import type {
  SummarizeRequest,
  LMSSummarizeRequest,
  SummaryResult,
  LMSProblemSummaryResult,
} from '../types';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

export const summaryApi = {
  /**
   * 문제 텍스트를 직접 요약
   */
  summarizeProblem: async (
    request: SummarizeRequest
  ): Promise<SummaryResult> => {
    const response = await api.post<SummaryResult>('/summarize', request);
    return response.data;
  },

  /**
   * LMS 문제 ID로 요약
   */
  summarizeLMSProblem: async (
    request: LMSSummarizeRequest
  ): Promise<LMSProblemSummaryResult> => {
    const response = await api.post<LMSProblemSummaryResult>(
      '/summarize/lms',
      request
    );
    return response.data;
  },

  /**
   * 헬스 체크
   */
  healthCheck: async (): Promise<{ status: string }> => {
    const response = await api.get('/health');
    return response.data;
  },
};

export default api;
