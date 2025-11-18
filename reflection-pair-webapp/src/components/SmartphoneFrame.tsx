import { ReactNode } from 'react';
import { useReflectionPair } from '../hooks/useReflectionPair';
import { getBaseDisplay } from '../utils/math';

interface SmartphoneFrameProps {
  children: ReactNode;
}

export const SmartphoneFrame: React.FC<SmartphoneFrameProps> = ({ children }) => {
  const { config } = useReflectionPair();

  const baseDisplay = getBaseDisplay(config.baseNumber);
  const title = `y = ${baseDisplay}ˣ ⟷ y = log₍${baseDisplay}₎(x)`;

  return (
    <div className="fixed bottom-5 right-5 w-[225px] h-[400px] z-50 drop-shadow-2xl">
      {/* Phone frame */}
      <div className="relative w-full h-full bg-phone-frame rounded-[18px] p-[9px]">
        {/* Notch */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[84px] h-[12px] bg-phone-frame rounded-b-[9px] z-10" />

        {/* Screen */}
        <div className="relative w-full h-full bg-phone-screen rounded-[12px] overflow-hidden shadow-inner">
          {/* Header */}
          <div className="bg-gradient-to-br from-purple-600 to-purple-800 text-white text-center py-2 px-2 text-xs font-semibold mt-[12px]">
            {title}
          </div>

          {/* Content */}
          <div className="relative w-full h-[calc(100%-48px)] bg-white">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};
