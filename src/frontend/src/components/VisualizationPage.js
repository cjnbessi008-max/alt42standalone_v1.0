import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './VisualizationPage.css';
import VirtualPhone from './VirtualPhone';
import SpiralVisualization from './SpiralVisualization';
import { getSequence, saveProgress } from '../utils/api';

function VisualizationPage({ user }) {
  const { sequenceId } = useParams();
  const navigate = useNavigate();
  const [sequence, setSequence] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [startTime] = useState(Date.now());

  useEffect(() => {
    loadSequence();
  }, [sequenceId]);

  const loadSequence = async () => {
    try {
      setLoading(true);
      const data = await getSequence(sequenceId);
      setSequence(data.sequence);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async () => {
    const timeSpent = Math.floor((Date.now() - startTime) / 1000);

    try {
      await saveProgress(sequenceId, {
        completion_status: 'completed',
        time_spent: timeSpent,
        score: 100
      });

      // Show success message
      alert('🎉 축하합니다! 시각화를 완료했습니다!');

      // Navigate back to dashboard
      navigate('/dashboard');
    } catch (err) {
      console.error('Failed to save progress:', err);
      alert('진도 저장에 실패했습니다. 다시 시도해주세요.');
    }
  };

  const handleBack = () => {
    navigate('/dashboard');
  };

  if (loading) {
    return (
      <div className="viz-loading">
        <div className="spinner"></div>
        <p>시각화 준비 중...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="viz-error">
        <h2>오류 발생</h2>
        <p>{error}</p>
        <button className="btn btn-primary" onClick={handleBack}>
          대시보드로 돌아가기
        </button>
      </div>
    );
  }

  return (
    <div className="visualization-page">
      <header className="viz-header">
        <button className="back-btn" onClick={handleBack}>
          ← 대시보드
        </button>
        <div className="viz-info">
          <h1>{sequence?.name}</h1>
          <p>{sequence?.description}</p>
        </div>
        <div className="viz-meta">
          <span className={`difficulty-badge level-${sequence?.difficulty_level}`}>
            Level {sequence?.difficulty_level}
          </span>
          <span className="sequence-type">{sequence?.sequence_type}</span>
        </div>
      </header>

      <main className="viz-main">
        <VirtualPhone position="bottom-right">
          {sequence && (
            <SpiralVisualization
              sequence={sequence}
              onComplete={handleComplete}
            />
          )}
        </VirtualPhone>

        <div className="viz-instructions">
          <h2>사용 방법</h2>
          <div className="instructions-grid">
            <div className="instruction-card">
              <div className="instruction-icon">▶️</div>
              <h3>애니메이션 시작</h3>
              <p>나선이 단계적으로 그려지는 모습을 관찰하세요</p>
            </div>
            <div className="instruction-card">
              <div className="instruction-icon">🔍</div>
              <h3>확대/축소</h3>
              <p>세부적인 패턴을 확인하거나 전체 구조를 파악하세요</p>
            </div>
            <div className="instruction-card">
              <div className="instruction-icon">🔄</div>
              <h3>회전</h3>
              <p>다양한 각도에서 나선의 아름다움을 감상하세요</p>
            </div>
            <div className="instruction-card">
              <div className="instruction-icon">🔁</div>
              <h3>초기화</h3>
              <p>언제든지 처음 상태로 돌아갈 수 있습니다</p>
            </div>
          </div>
        </div>

        {sequence && (
          <div className="viz-details">
            <h2>수열 정보</h2>
            <div className="details-grid">
              <div className="detail-item">
                <strong>타입</strong>
                <span>{sequence.sequence_type}</span>
              </div>
              <div className="detail-item">
                <strong>나선 타입</strong>
                <span>{sequence.spiral_type}</span>
              </div>
              <div className="detail-item">
                <strong>첫 항</strong>
                <span>{sequence.first_term}</span>
              </div>
              {sequence.common_ratio && (
                <div className="detail-item">
                  <strong>공비</strong>
                  <span>{sequence.common_ratio}</span>
                </div>
              )}
              <div className="detail-item">
                <strong>항수</strong>
                <span>{sequence.num_terms}</span>
              </div>
              <div className="detail-item">
                <strong>난이도</strong>
                <span>Level {sequence.difficulty_level}</span>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default VisualizationPage;
