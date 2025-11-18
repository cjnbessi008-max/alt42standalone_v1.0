/**
 * 멜로디 생성 API 클라이언트
 */

import axios from 'axios'
import type {
  MelodyGenerationRequest,
  MelodyGenerationResponse,
  TermAnalysisResponse,
} from '@types/melody.types'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

const client = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

export const melodyApi = {
  /**
   * 멜로디 생성
   */
  async generateMelody(request: MelodyGenerationRequest): Promise<MelodyGenerationResponse> {
    const response = await client.post('/melody/generate', request)
    return response.data
  },

  /**
   * 항 변화 분석
   */
  async analyzeTerms(expressions: string[]): Promise<TermAnalysisResponse> {
    const response = await client.post('/melody/analyze', { expressions })
    return response.data
  },
}

export default melodyApi
