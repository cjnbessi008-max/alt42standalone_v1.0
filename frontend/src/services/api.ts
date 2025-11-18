/**
 * API client for LMS Bottleneck Detection System
 */
import axios from 'axios'
import type {
  Student,
  Bottleneck,
  PerformanceSummary,
  RealtimePerformance,
} from '../types'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Students API
export const studentsApi = {
  getAll: async (): Promise<Student[]> => {
    const response = await api.get('/api/students')
    return response.data
  },

  getById: async (studentId: string): Promise<Student> => {
    const response = await api.get(`/api/students/${studentId}`)
    return response.data
  },
}

// Bottlenecks API
export const bottlenecksApi = {
  getForStudent: async (
    studentId: string,
    activeOnly: boolean = true
  ): Promise<Bottleneck[]> => {
    const response = await api.get(`/api/bottlenecks/students/${studentId}`, {
      params: { active_only: activeOnly },
    })
    return response.data
  },

  analyze: async (
    studentId: string,
    lookbackDays: number = 30,
    minAttempts: number = 5
  ) => {
    const response = await api.post(
      `/api/bottlenecks/students/${studentId}/analyze`,
      {
        lookback_days: lookbackDays,
        min_attempts: minAttempts,
      }
    )
    return response.data
  },

  resolve: async (studentId: string, bottleneckId: string) => {
    const response = await api.post(
      `/api/bottlenecks/students/${studentId}/resolve/${bottleneckId}`
    )
    return response.data
  },
}

// Performance API
export const performanceApi = {
  getSummary: async (studentId: string): Promise<PerformanceSummary> => {
    const response = await api.get(`/api/performance/students/${studentId}/summary`)
    return response.data
  },

  getRealtime: async (
    studentId: string,
    minutes: number = 30
  ): Promise<RealtimePerformance> => {
    const response = await api.get(
      `/api/performance/students/${studentId}/realtime`,
      {
        params: { minutes },
      }
    )
    return response.data
  },
}

export default api
