import React from 'react';

interface MobileFrameProps {
  children: React.ReactNode;
  showFrame?: boolean;
}

const MobileFrame: React.FC<MobileFrameProps> = ({ children, showFrame = true }) => {
  if (!showFrame) {
    return <>{children}</>;
  }

  return (
    <div className="flex items-center justify-end min-h-screen p-8 bg-gradient-to-br from-slate-100 to-slate-200">
      {/* Mobile Device Frame */}
      <div className="relative">
        {/* Phone outer frame */}
        <div className="mobile-frame bg-slate-900 p-3" style={{ width: '375px', height: '667px' }}>
          {/* Phone notch */}
          <div className="flex justify-center mb-2">
            <div className="bg-slate-800 rounded-full" style={{ width: '120px', height: '20px' }}>
              <div className="flex items-center justify-center h-full gap-2">
                <div className="w-2 h-2 bg-slate-700 rounded-full"></div>
                <div className="w-12 h-1 bg-slate-700 rounded-full"></div>
              </div>
            </div>
          </div>

          {/* Screen */}
          <div className="bg-white rounded-2xl overflow-hidden h-full shadow-inner">
            <div className="h-full overflow-auto">
              {children}
            </div>
          </div>
        </div>

        {/* Side buttons */}
        <div className="absolute top-32 -left-1 w-1 h-12 bg-slate-800 rounded-l"></div>
        <div className="absolute top-48 -left-1 w-1 h-16 bg-slate-800 rounded-l"></div>
        <div className="absolute top-48 -right-1 w-1 h-20 bg-slate-800 rounded-r"></div>

        {/* Label */}
        <div className="absolute -bottom-8 left-0 right-0 text-center">
          <span className="text-sm text-slate-500 font-medium">가상 스마트폰 화면</span>
        </div>
      </div>
    </div>
  );
};

export default MobileFrame;
