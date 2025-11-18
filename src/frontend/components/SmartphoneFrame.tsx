import React from 'react';

export interface SmartphoneFrameProps {
  children: React.ReactNode;
  position?: 'bottom-right' | 'bottom-left' | 'center';
  width?: number;
  height?: number;
}

/**
 * 가상 스마트폰 화면 프레임 컴포넌트
 * 데스크톱에서 우측 하단에 스마트폰 시뮬레이터를 표시합니다
 */
export const SmartphoneFrame: React.FC<SmartphoneFrameProps> = ({
  children,
  position = 'bottom-right',
  width = 375,
  height = 667,
}) => {
  const getPositionStyles = (): React.CSSProperties => {
    switch (position) {
      case 'bottom-right':
        return { bottom: '20px', right: '20px' };
      case 'bottom-left':
        return { bottom: '20px', left: '20px' };
      case 'center':
        return {
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
        };
      default:
        return { bottom: '20px', right: '20px' };
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        ...getPositionStyles(),
        width: `${width}px`,
        height: `${height}px`,
        background: '#000',
        borderRadius: '40px',
        padding: '15px',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.4)',
        zIndex: 1000,
      }}
    >
      {/* 노치 (상단 센서 영역) */}
      <div
        style={{
          position: 'absolute',
          top: '0',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '150px',
          height: '25px',
          background: '#000',
          borderRadius: '0 0 20px 20px',
          zIndex: 1001,
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: '8px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '60px',
            height: '6px',
            background: '#333',
            borderRadius: '3px',
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: '8px',
            left: '15px',
            width: '8px',
            height: '8px',
            background: '#1a1a2e',
            borderRadius: '50%',
          }}
        />
      </div>

      {/* 스크린 */}
      <div
        style={{
          width: '100%',
          height: '100%',
          background: '#fff',
          borderRadius: '28px',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        <div
          style={{
            width: '100%',
            height: '100%',
            overflow: 'auto',
            padding: '10px',
          }}
        >
          {children}
        </div>
      </div>

      {/* 홈 버튼 영역 (하단) */}
      <div
        style={{
          position: 'absolute',
          bottom: '5px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '120px',
          height: '4px',
          background: '#333',
          borderRadius: '2px',
        }}
      />
    </div>
  );
};
