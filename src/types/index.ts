export interface ProblemData {
  id: string
  title: string
  currentValue: number
  minValue: number
  maxValue: number
  targetValue?: number
  type: 'score' | 'progress' | 'difficulty' | 'time'
}

export interface ValueHeatConfig {
  showLabel?: boolean
  showPercentage?: boolean
  animationDuration?: number
  warningThreshold?: number
  dangerThreshold?: number
}

export interface MoodleApiConfig {
  baseUrl: string
  token: string
  courseId: string
}
