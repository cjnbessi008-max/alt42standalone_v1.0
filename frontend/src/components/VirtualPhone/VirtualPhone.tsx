import React, { ReactNode } from 'react';
import './VirtualPhone.css';

interface VirtualPhoneProps {
  children: ReactNode;
  scale?: number;
}

const VirtualPhone: React.FC<VirtualPhoneProps> = ({ children, scale = 0.5 }) => {
  return (
    <div className="virtual-phone-container" style={{ transform: `scale(${scale})` }}>
      <div className="virtual-phone">
        {/* Phone frame */}
        <div className="phone-frame">
          {/* Notch */}
          <div className="phone-notch"></div>

          {/* Screen */}
          <div className="phone-screen">
            {children}
          </div>

          {/* Home indicator (for modern phones) */}
          <div className="phone-home-indicator"></div>
        </div>
      </div>
    </div>
  );
};

export default VirtualPhone;
