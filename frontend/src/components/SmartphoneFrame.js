import React from 'react';
import './SmartphoneFrame.css';

function SmartphoneFrame({ children }) {
  return (
    <div className="smartphone-container">
      <div className="smartphone-frame">
        {/* Top bezel with notch */}
        <div className="bezel bezel-top">
          <div className="notch">
            <div className="speaker"></div>
            <div className="camera"></div>
          </div>
        </div>

        {/* Screen */}
        <div className="screen">
          <div className="screen-content">
            {children}
          </div>
        </div>

        {/* Bottom bezel with home indicator */}
        <div className="bezel bezel-bottom">
          <div className="home-indicator"></div>
        </div>

        {/* Side buttons */}
        <div className="button button-power"></div>
        <div className="button button-volume-up"></div>
        <div className="button button-volume-down"></div>
      </div>
    </div>
  );
}

export default SmartphoneFrame;
