import { ReactNode } from 'react';
import './MobileFrame.css';

interface MobileFrameProps {
  children: ReactNode;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left' | 'center';
  scale?: number;
}

/**
 * 가상 스마트폰 프레임 컴포넌트
 * 우측 하단에 고정되어 앱 화면을 미리보기
 */
const MobileFrame: React.FC<MobileFrameProps> = ({
  children,
  position = 'bottom-right',
  scale = 0.5,
}) => {
  return (
    <div className={`mobile-frame-wrapper ${position}`}>
      <div className="mobile-frame" style={{ transform: `scale(${scale})` }}>
        {/* 스마트폰 외곽 프레임 */}
        <div className="mobile-frame-device">
          {/* 상단 노치 */}
          <div className="mobile-frame-notch">
            <div className="mobile-frame-camera"></div>
            <div className="mobile-frame-speaker"></div>
          </div>

          {/* 화면 영역 */}
          <div className="mobile-frame-screen">
            {children}
          </div>

          {/* 하단 홈 인디케이터 */}
          <div className="mobile-frame-home-indicator"></div>
        </div>

        {/* 전원 버튼 */}
        <div className="mobile-frame-power-button"></div>

        {/* 볼륨 버튼 */}
        <div className="mobile-frame-volume-button volume-up"></div>
        <div className="mobile-frame-volume-button volume-down"></div>
      </div>
    </div>
  );
};

export default MobileFrame;
