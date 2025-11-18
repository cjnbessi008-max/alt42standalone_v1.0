import React, { ReactNode } from 'react';
import './VirtualPhone.css';

interface VirtualPhoneProps {
  children: ReactNode;
  showNotch?: boolean;
  showHomeButton?: boolean;
}

const VirtualPhone: React.FC<VirtualPhoneProps> = ({
  children,
  showNotch = true,
  showHomeButton = false,
}) => {
  return (
    <div className="virtual-phone-container">
      <div className="virtual-phone">
        {/* Phone Frame */}
        <div className="phone-frame">
          {/* Notch */}
          {showNotch && (
            <div className="phone-notch">
              <div className="notch-camera"></div>
              <div className="notch-speaker"></div>
            </div>
          )}

          {/* Screen */}
          <div className="phone-screen">
            <div className="phone-screen-content">{children}</div>
          </div>

          {/* Home Button */}
          {showHomeButton && <div className="phone-home-button"></div>}

          {/* Side Buttons */}
          <div className="phone-button phone-button-power"></div>
          <div className="phone-button phone-button-volume-up"></div>
          <div className="phone-button phone-button-volume-down"></div>
        </div>

        {/* Reflection Effect */}
        <div className="phone-reflection"></div>
      </div>
    </div>
  );
};

export default VirtualPhone;
