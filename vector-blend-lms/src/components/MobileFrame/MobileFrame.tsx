/**
 * Vector Blend LMS - Mobile Frame Component
 * Displays content in a mobile phone frame (for desktop preview)
 */

import React from 'react';
import './MobileFrame.css';

interface MobileFrameProps {
  children: React.ReactNode;
  position?: 'bottom-right' | 'center' | 'bottom-left';
  showFrame?: boolean;
}

const MobileFrame: React.FC<MobileFrameProps> = ({
  children,
  position = 'bottom-right',
  showFrame = true,
}) => {
  if (!showFrame) {
    return <div className="mobile-content-full">{children}</div>;
  }

  return (
    <div className={`mobile-frame-container ${position}`}>
      <div className="mobile-frame">
        {/* Phone frame decorations */}
        <div className="phone-notch"></div>
        <div className="phone-speaker"></div>

        {/* Screen content */}
        <div className="phone-screen">
          {children}
        </div>

        {/* Home button/indicator */}
        <div className="phone-home-indicator"></div>
      </div>
    </div>
  );
};

export default MobileFrame;
