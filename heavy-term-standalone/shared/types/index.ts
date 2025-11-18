/**
 * Shared TypeScript types for Heavy Term
 * Used by both frontend and backend
 */

// Physics types
export interface PhysicsConfig {
  gravityStrength: number
  gravityMultiplier: number
  bounceDamping: number
  frictionCoefficient: number
  maxVelocity: number
  enableGravity: boolean
  enableCollisions: boolean
}

// Term types
export interface Term {
  id: string
  problemId: string
  text: string
  value?: number
  size: number // 1-10
  weight: number
  positionX?: number
  positionY?: number
  velocityX: number
  velocityY: number
  isAnswer: boolean
  order: number
  createdAt: string
}

export interface TermInput {
  text: string
  value?: number
  size?: number
  weight?: number
  isAnswer?: boolean
  order?: number
}

// Problem types
export type DifficultyLevel = 'easy' | 'medium' | 'hard' | 'expert'
export type QuestionType = 'simplify' | 'solve' | 'factor' | 'expand' | 'evaluate'
export type Category = 'algebra' | 'calculus' | 'geometry' | 'trigonometry' | 'arithmetic'

export interface Problem {
  id: string
  title: string
  questionText: string
  questionType: QuestionType
  difficulty: DifficultyLevel
  category?: Category
  createdAt: string
  updatedAt: string
  isActive: boolean
  terms?: Term[]
}

export interface ProblemInput {
  title: string
  questionText: string
  questionType?: QuestionType
  difficulty?: DifficultyLevel
  category?: Category
  terms?: TermInput[]
}

// Session types
export type DeviceType = 'smartphone' | 'tablet' | 'desktop'

export interface Session {
  id: string
  problemId: string
  userId?: string
  deviceType: DeviceType
  startedAt: string
  endedAt?: string
  isActive: boolean
  interactionCount: number
  timeSpent: number
}

export interface SessionInput {
  problemId: string
  userId?: string
  deviceType?: DeviceType
}

// Interaction types
export type InteractionType = 'tap' | 'drag' | 'drop' | 'release' | 'collision'

export interface Interaction {
  id: string
  sessionId: string
  termId: string
  type: InteractionType
  positionX?: number
  positionY?: number
  metadata?: Record<string, any>
  timestamp: string
}

export interface InteractionInput {
  sessionId: string
  termId: string
  type: InteractionType
  positionX?: number
  positionY?: number
  metadata?: Record<string, any>
}

// Answer types
export interface Answer {
  id: string
  sessionId: string
  answerData: Record<string, any>
  isCorrect?: boolean
  score?: number
  feedback?: string
  submittedAt: string
}

export interface AnswerInput {
  sessionId: string
  answerData: Record<string, any>
}

// Setting types
export type SettingType = 'string' | 'number' | 'boolean' | 'json'

export interface Setting {
  id: string
  key: string
  value: string
  type: SettingType
  description?: string
  updatedAt: string
}

export interface SettingInput {
  key: string
  value: string
  type?: SettingType
  description?: string
}

// User types
export interface User {
  id: string
  username?: string
  displayName?: string
  preferences?: Record<string, any>
  createdAt: string
  lastActiveAt: string
}

export interface UserInput {
  username?: string
  displayName?: string
  preferences?: Record<string, any>
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  total: number
  page: number
  pageSize: number
  hasMore: boolean
}

// Physics simulation types
export interface PhysicsState {
  terms: Map<string, TermPhysicsState>
  config: PhysicsConfig
  isRunning: boolean
  fps: number
}

export interface TermPhysicsState {
  id: string
  x: number
  y: number
  vx: number
  vy: number
  isDragging: boolean
  dragOffsetX: number
  dragOffsetY: number
}

// Canvas types
export interface CanvasSize {
  width: number
  height: number
}

export interface Point {
  x: number
  y: number
}

export interface Vector2D {
  x: number
  y: number
}

// Event types
export interface DragEvent {
  termId: string
  startPosition: Point
  currentPosition: Point
  velocity: Vector2D
}

export interface CollisionEvent {
  term1Id: string
  term2Id: string
  position: Point
  normal: Vector2D
  impulse: number
}

// Error types
export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

// Validation schemas (using Zod would go here)
export interface ValidationError {
  field: string
  message: string
}

// Constants
export const PHYSICS_DEFAULTS: PhysicsConfig = {
  gravityStrength: 9.8,
  gravityMultiplier: 2.0,
  bounceDamping: 0.7,
  frictionCoefficient: 0.98,
  maxVelocity: 500,
  enableGravity: true,
  enableCollisions: true,
}

export const SMARTPHONE_DIMENSIONS: CanvasSize = {
  width: 375,
  height: 667,
}

export const FPS_TARGET = 60
export const DELTA_TIME_MAX = 1 / 30 // Maximum delta time (30 FPS minimum)
