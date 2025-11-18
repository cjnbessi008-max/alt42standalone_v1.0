import React from 'react';
import './SmartphoneFrame.css';

/**
 * SmartphoneFrame Component
 * Displays content in a smartphone frame positioned at the right bottom
 */
const SmartphoneFrame = ({ children }) => {
  return (
    <div className="smartphone-container">
      <div className="smartphone-frame">
        {/* Phone notch */}
        <div className="phone-notch"></div>

        {/* Phone screen */}
        <div className="phone-screen">
          {children}
        </div>

        {/* Home indicator */}
        <div className="home-indicator"></div>
      </div>
    </div>
  );
};

export default SmartphoneFrame;
