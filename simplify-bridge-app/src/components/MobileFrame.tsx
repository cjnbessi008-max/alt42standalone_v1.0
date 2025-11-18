/**
 * Mobile Frame Component
 * 우측 하단에 가상 스마트폰 화면을 표시하는 컴포넌트
 */

import React from 'react';

interface MobileFrameProps {
  children: React.ReactNode;
  position?: 'bottom-right' | 'bottom-left' | 'center';
  width?: string;
  height?: string;
}

export const MobileFrame: React.FC<MobileFrameProps> = ({
  children,
  position = 'bottom-right',
  width = '375px',
  height = '667px',
}) => {
  const positionClasses = {
    'bottom-right': 'fixed bottom-6 right-6',
    'bottom-left': 'fixed bottom-6 left-6',
    'center': 'mx-auto my-8',
  };

  return (
    <div className={`${positionClasses[position]} z-50`}>
      {/* 스마트폰 외곽 프레임 */}
      <div
        className="relative bg-gray-900 rounded-[3rem] shadow-2xl border-[14px] border-gray-800"
        style={{
          width,
          height,
        }}
      >
        {/* 상단 노치 영역 */}
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-1/3 h-7 bg-gray-900 rounded-b-3xl z-10">
          {/* 스피커 */}
          <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-16 h-1.5 bg-gray-800 rounded-full" />
          {/* 카메라 */}
          <div className="absolute top-2 right-6 w-2 h-2 bg-gray-700 rounded-full" />
        </div>

        {/* 화면 컨텐츠 영역 */}
        <div className="relative w-full h-full bg-white rounded-[2.5rem] overflow-hidden">
          {/* 상단 상태바 */}
          <div className="absolute top-0 left-0 right-0 h-12 bg-gradient-to-b from-gray-50 to-transparent z-10 flex items-center justify-between px-6 pt-2">
            <span className="text-xs font-semibold text-gray-700">9:41</span>
            <div className="flex items-center gap-1">
              {/* 신호 강도 */}
              <div className="flex gap-0.5">
                <div className="w-0.5 h-2 bg-gray-700 rounded-full" />
                <div className="w-0.5 h-3 bg-gray-700 rounded-full" />
                <div className="w-0.5 h-4 bg-gray-700 rounded-full" />
                <div className="w-0.5 h-5 bg-gray-700 rounded-full" />
              </div>
              {/* WiFi */}
              <svg className="w-4 h-4 text-gray-700" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2.166 10.88a.5.5 0 01-.014-.707 9 9 0 0112.696 0 .5.5 0 11-.707.707 8 8 0 00-11.268 0 .5.5 0 01-.707 0z" />
                <path d="M4.808 13.232a.5.5 0 01-.014-.707 5.5 5.5 0 017.412 0 .5.5 0 11-.707.707 4.5 4.5 0 00-6.005 0 .5.5 0 01-.686-.014z" />
                <path d="M9 16a1 1 0 100-2 1 1 0 000 2z" />
              </svg>
              {/* 배터리 */}
              <div className="w-6 h-3 border border-gray-700 rounded-sm relative">
                <div className="absolute right-[-2px] top-1/2 transform -translate-y-1/2 w-0.5 h-1.5 bg-gray-700 rounded-r" />
                <div className="absolute left-0.5 top-0.5 bottom-0.5 w-4 bg-gray-700 rounded-sm" />
              </div>
            </div>
          </div>

          {/* 메인 컨텐츠 */}
          <div className="h-full pt-12 pb-8 overflow-y-auto">
            {children}
          </div>
        </div>

        {/* 하단 홈 인디케이터 */}
        <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 w-32 h-1 bg-gray-700 rounded-full" />
      </div>
    </div>
  );
};

export default MobileFrame;
