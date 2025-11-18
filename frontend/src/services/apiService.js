import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    const message = error.response?.data?.error || error.message || 'Network error';
    return Promise.reject(new Error(message));
  }
);

/**
 * Filter Shrink API
 */
const filterAPI = {
  // Get available filters
  getAvailableFilters: () => {
    return apiClient.get('/filters/available');
  },

  // Start new filter session
  startSession: (studentId) => {
    return apiClient.post('/filters/start', { student_id: studentId });
  },

  // Apply filter
  applyFilter: (sessionToken, filterKey, filterValue) => {
    return apiClient.post('/filters/apply', {
      session_token: sessionToken,
      filter_key: filterKey,
      filter_value: filterValue,
    });
  },

  // Remove last filter (undo)
  removeLastFilter: (sessionToken) => {
    return apiClient.post('/filters/remove', {
      session_token: sessionToken,
    });
  },

  // Reset session
  resetSession: (sessionToken) => {
    return apiClient.post('/filters/reset', {
      session_token: sessionToken,
    });
  },

  // Get session state
  getState: (sessionToken) => {
    return apiClient.get(`/filters/state?session_token=${sessionToken}`);
  },

  // Select problems
  selectProblems: (sessionToken, count = 1) => {
    return apiClient.post('/filters/select', {
      session_token: sessionToken,
      count: count,
    });
  },
};

/**
 * Moodle API
 */
const moodleAPI = {
  // Test connection
  testConnection: () => {
    return apiClient.get('/moodle/test');
  },

  // Sync data
  sync: (type = 'questions', categoryId = null) => {
    return apiClient.post('/moodle/sync', {
      type: type,
      category_id: categoryId,
    });
  },

  // Get courses
  getCourses: () => {
    return apiClient.get('/moodle/courses');
  },

  // Get categories
  getCategories: () => {
    return apiClient.get('/moodle/categories');
  },

  // Get sync logs
  getSyncLogs: (limit = 10) => {
    return apiClient.get(`/moodle/sync-log?limit=${limit}`);
  },
};

/**
 * Problems API
 */
const problemsAPI = {
  // List problems
  list: (limit = 10, offset = 0) => {
    return apiClient.get(`/problems/list?limit=${limit}&offset=${offset}`);
  },

  // Get problem by ID
  get: (problemId) => {
    return apiClient.get(`/problems/get/${problemId}`);
  },

  // Submit answer
  submit: (studentId, problemId, answer, sessionId = null, timeSpent = null) => {
    return apiClient.post('/problems/submit', {
      student_id: studentId,
      problem_id: problemId,
      answer: answer,
      session_id: sessionId,
      time_spent: timeSpent,
    });
  },

  // Search problems
  search: (query, limit = 10) => {
    return apiClient.get(`/problems/search?q=${encodeURIComponent(query)}&limit=${limit}`);
  },
};

/**
 * Students API
 */
const studentsAPI = {
  // List students
  list: () => {
    return apiClient.get('/students/list');
  },

  // Get student progress
  getProgress: (studentId) => {
    return apiClient.get(`/students/progress/${studentId}`);
  },
};

/**
 * Main API Service
 */
const apiService = {
  // Filter Shrink
  getAvailableFilters: filterAPI.getAvailableFilters,
  startFilterSession: filterAPI.startSession,
  applyFilter: filterAPI.applyFilter,
  removeLastFilter: filterAPI.removeLastFilter,
  resetFilterSession: filterAPI.resetSession,
  getFilterState: filterAPI.getState,
  selectProblems: filterAPI.selectProblems,

  // Moodle
  testMoodleConnection: moodleAPI.testConnection,
  syncMoodle: moodleAPI.sync,
  getMoodleCourses: moodleAPI.getCourses,
  getMoodleCategories: moodleAPI.getCategories,
  getMoodleSyncLogs: moodleAPI.getSyncLogs,

  // Problems
  listProblems: problemsAPI.list,
  getProblem: problemsAPI.get,
  submitProblem: problemsAPI.submit,
  searchProblems: problemsAPI.search,

  // Students
  listStudents: studentsAPI.list,
  getStudentProgress: studentsAPI.getProgress,
};

export default apiService;
