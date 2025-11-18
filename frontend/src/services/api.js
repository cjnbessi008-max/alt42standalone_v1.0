import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// 요청 인터셉터
api.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 응답 인터셉터
api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

/**
 * API 서비스
 */
const apiService = {
  /**
   * 헬스 체크
   */
  healthCheck: () => api.get('/health'),

  /**
   * 히트 데이터 조회
   */
  getHeat: (params = {}) => api.get('/heat', { params }),

  /**
   * 모든 시간 윈도우 히트 데이터
   */
  getAllTimeWindows: (params = {}) => api.get('/heat/all', { params }),

  /**
   * 히트맵 데이터
   */
  getHeatmap: (params = {}) => api.get('/heat/heatmap', { params }),

  /**
   * 사용자 히트 랭킹
   */
  getRanking: (params = {}) => api.get('/heat/ranking', { params }),

  /**
   * 로그 통계
   */
  getLogStats: (params = {}) => api.get('/logs/stats', { params }),

  /**
   * Moodle 동기화
   */
  syncFromMoodle: (data) => api.post('/sync', data),

  /**
   * Moodle 연결 테스트
   */
  testMoodleConnection: () => api.get('/moodle/test')
};

export default apiService;
