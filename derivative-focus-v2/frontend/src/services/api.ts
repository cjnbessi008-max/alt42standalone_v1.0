import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

export interface DetectedRule {
  rule_id: number
  rule_name: string
  rule_type: string
  rule_formula: string
  matched_expression?: string
  highlight_start?: number
  highlight_end?: number
  confidence_score: number
  ai_explanation?: string
  description?: string
}

export interface AnalysisResponse {
  success: boolean
  problem_id: number
  problem_text: string
  problem_latex?: string
  detected_rules: DetectedRule[]
  ai_analysis?: string
  processing_time_ms: number
}

export interface AnalyzeRequest {
  problem_text: string
  use_ai: boolean
}

export interface FetchFromMoodleRequest {
  question_id: number
}

export const analyzeProblem = async (data: AnalyzeRequest): Promise<AnalysisResponse> => {
  const response = await api.post<AnalysisResponse>('/problems/analyze', data)
  return response.data
}

export const fetchFromMoodle = async (data: FetchFromMoodleRequest): Promise<AnalysisResponse> => {
  const response = await api.post<AnalysisResponse>('/problems/fetch-from-moodle', data)
  return response.data
}

export const getProblem = async (problemId: number): Promise<any> => {
  const response = await api.get(`/problems/${problemId}`)
  return response.data
}

export const getCoreRules = async (): Promise<any[]> => {
  const response = await api.get('/rules/core')
  return response.data
}

export default api
