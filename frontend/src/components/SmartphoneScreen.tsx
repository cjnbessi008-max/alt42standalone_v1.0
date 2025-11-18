/**
 * Smartphone Screen Component
 * Displays a virtual smartphone frame in the bottom-right corner
 */

import React from 'react';
import { motion } from 'framer-motion';
import type { SmartphoneScreenProps } from '@types/index';

const SmartphoneScreen: React.FC<SmartphoneScreenProps> = ({
  children,
  width = 375,
  height = 667,
}) => {
  const scale = 0.6; // Scale factor for the smartphone
  const scaledWidth = width * scale;
  const scaledHeight = height * scale;

  return (
    <div
      className="fixed bottom-4 right-4 z-50"
      style={{
        width: scaledWidth + 40,
        height: scaledHeight + 80,
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: 50 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="relative w-full h-full"
      >
        {/* Smartphone Frame */}
        <div className="absolute inset-0 bg-gray-900 rounded-[2.5rem] shadow-2xl p-4">
          {/* Notch */}
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-32 h-6 bg-gray-900 rounded-b-3xl z-10">
            <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-12 h-1 bg-gray-800 rounded-full" />
          </div>

          {/* Screen */}
          <div
            className="relative bg-white rounded-[2rem] overflow-hidden shadow-inner h-full"
            style={{
              width: scaledWidth,
              height: scaledHeight,
            }}
          >
            {/* Status Bar */}
            <div className="absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-gray-100 to-transparent z-10 flex items-center justify-between px-4 text-xs">
              <span className="text-gray-600">9:41</span>
              <div className="flex items-center gap-1">
                <div className="w-4 h-3 border border-gray-600 rounded-sm relative">
                  <div className="absolute inset-0.5 bg-gray-600 rounded-sm" />
                </div>
              </div>
            </div>

            {/* Content Area */}
            <div className="absolute inset-0 pt-8 overflow-y-auto">
              {children}
            </div>
          </div>

          {/* Home Indicator */}
          <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 w-32 h-1 bg-gray-700 rounded-full" />
        </div>

        {/* Glow Effect */}
        <div className="absolute inset-0 rounded-[2.5rem] bg-gradient-to-tr from-blue-500/20 to-purple-500/20 blur-xl -z-10" />
      </motion.div>
    </div>
  );
};

export default SmartphoneScreen;
