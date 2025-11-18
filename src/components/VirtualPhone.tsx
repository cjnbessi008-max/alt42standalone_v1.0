import { useState } from 'react'
import './VirtualPhone.css'
import ValueHeat from './ValueHeat'
import { ProblemData } from '../types'

interface VirtualPhoneProps {
  problemData: ProblemData
}

/**
 * 가상 스마트폰 화면 컴포넌트
 * 우측 하단에 고정되어 표시됨 (iPhone 크기: 375x667px)
 */
const VirtualPhone = ({ problemData }: VirtualPhoneProps) => {
  const [isMinimized, setIsMinimized] = useState(false)

  const toggleMinimize = () => {
    setIsMinimized(!isMinimized)
  }

  return (
    <div className={`virtual-phone ${isMinimized ? 'minimized' : ''}`}>
      <div className="phone-header">
        <div className="phone-notch"></div>
        <div className="phone-controls">
          <button
            className="minimize-btn"
            onClick={toggleMinimize}
            aria-label={isMinimized ? '확대' : '최소화'}
          >
            {isMinimized ? '📱' : '−'}
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          <div className="phone-screen">
            <div className="phone-status-bar">
              <span className="time">12:30</span>
              <div className="phone-icons">
                <span>📶</span>
                <span>🔋</span>
              </div>
            </div>

            <div className="phone-content">
              <div className="app-header">
                <h2>학습 진행 상황</h2>
                <p className="problem-id">문제 ID: {problemData.id}</p>
              </div>

              <ValueHeat
                problemData={problemData}
                config={{
                  showLabel: true,
                  showPercentage: true,
                  animationDuration: 400
                }}
              />

              <div className="phone-info-section">
                <div className="info-card">
                  <span className="info-label">문제 유형</span>
                  <span className="info-value">{problemData.type === 'score' ? '점수' : problemData.type}</span>
                </div>
                {problemData.targetValue && (
                  <div className="info-card">
                    <span className="info-label">목표 값</span>
                    <span className="info-value">{problemData.targetValue}</span>
                  </div>
                )}
              </div>

              <div className="phone-footer">
                <p className="connection-status">
                  <span className="status-dot"></span>
                  LMS 연결됨
                </p>
              </div>
            </div>
          </div>

          <div className="phone-home-indicator"></div>
        </>
      )}
    </div>
  )
}

export default VirtualPhone
