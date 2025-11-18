import React from 'react';

interface PhoneSimulatorProps {
  children: React.ReactNode;
}

/**
 * 스마트폰 UI 시뮬레이터 컴포넌트
 * 우측 하단에 고정되며 실제 스마트폰 화면처럼 표시
 */
export const PhoneSimulator: React.FC<PhoneSimulatorProps> = ({ children }) => {
  return (
    <div className="fixed bottom-8 right-8 z-50">
      {/* 스마트폰 외관 */}
      <div className="relative bg-gray-900 rounded-[3rem] p-4 shadow-phone border-8 border-gray-800">
        {/* 노치 */}
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-32 h-6 bg-gray-900 rounded-b-3xl z-10"></div>

        {/* 화면 */}
        <div className="relative bg-white rounded-[2.5rem] overflow-hidden w-[320px] h-[600px] shadow-inner">
          {/* 상태바 */}
          <div className="bg-gray-100 h-12 flex items-center justify-between px-4 text-xs text-gray-600">
            <span className="font-semibold">9:41</span>
            <div className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
              </svg>
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M17.778 8.222c-4.296-4.296-11.26-4.296-15.556 0A1 1 0 01.808 6.808c5.076-5.077 13.308-5.077 18.384 0a1 1 0 01-1.414 1.414zM14.95 11.05a7 7 0 00-9.9 0 1 1 0 01-1.414-1.414 9 9 0 0112.728 0 1 1 0 01-1.414 1.414zM12.12 13.88a3 3 0 00-4.242 0 1 1 0 01-1.415-1.415 5 5 0 017.072 0 1 1 0 01-1.415 1.415zM9 16a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd" />
              </svg>
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3zM14 7a1 1 0 00-1 1v6.05A2.5 2.5 0 0115.95 16H17a1 1 0 001-1v-5a1 1 0 00-.293-.707l-2-2A1 1 0 0015 7h-1z" />
              </svg>
            </div>
          </div>

          {/* 앱 콘텐츠 영역 */}
          <div className="h-[calc(100%-3rem)] overflow-auto">
            {children}
          </div>
        </div>

        {/* 홈 버튼 인디케이터 */}
        <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 w-24 h-1 bg-gray-700 rounded-full"></div>
      </div>
    </div>
  );
};
