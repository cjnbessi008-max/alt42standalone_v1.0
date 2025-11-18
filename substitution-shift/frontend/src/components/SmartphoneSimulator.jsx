import React from 'react';
import '../styles/SmartphoneSimulator.css';

/**
 * SmartphoneSimulator Component
 *
 * Displays a virtual smartphone screen in the bottom right corner
 * Shows the Substitution Shift app interface
 */
const SmartphoneSimulator = ({ children, position = 'bottom-right' }) => {
  return (
    <div className={`smartphone-simulator ${position}`}>
      {/* Phone frame */}
      <div className="phone-frame">
        {/* Top notch */}
        <div className="phone-notch">
          <div className="notch-speaker"></div>
          <div className="notch-camera"></div>
        </div>

        {/* Screen */}
        <div className="phone-screen">
          {children}
        </div>

        {/* Bottom home indicator (iOS style) */}
        <div className="phone-home-indicator"></div>
      </div>

      {/* Phone shadow */}
      <div className="phone-shadow"></div>
    </div>
  );
};

export default SmartphoneSimulator;
