import { ReactNode } from 'react';
import './PhoneSimulator.css';

interface PhoneSimulatorProps {
  children: ReactNode;
}

/**
 * 스마트폰 시뮬레이터 컴포넌트
 */
export function PhoneSimulator({ children }: PhoneSimulatorProps) {
  return (
    <div className="phone-simulator">
      <div className="phone-frame">
        <div className="phone-notch"></div>
        <div className="phone-screen">
          <div className="phone-status-bar">
            <span className="time">9:41</span>
            <div className="status-icons">
              <span className="signal">📶</span>
              <span className="wifi">📡</span>
              <span className="battery">🔋</span>
            </div>
          </div>
          <div className="phone-content">
            {children}
          </div>
        </div>
        <div className="phone-button"></div>
      </div>
    </div>
  );
}
