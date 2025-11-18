import React from 'react'
import ValueBounce from '../ValueBounce/ValueBounce'
import './VirtualSmartphone.css'

const VirtualSmartphone = ({ value, problemData }) => {
  return (
    <div className="smartphone-container">
      <div className="smartphone">
        {/* 스마트폰 노치 */}
        <div className="smartphone-notch"></div>

        {/* 스마트폰 화면 */}
        <div className="smartphone-screen">
          <div className="screen-content">
            {/* 상단 헤더 */}
            <div className="screen-header">
              <div className="status-bar">
                <span className="time">12:34</span>
                <div className="status-icons">
                  <span>📶</span>
                  <span>🔋</span>
                </div>
              </div>
            </div>

            {/* 문제 정보 */}
            <div className="problem-info">
              <h3>{problemData.title}</h3>
              <p className="function-name">{problemData.functionName}</p>
              <p className="description">{problemData.description}</p>
            </div>

            {/* Value Bounce 애니메이션 영역 */}
            <div className="bounce-area">
              <ValueBounce value={value} />
            </div>

            {/* 현재 값 표시 */}
            <div className="value-display">
              <div className="current-value">
                <span className="value-label">현재 값:</span>
                <span className="value-number">{value}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 스마트폰 홈 버튼 */}
        <div className="smartphone-home-button"></div>
      </div>
    </div>
  )
}

export default VirtualSmartphone
