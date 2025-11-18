import { useEffect, useState } from 'react'
import { useAppStore } from '../hooks/useAppStore'
import { calculateSimilarity, checkTrianglesOverlap } from '../utils/geometry'
import './FeedbackPanel.css'

const FeedbackPanel = () => {
  const { currentProblem, currentTriangle } = useAppStore()
  const [similarity, setSimilarity] = useState(0)
  const [overlap, setOverlap] = useState(0)

  useEffect(() => {
    if (currentProblem) {
      const sim = calculateSimilarity(currentTriangle, currentProblem.targetTriangle)
      const ovr = checkTrianglesOverlap(currentTriangle, currentProblem.targetTriangle)
      setSimilarity(sim)
      setOverlap(ovr)
    }
  }, [currentTriangle, currentProblem])

  if (!currentProblem) return null

  const getProgressColor = (value: number) => {
    if (value >= 0.9) return 'var(--success-color)'
    if (value >= 0.7) return 'var(--warning-color)'
    return 'var(--error-color)'
  }

  const getFeedbackMessage = () => {
    if (similarity >= 0.95 && overlap >= 0.95) {
      return { icon: '🎯', text: '완벽합니다! 삼각형이 거의 겹칩니다!', level: 'excellent' }
    }
    if (similarity >= 0.85 && overlap >= 0.8) {
      return { icon: '👍', text: '거의 다 됐어요! 조금만 더 조절해보세요.', level: 'good' }
    }
    if (similarity >= 0.7) {
      return { icon: '📐', text: '크기는 비슷해요. 위치를 조정해보세요.', level: 'ok' }
    }
    if (overlap >= 0.7) {
      return { icon: '📍', text: '위치는 좋아요. 크기를 조정해보세요.', level: 'ok' }
    }
    return { icon: '🔍', text: '크기와 위치를 조정해보세요.', level: 'needs-work' }
  }

  const feedback = getFeedbackMessage()

  return (
    <div className="feedback-panel">
      <h3>실시간 피드백</h3>

      <div className={`feedback-message ${feedback.level}`}>
        <span className="feedback-icon">{feedback.icon}</span>
        <p>{feedback.text}</p>
      </div>

      <div className="metrics">
        <div className="metric">
          <div className="metric-header">
            <span className="metric-label">모양 유사도</span>
            <span className="metric-value">{(similarity * 100).toFixed(0)}%</span>
          </div>
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{
                width: `${similarity * 100}%`,
                backgroundColor: getProgressColor(similarity)
              }}
            />
          </div>
        </div>

        <div className="metric">
          <div className="metric-header">
            <span className="metric-label">위치 일치도</span>
            <span className="metric-value">{(overlap * 100).toFixed(0)}%</span>
          </div>
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{
                width: `${overlap * 100}%`,
                backgroundColor: getProgressColor(overlap)
              }}
            />
          </div>
        </div>
      </div>

      <div className="hints">
        <p className="hints-title">💡 힌트:</p>
        <ul>
          <li>닮음비가 {currentProblem.requiredScaleFactor.toFixed(2)}에 가까워야 합니다</li>
          <li>두 삼각형의 모양은 같지만 크기가 다릅니다</li>
          <li>모든 변의 비율이 같아야 합니다</li>
        </ul>
      </div>
    </div>
  )
}

export default FeedbackPanel
