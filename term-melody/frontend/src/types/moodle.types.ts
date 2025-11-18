/**
 * Moodle 관련 TypeScript 타입 정의
 */

export interface MoodleQuestion {
  id: number
  name: string
  questiontext: string
  qtype: QuestionType
  category: number
  createdAt: string
  modifiedAt?: string
}

export type QuestionType =
  | 'multichoice'
  | 'shortanswer'
  | 'numerical'
  | 'calculated'
  | 'essay'
  | 'truefalse'

export interface MoodleAnswer {
  id: number
  question: number
  answer: string
  fraction: number // 1.0 = 정답, 0.0 = 오답
  feedback: string
}

export interface QuestionDetail extends MoodleQuestion {
  answers: MoodleAnswer[]
  terms: Term[]
}

export interface Term {
  coefficient: number
  variable?: string
  operator?: '+' | '-' | '*' | '/' | '='
  constant?: number
  position: number
}

export interface QuestionListResponse {
  questions: MoodleQuestion[]
  total: number
  page: number
  limit: number
}
