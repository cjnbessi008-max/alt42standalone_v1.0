/**
 * 모바일 폰 프레임 컴포넌트
 * 우측 하단에 가상 스마트폰 화면 표시
 */

import React, { ReactNode } from 'react';
import '../styles/MobilePhoneFrame.css';

interface MobilePhoneFrameProps {
  children: ReactNode;
}

const MobilePhoneFrame: React.FC<MobilePhoneFrameProps> = ({ children }) => {
  return (
    <div className="phone-frame-wrapper">
      <div className="phone-frame">
        <div className="phone-notch"></div>
        <div className="phone-screen">
          {children}
        </div>
        <div className="phone-home-button"></div>
      </div>
    </div>
  );
};

export default MobilePhoneFrame;
