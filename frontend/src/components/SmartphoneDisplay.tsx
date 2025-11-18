import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SimilarityCardList } from './SimilarityCardList';
import { SimilarityType } from '../types/similarity';
import '../styles/SmartphoneDisplay.css';

interface SmartphoneDisplayProps {
  activeSimilarity?: SimilarityType | null;
  onCardClick?: (type: SimilarityType) => void;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
}

/**
 * 우측 하단 가상 스마트폰 화면 컴포넌트
 */
export const SmartphoneDisplay: React.FC<SmartphoneDisplayProps> = ({
  activeSimilarity,
  onCardClick,
  position = 'bottom-right',
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);

  const toggleExpanded = () => {
    if (isMinimized) {
      setIsMinimized(false);
      setIsExpanded(true);
    } else {
      setIsExpanded(!isExpanded);
    }
  };

  const minimize = () => {
    setIsMinimized(true);
    setIsExpanded(false);
  };

  return (
    <>
      {/* Minimized floating button */}
      <AnimatePresence>
        {isMinimized && (
          <motion.div
            className={`smartphone-minimized ${position}`}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={toggleExpanded}
          >
            <div className="minimized-icon">📱</div>
            <div className="minimized-text">닮음 조건</div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Smartphone display */}
      <AnimatePresence>
        {!isMinimized && (
          <motion.div
            className={`smartphone-display ${position} ${isExpanded ? 'expanded' : 'collapsed'}`}
            initial={{ x: 100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 100, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 100 }}
          >
            {/* Phone frame */}
            <div className="phone-frame">
              {/* Phone notch */}
              <div className="phone-notch">
                <div className="notch-speaker"></div>
                <div className="notch-camera"></div>
              </div>

              {/* Phone header */}
              <div className="phone-header">
                <div className="phone-time">14:32</div>
                <div className="phone-status">
                  <span className="status-icon">📶</span>
                  <span className="status-icon">📡</span>
                  <span className="status-icon">🔋</span>
                </div>
              </div>

              {/* Phone screen content */}
              <div className="phone-screen">
                <div className="screen-header">
                  <button
                    className="screen-minimize-btn"
                    onClick={minimize}
                    title="최소화"
                  >
                    ─
                  </button>
                  <button
                    className="screen-toggle-btn"
                    onClick={toggleExpanded}
                    title={isExpanded ? '접기' : '펼치기'}
                  >
                    {isExpanded ? '▼' : '▲'}
                  </button>
                </div>

                <AnimatePresence mode="wait">
                  {isExpanded ? (
                    <motion.div
                      key="expanded"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                      className="screen-content"
                    >
                      <SimilarityCardList
                        activeSimilarity={activeSimilarity}
                        onCardClick={onCardClick}
                      />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="collapsed"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="screen-collapsed"
                    >
                      <p className="collapsed-text">닮음 조건 카드</p>
                      <p className="collapsed-hint">클릭하여 펼치기</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Phone home indicator */}
              <div className="phone-home-indicator"></div>
            </div>

            {/* Glow effect for phone */}
            <div className="phone-glow"></div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default SmartphoneDisplay;
