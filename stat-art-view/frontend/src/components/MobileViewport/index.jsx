import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './MobileViewport.css';
import MiniRadialChart from './MiniRadialChart';

const MobileViewport = ({ artData, loading }) => {
  const [isMinimized, setIsMinimized] = useState(false);
  const [currentView, setCurrentView] = useState('radial'); // radial, stats, particles

  const toggleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  const switchView = (view) => {
    setCurrentView(view);
  };

  return (
    <motion.div
      className={`mobile-viewport ${isMinimized ? 'minimized' : ''}`}
      initial={{ x: 100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.3 }}
    >
      {/* 스마트폰 프레임 */}
      <div className="phone-frame">
        {/* 상단 노치 */}
        <div className="phone-notch"></div>

        {/* 헤더 */}
        <div className="phone-header">
          <button
            className="minimize-btn"
            onClick={toggleMinimize}
            aria-label={isMinimized ? "확대" : "최소화"}
          >
            {isMinimized ? '📱' : '➖'}
          </button>
          <h3>📊 Stat Art</h3>
          <div className="phone-time">
            {new Date().toLocaleTimeString('ko-KR', {
              hour: '2-digit',
              minute: '2-digit'
            })}
          </div>
        </div>

        <AnimatePresence>
          {!isMinimized && (
            <motion.div
              className="phone-content"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              {/* 탭 네비게이션 */}
              <div className="phone-tabs">
                <button
                  className={`tab-btn ${currentView === 'radial' ? 'active' : ''}`}
                  onClick={() => switchView('radial')}
                >
                  🌸 차트
                </button>
                <button
                  className={`tab-btn ${currentView === 'stats' ? 'active' : ''}`}
                  onClick={() => switchView('stats')}
                >
                  📈 통계
                </button>
                <button
                  className={`tab-btn ${currentView === 'particles' ? 'active' : ''}`}
                  onClick={() => switchView('particles')}
                >
                  ✨ 효과
                </button>
              </div>

              {/* 콘텐츠 영역 */}
              <div className="phone-screen">
                {loading && (
                  <div className="phone-loading">
                    <div className="phone-spinner"></div>
                    <p>로딩 중...</p>
                  </div>
                )}

                {!loading && artData && (
                  <AnimatePresence mode="wait">
                    {currentView === 'radial' && (
                      <motion.div
                        key="radial"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ duration: 0.3 }}
                        className="view-content"
                      >
                        <MiniRadialChart data={artData.radial} />
                      </motion.div>
                    )}

                    {currentView === 'stats' && (
                      <motion.div
                        key="stats"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ duration: 0.3 }}
                        className="view-content stats-view"
                      >
                        <h4>📊 요약 통계</h4>
                        <div className="stat-grid">
                          <div className="stat-card">
                            <div className="stat-icon">📝</div>
                            <div className="stat-content">
                              <div className="stat-label">전체 문제</div>
                              <div className="stat-number">
                                {artData.summary.totalQuestions}
                              </div>
                            </div>
                          </div>

                          <div className="stat-card">
                            <div className="stat-icon">✅</div>
                            <div className="stat-content">
                              <div className="stat-label">평균 정답률</div>
                              <div className="stat-number">
                                {artData.summary.averageCorrectRate.toFixed(1)}%
                              </div>
                            </div>
                          </div>

                          <div className="stat-card easy">
                            <div className="stat-icon">😊</div>
                            <div className="stat-content">
                              <div className="stat-label">쉬운 문제</div>
                              <div className="stat-number">
                                {artData.summary.difficultyBreakdown.easy}
                              </div>
                            </div>
                          </div>

                          <div className="stat-card medium">
                            <div className="stat-icon">😐</div>
                            <div className="stat-content">
                              <div className="stat-label">보통 문제</div>
                              <div className="stat-number">
                                {artData.summary.difficultyBreakdown.medium}
                              </div>
                            </div>
                          </div>

                          <div className="stat-card hard">
                            <div className="stat-icon">😰</div>
                            <div className="stat-content">
                              <div className="stat-label">어려운 문제</div>
                              <div className="stat-number">
                                {artData.summary.difficultyBreakdown.hard}
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {currentView === 'particles' && (
                      <motion.div
                        key="particles"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ duration: 0.3 }}
                        className="view-content particles-view"
                      >
                        <h4>✨ 학습 현황</h4>
                        <div className="particles-container">
                          {artData.particles.slice(0, 10).map((particle, i) => (
                            <motion.div
                              key={i}
                              className="particle-item"
                              initial={{ opacity: 0, scale: 0 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: i * 0.05, duration: 0.3 }}
                            >
                              <div
                                className="particle-dot"
                                style={{
                                  width: particle.size * 2,
                                  height: particle.size * 2,
                                  opacity: particle.opacity,
                                  background: `hsl(${particle.opacity * 120}, 70%, 50%)`
                                }}
                              ></div>
                              <div className="particle-info-mini">
                                <span>문제 {i + 1}</span>
                                <span className="particle-score">
                                  {(particle.opacity * 100).toFixed(0)}%
                                </span>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                )}

                {!loading && !artData && (
                  <div className="phone-empty">
                    <p>데이터가 없습니다</p>
                  </div>
                )}
              </div>

              {/* 하단 홈 인디케이터 */}
              <div className="phone-home-indicator"></div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default MobileViewport;
