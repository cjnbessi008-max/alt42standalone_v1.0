/**
 * 음악 생성 관련 TypeScript 타입 정의
 */

export interface Note {
  note: string // 예: 'C4', 'D#5'
  duration: string // 예: '4n' (quarter note), '8n' (eighth note)
  time: number // 시작 시간 (초 단위)
  velocity?: number // 0-1 사이의 볼륨
}

export interface Melody {
  notes: Note[]
  tempo: number // BPM
  timeSignature: string // 예: '4/4'
  scale?: Scale
}

export type Scale =
  | 'major'
  | 'minor'
  | 'pentatonic'
  | 'chromatic'
  | 'blues'

export interface MelodyGenerationOptions {
  tempo?: number
  scale?: Scale
  baseNote?: string // 예: 'C4'
  duration?: number // 전체 길이 (초)
}

export interface MelodyGenerationRequest {
  questionId: number
  terms: import('./moodle.types').Term[]
  options: MelodyGenerationOptions
}

export interface MelodyGenerationResponse {
  melody: Melody
  visualization: TermChangeVisualization
}

export interface TermChangeVisualization {
  termChanges: TermChange[]
  patterns: string[]
}

export interface TermChange {
  from: string
  to: string
  direction: 'up' | 'down' | 'same' | 'transform'
  musicalInterpretation: string
}

export interface AnalysisPattern {
  type: string
  description: string
  musicalMapping: string
}

export interface TermAnalysisResponse {
  patterns: AnalysisPattern[]
  complexity: 'simple' | 'medium' | 'complex'
  suggestedTempo: number
}
