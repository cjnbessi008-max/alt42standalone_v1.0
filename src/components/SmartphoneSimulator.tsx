import React, { ReactNode } from 'react'
import './SmartphoneSimulator.css'

interface SmartphoneSimulatorProps {
  children: ReactNode
}

const SmartphoneSimulator: React.FC<SmartphoneSimulatorProps> = ({ children }) => {
  return (
    <div className="smartphone-container">
      <div className="smartphone-frame">
        {/* 스마트폰 상단 노치 */}
        <div className="smartphone-notch">
          <div className="notch-speaker"></div>
          <div className="notch-camera"></div>
        </div>

        {/* 스마트폰 화면 */}
        <div className="smartphone-screen">
          <div className="smartphone-statusbar">
            <span className="statusbar-time">9:41</span>
            <div className="statusbar-icons">
              <span>📶</span>
              <span>📡</span>
              <span>🔋</span>
            </div>
          </div>

          {/* 앱 콘텐츠 */}
          <div className="smartphone-content">
            {children}
          </div>
        </div>

        {/* 홈 버튼 표시줄 */}
        <div className="smartphone-home-indicator"></div>
      </div>
    </div>
  )
}

export default SmartphoneSimulator
