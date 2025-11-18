import React from 'react';
import '../styles/SmartphoneFrame.css';

interface SmartphoneFrameProps {
  children: React.ReactNode;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left' | 'center';
}

export const SmartphoneFrame: React.FC<SmartphoneFrameProps> = ({
  children,
  position = 'bottom-right',
}) => {
  return (
    <div className={`smartphone-container ${position}`}>
      <div className="smartphone-frame">
        {/* Phone notch */}
        <div className="smartphone-notch">
          <div className="speaker"></div>
          <div className="camera"></div>
        </div>

        {/* Screen content */}
        <div className="smartphone-screen">{children}</div>

        {/* Home button indicator */}
        <div className="smartphone-home-indicator"></div>
      </div>
    </div>
  );
};
