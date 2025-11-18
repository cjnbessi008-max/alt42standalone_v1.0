import axios from 'axios'

const API_BASE_URL = '/api'

export const problemService = {
  // 모든 문제 가져오기
  getAll: async () => {
    const response = await axios.get(`${API_BASE_URL}/problems`)
    return response.data
  },

  // 특정 문제 가져오기
  getById: async (id) => {
    const response = await axios.get(`${API_BASE_URL}/problems/${id}`)
    return response.data
  },

  // 랜덤 문제 가져오기
  getRandom: async () => {
    const response = await axios.get(`${API_BASE_URL}/problems/random`)
    return response.data
  },

  // 새 문제 생성
  create: async (problemData) => {
    const response = await axios.post(`${API_BASE_URL}/problems`, problemData)
    return response.data
  }
}

export default {
  problems: problemService
}
