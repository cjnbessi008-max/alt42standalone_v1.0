import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Time Tracking API
export const timeTrackingAPI = {
  // 문제 시도 시작
  startAttempt: async (studentId, problemId) => {
    const response = await api.post('/time-tracking/start', {
      student_id: studentId,
      problem_id: problemId,
    });
    return response.data;
  },

  // 시간 추적 이벤트 기록
  recordEvent: async (attemptId, eventType, eventData = null) => {
    const response = await api.post('/time-tracking/event', {
      attempt_id: attemptId,
      event_type: eventType,
      event_data: eventData,
    });
    return response.data;
  },

  // 문제 시도 완료
  completeAttempt: async (attemptId, isCorrect, answerData = null) => {
    const response = await api.post('/time-tracking/complete', {
      attempt_id: attemptId,
      is_correct: isCorrect,
      answer_data: answerData,
    });
    return response.data;
  },

  // 학생의 시도 기록 조회
  getStudentAttempts: async (studentId, problemId = null) => {
    const params = problemId ? { problem_id: problemId } : {};
    const response = await api.get(`/time-tracking/attempts/${studentId}`, { params });
    return response.data;
  },

  // 문제별 통계 조회
  getProblemStatistics: async (problemId) => {
    const response = await api.get(`/time-tracking/statistics/${problemId}`);
    return response.data;
  },

  // 활성 시도 조회
  getActiveAttempt: async (studentId, problemId) => {
    const response = await api.get(`/time-tracking/active/${studentId}/${problemId}`);
    return response.data;
  },
};

// Student API
export const studentAPI = {
  upsert: async (studentId, name, email = null) => {
    const response = await api.post('/students', {
      student_id: studentId,
      name,
      email,
    });
    return response.data;
  },

  get: async (studentId) => {
    const response = await api.get(`/students/${studentId}`);
    return response.data;
  },

  getAll: async () => {
    const response = await api.get('/students');
    return response.data;
  },
};

// Problem API
export const problemAPI = {
  upsert: async (problemId, moduleId, title, description = null, difficultyLevel = null, problemType = null) => {
    const response = await api.post('/problems', {
      problem_id: problemId,
      module_id: moduleId,
      title,
      description,
      difficulty_level: difficultyLevel,
      problem_type: problemType,
    });
    return response.data;
  },

  get: async (problemId) => {
    const response = await api.get(`/problems/${problemId}`);
    return response.data;
  },

  getAll: async (moduleId = null) => {
    const params = moduleId ? { module_id: moduleId } : {};
    const response = await api.get('/problems', { params });
    return response.data;
  },
};

export default api;
