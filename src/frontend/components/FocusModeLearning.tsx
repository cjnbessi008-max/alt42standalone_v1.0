/**
 * Focus Mode Learning Component
 * Main component that integrates eye tracking with learning content
 */

import React, { useState, useEffect } from 'react';
import { useFocusMode } from '../hooks/useFocusMode';
import { FocusModeIndicator } from './FocusModeIndicator';
import { BlinkMetricsDisplay } from './BlinkMetricsDisplay';
import { FocusTimer } from './FocusTimer';
import type { FocusModeConfig } from '../types/focus-mode.types';

interface FocusModeLearningProps {
  courseId: string;
  userId: string;
  config?: Partial<FocusModeConfig>;
  children?: React.ReactNode;
  onSessionStart?: (sessionId: string) => void;
  onSessionEnd?: (sessionId: string, duration: number) => void;
}

export const FocusModeLearning: React.FC<FocusModeLearningProps> = ({
  courseId,
  userId,
  config: userConfig,
  children,
  onSessionStart,
  onSessionEnd,
}) => {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [showMetrics, setShowMetrics] = useState(true);
  const [cameraPermissionGranted, setCameraPermissionGranted] = useState(false);
  const [showVideo, setShowVideo] = useState(false);

  const {
    isActive,
    isFocused,
    focusState,
    blinkMetrics,
    focusMetrics,
    trackingState,
    start,
    stop,
    reset,
    videoRef,
    canvasRef,
  } = useFocusMode({
    config: userConfig,
    callbacks: {
      onFocusStart: (metrics) => {
        console.log('🎯 Focus mode activated!', metrics);
        // Create session
        const newSessionId = `session_${Date.now()}`;
        setSessionId(newSessionId);
        if (onSessionStart) {
          onSessionStart(newSessionId);
        }
      },
      onFocusEnd: (metrics) => {
        console.log('👋 Focus mode deactivated', metrics);
        if (sessionId && onSessionEnd) {
          onSessionEnd(sessionId, metrics.focusDuration);
        }
      },
      onBlinkDetected: (event) => {
        console.log('👁️ Blink detected:', event);
      },
      onError: (error) => {
        console.error('Focus mode error:', error);
        alert(`Error: ${error.message}`);
      },
    },
  });

  const handleStart = async () => {
    try {
      await start();
      setCameraPermissionGranted(true);
    } catch (error) {
      console.error('Failed to start:', error);
      setCameraPermissionGranted(false);
    }
  };

  const handleStop = () => {
    stop();
    setCameraPermissionGranted(false);
  };

  // Apply focus mode UI effects
  useEffect(() => {
    if (isFocused) {
      document.body.classList.add('focus-mode-active');
    } else {
      document.body.classList.remove('focus-mode-active');
    }

    return () => {
      document.body.classList.remove('focus-mode-active');
    };
  }, [isFocused]);

  return (
    <div
      className="focus-mode-learning"
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        backgroundColor: isFocused ? '#fafafa' : '#ffffff',
        transition: 'background-color 0.5s ease',
      }}
    >
      {/* Focus Mode Styles */}
      <style>{`
        .focus-mode-active {
          background-color: #fafafa !important;
        }
        .learning-content.focused {
          box-shadow: 0 0 20px rgba(16, 185, 129, 0.3) !important;
        }
      `}</style>

      {/* Header */}
      <header
        style={{
          padding: '16px 24px',
          backgroundColor: '#ffffff',
          borderBottom: '1px solid #e5e7eb',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: '#111827' }}>
              🎓 Focus Mode Learning
            </h1>
            <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#6b7280' }}>
              Course: {courseId} | User: {userId}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            {/* Toggle metrics */}
            <button
              onClick={() => setShowMetrics(!showMetrics)}
              style={{
                padding: '8px 16px',
                fontSize: '14px',
                borderRadius: '6px',
                border: '1px solid #d1d5db',
                backgroundColor: '#ffffff',
                cursor: 'pointer',
              }}
            >
              {showMetrics ? '📊 메트릭 숨기기' : '📊 메트릭 보기'}
            </button>

            {/* Start/Stop button */}
            {!isActive ? (
              <button
                onClick={handleStart}
                style={{
                  padding: '10px 20px',
                  fontSize: '14px',
                  fontWeight: 600,
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: '#10b981',
                  color: '#ffffff',
                  cursor: 'pointer',
                  boxShadow: '0 2px 4px rgba(16, 185, 129, 0.3)',
                }}
              >
                🚀 시작하기
              </button>
            ) : (
              <button
                onClick={handleStop}
                style={{
                  padding: '10px 20px',
                  fontSize: '14px',
                  fontWeight: 600,
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: '#ef4444',
                  color: '#ffffff',
                  cursor: 'pointer',
                }}
              >
                ⏹️ 중지
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Sidebar with metrics */}
        {showMetrics && isActive && (
          <aside
            style={{
              width: '320px',
              padding: '16px',
              backgroundColor: '#f9fafb',
              borderRight: '1px solid #e5e7eb',
              overflowY: 'auto',
              transition: 'transform 0.3s ease',
              transform: isFocused && userConfig?.autoHideSidebar ? 'translateX(-100%)' : 'translateX(0)',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Focus State Indicator */}
              <FocusModeIndicator focusMetrics={focusMetrics} />

              {/* Focus Timer */}
              {isFocused && <FocusTimer focusMetrics={focusMetrics} />}

              {/* Blink Metrics */}
              <BlinkMetricsDisplay metrics={blinkMetrics} />

              {/* Camera Preview */}
              {showVideo && (
                <div
                  style={{
                    padding: '12px',
                    backgroundColor: '#ffffff',
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 600 }}>
                      📹 카메라 프리뷰
                    </h4>
                    <button
                      onClick={() => setShowVideo(false)}
                      style={{
                        padding: '4px 8px',
                        fontSize: '12px',
                        border: 'none',
                        background: 'none',
                        cursor: 'pointer',
                      }}
                    >
                      ✕
                    </button>
                  </div>
                  <div style={{ position: 'relative', width: '100%', aspectRatio: '4/3', backgroundColor: '#000' }}>
                    <video
                      ref={videoRef}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      autoPlay
                      playsInline
                      muted
                    />
                    <canvas
                      ref={canvasRef}
                      style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
                    />
                  </div>
                </div>
              )}

              {!showVideo && cameraPermissionGranted && (
                <button
                  onClick={() => setShowVideo(true)}
                  style={{
                    padding: '8px',
                    fontSize: '12px',
                    borderRadius: '6px',
                    border: '1px solid #d1d5db',
                    backgroundColor: '#ffffff',
                    cursor: 'pointer',
                  }}
                >
                  📹 카메라 프리뷰 보기
                </button>
              )}

              {/* Tracking Status */}
              <div
                style={{
                  padding: '12px',
                  backgroundColor: '#ffffff',
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb',
                  fontSize: '12px',
                }}
              >
                <div style={{ fontWeight: 600, marginBottom: '8px', color: '#374151' }}>
                  추적 상태
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', color: '#6b7280' }}>
                  <div>
                    활성화: {trackingState.isTracking ? '✅' : '❌'}
                  </div>
                  <div>
                    감지된 얼굴: {trackingState.facesDetected}
                  </div>
                  {trackingState.error && (
                    <div style={{ color: '#ef4444', marginTop: '4px' }}>
                      오류: {trackingState.error}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </aside>
        )}

        {/* Learning Content Area */}
        <main
          className={isFocused ? 'learning-content focused' : 'learning-content'}
          style={{
            flex: 1,
            padding: '24px',
            overflowY: 'auto',
            transition: 'all 0.3s ease',
          }}
        >
          {children || (
            <div style={{ maxWidth: '800px', margin: '0 auto' }}>
              <h2 style={{ fontSize: '28px', fontWeight: 700, marginBottom: '16px' }}>
                학습 콘텐츠 영역
              </h2>
              <p style={{ fontSize: '16px', lineHeight: 1.6, color: '#4b5563', marginBottom: '16px' }}>
                여기에 LMS의 학습 콘텐츠가 표시됩니다. 눈 깜빡임이 적으면 자동으로 집중 모드가 활성화됩니다.
              </p>

              {!isActive && (
                <div
                  style={{
                    padding: '24px',
                    backgroundColor: '#eff6ff',
                    border: '2px solid #3b82f6',
                    borderRadius: '12px',
                    marginTop: '24px',
                  }}
                >
                  <h3 style={{ marginTop: 0, color: '#1e40af' }}>👋 시작하려면</h3>
                  <ol style={{ marginBottom: 0, color: '#1e3a8a' }}>
                    <li>상단의 "🚀 시작하기" 버튼을 클릭하세요</li>
                    <li>카메라 권한을 허용하세요</li>
                    <li>학습을 시작하면 자동으로 집중도를 측정합니다</li>
                    <li>눈 깜빡임이 줄어들면 집중 모드가 활성화됩니다!</li>
                  </ol>
                </div>
              )}

              {isFocused && (
                <div
                  style={{
                    padding: '24px',
                    backgroundColor: '#d1fae5',
                    border: '2px solid #10b981',
                    borderRadius: '12px',
                    marginTop: '24px',
                    textAlign: 'center',
                  }}
                >
                  <div style={{ fontSize: '48px', marginBottom: '12px' }}>🎯</div>
                  <h3 style={{ margin: '0 0 8px 0', color: '#065f46' }}>
                    집중 모드 활성화!
                  </h3>
                  <p style={{ margin: 0, color: '#047857' }}>
                    훌륭해요! 높은 집중도를 유지하고 계십니다.
                  </p>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
