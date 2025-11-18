import React from 'react';

interface PhoneSimulatorProps {
  children: React.ReactNode;
}

const PhoneSimulator: React.FC<PhoneSimulatorProps> = ({ children }) => {
  return (
    <div className="relative flex items-center justify-center p-8">
      {/* Phone Frame */}
      <div className="relative bg-gray-900 rounded-[3rem] p-3 shadow-2xl">
        {/* Notch */}
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-40 h-7 bg-gray-900 rounded-b-3xl z-10">
          <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-16 h-1.5 bg-gray-800 rounded-full" />
        </div>

        {/* Screen */}
        <div className="relative bg-white rounded-[2.5rem] overflow-hidden shadow-inner">
          {/* Status Bar */}
          <div className="absolute top-0 left-0 right-0 h-12 bg-gradient-to-b from-gray-50 to-transparent z-10 flex items-center justify-between px-8 pt-2">
            <div className="flex items-center gap-1">
              <div className="text-xs font-semibold">9:41</div>
            </div>
            <div className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
              </svg>
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M17.778 8.222c-4.296-4.296-11.26-4.296-15.556 0A1 1 0 01.808 6.808c5.076-5.077 13.308-5.077 18.384 0a1 1 0 01-1.414 1.414zM14.95 11.05a7 7 0 00-9.9 0 1 1 0 01-1.414-1.414 9 9 0 0112.728 0 1 1 0 01-1.414 1.414zM12.12 13.88a3 3 0 00-4.242 0 1 1 0 01-1.415-1.415 5 5 0 017.072 0 1 1 0 01-1.415 1.415zM9 16a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd" />
              </svg>
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3zM14 7a1 1 0 00-1 1v6.05A2.5 2.5 0 0115.95 16H17a1 1 0 001-1v-5a1 1 0 00-.293-.707l-2-2A1 1 0 0015 7h-1z" />
              </svg>
            </div>
          </div>

          {/* Content Area */}
          <div className="w-[400px] h-[700px] overflow-hidden">
            {children}
          </div>
        </div>

        {/* Home Indicator */}
        <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 w-32 h-1.5 bg-gray-700 rounded-full" />
      </div>

      {/* Side Buttons */}
      <div className="absolute left-0 top-32 w-1 h-8 bg-gray-800 rounded-r" />
      <div className="absolute left-0 top-44 w-1 h-12 bg-gray-800 rounded-r" />
      <div className="absolute left-0 top-60 w-1 h-12 bg-gray-800 rounded-r" />
      <div className="absolute right-0 top-40 w-1 h-16 bg-gray-800 rounded-l" />
    </div>
  );
};

export default PhoneSimulator;
