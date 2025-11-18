/**
 * SmartphoneFrame Component
 * 스마트폰 프레임 UI
 */

import React from 'react';

interface SmartphoneFrameProps {
  children: React.ReactNode;
}

export const SmartphoneFrame: React.FC<SmartphoneFrameProps> = ({ children }) => {
  return (
    <div className="fixed bottom-8 right-8 z-50">
      {/* 스마트폰 외곽 */}
      <div className="relative bg-gray-900 rounded-[3rem] p-3 shadow-2xl border-8 border-gray-800">
        {/* 노치 */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-7 bg-gray-900 rounded-b-3xl z-10"></div>

        {/* 스크린 */}
        <div className="relative w-[360px] h-[640px] bg-white rounded-[2.5rem] overflow-hidden">
          {/* 상태바 */}
          <div className="absolute top-0 left-0 right-0 h-10 bg-gradient-to-b from-gray-100 to-transparent z-10 flex items-center justify-between px-6 text-xs">
            <span className="font-semibold">9:41</span>
            <div className="flex gap-1 items-center">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
              </svg>
              <span className="font-bold">100%</span>
            </div>
          </div>

          {/* 컨텐츠 영역 */}
          <div className="h-full pt-10 pb-6 overflow-auto bg-gradient-to-br from-indigo-50 to-purple-50">
            {children}
          </div>
        </div>

        {/* 홈 버튼 인디케이터 */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-1.5 bg-gray-700 rounded-full"></div>
      </div>
    </div>
  );
};
