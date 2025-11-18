/**
 * 음악 생성 서비스
 */

interface Term {
  coefficient?: number
  variable?: string
  constant?: number
  operator?: string
  position: number
}

interface Note {
  note: string
  duration: string
  time: number
  velocity?: number
}

interface Melody {
  notes: Note[]
  tempo: number
  timeSignature: string
  scale?: string
}

export class MelodyService {
  // 기본 음계 (C Major)
  private readonly MAJOR_SCALE = ['C', 'D', 'E', 'F', 'G', 'A', 'B']
  private readonly MINOR_SCALE = ['C', 'D', 'Eb', 'F', 'G', 'Ab', 'Bb']
  private readonly PENTATONIC_SCALE = ['C', 'D', 'E', 'G', 'A']

  /**
   * 항 변화를 멜로디로 변환
   */
  generateMelody(
    terms: Term[],
    options: {
      tempo?: number
      scale?: 'major' | 'minor' | 'pentatonic'
      baseNote?: string
    } = {}
  ): Melody {
    const tempo = options.tempo || 120
    const scale = this.getScale(options.scale || 'major')
    const baseOctave = 4

    const notes: Note[] = []
    let currentTime = 0

    for (let i = 0; i < terms.length; i++) {
      const term = terms[i]
      const note = this.termToNote(term, scale, baseOctave)

      notes.push({
        note,
        duration: '4n', // Quarter note
        time: currentTime,
        velocity: 0.8,
      })

      currentTime += 0.5 // 0.5초 간격
    }

    return {
      notes,
      tempo,
      timeSignature: '4/4',
      scale: options.scale,
    }
  }

  /**
   * 항을 음표로 변환
   */
  private termToNote(term: Term, scale: string[], octave: number): string {
    let noteIndex = 0

    // 계수를 음높이로 매핑
    if (term.coefficient !== undefined) {
      noteIndex = Math.abs(term.coefficient) % scale.length
    } else if (term.constant !== undefined) {
      noteIndex = Math.abs(term.constant) % scale.length
    }

    // 변수가 있으면 옥타브 조정
    if (term.variable) {
      octave += 1
    }

    // 음수 계수는 낮은 옥타브
    if (term.coefficient && term.coefficient < 0) {
      octave -= 1
    }

    const noteName = scale[noteIndex]
    return `${noteName}${octave}`
  }

  /**
   * 음계 선택
   */
  private getScale(scaleType: string): string[] {
    switch (scaleType) {
      case 'minor':
        return this.MINOR_SCALE
      case 'pentatonic':
        return this.PENTATONIC_SCALE
      case 'major':
      default:
        return this.MAJOR_SCALE
    }
  }

  /**
   * 항 변화 분석
   */
  analyzeTermChanges(expressions: string[]) {
    const patterns = []

    // 간단한 패턴 분석
    if (expressions.length >= 2) {
      patterns.push({
        type: 'sequence',
        description: `${expressions.length}개의 표현식 시퀀스`,
        musicalMapping: '연속적인 멜로디 라인',
      })
    }

    const complexity = expressions.length > 5 ? 'complex' : expressions.length > 2 ? 'medium' : 'simple'
    const suggestedTempo = complexity === 'complex' ? 100 : complexity === 'medium' ? 110 : 120

    return {
      patterns,
      complexity,
      suggestedTempo,
    }
  }
}

export default new MelodyService()
