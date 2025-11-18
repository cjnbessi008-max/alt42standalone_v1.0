import React, { useEffect, useState } from 'react';

interface ThermometerProps {
  value: number; // 0-100
  onChange?: (value: number) => void;
  showSlider?: boolean;
  animated?: boolean;
}

const Thermometer: React.FC<ThermometerProps> = ({
  value,
  onChange,
  showSlider = true,
  animated = true,
}) => {
  const [displayValue, setDisplayValue] = useState(value);

  useEffect(() => {
    if (animated) {
      const timer = setTimeout(() => setDisplayValue(value), 50);
      return () => clearTimeout(timer);
    } else {
      setDisplayValue(value);
    }
  }, [value, animated]);

  // 온도에 따른 색상 계산 (파란색 -> 주황색)
  const getColor = (val: number) => {
    const blue = Math.round(255 * (1 - val / 100));
    const red = Math.round(255 * (val / 100));
    return `rgb(${red}, ${blue / 2}, ${blue})`;
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      {/* 온도 표시 */}
      <div className="text-3xl font-bold text-gray-800">
        {Math.round(displayValue)}%
      </div>

      {/* 온도계 컨테이너 */}
      <div className="relative">
        {/* 온도계 본체 */}
        <div className="relative w-16 h-80 bg-gray-200 rounded-full shadow-inner overflow-hidden">
          {/* 눈금 */}
          <div className="absolute right-full mr-3 h-full flex flex-col justify-between text-xs text-gray-500">
            {[100, 75, 50, 25, 0].map((mark) => (
              <span key={mark} className="transform -translate-y-1/2">
                {mark}
              </span>
            ))}
          </div>

          {/* 온도 채움 */}
          <div
            className={`absolute bottom-0 left-0 w-full rounded-full ${
              animated ? 'transition-all duration-500 ease-in-out' : ''
            }`}
            style={{
              height: `${displayValue}%`,
              background: `linear-gradient(to top, ${getColor(displayValue)}, ${getColor(Math.min(displayValue + 20, 100))})`,
            }}
          />
        </div>

        {/* 온도계 구슬 */}
        <div
          className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 w-20 h-20 rounded-full shadow-lg"
          style={{
            backgroundColor: getColor(displayValue),
          }}
        >
          <div className="absolute inset-2 rounded-full bg-white/20"></div>
        </div>
      </div>

      {/* 슬라이더 */}
      {showSlider && onChange && (
        <div className="w-full max-w-xs px-4 mt-8">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            확신도를 선택하세요
          </label>
          <input
            type="range"
            min="0"
            max="100"
            value={value}
            onChange={(e) => onChange(Number(e.target.value))}
            className="w-full h-2 bg-gradient-to-r from-blue-500 to-orange-500 rounded-lg appearance-none cursor-pointer slider"
            style={{
              background: `linear-gradient(to right, #0066FF, #FF6600)`,
            }}
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>낮음 (0%)</span>
            <span>높음 (100%)</span>
          </div>
        </div>
      )}

      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: #667eea;
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
        }

        .slider::-moz-range-thumb {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: #667eea;
          cursor: pointer;
          border: none;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
        }
      `}</style>
    </div>
  );
};

export default Thermometer;
