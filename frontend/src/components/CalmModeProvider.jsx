/**
 * Calm Mode Provider Component
 * 안정 모드 전역 상태 관리
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const CalmModeContext = createContext();

export const useCalmMode = () => {
  const context = useContext(CalmModeContext);
  if (!context) {
    throw new Error('useCalmMode must be used within CalmModeProvider');
  }
  return context;
};

export const CalmModeProvider = ({ children }) => {
  const [isCalmMode, setIsCalmMode] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [brainStatus, setBrainStatus] = useState({
    overheated: false,
    cognitiveLoad: 0,
    metrics: null
  });

  /**
   * 안정 모드 활성화
   */
  const activateCalmMode = useCallback((reason = 'manual') => {
    console.log('🔵 안정 모드 활성화:', reason);

    // body에 calm-mode 클래스 추가
    document.body.classList.add('calm-mode-activating');
    document.body.classList.add('calm-mode');

    // 활성화 애니메이션 후 클래스 제거
    setTimeout(() => {
      document.body.classList.remove('calm-mode-activating');
    }, 1500);

    setIsCalmMode(true);

    // 배너 표시 (자동 활성화된 경우)
    if (reason === 'auto') {
      setShowBanner(true);

      // 10초 후 배너 자동 숨김
      setTimeout(() => {
        setShowBanner(false);
      }, 10000);
    }
  }, []);

  /**
   * 안정 모드 비활성화
   */
  const deactivateCalmMode = useCallback(() => {
    console.log('⚪ 안정 모드 비활성화');

    document.body.classList.remove('calm-mode');
    document.body.classList.remove('calm-mode-activating');

    setIsCalmMode(false);
    setShowBanner(false);
  }, []);

  /**
   * 안정 모드 토글
   */
  const toggleCalmMode = useCallback(() => {
    if (isCalmMode) {
      deactivateCalmMode();
    } else {
      activateCalmMode('manual');
    }
  }, [isCalmMode, activateCalmMode, deactivateCalmMode]);

  /**
   * 뇌 상태 업데이트
   */
  const updateBrainStatus = useCallback((status) => {
    setBrainStatus(status);

    // 과열 상태이고 안정 모드가 비활성화된 경우 자동 활성화
    if (status.overheated && !isCalmMode) {
      activateCalmMode('auto');
    }
    // 과열이 해제되고 안정 모드가 자동 활성화된 상태라면 비활성화
    else if (!status.overheated && isCalmMode && status.cognitiveLoad < 0.5) {
      // 인지 부하가 50% 이하로 떨어지면 자동 비활성화
      // (사용자가 수동으로 활성화한 경우는 유지)
      deactivateCalmMode();
    }
  }, [isCalmMode, activateCalmMode, deactivateCalmMode]);

  /**
   * 배너 닫기
   */
  const closeBanner = useCallback(() => {
    setShowBanner(false);
  }, []);

  /**
   * 로컬 스토리지에서 설정 불러오기
   */
  useEffect(() => {
    const savedMode = localStorage.getItem('calmMode');
    if (savedMode === 'true') {
      activateCalmMode('saved');
    }
  }, [activateCalmMode]);

  /**
   * 로컬 스토리지에 설정 저장
   */
  useEffect(() => {
    localStorage.setItem('calmMode', isCalmMode.toString());
  }, [isCalmMode]);

  const value = {
    isCalmMode,
    showBanner,
    brainStatus,
    activateCalmMode,
    deactivateCalmMode,
    toggleCalmMode,
    updateBrainStatus,
    closeBanner
  };

  return (
    <CalmModeContext.Provider value={value}>
      {children}
    </CalmModeContext.Provider>
  );
};

export default CalmModeProvider;
