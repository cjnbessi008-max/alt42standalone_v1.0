import { ReactNode } from 'react';
import './MobileView.css';

interface MobileViewProps {
  children: ReactNode;
}

const MobileView = ({ children }: MobileViewProps) => {
  return (
    <div className="mobile-view-container">
      <div className="mobile-frame">
        <div className="mobile-header">
          <div className="mobile-notch"></div>
          <div className="mobile-time">9:41</div>
          <div className="mobile-status">
            <span className="signal">📶</span>
            <span className="wifi">📡</span>
            <span className="battery">🔋</span>
          </div>
        </div>

        <div className="mobile-screen">
          <div className="mobile-app-header">
            <button className="back-btn">←</button>
            <h3>Equation Fold</h3>
            <button className="menu-btn">⋮</button>
          </div>

          <div className="mobile-content">
            {children}
          </div>
        </div>

        <div className="mobile-footer">
          <div className="home-indicator"></div>
        </div>
      </div>

      <div className="mobile-label">
        📱 모바일 미리보기
      </div>
    </div>
  );
};

export default MobileView;
