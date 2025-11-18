import React from 'react';
import './VirtualPhone.css';

const VirtualPhone = ({ children, position = 'bottom-right' }) => {
  return (
    <div className={`virtual-phone-wrapper ${position}`}>
      <div className="virtual-phone">
        <div className="phone-frame">
          <div className="phone-notch"></div>
          <div className="phone-speaker"></div>
          <div className="phone-screen">
            {children}
          </div>
          <div className="phone-home-button"></div>
        </div>
        <div className="phone-shadow"></div>
      </div>
    </div>
  );
};

export default VirtualPhone;
