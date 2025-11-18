/**
 * Moodle API 클라이언트
 */

import axios from 'axios'
import type { MoodleQuestion, QuestionDetail, QuestionListResponse } from '@types/moodle.types'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

const client = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

export const moodleApi = {
  /**
   * 문제 목록 조회
   */
  async getQuestions(params?: {
    category?: number
    type?: string
    limit?: number
    offset?: number
  }): Promise<QuestionListResponse> {
    const response = await client.get('/moodle/questions', { params })
    return response.data
  },

  /**
   * 특정 문제 상세 조회
   */
  async getQuestionById(id: number): Promise<QuestionDetail> {
    const response = await client.get(`/moodle/question/${id}`)
    return response.data
  },

  /**
   * 카테고리 목록 조회
   */
  async getCategories(): Promise<{ categories: Array<{ category: number; count: number }> }> {
    const response = await client.get('/moodle/categories')
    return response.data
  },

  /**
   * 통계 조회
   */
  async getStatistics(): Promise<{
    byType: Array<{ type: string; count: number }>
    total: number
  }> {
    const response = await client.get('/moodle/statistics')
    return response.data
  },
}

export default moodleApi
