import React, { ReactNode } from 'react';

interface SmartphoneFrameProps {
  children: ReactNode;
}

const SmartphoneFrame: React.FC<SmartphoneFrameProps> = ({ children }) => {
  return (
    <div className="fixed bottom-5 right-5 z-50">
      {/* 스마트폰 외부 프레임 */}
      <div className="relative w-[360px] h-[640px] bg-gray-900 rounded-[36px] p-3 shadow-2xl">
        {/* 상단 노치/카메라 */}
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-32 h-6 bg-gray-900 rounded-b-2xl z-10"></div>

        {/* 화면 */}
        <div className="relative w-full h-full bg-white rounded-[28px] overflow-hidden">
          {children}
        </div>

        {/* 하단 인디케이터 */}
        <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-32 h-1 bg-gray-700 rounded-full"></div>
      </div>
    </div>
  );
};

export default SmartphoneFrame;
