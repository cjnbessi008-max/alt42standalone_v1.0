import React, { type ReactNode } from 'react';
import './VirtualSmartphone.css';

interface VirtualSmartphoneProps {
  children: ReactNode;
}

/**
 * Virtual Smartphone Frame Component
 * Displays content in a smartphone-like frame positioned at bottom-right
 */
const VirtualSmartphone: React.FC<VirtualSmartphoneProps> = ({ children }) => {
  return (
    <div className="smartphone-container">
      <div className="smartphone-frame">
        {/* Smartphone notch */}
        <div className="smartphone-notch">
          <div className="speaker"></div>
          <div className="camera"></div>
        </div>

        {/* Smartphone screen */}
        <div className="smartphone-screen">
          {children}
        </div>

        {/* Home button */}
        <div className="smartphone-home-button"></div>
      </div>
    </div>
  );
};

export default VirtualSmartphone;
