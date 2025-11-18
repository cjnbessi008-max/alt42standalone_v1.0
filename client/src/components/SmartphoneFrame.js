import React from 'react';
import './SmartphoneFrame.css';

const SmartphoneFrame = ({ children }) => {
  return (
    <div className="smartphone-container">
      <div className="smartphone-frame">
        {/* Top notch */}
        <div className="notch">
          <div className="camera"></div>
          <div className="speaker"></div>
        </div>

        {/* Screen */}
        <div className="screen">
          {children}
        </div>

        {/* Home button */}
        <div className="home-button"></div>
      </div>

      {/* Side buttons */}
      <div className="side-buttons">
        <div className="volume-up"></div>
        <div className="volume-down"></div>
        <div className="power-button"></div>
      </div>
    </div>
  );
};

export default SmartphoneFrame;
