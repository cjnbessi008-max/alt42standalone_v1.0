import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// ============================================================================
// HIGHLIGHTS API
// ============================================================================

export const getDailyHighlights = async (date, gradeLevel) => {
  const params = {}
  if (date) params.date = date
  if (gradeLevel) params.grade_level = gradeLevel

  const response = await api.get('/highlights/daily', { params })
  return response.data
}

export const searchHighlights = async (filters = {}) => {
  const response = await api.get('/highlights', { params: filters })
  return response.data
}

export const getHighlightById = async (highlightId) => {
  const response = await api.get(`/highlights/${highlightId}`)
  return response.data
}

export const getHighlightAnalytics = async (highlightId) => {
  const response = await api.get(`/highlights/${highlightId}/analytics`)
  return response.data
}

export const generateDailyHighlights = async () => {
  const response = await api.post('/highlights/daily/generate')
  return response.data
}

// ============================================================================
// MODULES API
// ============================================================================

export const getModules = async (filters = {}) => {
  const response = await api.get('/modules', { params: filters })
  return response.data
}

export const getModuleById = async (moduleId) => {
  const response = await api.get(`/modules/${moduleId}`)
  return response.data
}

export const createModule = async (moduleData) => {
  const response = await api.post('/modules', moduleData)
  return response.data
}

export const updateModule = async (moduleId, updates) => {
  const response = await api.patch(`/modules/${moduleId}`, updates)
  return response.data
}

export const deleteModule = async (moduleId) => {
  const response = await api.delete(`/modules/${moduleId}`)
  return response.data
}

export const getModuleHighlights = async (moduleId) => {
  const response = await api.get(`/modules/${moduleId}/highlights`)
  return response.data
}

export const generateModuleHighlights = async (moduleId) => {
  const response = await api.post(`/modules/${moduleId}/highlights/generate`)
  return response.data
}

// ============================================================================
// STUDENTS API
// ============================================================================

export const getStudentProgress = async (studentId, clipId = null) => {
  const params = clipId ? { clip_id: clipId } : {}
  const response = await api.get(`/students/${studentId}/progress`, { params })
  return response.data
}

export const updateStudentProgress = async (studentId, progressData) => {
  const response = await api.post(`/students/${studentId}/progress`, progressData)
  return response.data
}

export const getStudentById = async (studentId) => {
  const response = await api.get(`/students/${studentId}`)
  return response.data
}

// ============================================================================
// TEACHERS API
// ============================================================================

export const getTeacherById = async (teacherId) => {
  const response = await api.get(`/teachers/${teacherId}`)
  return response.data
}

export const getTeacherModules = async (teacherId, filters = {}) => {
  const response = await api.get(`/teachers/${teacherId}/modules`, { params: filters })
  return response.data
}

export default api
