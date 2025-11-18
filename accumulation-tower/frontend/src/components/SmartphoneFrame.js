import React, { useState } from 'react';
import '../styles/SmartphoneFrame.css';

/**
 * SmartphoneFrame 컴포넌트
 * 우측 하단에 스마트폰 모양의 프레임을 표시
 *
 * @param {object} props
 * @param {React.ReactNode} props.children - 화면에 표시할 내용
 */
const SmartphoneFrame = ({ children }) => {
  const [isMinimized, setIsMinimized] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  /**
   * 최소화/최대화 토글
   */
  const toggleMinimize = (e) => {
    e.stopPropagation();
    setIsMinimized(!isMinimized);
  };

  /**
   * 드래그 시작
   */
  const handleMouseDown = (e) => {
    if (isMinimized) {
      // 최소화 상태에서 클릭하면 최대화
      setIsMinimized(false);
      return;
    }

    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  };

  /**
   * 드래그 중
   */
  const handleMouseMove = (e) => {
    if (!isDragging) return;

    const newX = e.clientX - dragStart.x;
    const newY = e.clientY - dragStart.y;

    // 화면 경계 체크
    const maxX = window.innerWidth - 340;
    const maxY = window.innerHeight - 660;

    setPosition({
      x: Math.max(-maxX, Math.min(0, newX)),
      y: Math.max(-maxY, Math.min(0, newY))
    });
  };

  /**
   * 드래그 종료
   */
  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // 드래그 이벤트 리스너
  React.useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging]);

  return (
    <div
      className="smartphone-container"
      style={{
        transform: `translate(${position.x}px, ${position.y}px)`,
        cursor: isDragging ? 'grabbing' : 'grab'
      }}
    >
      <div className={`smartphone-frame ${isMinimized ? 'minimized' : ''}`}>
        {/* 드래그 핸들 */}
        <div
          className="smartphone-drag-handle"
          onMouseDown={handleMouseDown}
        />

        {/* 컨트롤 버튼 */}
        <div className="smartphone-controls">
          <button
            className="smartphone-control-btn"
            onClick={toggleMinimize}
            title={isMinimized ? "펼치기" : "최소화"}
          >
            {isMinimized ? '□' : '−'}
          </button>
        </div>

        {/* 스피커 */}
        <div className="smartphone-speaker" />

        {/* 화면 */}
        <div className="smartphone-screen">
          {children}
        </div>

        {/* 홈 버튼 */}
        <div className="smartphone-home-button" />
      </div>
    </div>
  );
};

export default SmartphoneFrame;
