/**
 * useBrainMonitor Hook
 * 뇌 모니터링 상태를 관리하는 React Hook
 */

import { useEffect } from 'react';
import { useCalmMode } from '../components/CalmModeProvider';
import wsService from '../services/websocket-service';

export const useBrainMonitor = () => {
  const { updateBrainStatus, activateCalmMode, deactivateCalmMode } = useCalmMode();

  useEffect(() => {
    // 뇌 상태 업데이트 이벤트 리스너
    const handleBrainStatusUpdate = (status) => {
      updateBrainStatus(status);
    };

    // 안정 모드 활성화 이벤트 리스너
    const handleCalmModeActivate = (data) => {
      activateCalmMode(data.reason);
    };

    // 안정 모드 비활성화 이벤트 리스너
    const handleCalmModeDeactivate = (data) => {
      deactivateCalmMode();
    };

    // 이벤트 리스너 등록
    wsService.on('brain_status_update', handleBrainStatusUpdate);
    wsService.on('calm_mode_activate', handleCalmModeActivate);
    wsService.on('calm_mode_deactivate', handleCalmModeDeactivate);

    // 정리 (cleanup)
    return () => {
      wsService.off('brain_status_update', handleBrainStatusUpdate);
      wsService.off('calm_mode_activate', handleCalmModeActivate);
      wsService.off('calm_mode_deactivate', handleCalmModeDeactivate);
    };
  }, [updateBrainStatus, activateCalmMode, deactivateCalmMode]);

  // 활동 기록 함수
  const recordActivity = (activity) => {
    wsService.recordActivity(activity);
  };

  return {
    recordActivity
  };
};

export default useBrainMonitor;
