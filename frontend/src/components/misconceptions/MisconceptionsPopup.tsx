/**
 * MisconceptionsPopup Component
 * Main popup showing top 3 frequently missed concepts for a student
 */
import React, { useEffect, useState } from 'react';
import { Modal } from '../common/Modal/Modal';
import { MisconceptionCard } from './MisconceptionCard';
import { apiService } from '../../services/api';
import { TopMisconceptionsResponse } from '../../types';
import './MisconceptionsPopup.css';

interface MisconceptionsPopupProps {
  studentId: string;
  moduleId: string;
  open: boolean;
  onClose: () => void;
  limit?: number;
  timeframe?: 'week' | 'month' | 'all_time';
}

export const MisconceptionsPopup: React.FC<MisconceptionsPopupProps> = ({
  studentId,
  moduleId,
  open,
  onClose,
  limit = 3,
  timeframe = 'all_time',
}) => {
  const [data, setData] = useState<TopMisconceptionsResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && studentId && moduleId) {
      fetchMisconceptions();
    }
  }, [open, studentId, moduleId, limit, timeframe]);

  const fetchMisconceptions = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiService.getTopMisconceptions(
        studentId,
        moduleId,
        limit,
        timeframe
      );
      setData(response);
    } catch (err: any) {
      console.error('Failed to fetch misconceptions:', err);
      setError(
        err.response?.data?.detail || '오개념 데이터를 불러오는데 실패했습니다. 다시 시도해주세요.'
      );
    } finally {
      setLoading(false);
    }
  };

  const getTimeframeLabel = (tf: string): string => {
    switch (tf) {
      case 'week':
        return '최근 일주일';
      case 'month':
        return '최근 한 달';
      default:
        return '전체 기간';
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="내가 자주 틀리는 개념 TOP3" maxWidth="lg">
      <div className="misconceptions-popup">
        {data && (
          <div className="popup-header">
            <div className="student-info">
              <h3 className="student-name">👤 {data.student_name}</h3>
              <p className="module-name">📚 {data.module_name}</p>
            </div>
            <div className="timeframe-badge">{getTimeframeLabel(timeframe)}</div>
          </div>
        )}

        <p className="popup-description">
          최근 학습 내용을 분석한 결과, 아래 개념들을 더 연습하면 실력이 크게 향상될 거예요! 💪
        </p>

        {loading && (
          <div className="loading-container">
            <div className="spinner"></div>
            <p className="loading-text">맞춤 학습 분석 중...</p>
          </div>
        )}

        {error && (
          <div className="error-container">
            <div className="error-icon">⚠️</div>
            <p className="error-message">{error}</p>
            <button className="retry-button" onClick={fetchMisconceptions}>
              다시 시도
            </button>
          </div>
        )}

        {!loading && !error && data && data.misconceptions.length === 0 && (
          <div className="success-container">
            <div className="success-icon">🎉</div>
            <h3 className="success-title">완벽해요!</h3>
            <p className="success-message">
              자주 틀리는 개념이 발견되지 않았어요. 정말 잘하고 있어요! 계속 이대로 화이팅!
            </p>
          </div>
        )}

        {!loading && !error && data && data.misconceptions.length > 0 && (
          <div className="misconceptions-list">
            {data.misconceptions.map((misconception, index) => (
              <MisconceptionCard
                key={misconception.id}
                misconception={misconception}
                rank={index + 1}
              />
            ))}
          </div>
        )}

        <div className="popup-footer">
          <button className="secondary-button" onClick={onClose}>
            닫기
          </button>
          {data && data.misconceptions.length > 0 && (
            <button className="primary-button" onClick={() => alert('연습 문제 기능은 곧 추가됩니다!')}>
              연습 문제 풀기 📝
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
};
