import type { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface PhoneSimulatorProps {
  children: ReactNode;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
}

export const PhoneSimulator = ({
  children,
  position = 'bottom-right'
}: PhoneSimulatorProps) => {
  const positionClasses = {
    'bottom-right': 'bottom-8 right-8',
    'bottom-left': 'bottom-8 left-8',
    'top-right': 'top-8 right-8',
    'top-left': 'top-8 left-8',
  };

  return (
    <motion.div
      className={`fixed ${positionClasses[position]} z-50`}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{
        type: 'spring',
        stiffness: 260,
        damping: 20,
        delay: 0.2
      }}
    >
      {/* 스마트폰 프레임 */}
      <div className="relative">
        {/* 폰 외곽 */}
        <div className="w-[300px] h-[600px] bg-gray-900 rounded-[40px] p-3 shadow-2xl">
          {/* 노치 */}
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-40 h-6 bg-gray-900 rounded-b-3xl z-10"></div>

          {/* 스크린 */}
          <div className="w-full h-full bg-white rounded-[32px] overflow-hidden relative">
            {/* 상태바 */}
            <div className="absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-gray-50 to-transparent z-10 flex items-center justify-between px-6 text-xs">
              <span className="font-semibold">9:41</span>
              <div className="flex gap-1 items-center">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                </svg>
                <span>100%</span>
              </div>
            </div>

            {/* 앱 컨텐츠 */}
            <div className="pt-8 h-full overflow-y-auto">
              {children}
            </div>
          </div>
        </div>

        {/* 홈 버튼 표시기 */}
        <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 w-32 h-1 bg-gray-700 rounded-full"></div>
      </div>
    </motion.div>
  );
};
