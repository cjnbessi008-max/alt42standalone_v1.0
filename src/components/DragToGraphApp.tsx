import { useState } from 'react'
import './DragToGraphApp.css'
import GraphCanvas from './GraphCanvas'
import SequenceTerms from './SequenceTerms'

export interface SequenceTerm {
  id: string
  index: number
  value: number
  placed: boolean
  x?: number
  y?: number
}

export interface Problem {
  id: string
  title: string
  description: string
  sequence: SequenceTerm[]
  pattern: string // 'arithmetic' | 'geometric' | 'quadratic'
}

const DragToGraphApp = () => {
  // 샘플 문제: 등차수열 (2, 4, 6, 8, 10)
  const [problem] = useState<Problem>({
    id: 'prob-1',
    title: '등차수열 그래프',
    description: '아래 수열의 항들을 그래프에 올바른 위치로 드래그하세요',
    sequence: [
      { id: 'term-1', index: 1, value: 2, placed: false },
      { id: 'term-2', index: 2, value: 4, placed: false },
      { id: 'term-3', index: 3, value: 6, placed: false },
      { id: 'term-4', index: 4, value: 8, placed: false },
      { id: 'term-5', index: 5, value: 10, placed: false },
    ],
    pattern: 'arithmetic'
  })

  const [terms, setTerms] = useState<SequenceTerm[]>(problem.sequence)
  const [draggedTerm, setDraggedTerm] = useState<SequenceTerm | null>(null)
  const [score, setScore] = useState(0)
  const [isComplete, setIsComplete] = useState(false)

  const handleDragStart = (term: SequenceTerm) => {
    setDraggedTerm(term)
  }

  const handleDrop = (x: number, y: number) => {
    if (!draggedTerm) return

    // 올바른 위치인지 확인 (허용 오차 ±0.5)
    const isCorrect =
      Math.abs(x - draggedTerm.index) < 0.5 &&
      Math.abs(y - draggedTerm.value) < 0.5

    if (isCorrect) {
      // 정확한 위치로 스냅
      const updatedTerms = terms.map(term =>
        term.id === draggedTerm.id
          ? { ...term, placed: true, x: draggedTerm.index, y: draggedTerm.value }
          : term
      )
      setTerms(updatedTerms)
      setScore(score + 20)

      // 모든 항이 배치되었는지 확인
      const allPlaced = updatedTerms.every(term => term.placed)
      if (allPlaced) {
        setIsComplete(true)
      }
    }

    setDraggedTerm(null)
  }

  const handleReset = () => {
    setTerms(problem.sequence.map(term => ({ ...term, placed: false, x: undefined, y: undefined })))
    setScore(0)
    setIsComplete(false)
  }

  return (
    <div className="drag-to-graph-app">
      <div className="app-header-mobile">
        <h2>{problem.title}</h2>
        <div className="score-badge">점수: {score}</div>
      </div>

      <div className="app-description">
        <p>{problem.description}</p>
      </div>

      {isComplete && (
        <div className="success-message">
          <h3>🎉 축하합니다!</h3>
          <p>모든 항을 올바르게 배치했습니다!</p>
          <button onClick={handleReset}>다시 시작</button>
        </div>
      )}

      <SequenceTerms
        terms={terms}
        onDragStart={handleDragStart}
      />

      <GraphCanvas
        terms={terms}
        onDrop={handleDrop}
        draggedTerm={draggedTerm}
      />
    </div>
  )
}

export default DragToGraphApp
