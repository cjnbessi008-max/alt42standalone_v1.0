import { v4 as uuidv4 } from 'uuid'
import type { StudentAttempt } from '../types'

// In-memory storage for demo (replace with database in production)
const attempts: StudentAttempt[] = []

export class AttemptService {
  async submitAttempt(attemptData: Omit<StudentAttempt, 'id' | 'attemptedAt'>): Promise<StudentAttempt> {
    const newAttempt: StudentAttempt = {
      ...attemptData,
      id: uuidv4(),
      attemptedAt: new Date().toISOString()
    }
    attempts.push(newAttempt)
    return newAttempt
  }

  async getAttemptsByStudent(studentId: string): Promise<StudentAttempt[]> {
    return attempts.filter(a => a.studentId === studentId)
  }

  async getAttemptsByProblem(problemId: string): Promise<StudentAttempt[]> {
    return attempts.filter(a => a.problemId === problemId)
  }

  async getAttemptById(id: string): Promise<StudentAttempt | null> {
    return attempts.find(a => a.id === id) || null
  }
}
