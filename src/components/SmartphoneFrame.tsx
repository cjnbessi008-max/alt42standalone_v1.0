import React, { ReactNode } from 'react';

interface SmartphoneFrameProps {
  children: ReactNode;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left' | 'center';
}

const SmartphoneFrame: React.FC<SmartphoneFrameProps> = ({
  children,
  position = 'bottom-right',
}) => {
  const positionClasses = {
    'bottom-right': 'fixed bottom-8 right-8',
    'bottom-left': 'fixed bottom-8 left-8',
    'top-right': 'fixed top-8 right-8',
    'top-left': 'fixed top-8 left-8',
    center: 'mx-auto my-8',
  };

  return (
    <div className={`${positionClasses[position]} z-50 smooth-transition`}>
      {/* Smartphone Frame */}
      <div className="smartphone-frame">
        {/* Power Button */}
        <div className="smartphone-button" style={{ top: '100px' }}></div>
        {/* Volume Buttons */}
        <div className="smartphone-button" style={{ top: '180px' }}></div>
        <div className="smartphone-button" style={{ top: '240px' }}></div>

        {/* Screen */}
        <div className="smartphone-screen">
          {/* Notch (iPhone style) */}
          <div className="smartphone-notch">
            <div className="absolute top-2 left-1/2 transform -translate-x-1/2 flex items-center gap-2">
              {/* Speaker */}
              <div className="w-12 h-1 bg-gray-900 rounded-full"></div>
              {/* Camera */}
              <div className="w-2 h-2 bg-gray-900 rounded-full"></div>
            </div>
          </div>

          {/* Status Bar */}
          <div className="absolute top-0 left-0 right-0 h-8 bg-white z-20 flex items-center justify-between px-6 pt-1 text-xs">
            <div className="flex items-center gap-1 mt-1">
              <span className="font-semibold">9:41</span>
            </div>
            <div className="flex items-center gap-1 mt-1">
              <span>📶</span>
              <span>📡</span>
              <span>🔋</span>
            </div>
          </div>

          {/* Content Area */}
          <div className="pt-8 h-full overflow-y-auto overflow-x-hidden">
            {children}
          </div>

          {/* Home Indicator (iPhone style) */}
          <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 w-32 h-1 bg-gray-800 rounded-full"></div>
        </div>
      </div>

      {/* Device Label */}
      <div className="text-center mt-3">
        <span className="inline-block px-4 py-1 bg-white shadow-md rounded-full text-xs font-semibold text-gray-700">
          📱 Student View
        </span>
      </div>
    </div>
  );
};

export default SmartphoneFrame;
