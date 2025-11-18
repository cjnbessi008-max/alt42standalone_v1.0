import axios from 'axios'
import type { Problem, StudentAttempt } from '../types'

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

/**
 * Fetch a problem by ID
 */
export async function fetchProblem(problemId: string, moodleToken?: string): Promise<Problem> {
  const headers = moodleToken ? { 'X-Moodle-Token': moodleToken } : {}

  const response = await api.get<Problem>(`/problems/${problemId}`, { headers })
  return response.data
}

/**
 * Submit student attempt
 */
export async function submitAttempt(
  attempt: Omit<StudentAttempt, 'id' | 'attemptedAt'>
): Promise<StudentAttempt> {
  const response = await api.post<StudentAttempt>('/attempts', attempt)
  return response.data
}

/**
 * Fetch problems from Moodle
 */
export async function fetchMoodleProblems(courseId: number, token: string): Promise<Problem[]> {
  const response = await api.get<Problem[]>('/moodle/problems', {
    params: { courseId },
    headers: { 'X-Moodle-Token': token }
  })
  return response.data
}

/**
 * Send grade back to Moodle
 */
export async function sendGradeToMoodle(
  attemptId: string,
  grade: number,
  token: string
): Promise<void> {
  await api.post('/moodle/grade', {
    attemptId,
    grade
  }, {
    headers: { 'X-Moodle-Token': token }
  })
}

/**
 * Health check
 */
export async function healthCheck(): Promise<{ status: string }> {
  const response = await api.get<{ status: string }>('/health')
  return response.data
}

export default api
