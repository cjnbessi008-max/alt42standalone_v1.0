import { useState, useEffect } from 'react'
import './VectorProblem.css'

interface Vector {
  x: number
  y: number
}

const VectorProblem = () => {
  const [vector1, setVector1] = useState<Vector>({ x: 0, y: 0 })
  const [vector2, setVector2] = useState<Vector>({ x: 0, y: 0 })
  const [operation, setOperation] = useState<'add' | 'subtract'>('add')
  const [userAnswer, setUserAnswer] = useState<Vector>({ x: 0, y: 0 })
  const [showResult, setShowResult] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)

  // Generate random problem on mount
  useEffect(() => {
    generateNewProblem()
  }, [])

  const generateNewProblem = () => {
    setVector1({
      x: Math.floor(Math.random() * 10) - 5,
      y: Math.floor(Math.random() * 10) - 5
    })
    setVector2({
      x: Math.floor(Math.random() * 10) - 5,
      y: Math.floor(Math.random() * 10) - 5
    })
    setOperation(Math.random() > 0.5 ? 'add' : 'subtract')
    setUserAnswer({ x: 0, y: 0 })
    setShowResult(false)
    setIsCorrect(false)
  }

  const calculateCorrectAnswer = (): Vector => {
    if (operation === 'add') {
      return {
        x: vector1.x + vector2.x,
        y: vector1.y + vector2.y
      }
    } else {
      return {
        x: vector1.x - vector2.x,
        y: vector1.y - vector2.y
      }
    }
  }

  const checkAnswer = () => {
    const correctAnswer = calculateCorrectAnswer()
    const correct = userAnswer.x === correctAnswer.x && userAnswer.y === correctAnswer.y

    setIsCorrect(correct)
    setShowResult(true)

    // Trigger glow effect on smartphone screen
    if (correct) {
      const screen = document.querySelector('.smartphone-screen')
      screen?.classList.add('correct-glow')

      setTimeout(() => {
        screen?.classList.remove('correct-glow')
      }, 1500)
    }
  }

  return (
    <div className="vector-problem">
      <div className="problem-header">
        <h2>벡터 연산</h2>
        <p className="problem-subtitle">Vector Operation</p>
      </div>

      <div className="problem-content">
        <div className="vector-display">
          <div className="vector-box">
            <div className="vector-label">벡터 A</div>
            <div className="vector-value">
              <span className="vector-component">x: {vector1.x}</span>
              <span className="vector-component">y: {vector1.y}</span>
            </div>
            <div className="vector-visual">
              <svg width="100" height="100" viewBox="-50 -50 100 100">
                <defs>
                  <marker
                    id="arrowhead-a"
                    markerWidth="10"
                    markerHeight="10"
                    refX="9"
                    refY="3"
                    orient="auto"
                  >
                    <polygon points="0 0, 10 3, 0 6" fill="#667eea" />
                  </marker>
                </defs>
                <line
                  x1="0"
                  y1="0"
                  x2={vector1.x * 8}
                  y2={-vector1.y * 8}
                  stroke="#667eea"
                  strokeWidth="2"
                  markerEnd="url(#arrowhead-a)"
                />
                <circle cx="0" cy="0" r="2" fill="#667eea" />
              </svg>
            </div>
          </div>

          <div className="operation-symbol">
            {operation === 'add' ? '+' : '−'}
          </div>

          <div className="vector-box">
            <div className="vector-label">벡터 B</div>
            <div className="vector-value">
              <span className="vector-component">x: {vector2.x}</span>
              <span className="vector-component">y: {vector2.y}</span>
            </div>
            <div className="vector-visual">
              <svg width="100" height="100" viewBox="-50 -50 100 100">
                <defs>
                  <marker
                    id="arrowhead-b"
                    markerWidth="10"
                    markerHeight="10"
                    refX="9"
                    refY="3"
                    orient="auto"
                  >
                    <polygon points="0 0, 10 3, 0 6" fill="#f093fb" />
                  </marker>
                </defs>
                <line
                  x1="0"
                  y1="0"
                  x2={vector2.x * 8}
                  y2={-vector2.y * 8}
                  stroke="#f093fb"
                  strokeWidth="2"
                  markerEnd="url(#arrowhead-b)"
                />
                <circle cx="0" cy="0" r="2" fill="#f093fb" />
              </svg>
            </div>
          </div>
        </div>

        <div className="answer-section">
          <div className="answer-label">답을 입력하세요:</div>
          <div className="answer-inputs">
            <div className="input-group">
              <label>x:</label>
              <input
                type="number"
                value={userAnswer.x}
                onChange={(e) => setUserAnswer({ ...userAnswer, x: parseInt(e.target.value) || 0 })}
                disabled={showResult && isCorrect}
              />
            </div>
            <div className="input-group">
              <label>y:</label>
              <input
                type="number"
                value={userAnswer.y}
                onChange={(e) => setUserAnswer({ ...userAnswer, y: parseInt(e.target.value) || 0 })}
                disabled={showResult && isCorrect}
              />
            </div>
          </div>
        </div>

        {showResult && (
          <div className={`result-message ${isCorrect ? 'correct' : 'incorrect'}`}>
            {isCorrect ? (
              <>
                <span className="result-icon">✓</span>
                <span>정답입니다! 잘했어요!</span>
              </>
            ) : (
              <>
                <span className="result-icon">✗</span>
                <span>
                  다시 시도해보세요. 정답은 ({calculateCorrectAnswer().x}, {calculateCorrectAnswer().y})입니다.
                </span>
              </>
            )}
          </div>
        )}

        <div className="button-group">
          {!showResult ? (
            <button className="btn btn-primary" onClick={checkAnswer}>
              확인
            </button>
          ) : (
            <button className="btn btn-secondary" onClick={generateNewProblem}>
              새 문제
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default VectorProblem
