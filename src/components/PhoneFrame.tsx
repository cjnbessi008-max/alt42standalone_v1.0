import React from 'react';
import { motion } from 'framer-motion';

interface PhoneFrameProps {
  children: React.ReactNode;
}

/**
 * 스마트폰 프레임 컴포넌트
 * 우측 하단에 표시되는 가상 스마트폰 화면
 */
export const PhoneFrame: React.FC<PhoneFrameProps> = ({ children }) => {
  return (
    <motion.div
      className="fixed bottom-8 right-8 z-50"
      initial={{ opacity: 0, scale: 0.8, y: 100 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      {/* Phone outer frame */}
      <div className="relative bg-phone-frame rounded-[3rem] p-3 shadow-2xl">
        {/* Phone notch */}
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-32 h-7 bg-phone-frame rounded-b-3xl z-10">
          <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-16 h-1 bg-gray-800 rounded-full"></div>
        </div>

        {/* Phone screen */}
        <div className="relative bg-screen-bg rounded-[2.5rem] overflow-hidden w-[360px] h-[720px] shadow-inner">
          {/* Status bar */}
          <div className="absolute top-0 left-0 right-0 h-12 bg-gradient-to-b from-gray-50 to-transparent z-10 flex items-center justify-between px-6 pt-2">
            <span className="text-xs font-semibold text-gray-700">9:41</span>
            <div className="flex items-center gap-1">
              <svg className="w-4 h-4 text-gray-700" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
              </svg>
              <svg className="w-4 h-4 text-gray-700" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M17.778 8.222c-4.296-4.296-11.26-4.296-15.556 0A1 1 0 01.808 6.808c5.076-5.077 13.308-5.077 18.384 0a1 1 0 01-1.414 1.414zM14.95 11.05a7 7 0 00-9.9 0 1 1 0 01-1.414-1.414 9 9 0 0112.728 0 1 1 0 01-1.414 1.414zM12.12 13.88a3 3 0 00-4.242 0 1 1 0 01-1.415-1.415 5 5 0 017.072 0 1 1 0 01-1.415 1.415zM9 16a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd" />
              </svg>
              <svg className="w-3 h-3 text-gray-700" fill="currentColor" viewBox="0 0 20 20">
                <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3zM14 7a1 1 0 00-1 1v6.05A2.5 2.5 0 0115.95 16H17a1 1 0 001-1v-5a1 1 0 00-.293-.707l-2-2A1 1 0 0015 7h-1z" />
              </svg>
            </div>
          </div>

          {/* App content */}
          <div className="h-full pt-12 pb-8 overflow-y-auto">
            {children}
          </div>

          {/* Home indicator (iOS style) */}
          <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 w-32 h-1 bg-gray-400 rounded-full"></div>
        </div>

        {/* Side buttons */}
        <div className="absolute right-[-4px] top-24 w-1 h-12 bg-phone-frame rounded-r"></div>
        <div className="absolute right-[-4px] top-40 w-1 h-16 bg-phone-frame rounded-r"></div>
        <div className="absolute right-[-4px] top-60 w-1 h-16 bg-phone-frame rounded-r"></div>
        <div className="absolute left-[-4px] top-32 w-1 h-8 bg-phone-frame rounded-l"></div>
      </div>
    </motion.div>
  );
};
