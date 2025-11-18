import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import './SmartphoneSimulator.css';

interface SmartphoneSimulatorProps {
  children: ReactNode;
  position?: 'bottom-right' | 'bottom-left' | 'center';
}

/**
 * 가상 스마트폰 화면 시뮬레이터
 * 우측 하단에 스마트폰 형태의 UI를 표시
 */
export default function SmartphoneSimulator({
  children,
  position = 'bottom-right',
}: SmartphoneSimulatorProps) {
  const positionClasses: Record<string, string> = {
    'bottom-right': 'smartphone-bottom-right',
    'bottom-left': 'smartphone-bottom-left',
    'center': 'smartphone-center',
  };

  return (
    <motion.div
      className={`smartphone-container ${positionClasses[position]}`}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* 스마트폰 외곽 프레임 */}
      <div className="smartphone-frame">
        {/* 상단 노치 */}
        <div className="smartphone-notch">
          <div className="notch-camera"></div>
          <div className="notch-speaker"></div>
        </div>

        {/* 화면 영역 */}
        <div className="smartphone-screen">
          {/* 상태바 */}
          <div className="status-bar">
            <div className="status-bar-left">
              <span className="time">
                {new Date().toLocaleTimeString('ko-KR', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
            <div className="status-bar-right">
              <span className="signal">📶</span>
              <span className="battery">🔋</span>
            </div>
          </div>

          {/* 앱 컨텐츠 영역 */}
          <div className="app-content">{children}</div>
        </div>

        {/* 하단 홈 인디케이터 */}
        <div className="home-indicator"></div>
      </div>
    </motion.div>
  );
}
