import axios from 'axios'
import { SolutionFlowchart } from '../types/flowchart'

const API_BASE_URL = '/api/v1'

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add token to requests
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Authentication APIs
export const login = async (username: string, password: string) => {
  const formData = new FormData()
  formData.append('username', username)
  formData.append('password', password)

  const response = await apiClient.post('/auth/token', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
  return response.data
}

export const register = async (userData: any) => {
  const response = await apiClient.post('/auth/register', userData)
  return response.data
}

export const getCurrentUser = async () => {
  const response = await apiClient.get('/auth/me')
  return response.data
}

export const logout = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
}

// Recommendation APIs
export const getMyRecommendations = async (limit: number = 5) => {
  const response = await apiClient.get('/recommendations/my-recommendations', {
    params: { limit }
  })
  return response.data
}

export const getMyLearningPath = async (moduleId?: string) => {
  const response = await apiClient.get('/recommendations/my-learning-path', {
    params: moduleId ? { module_id: moduleId } : {}
  })
  return response.data
}

export const getDashboardInsights = async () => {
  const response = await apiClient.get('/recommendations/dashboard/insights')
  return response.data
}

export const getTeacherInterventions = async () => {
  const response = await apiClient.get('/recommendations/teacher/intervention-recommendations')
  return response.data
}

// Flowchart APIs
export const fetchSolutionFlowchart = async (
  solutionId: string,
  regenerate: boolean = false
): Promise<SolutionFlowchart> => {
  const response = await apiClient.get(
    `/flowchart/solution/${solutionId}`,
    { params: { regenerate } }
  )
  return response.data
}

export const generateFlowchart = async (
  solutionId: string,
  layoutAlgorithm: string = 'dagre'
) => {
  const response = await apiClient.post('/flowchart/generate', {
    solution_id: solutionId,
    layout_algorithm: layoutAlgorithm,
    auto_position: true,
  })
  return response.data
}

// Solution tracking APIs
export const trackStudentAction = async (
  studentId: string,
  solutionId: string,
  actionType: string,
  actionData?: any
) => {
  const response = await apiClient.post('/solutions/track-action', {
    student_id: studentId,
    solution_id: solutionId,
    action_type: actionType,
    action_data: actionData,
  })
  return response.data
}

export const startSolution = async (
  studentId: string,
  problemId: string,
  moduleId: string
) => {
  const response = await apiClient.post('/solutions/start-solution', {
    student_id: studentId,
    problem_id: problemId,
    module_id: moduleId,
  })
  return response.data
}

export const submitAnswer = async (
  solutionId: string,
  answer: any
) => {
  const response = await apiClient.post('/solutions/submit-answer', {
    solution_id: solutionId,
    answer: answer,
  })
  return response.data
}

export const getStudentSolutions = async (
  studentId: string,
  moduleId?: string
) => {
  const params = moduleId ? { module_id: moduleId } : {}
  const response = await apiClient.get(
    `/solutions/student/${studentId}/solutions`,
    { params }
  )
  return response.data
}

export default apiClient
