import React from 'react';
import './SmartphoneFrame.css';

interface SmartphoneFrameProps {
  children: React.ReactNode;
}

const SmartphoneFrame: React.FC<SmartphoneFrameProps> = ({ children }) => {
  return (
    <div className="smartphone-container">
      <div className="smartphone-frame">
        <div className="smartphone-notch"></div>
        <div className="smartphone-screen">
          {children}
        </div>
        <div className="smartphone-home-button"></div>
      </div>
    </div>
  );
};

export default SmartphoneFrame;
