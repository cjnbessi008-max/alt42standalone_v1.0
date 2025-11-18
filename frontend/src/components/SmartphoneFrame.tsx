import React, { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface SmartphoneFrameProps {
  children: ReactNode;
}

export const SmartphoneFrame: React.FC<SmartphoneFrameProps> = ({ children }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, y: 50 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed bottom-8 right-8 z-50"
    >
      {/* Smartphone outer frame */}
      <div className="relative bg-gray-900 rounded-[3rem] p-4 shadow-2xl border-8 border-gray-800">
        {/* Notch */}
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-32 h-6 bg-gray-900 rounded-b-2xl z-10"></div>

        {/* Screen */}
        <div className="relative bg-white rounded-[2.5rem] overflow-hidden w-[380px] h-[760px] shadow-inner">
          {/* Status bar */}
          <div className="absolute top-0 left-0 right-0 h-12 bg-gradient-to-b from-gray-100 to-transparent z-10 flex items-center justify-between px-6 pt-2">
            <span className="text-xs font-semibold text-gray-800">9:41</span>
            <div className="flex gap-1 items-center">
              <div className="w-4 h-3 border border-gray-800 rounded-sm">
                <div className="w-2 h-2 bg-gray-800 m-auto mt-0.5"></div>
              </div>
              <div className="text-xs text-gray-800">100%</div>
            </div>
          </div>

          {/* Content area */}
          <div className="h-full pt-12 pb-8 overflow-hidden">
            {children}
          </div>
        </div>

        {/* Home indicator */}
        <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 w-32 h-1.5 bg-gray-700 rounded-full"></div>
      </div>
    </motion.div>
  );
};
