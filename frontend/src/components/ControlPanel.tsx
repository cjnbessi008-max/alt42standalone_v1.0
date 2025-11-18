import { useState } from 'react'
import { useAppStore } from '../hooks/useAppStore'
import { getTriangleSides } from '../utils/geometry'
import './ControlPanel.css'

const ControlPanel = () => {
  const {
    currentProblem,
    currentTriangle,
    updateTriangleScale,
    submitSolution,
    resetProblem,
    attempts
  } = useAppStore()

  const [scaleFactor, setScaleFactor] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [lastResult, setLastResult] = useState<{ success: boolean; message: string } | null>(null)

  if (!currentProblem) return null

  const handleScaleChange = (value: number) => {
    setScaleFactor(value)
    updateTriangleScale(value)
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    const result = await submitSolution()

    setLastResult({
      success: result,
      message: result
        ? '🎉 정답입니다! 삼각형이 완벽하게 겹칩니다!'
        : '아직 완전히 겹치지 않았습니다. 다시 시도해보세요.'
    })

    setIsSubmitting(false)
  }

  const handleReset = () => {
    setScaleFactor(1)
    setLastResult(null)
    resetProblem()
  }

  const currentSides = getTriangleSides(currentTriangle)
  const targetSides = getTriangleSides(currentProblem.targetTriangle)

  return (
    <div className="control-panel">
      <div className="panel-section">
        <h3>확대/축소 조절</h3>
        <div className="scale-control">
          <label htmlFor="scale-slider">
            비율: <strong>{scaleFactor.toFixed(2)}x</strong>
          </label>
          <input
            id="scale-slider"
            type="range"
            min="0.5"
            max="3"
            step="0.01"
            value={scaleFactor}
            onChange={(e) => handleScaleChange(parseFloat(e.target.value))}
            className="scale-slider"
          />
          <div className="scale-marks">
            <span>0.5x</span>
            <span>1.0x</span>
            <span>1.5x</span>
            <span>2.0x</span>
            <span>3.0x</span>
          </div>
        </div>
      </div>

      <div className="panel-section">
        <h3>변의 길이 비교</h3>
        <div className="sides-comparison">
          <div className="sides-table">
            <div className="table-header">
              <span>변</span>
              <span>내 삼각형</span>
              <span>목표</span>
            </div>
            <div className="table-row">
              <span>AB</span>
              <span>{currentSides.AB.toFixed(1)}</span>
              <span>{targetSides.AB.toFixed(1)}</span>
            </div>
            <div className="table-row">
              <span>BC</span>
              <span>{currentSides.BC.toFixed(1)}</span>
              <span>{targetSides.BC.toFixed(1)}</span>
            </div>
            <div className="table-row">
              <span>CA</span>
              <span>{currentSides.CA.toFixed(1)}</span>
              <span>{targetSides.CA.toFixed(1)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="panel-section">
        <h3>제출</h3>
        <div className="submit-section">
          <p className="attempts-count">시도 횟수: {attempts}</p>
          <div className="button-group">
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="btn btn-primary"
            >
              {isSubmitting ? '제출 중...' : '정답 확인'}
            </button>
            <button
              onClick={handleReset}
              className="btn btn-secondary"
            >
              다시 시작
            </button>
          </div>
        </div>
      </div>

      {lastResult && (
        <div className={`result-message ${lastResult.success ? 'success' : 'error'}`}>
          {lastResult.message}
        </div>
      )}
    </div>
  )
}

export default ControlPanel
