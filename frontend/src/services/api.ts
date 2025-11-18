import axios, { AxiosInstance } from 'axios'
import type {
  User,
  Problem,
  Solution,
  Comparison,
  LoginRequest,
  RegisterRequest,
  Token,
  ProblemCreateRequest,
  SolutionCreateRequest,
  ComparisonRequest,
} from '@/types'

class ApiService {
  private client: AxiosInstance

  constructor() {
    this.client = axios.create({
      baseURL: '/api',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    // Add token to requests
    this.client.interceptors.request.use((config) => {
      const token = localStorage.getItem('token')
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
      return config
    })

    // Handle 401 errors
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('token')
          window.location.href = '/login'
        }
        return Promise.reject(error)
      }
    )
  }

  // Auth endpoints
  async login(data: LoginRequest): Promise<Token> {
    const formData = new URLSearchParams()
    formData.append('username', data.username)
    formData.append('password', data.password)

    const response = await this.client.post<Token>('/auth/login', formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    })
    return response.data
  }

  async register(data: RegisterRequest): Promise<User> {
    const response = await this.client.post<User>('/auth/register', data)
    return response.data
  }

  async getMe(): Promise<User> {
    const response = await this.client.get<User>('/auth/me')
    return response.data
  }

  // Problem endpoints
  async getProblems(): Promise<Problem[]> {
    const response = await this.client.get<Problem[]>('/problems')
    return response.data
  }

  async getProblem(id: string): Promise<Problem> {
    const response = await this.client.get<Problem>(`/problems/${id}`)
    return response.data
  }

  async createProblem(data: ProblemCreateRequest): Promise<Problem> {
    const response = await this.client.post<Problem>('/problems', data)
    return response.data
  }

  async updateProblem(id: string, data: Partial<ProblemCreateRequest>): Promise<Problem> {
    const response = await this.client.put<Problem>(`/problems/${id}`, data)
    return response.data
  }

  async deleteProblem(id: string): Promise<void> {
    await this.client.delete(`/problems/${id}`)
  }

  // Solution endpoints
  async submitSolution(data: SolutionCreateRequest): Promise<Solution> {
    const response = await this.client.post<Solution>('/solutions', data)
    return response.data
  }

  async getProblemSolutions(problemId: string): Promise<Solution[]> {
    const response = await this.client.get<Solution[]>(`/solutions/problem/${problemId}`)
    return response.data
  }

  async getSolution(id: string): Promise<Solution> {
    const response = await this.client.get<Solution>(`/solutions/${id}`)
    return response.data
  }

  async getMySolutions(): Promise<Solution[]> {
    const response = await this.client.get<Solution[]>('/solutions/my/all')
    return response.data
  }

  // Comparison endpoints
  async createComparison(data: ComparisonRequest): Promise<Comparison> {
    const response = await this.client.post<Comparison>('/comparisons', data)
    return response.data
  }

  async getSolutionComparisons(solutionId: string): Promise<Comparison[]> {
    const response = await this.client.get<Comparison[]>(`/comparisons/solution/${solutionId}`)
    return response.data
  }

  async getComparison(id: string): Promise<Comparison> {
    const response = await this.client.get<Comparison>(`/comparisons/${id}`)
    return response.data
  }
}

export const api = new ApiService()
