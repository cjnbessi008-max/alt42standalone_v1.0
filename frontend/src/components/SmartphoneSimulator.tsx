import { useState } from 'react';
import { Maximize2, Minimize2, Smartphone } from 'lucide-react';

interface SmartphoneSimulatorProps {
  children: React.ReactNode;
}

export const SmartphoneSimulator = ({ children }: SmartphoneSimulatorProps) => {
  const [isMinimized, setIsMinimized] = useState(false);

  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setIsMinimized(false)}
          className="bg-blue-500 text-white p-4 rounded-full shadow-2xl hover:bg-blue-600 transition-all hover:scale-110"
          title="스마트폰 화면 펼치기"
        >
          <Smartphone size={32} />
        </button>
      </div>
    );
  }

  return (
    <div className="smartphone-frame z-40">
      {/* 상단 버튼들 */}
      <div className="absolute top-1 left-1/2 transform -translate-x-1/2 z-50">
        <button
          onClick={() => setIsMinimized(true)}
          className="bg-gray-700 text-white px-3 py-1 rounded-full text-xs hover:bg-gray-600 transition-colors flex items-center gap-1"
          title="최소화"
        >
          <Minimize2 size={12} />
          최소화
        </button>
      </div>

      {/* 노치 (아이폰 스타일) */}
      <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-32 h-6 bg-black rounded-b-2xl z-50" />

      {/* 스크린 */}
      <div className="smartphone-screen relative">
        {/* 상태바 */}
        <div className="absolute top-0 left-0 right-0 h-10 bg-gradient-to-b from-gray-100 to-transparent z-10 flex items-center justify-between px-4 text-xs">
          <span>9:41</span>
          <span>📶 ⚡ 100%</span>
        </div>

        {/* 콘텐츠 */}
        <div className="h-full overflow-auto pt-10 pb-4">
          {children}
        </div>

        {/* 홈 인디케이터 */}
        <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 w-32 h-1 bg-gray-400 rounded-full" />
      </div>
    </div>
  );
};
