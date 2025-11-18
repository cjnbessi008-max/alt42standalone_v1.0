import axios from 'axios'
import { SolutionFlowchart } from '../types/flowchart'

const API_BASE_URL = '/api/v1'

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

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
