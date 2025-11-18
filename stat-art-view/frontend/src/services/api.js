import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  }
});

// 요청 인터셉터
api.interceptors.request.use(
  (config) => {
    console.log(`🌐 API Request: ${config.method.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

// 응답 인터셉터
api.interceptors.response.use(
  (response) => {
    console.log(`✅ API Response: ${response.config.url}`, response.data);
    return response;
  },
  (error) => {
    console.error('❌ Response Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// API 메서드들
export const statsAPI = {
  /**
   * 퀴즈 통계 조회
   */
  getQuizStats: async (quizId) => {
    const response = await api.get(`/stats/quiz/${quizId}`);
    return response.data;
  },

  /**
   * 학생 통계 조회
   */
  getStudentStats: async (studentId, quizId = null) => {
    const params = quizId ? { quizId } : {};
    const response = await api.get(`/stats/student/${studentId}`, { params });
    return response.data;
  },

  /**
   * 코스 통계 조회
   */
  getCourseStats: async (courseId) => {
    const response = await api.get(`/stats/course/${courseId}`);
    return response.data;
  },

  /**
   * 히트맵 데이터 조회
   */
  getHeatmap: async (courseId, startDate = null, endDate = null) => {
    const params = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;

    const response = await api.get(`/stats/heatmap/${courseId}`, { params });
    return response.data;
  },

  /**
   * Stat Art View용 특화 데이터 조회
   */
  getArtData: async (quizId) => {
    const response = await api.get(`/stats/artdata/${quizId}`);
    return response.data;
  }
};

export const moodleAPI = {
  /**
   * Moodle 연결 테스트
   */
  testConnection: async () => {
    const response = await api.get('/moodle/test');
    return response.data;
  },

  /**
   * 퀴즈 정보 조회
   */
  getQuizInfo: async (quizId) => {
    const response = await api.get(`/moodle/quiz/${quizId}`);
    return response.data;
  }
};

export default api;
