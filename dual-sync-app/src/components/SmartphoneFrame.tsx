import React, { ReactNode } from 'react';

interface SmartphoneFrameProps {
  children: ReactNode;
}

const SmartphoneFrame: React.FC<SmartphoneFrameProps> = ({ children }) => {
  return (
    <div className="fixed bottom-8 right-8 z-50">
      {/* 스마트폰 프레임 */}
      <div className="relative bg-phone-frame rounded-[2.5rem] p-3 shadow-2xl">
        {/* 노치 */}
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-32 h-6 bg-phone-frame rounded-b-2xl z-10"></div>

        {/* 화면 */}
        <div className="relative bg-white rounded-[2rem] overflow-hidden" style={{ width: '360px', height: '640px' }}>
          {/* 상태바 영역 */}
          <div className="absolute top-0 left-0 right-0 h-10 bg-gradient-to-b from-gray-900/10 to-transparent z-10 pointer-events-none">
            <div className="flex justify-between items-center px-6 pt-2 text-xs text-gray-600">
              <span>9:41</span>
              <div className="flex gap-1">
                <span>📶</span>
                <span>📡</span>
                <span>🔋</span>
              </div>
            </div>
          </div>

          {/* 컨텐츠 영역 */}
          <div className="h-full pt-10 bg-gradient-to-br from-blue-50 to-purple-50">
            {children}
          </div>
        </div>

        {/* 홈 버튼 (제스처 바) */}
        <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 w-32 h-1.5 bg-gray-400 rounded-full"></div>
      </div>
    </div>
  );
};

export default SmartphoneFrame;
