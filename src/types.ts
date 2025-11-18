export interface ConfusingPart {
  id: string
  text: string
  reason: string
  explanation: string
  examples: string[]
}

export interface AnalysisResult {
  originalInput: string
  confusingParts: ConfusingPart[]
  overallSummary: string
}

export interface RepetitionState {
  partId: string
  viewCount: number
  lastViewed: Date
  mastered: boolean
}
