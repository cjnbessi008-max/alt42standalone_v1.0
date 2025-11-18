import React from 'react';
import { motion } from 'framer-motion';
import { Battery, Signal, Wifi } from 'lucide-react';

interface SmartphoneFrameProps {
  children: React.ReactNode;
  position?: 'bottom-right' | 'center' | 'bottom-left';
  showStatusBar?: boolean;
}

/**
 * Smartphone frame component for displaying the app
 * 앱을 표시하기 위한 스마트폰 프레임 컴포넌트
 */
export const SmartphoneFrame: React.FC<SmartphoneFrameProps> = ({
  children,
  position = 'bottom-right',
  showStatusBar = true,
}) => {
  const positionClasses = {
    'bottom-right': 'fixed bottom-8 right-8',
    'center': 'mx-auto',
    'bottom-left': 'fixed bottom-8 left-8',
  };

  const getCurrentTime = () => {
    const now = new Date();
    return now.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  };

  return (
    <motion.div
      className={`${positionClasses[position]} z-50`}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.5, type: 'spring' }}
    >
      {/* Smartphone outer frame */}
      <div className="relative bg-gray-900 rounded-[3rem] p-3 shadow-2xl">
        {/* Phone notch */}
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-40 h-7 bg-gray-900 rounded-b-3xl z-10" />

        {/* Screen container */}
        <div className="relative bg-white rounded-[2.5rem] overflow-hidden w-[375px] h-[667px] shadow-inner">
          {/* Status bar */}
          {showStatusBar && (
            <div className="absolute top-0 left-0 right-0 h-12 bg-gradient-to-b from-gray-50 to-transparent z-20 px-6 flex items-center justify-between text-xs">
              <div className="flex items-center gap-1">
                <Signal className="w-3 h-3" />
                <Wifi className="w-3 h-3" />
              </div>
              <div className="font-medium">{getCurrentTime()}</div>
              <div className="flex items-center gap-1">
                <span className="text-xs">100%</span>
                <Battery className="w-4 h-4" />
              </div>
            </div>
          )}

          {/* App content */}
          <div className="h-full overflow-y-auto pt-12 pb-6">
            {children}
          </div>

          {/* Home indicator (iPhone style) */}
          <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2">
            <div className="w-32 h-1 bg-gray-300 rounded-full" />
          </div>
        </div>

        {/* Side buttons */}
        <div className="absolute left-0 top-24 w-1 h-8 bg-gray-800 rounded-l-lg -ml-1" />
        <div className="absolute left-0 top-36 w-1 h-12 bg-gray-800 rounded-l-lg -ml-1" />
        <div className="absolute right-0 top-32 w-1 h-16 bg-gray-800 rounded-r-lg -mr-1" />
      </div>
    </motion.div>
  );
};
