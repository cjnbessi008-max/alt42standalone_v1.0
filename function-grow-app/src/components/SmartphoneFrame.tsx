import React from 'react';
import { motion } from 'framer-motion';

interface SmartphoneFrameProps {
  children: React.ReactNode;
}

const SmartphoneFrame: React.FC<SmartphoneFrameProps> = ({ children }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, x: 100, y: 100 }}
      animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="fixed bottom-8 right-8 z-50"
    >
      {/* Smartphone Frame */}
      <div className="relative bg-gray-900 rounded-[3rem] p-3 shadow-2xl border-8 border-gray-800">
        {/* Notch */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-7 bg-gray-900 rounded-b-3xl z-10">
          <div className="absolute top-2 left-1/2 -translate-x-1/2 w-16 h-1.5 bg-gray-700 rounded-full"></div>
        </div>

        {/* Screen */}
        <div className="relative w-[280px] h-[560px] bg-white rounded-[2.5rem] overflow-hidden shadow-inner">
          {/* Status Bar */}
          <div className="absolute top-0 left-0 right-0 h-12 bg-gradient-to-b from-gray-100 to-transparent z-10 flex items-center justify-between px-6 pt-2">
            <span className="text-xs font-semibold text-gray-800">9:41</span>
            <div className="flex gap-1 items-center">
              <svg className="w-4 h-4 text-gray-800" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
              </svg>
              <svg className="w-3 h-3 text-gray-800" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M17 10a1 1 0 01-1 1h-4a1 1 0 110-2h4a1 1 0 011 1zm-6 0a1 1 0 01-1 1H6a1 1 0 110-2h4a1 1 0 011 1zm-6 0a1 1 0 01-1 1H2a1 1 0 110-2h2a1 1 0 011 1z" clipRule="evenodd" />
              </svg>
            </div>
          </div>

          {/* Content Area */}
          <div className="w-full h-full pt-12">
            {children}
          </div>
        </div>

        {/* Home Indicator */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-28 h-1 bg-gray-700 rounded-full"></div>
      </div>
    </motion.div>
  );
};

export default SmartphoneFrame;
