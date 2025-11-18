import React from 'react';
import { motion } from 'framer-motion';

interface SmartphoneFrameProps {
  children: React.ReactNode;
}

/**
 * 스마트폰 프레임 컴포넌트
 * 우측 하단에 표시되는 가상 스마트폰 화면
 */
export const SmartphoneFrame: React.FC<SmartphoneFrameProps> = ({ children }) => {
  return (
    <motion.div
      initial={{ x: 100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="fixed bottom-8 right-8 z-50"
    >
      {/* 스마트폰 외관 */}
      <div className="relative">
        {/* 스마트폰 프레임 */}
        <div className="relative bg-gray-900 rounded-[3rem] p-3 shadow-2xl">
          {/* 노치 (상단 카메라 부분) */}
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-40 h-7 bg-gray-900 rounded-b-3xl z-10"></div>

          {/* 화면 영역 */}
          <div className="relative bg-white rounded-[2.5rem] overflow-hidden"
               style={{ width: '360px', height: '640px' }}>
            {/* 상태바 */}
            <div className="absolute top-0 left-0 right-0 h-10 bg-gradient-to-b from-gray-100 to-transparent z-10 flex items-center justify-between px-8 pt-2">
              <span className="text-xs font-semibold">9:41</span>
              <div className="flex gap-1">
                <div className="w-4 h-3 bg-gray-800 rounded-sm"></div>
                <div className="w-4 h-3 bg-gray-800 rounded-sm"></div>
                <div className="w-4 h-3 bg-gray-800 rounded-sm"></div>
              </div>
            </div>

            {/* 컨텐츠 영역 */}
            <div className="h-full overflow-y-auto pt-10">
              {children}
            </div>

            {/* 홈 인디케이터 */}
            <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 w-32 h-1 bg-gray-900 rounded-full"></div>
          </div>
        </div>

        {/* 전원 버튼 */}
        <div className="absolute right-0 top-24 w-1 h-16 bg-gray-800 rounded-l-lg"></div>

        {/* 볼륨 버튼 */}
        <div className="absolute left-0 top-20 w-1 h-12 bg-gray-800 rounded-r-lg"></div>
        <div className="absolute left-0 top-36 w-1 h-12 bg-gray-800 rounded-r-lg"></div>
      </div>
    </motion.div>
  );
};
