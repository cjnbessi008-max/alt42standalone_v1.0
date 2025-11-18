import { v4 as uuidv4 } from 'uuid'
import type { Problem, Triangle } from '../types'

// In-memory storage for demo (replace with database in production)
const problems: Problem[] = [
  {
    id: 'demo-problem-1',
    title: '삼각형 닮음 기초',
    description: '파란색 삼각형을 확대하여 보라색 삼각형과 완전히 겹치도록 만드세요.',
    sourceTriangle: {
      id: 'source-1',
      vertices: [
        { x: 200, y: 200 },
        { x: 300, y: 200 },
        { x: 250, y: 300 }
      ],
      color: '#3b82f6',
      isTarget: false,
      scaleFactor: 1
    },
    targetTriangle: {
      id: 'target-1',
      vertices: [
        { x: 400, y: 200 },
        { x: 600, y: 200 },
        { x: 500, y: 400 }
      ],
      color: '#8b5cf6',
      isTarget: true,
      scaleFactor: 2
    },
    requiredScaleFactor: 2,
    tolerance: 0.05,
    difficulty: 'easy',
    createdAt: new Date().toISOString()
  }
]

export class ProblemService {
  async getAllProblems(): Promise<Problem[]> {
    return problems
  }

  async getProblemById(id: string): Promise<Problem | null> {
    return problems.find(p => p.id === id) || null
  }

  async createProblem(problemData: Omit<Problem, 'id' | 'createdAt'>): Promise<Problem> {
    const newProblem: Problem = {
      ...problemData,
      id: uuidv4(),
      createdAt: new Date().toISOString()
    }
    problems.push(newProblem)
    return newProblem
  }

  async updateProblem(id: string, problemData: Partial<Problem>): Promise<Problem | null> {
    const index = problems.findIndex(p => p.id === id)
    if (index === -1) return null

    problems[index] = {
      ...problems[index],
      ...problemData
    }
    return problems[index]
  }

  async deleteProblem(id: string): Promise<boolean> {
    const index = problems.findIndex(p => p.id === id)
    if (index === -1) return false

    problems.splice(index, 1)
    return true
  }
}
