import React from 'react';
import { MagnitudeWave } from './MagnitudeWave';

interface MobilePreviewProps {
  magnitude: number;
}

export const MobilePreview: React.FC<MobilePreviewProps> = ({ magnitude }) => {
  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="relative">
        {/* Mobile Phone Frame */}
        <div className="bg-gray-800 rounded-[3rem] p-3 shadow-2xl border-8 border-gray-900">
          {/* Notch */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-gray-900 rounded-b-2xl z-10" />

          {/* Screen */}
          <div className="bg-white rounded-[2.5rem] overflow-hidden w-[280px] h-[560px] relative">
            {/* Status Bar */}
            <div className="bg-gray-100 px-6 py-2 flex justify-between items-center text-xs">
              <span className="font-medium">9:41</span>
              <div className="flex items-center gap-1">
                <div className="w-4 h-3 border border-gray-400 rounded-sm relative">
                  <div className="absolute inset-0.5 bg-gray-600 rounded-sm" />
                </div>
              </div>
            </div>

            {/* App Content */}
            <div className="p-4 flex flex-col items-center justify-center h-full bg-gradient-to-b from-blue-50 to-purple-50">
              <h2 className="text-lg font-bold text-gray-800 mb-4">
                Magnitude Wave
              </h2>
              <MagnitudeWave magnitude={magnitude} width={240} height={200} />

              {/* Display current value */}
              <div className="mt-6 bg-white rounded-lg p-4 shadow-md">
                <p className="text-sm text-gray-600 mb-1">현재 값</p>
                <p className="text-3xl font-bold text-indigo-600">
                  {magnitude.toFixed(1)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Label */}
        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white px-3 py-1 rounded-full text-xs whitespace-nowrap">
          모바일 미리보기
        </div>
      </div>
    </div>
  );
};
