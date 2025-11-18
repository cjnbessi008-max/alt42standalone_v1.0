import React from 'react'
import './VirtualDevice.css'

/**
 * VirtualDevice - Virtual smartphone display component
 * Features the "Impossible Shadow" effect for realistic 3D depth
 * Positioned at bottom-right of the screen as per requirements
 */
const VirtualDevice = ({ children, position = 'bottom-right' }) => {
  return (
    <div className={`virtual-device-wrapper ${position}`}>
      <div className="virtual-device">
        {/* Device frame with impossible shadow effect */}
        <div className="device-frame">
          {/* Top bezel with notch */}
          <div className="device-bezel top">
            <div className="notch">
              <div className="speaker"></div>
              <div className="camera"></div>
            </div>
          </div>

          {/* Device screen - content area */}
          <div className="device-screen">
            <div className="screen-content">
              {children}
            </div>
          </div>

          {/* Bottom bezel */}
          <div className="device-bezel bottom">
            <div className="home-indicator"></div>
          </div>
        </div>

        {/* Impossible shadow layers */}
        <div className="shadow-layer shadow-1"></div>
        <div className="shadow-layer shadow-2"></div>
        <div className="shadow-layer shadow-3"></div>
      </div>
    </div>
  )
}

export default VirtualDevice
