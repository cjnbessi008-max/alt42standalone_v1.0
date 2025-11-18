import { ReactNode } from 'react'
import './MobileFrame.css'

interface MobileFrameProps {
  children: ReactNode
}

const MobileFrame = ({ children }: MobileFrameProps) => {
  return (
    <div className="mobile-frame">
      <div className="mobile-frame-top">
        <div className="mobile-camera"></div>
        <div className="mobile-speaker"></div>
      </div>
      <div className="mobile-screen">
        <div className="mobile-status-bar">
          <span className="mobile-time">9:41</span>
          <div className="mobile-icons">
            <span>📶</span>
            <span>📡</span>
            <span>🔋</span>
          </div>
        </div>
        <div className="mobile-content">
          {children}
        </div>
      </div>
      <div className="mobile-frame-bottom">
        <div className="mobile-home-indicator"></div>
      </div>
    </div>
  )
}

export default MobileFrame
