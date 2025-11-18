/**
 * Virtual smartphone frame component
 * Displays content in a smartphone-like container
 */
import React from 'react';
import { motion } from 'framer-motion';

interface SmartphoneFrameProps {
  children: React.ReactNode;
  position?: 'bottom-right' | 'center' | 'bottom-left';
}

export const SmartphoneFrame: React.FC<SmartphoneFrameProps> = ({
  children,
  position = 'bottom-right',
}) => {
  const positionClasses = {
    'bottom-right': 'fixed bottom-8 right-8',
    'center': 'mx-auto my-8',
    'bottom-left': 'fixed bottom-8 left-8',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`${positionClasses[position]} z-50`}
    >
      {/* Smartphone Frame */}
      <div className="relative w-[375px] h-[667px] bg-gray-900 rounded-[3rem] p-4 shadow-2xl border-8 border-gray-800">
        {/* Notch */}
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-40 h-7 bg-gray-900 rounded-b-3xl z-10">
          <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-16 h-1 bg-gray-700 rounded-full"></div>
        </div>

        {/* Screen */}
        <div className="w-full h-full bg-white rounded-[2.5rem] overflow-hidden shadow-inner">
          {/* Status Bar */}
          <div className="bg-gradient-to-r from-primary to-secondary text-white px-6 py-3 flex justify-between items-center text-xs">
            <span className="font-semibold">9:41</span>
            <span className="font-semibold">Pattern Match</span>
            <div className="flex gap-1">
              <div className="w-4 h-3 border border-white rounded-sm"></div>
              <div className="w-2 h-3 bg-white rounded-sm"></div>
            </div>
          </div>

          {/* Content Area */}
          <div className="h-[calc(100%-48px)] overflow-y-auto bg-gradient-to-b from-blue-50 to-purple-50">
            {children}
          </div>
        </div>

        {/* Home Indicator */}
        <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 w-32 h-1 bg-gray-700 rounded-full"></div>
      </div>
    </motion.div>
  );
};
