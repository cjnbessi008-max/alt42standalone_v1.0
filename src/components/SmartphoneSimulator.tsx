import { ReactNode } from 'react'
import './SmartphoneSimulator.css'

interface SmartphoneSimulatorProps {
  children: ReactNode
}

function SmartphoneSimulator({ children }: SmartphoneSimulatorProps) {
  return (
    <div className="smartphone-container">
      <div className="smartphone-device">
        {/* Phone Frame */}
        <div className="phone-frame">
          {/* Notch */}
          <div className="phone-notch">
            <div className="notch-camera"></div>
            <div className="notch-speaker"></div>
          </div>

          {/* Screen */}
          <div className="phone-screen">
            <div className="status-bar">
              <span className="time">9:41</span>
              <div className="status-icons">
                <span>📶</span>
                <span>📡</span>
                <span>🔋</span>
              </div>
            </div>

            <div className="app-content">
              {children}
            </div>

            {/* Home Indicator */}
            <div className="home-indicator"></div>
          </div>

          {/* Power Button */}
          <div className="power-button"></div>

          {/* Volume Buttons */}
          <div className="volume-button volume-up"></div>
          <div className="volume-button volume-down"></div>
        </div>
      </div>
    </div>
  )
}

export default SmartphoneSimulator
