import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Timeline API
export const timelineAPI = {
  // 새 타임라인 시작
  create: async (data) => {
    const response = await api.post('/timelines', data);
    return response.data;
  },

  // 타임라인 조회
  getById: async (id) => {
    const response = await api.get(`/timelines/${id}`);
    return response.data;
  },

  // 학생별 타임라인 목록
  getByStudentId: async (studentId, page = 1, limit = 20) => {
    const response = await api.get(`/timelines/student/${studentId}`, {
      params: { page, limit }
    });
    return response.data;
  },

  // 풀이 단계 추가
  addStep: async (timelineId, stepData) => {
    const response = await api.post(`/timelines/${timelineId}/steps`, stepData);
    return response.data;
  },

  // 타임라인 완료
  complete: async (timelineId, finalAnswer, isCorrect) => {
    const response = await api.post(`/timelines/${timelineId}/complete`, {
      final_answer: finalAnswer,
      is_correct: isCorrect
    });
    return response.data;
  },

  // 학생 통계
  getStudentStats: async (studentId) => {
    const response = await api.get(`/timelines/student/${studentId}/stats`);
    return response.data;
  }
};

// Moodle API
export const moodleAPI = {
  // Moodle 세션 시작
  startSession: async (data) => {
    const response = await api.post('/moodle/problem', data);
    return response.data;
  },

  // Moodle로 결과 제출
  submitResult: async (data) => {
    const response = await api.post('/moodle/submit', data);
    return response.data;
  },

  // 세션 조회
  getSession: async (token) => {
    const response = await api.get(`/moodle/session/${token}`);
    return response.data;
  }
};

export default api;
