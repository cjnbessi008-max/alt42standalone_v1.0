import { ReactNode } from 'react';
import './MobileApp.css';

interface MobileAppProps {
  title?: string;
  children: ReactNode;
  statusBarColor?: string;
}

/**
 * 모바일 앱 화면 컴포넌트
 * 상태바와 콘텐츠 영역을 포함
 */
const MobileApp: React.FC<MobileAppProps> = ({
  title = 'KAIST Math',
  children,
  statusBarColor = '#1a1a2e',
}) => {
  const now = new Date();
  const timeString = now.toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="mobile-app">
      {/* 상태바 */}
      <div className="mobile-app-status-bar" style={{ background: statusBarColor }}>
        <div className="mobile-app-status-time">{timeString}</div>
        <div className="mobile-app-status-icons">
          <div className="mobile-app-status-signal">
            <div className="signal-bar"></div>
            <div className="signal-bar"></div>
            <div className="signal-bar"></div>
            <div className="signal-bar"></div>
          </div>
          <div className="mobile-app-status-wifi">📶</div>
          <div className="mobile-app-status-battery">
            <div className="battery-level"></div>
          </div>
        </div>
      </div>

      {/* 앱 헤더 */}
      {title && (
        <div className="mobile-app-header">
          <h1 className="mobile-app-title">{title}</h1>
        </div>
      )}

      {/* 콘텐츠 영역 */}
      <div className="mobile-app-content">
        {children}
      </div>
    </div>
  );
};

export default MobileApp;
