import React from 'react';
import './SmartphoneFrame.css';

const SmartphoneFrame = ({ children }) => {
  return (
    <div className="smartphone-container">
      <div className="smartphone-frame">
        <div className="smartphone-notch" />
        <div className="smartphone-screen">
          {children}
        </div>
        <div className="smartphone-home-indicator" />
      </div>
    </div>
  );
};

export default SmartphoneFrame;
