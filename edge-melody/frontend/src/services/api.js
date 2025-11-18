/**
 * Moodle LMS API 클라이언트
 */
import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api'

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// 에러 처리 인터셉터
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      console.error('API Error:', error.response.data)
      throw new Error(error.response.data.error || '서버 오류가 발생했습니다.')
    } else if (error.request) {
      console.error('Network Error:', error.request)
      throw new Error('네트워크 연결을 확인해주세요.')
    } else {
      console.error('Error:', error.message)
      throw error
    }
  }
)

/**
 * 문제 목록 조회
 * @param {number} categoryId - 카테고리 ID (선택적)
 * @param {number} limit - 조회 개수
 * @returns {Promise<Array>} 문제 목록
 */
export const getQuestions = async (categoryId = null, limit = 10) => {
  const params = { limit }
  if (categoryId) params.category = categoryId

  const response = await apiClient.get('/questions', { params })
  return response.data.data
}

/**
 * 특정 문제 조회
 * @param {number} questionId - 문제 ID
 * @returns {Promise<Object>} 문제 상세 정보
 */
export const getQuestion = async (questionId) => {
  const response = await apiClient.get(`/questions/${questionId}`)
  return response.data.data
}

/**
 * Edge Melody 시각화 데이터 조회
 * @param {number} questionId - 문제 ID
 * @returns {Promise<Object>} Edge Melody 데이터
 */
export const getQuestionEdgeMelody = async (questionId) => {
  const response = await apiClient.get(`/questions/${questionId}/edge-melody`)
  return response.data.data
}

/**
 * 카테고리 목록 조회
 * @returns {Promise<Array>} 카테고리 목록
 */
export const getCategories = async () => {
  const response = await apiClient.get('/categories')
  return response.data.data
}

export default apiClient
