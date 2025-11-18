import React from 'react'
import './PhoneFrame.css'

/**
 * 가상 스마트폰 프레임 컴포넌트
 * 우측 하단에 모바일 화면 시뮬레이션
 */
const PhoneFrame = ({ children }) => {
  return (
    <div className="phone-frame-container">
      <div className="phone-frame">
        {/* 상단 노치 */}
        <div className="phone-notch">
          <div className="camera"></div>
          <div className="speaker"></div>
        </div>

        {/* 화면 영역 */}
        <div className="phone-screen">
          {children}
        </div>

        {/* 하단 홈 인디케이터 */}
        <div className="phone-home-indicator"></div>

        {/* 측면 버튼 */}
        <div className="phone-button phone-button-power"></div>
        <div className="phone-button phone-button-volume-up"></div>
        <div className="phone-button phone-button-volume-down"></div>
      </div>
    </div>
  )
}

export default PhoneFrame
