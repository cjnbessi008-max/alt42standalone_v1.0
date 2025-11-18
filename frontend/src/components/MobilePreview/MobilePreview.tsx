import React, { ReactNode } from 'react'
import './MobilePreview.css'

interface MobilePreviewProps {
  children: ReactNode
}

const MobilePreview: React.FC<MobilePreviewProps> = ({ children }) => {
  return (
    <div className="mobile-preview-wrapper">
      <div className="mobile-frame">
        {/* 상단 노치 */}
        <div className="mobile-notch"></div>

        {/* 스크린 */}
        <div className="mobile-screen">
          {children}
        </div>

        {/* 하단 홈 버튼 인디케이터 */}
        <div className="mobile-home-indicator"></div>
      </div>

      {/* 디바이스 정보 */}
      <div className="device-info">
        <p>iPhone 14 Pro</p>
        <p className="resolution">393 × 852</p>
      </div>
    </div>
  )
}

export default MobilePreview
