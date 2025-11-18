/**
 * 수학 항을 음표로 매핑하는 유틸리티
 */

import type { ExpressionTerm } from '@types/term.types'
import type { Note } from '@types/melody.types'

const MAJOR_SCALE = ['C', 'D', 'E', 'F', 'G', 'A', 'B']
const MINOR_SCALE = ['C', 'D', 'Eb', 'F', 'G', 'Ab', 'Bb']
const PENTATONIC_SCALE = ['C', 'D', 'E', 'G', 'A']

/**
 * 항을 음표로 매핑
 */
export function mapTermToNote(
  term: ExpressionTerm,
  options: {
    scale?: 'major' | 'minor' | 'pentatonic'
    baseOctave?: number
  } = {}
): string {
  const scale = getScale(options.scale || 'major')
  let octave = options.baseOctave || 4

  // 계수를 음높이로 매핑
  const absCoeff = Math.abs(term.coefficient)
  const noteIndex = Math.floor(absCoeff) % scale.length

  // 변수가 있으면 옥타브 증가
  if (term.variable) {
    octave += 1
  }

  // 음수 계수는 낮은 옥타브
  if (term.coefficient < 0) {
    octave -= 1
  }

  // 지수가 있으면 옥타브 조정
  if (term.exponent && term.exponent > 1) {
    octave += Math.min(term.exponent - 1, 2) // 최대 2옥타브 증가
  }

  // 옥타브 범위 제한 (1-7)
  octave = Math.max(1, Math.min(7, octave))

  const noteName = scale[noteIndex]
  return `${noteName}${octave}`
}

/**
 * 항 변화를 노트 시퀀스로 변환
 */
export function termsToNoteSequence(
  terms: ExpressionTerm[],
  options: {
    scale?: 'major' | 'minor' | 'pentatonic'
    tempo?: number
    duration?: string
  } = {}
): Note[] {
  const tempo = options.tempo || 120
  const beatDuration = 60 / tempo // 1박의 길이 (초)
  const duration = options.duration || '4n'

  const notes: Note[] = []
  let currentTime = 0

  for (const term of terms) {
    const note = mapTermToNote(term, options)

    notes.push({
      note,
      duration,
      time: currentTime,
      velocity: 0.8,
    })

    currentTime += beatDuration
  }

  return notes
}

/**
 * 음계 가져오기
 */
function getScale(scaleType: 'major' | 'minor' | 'pentatonic'): string[] {
  switch (scaleType) {
    case 'minor':
      return MINOR_SCALE
    case 'pentatonic':
      return PENTATONIC_SCALE
    case 'major':
    default:
      return MAJOR_SCALE
  }
}

/**
 * 계수 변화를 음정 간격으로 매핑
 */
export function coefficientChangeToInterval(change: number): string {
  const absChange = Math.abs(change)

  if (absChange === 0) return 'unison'
  if (absChange === 1) return 'second'
  if (absChange === 2) return 'third'
  if (absChange === 3) return 'fourth'
  if (absChange === 4) return 'fifth'
  if (absChange >= 5) return 'octave'

  return 'interval'
}
