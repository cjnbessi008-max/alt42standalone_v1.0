import { useEffect, useState } from 'react'
import './ValueHeat.css'
import { ProblemData, ValueHeatConfig } from '../types'

interface ValueHeatProps {
  problemData: ProblemData
  config?: ValueHeatConfig
}

/**
 * Value Heat 컴포넌트
 * 값의 변화에 따라 색온도를 변경하여 시각적 피드백 제공
 * 파랑(낮음) → 초록 → 노랑 → 주황 → 빨강(높음)
 */
const ValueHeat = ({ problemData, config = {} }: ValueHeatProps) => {
  const {
    showLabel = true,
    showPercentage = true,
    animationDuration = 300,
    warningThreshold = 80,
    dangerThreshold = 95
  } = config

  const [isAnimating, setIsAnimating] = useState(false)
  const [prevValue, setPrevValue] = useState(problemData.currentValue)

  const { currentValue, minValue, maxValue, title } = problemData

  // 퍼센티지 계산 (0-100)
  const percentage = ((currentValue - minValue) / (maxValue - minValue)) * 100

  // 색온도 계산 함수
  const getHeatColor = (percent: number): string => {
    if (percent <= 0) return '#0066ff' // 최솟값: 진한 파랑
    if (percent <= 20) return '#00b4ff' // 파랑
    if (percent <= 40) return '#00ff88' // 청록
    if (percent <= 60) return '#88ff00' // 연두
    if (percent <= 80) return '#ffdd00' // 노랑
    if (percent <= 90) return '#ff8800' // 주황
    if (percent < 100) return '#ff4400' // 진한 주황
    return '#ff0000' // 최댓값: 빨강
  }

  // 상태 메시지 생성
  const getStatusMessage = (): string => {
    if (currentValue <= minValue) return '최솟값 도달'
    if (currentValue >= maxValue) return '최댓값 도달'
    if (percentage >= dangerThreshold) return '위험 수준'
    if (percentage >= warningThreshold) return '경고 수준'
    if (percentage <= 20) return '매우 낮음'
    if (percentage <= 40) return '낮음'
    if (percentage <= 60) return '보통'
    return '높음'
  }

  // 값 변경 시 애니메이션 트리거
  useEffect(() => {
    if (prevValue !== currentValue) {
      setIsAnimating(true)
      const timer = setTimeout(() => setIsAnimating(false), animationDuration)
      setPrevValue(currentValue)
      return () => clearTimeout(timer)
    }
  }, [currentValue, prevValue, animationDuration])

  const heatColor = getHeatColor(percentage)
  const isMinReached = currentValue <= minValue
  const isMaxReached = currentValue >= maxValue

  return (
    <div className="value-heat-container">
      {showLabel && (
        <div className="value-heat-header">
          <h3>{title}</h3>
          <span className="status-message">{getStatusMessage()}</span>
        </div>
      )}

      <div
        className={`value-heat-display ${isAnimating ? 'animating' : ''} ${
          isMinReached ? 'min-reached' : ''
        } ${isMaxReached ? 'max-reached' : ''}`}
        style={{
          backgroundColor: heatColor,
          transition: `background-color ${animationDuration}ms ease-in-out`
        }}
      >
        <div className="value-display">
          <span className="current-value">{currentValue}</span>
          {showPercentage && (
            <span className="percentage">{percentage.toFixed(1)}%</span>
          )}
        </div>

        {/* 최솟값/최댓값 도달 시 특별한 표시 */}
        {(isMinReached || isMaxReached) && (
          <div className="extreme-indicator">
            {isMinReached && (
              <div className="min-indicator">
                <span className="icon">❄️</span>
                <span>최솟값</span>
              </div>
            )}
            {isMaxReached && (
              <div className="max-indicator">
                <span className="icon">🔥</span>
                <span>최댓값</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 색온도 바 */}
      <div className="heat-bar">
        <div
          className="heat-bar-fill"
          style={{
            width: `${Math.max(0, Math.min(100, percentage))}%`,
            backgroundColor: heatColor,
            transition: `width ${animationDuration}ms ease-in-out`
          }}
        />
      </div>

      <div className="heat-range-labels">
        <span className="min-label">최소: {minValue}</span>
        <span className="max-label">최대: {maxValue}</span>
      </div>
    </div>
  )
}

export default ValueHeat
