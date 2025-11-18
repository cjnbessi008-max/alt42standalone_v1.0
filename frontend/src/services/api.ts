import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1'

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Moodle API
export const moodleApi = {
  connect: () => api.post('/moodle/connect'),
  getCourses: () => api.get('/moodle/courses'),
  getCourse: (courseId: number) => api.get(`/moodle/courses/${courseId}`),
  getStudents: (courseId: number) => api.get(`/moodle/courses/${courseId}/students`),
  getQuizzes: (courseId: number) => api.get(`/moodle/courses/${courseId}/quizzes`),
  sync: (courseId: number) => api.post('/moodle/sync', { course_id: courseId }),
}

// Reasoning Density API
export const reasoningApi = {
  calculateQuizAttempt: (attemptId: number) =>
    api.post(`/reasoning/calculate/quiz-attempt/${attemptId}`),
  calculateQuestionAttempt: (questionAttemptId: number, difficultyLevel: number = 3) =>
    api.post(`/reasoning/calculate/question-attempt/${questionAttemptId}`, {
      difficulty_level: difficultyLevel,
    }),
  getStudentMetrics: (studentId: number) => api.get(`/reasoning/student/${studentId}`),
  getQuizMetrics: (quizId: number) => api.get(`/reasoning/quiz/${quizId}`),
}

// Correlation Analysis API
export const correlationApi = {
  analyze: (params: {
    analysis_name?: string
    analysis_type: string
    course_id?: number
    quiz_id?: number
    student_ids?: number[]
  }) => api.post('/correlation/analyze', params),
  getResults: (analysisId: number) => api.get(`/correlation/results/${analysisId}`),
  getVisualization: (analysisId: number) => api.get(`/correlation/visualize/${analysisId}`),
  listAnalyses: (params?: { course_id?: number; quiz_id?: number; limit?: number }) =>
    api.get('/correlation/list', { params }),
  deleteAnalysis: (analysisId: number) => api.delete(`/correlation/${analysisId}`),
}

export default api
