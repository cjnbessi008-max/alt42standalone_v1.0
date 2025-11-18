import React from 'react'
import './PhoneFrame.css'

/**
 * PhoneFrame - 가상 스마트폰 화면 컨테이너
 * 우측 하단에 표시되는 모바일 디바이스 시뮬레이션
 */
function PhoneFrame({ children }) {
  return (
    <div className="phone-frame">
      <div className="phone-notch"></div>
      <div className="phone-screen">
        <div className="phone-status-bar">
          <span className="time">10:24</span>
          <div className="status-icons">
            <span>📶</span>
            <span>📡</span>
            <span>🔋</span>
          </div>
        </div>
        <div className="phone-content">
          {children}
        </div>
      </div>
      <div className="phone-home-button"></div>
    </div>
  )
}

export default PhoneFrame
