import React, { useState, useEffect } from 'react'
import './DivisionProblem.css'

/**
 * DivisionProblem Component
 * Handles division problems and detects "impossible" cases:
 * - Division by zero
 * - Non-divisible numbers (remainder exists)
 * These cases are shown with a shadow effect
 */
const DivisionProblem = ({ problem, onAnswer }) => {
  const [answer, setAnswer] = useState('')
  const [showFeedback, setShowFeedback] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)
  const [isImpossible, setIsImpossible] = useState(false)

  useEffect(() => {
    // Check if this is an impossible/indivisible case
    checkImpossible()
  }, [problem])

  const checkImpossible = () => {
    if (!problem) return

    const { dividend, divisor } = problem

    // Case 1: Division by zero is impossible
    if (divisor === 0) {
      setIsImpossible(true)
      return
    }

    // Case 2: Non-divisible (has remainder)
    if (dividend % divisor !== 0) {
      setIsImpossible(true)
      return
    }

    setIsImpossible(false)
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    if (!problem) return

    const { dividend, divisor } = problem

    // Calculate correct answer
    let correctAnswer
    if (divisor === 0) {
      correctAnswer = 'impossible' // Or 'undefined'
    } else {
      correctAnswer = Math.floor(dividend / divisor)
    }

    // Check student's answer
    const studentAnswer = answer.toLowerCase()
    const correct =
      studentAnswer === correctAnswer.toString() ||
      (isImpossible && (studentAnswer === 'impossible' || studentAnswer === '불가능'))

    setIsCorrect(correct)
    setShowFeedback(true)

    // Send to parent/LMS after delay
    setTimeout(() => {
      onAnswer({
        problemId: problem.id,
        answer: answer,
        correct: correct,
        timestamp: new Date().toISOString()
      })

      // Reset for next problem
      setAnswer('')
      setShowFeedback(false)
    }, 2000)
  }

  const getRemainder = () => {
    if (!problem || problem.divisor === 0) return 0
    return problem.dividend % problem.divisor
  }

  const getQuotient = () => {
    if (!problem || problem.divisor === 0) return 0
    return Math.floor(problem.dividend / problem.divisor)
  }

  if (!problem) {
    return <div className="loading">문제를 불러오는 중...</div>
  }

  const { dividend, divisor } = problem
  const remainder = getRemainder()
  const quotient = getQuotient()

  return (
    <div className={`division-problem ${isImpossible ? 'impossible' : ''}`}>
      <div className="problem-header">
        <h2>나눗셈 문제</h2>
        <span className="problem-id">#{problem.id}</span>
      </div>

      {/* Visual representation of division */}
      <div className={`division-visual ${isImpossible ? 'with-shadow' : ''}`}>
        <div className="dividend-box">
          <span className="number">{dividend}</span>
          <span className="label">나눠지는 수</span>
        </div>

        <div className="division-symbol">÷</div>

        <div className="divisor-box">
          <span className="number">{divisor}</span>
          <span className="label">나누는 수</span>
        </div>

        <div className="equals-symbol">=</div>

        <div className="result-box">
          <span className="number">?</span>
          <span className="label">몫</span>
        </div>

        {/* Impossible shadow overlay */}
        {isImpossible && (
          <div className="impossible-overlay">
            <div className="shadow-effect"></div>
            <div className="impossible-label">
              {divisor === 0 ? '0으로 나눌 수 없습니다' : `나머지: ${remainder}`}
            </div>
          </div>
        )}
      </div>

      {/* Division details */}
      {!isImpossible && divisor !== 0 && (
        <div className="division-details">
          <p>이 나눗셈은 정확히 나누어떨어집니다</p>
        </div>
      )}

      {isImpossible && divisor !== 0 && remainder > 0 && (
        <div className="division-details warning">
          <p>⚠️ 이 나눗셈은 나누어떨어지지 않습니다</p>
          <p className="hint">몫: {quotient}, 나머지: {remainder}</p>
        </div>
      )}

      {divisor === 0 && (
        <div className="division-details error">
          <p>🚫 0으로 나누는 것은 불가능합니다!</p>
          <p className="hint">수학적으로 정의되지 않습니다</p>
        </div>
      )}

      {/* Answer form */}
      <form onSubmit={handleSubmit} className="answer-form">
        <label htmlFor="answer">
          {divisor === 0 ? "'불가능' 또는 몫을 입력하세요:" : "몫을 입력하세요:"}
        </label>
        <input
          id="answer"
          type="text"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder={divisor === 0 ? "불가능" : "답을 입력하세요"}
          disabled={showFeedback}
          className={showFeedback ? (isCorrect ? 'correct' : 'incorrect') : ''}
        />
        <button type="submit" disabled={!answer || showFeedback}>
          제출
        </button>
      </form>

      {/* Feedback */}
      {showFeedback && (
        <div className={`feedback ${isCorrect ? 'correct' : 'incorrect'}`}>
          {isCorrect ? '✓ 정답입니다!' : '✗ 다시 생각해보세요'}
        </div>
      )}
    </div>
  )
}

export default DivisionProblem
