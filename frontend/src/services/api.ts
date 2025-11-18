import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

export const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Mock student ID for demo - replace with auth
const MOCK_STUDENT_ID = 'b7e3c1a0-8f9d-4e5b-a1c2-3d4e5f6a7b8c'

export const eventService = {
  trackEvent: async (sessionId: string, eventType: string, data: any) => {
    return api.post('/events', {
      session_id: sessionId,
      student_id: MOCK_STUDENT_ID,
      event_type: eventType,
      ...data,
    })
  },
}

export const sessionService = {
  createSession: async (courseId: string, problemId?: string) => {
    const response = await api.post('/sessions', {
      student_id: MOCK_STUDENT_ID,
      course_id: courseId,
      problem_id: problemId,
      device_type: 'desktop',
      browser: navigator.userAgent,
    })
    return response.data.data.session_id
  },

  endSession: async (sessionId: string) => {
    return api.put(`/sessions/${sessionId}/end`, {
      is_completed: true,
    })
  },
}

export const analyticsService = {
  analyzeSession: async (sessionId: string) => {
    const response = await api.post(`/analytics/analyze-session/${sessionId}`)
    return response.data
  },

  getStudentPeaks: async (studentId: string) => {
    const response = await api.get(`/analytics/peak-periods/student/${studentId}`)
    return response.data.data.peak_periods
  },
}
