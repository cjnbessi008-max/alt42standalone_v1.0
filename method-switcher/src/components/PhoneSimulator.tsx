import React, { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface PhoneSimulatorProps {
  children: ReactNode;
}

/**
 * 가상 스마트폰 화면 컨테이너
 * 우측 하단에 배치되는 모바일 시뮬레이터
 */
export const PhoneSimulator: React.FC<PhoneSimulatorProps> = ({ children }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 100 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        width: '375px',
        height: '667px',
        zIndex: 1000
      }}
    >
      {/* 스마트폰 외형 */}
      <div
        style={{
          width: '100%',
          height: '100%',
          backgroundColor: '#1a1a1a',
          borderRadius: '40px',
          padding: '15px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          position: 'relative'
        }}
      >
        {/* 노치 (상단 카메라 영역) */}
        <div
          style={{
            position: 'absolute',
            top: '15px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '150px',
            height: '25px',
            backgroundColor: '#1a1a1a',
            borderRadius: '0 0 15px 15px',
            zIndex: 2
          }}
        />

        {/* 스크린 영역 */}
        <div
          style={{
            width: '100%',
            height: '100%',
            backgroundColor: '#ffffff',
            borderRadius: '30px',
            overflow: 'hidden',
            position: 'relative'
          }}
        >
          {children}
        </div>

        {/* 홈 버튼 (하단) */}
        <div
          style={{
            position: 'absolute',
            bottom: '8px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '120px',
            height: '4px',
            backgroundColor: '#666',
            borderRadius: '2px'
          }}
        />
      </div>
    </motion.div>
  );
};
