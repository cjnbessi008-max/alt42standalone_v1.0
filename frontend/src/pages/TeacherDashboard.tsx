/**
 * Teacher Dashboard - View student thinking flow analysis
 */
import React, { useState, useEffect } from 'react';
import { sessionAPI } from '../services/api';
import ThinkingFlowGraph from '../components/ThinkingFlowGraph';
import type { ThinkingFlowGraphData } from '../types';

const TeacherDashboard: React.FC = () => {
  const [sessionId, setSessionId] = useState<string>('');
  const [analysisData, setAnalysisData] = useState<ThinkingFlowGraphData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    if (!sessionId.trim()) {
      setError('세션 ID를 입력해주세요');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const data = await sessionAPI.analyzeSession(sessionId.trim());
      setAnalysisData(data);
    } catch (err: any) {
      setError(err.response?.data?.detail || '분석에 실패했습니다');
      setAnalysisData(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto' }}>
      <header
        style={{
          backgroundColor: '#4CAF50',
          color: 'white',
          padding: '20px',
          borderRadius: '8px',
          marginBottom: '30px',
        }}
      >
        <h1 style={{ margin: 0 }}>교사 대시보드</h1>
        <p style={{ margin: '10px 0 0 0', opacity: 0.9 }}>
          학생의 사고 흐름과 학습 패턴을 분석합니다
        </p>
      </header>

      {/* Analysis Input */}
      <div
        style={{
          backgroundColor: 'white',
          padding: '25px',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          marginBottom: '30px',
        }}
      >
        <h2 style={{ marginTop: 0 }}>세션 분석</h2>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
          <div style={{ flex: 1 }}>
            <label
              htmlFor="session-id"
              style={{
                display: 'block',
                marginBottom: '8px',
                fontWeight: 'bold',
                color: '#555',
              }}
            >
              세션 ID:
            </label>
            <input
              id="session-id"
              type="text"
              value={sessionId}
              onChange={(e) => setSessionId(e.target.value)}
              placeholder="예: 123e4567-e89b-12d3-a456-426614174000"
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '14px',
                border: '2px solid #ddd',
                borderRadius: '5px',
                boxSizing: 'border-box',
              }}
            />
          </div>
          <button
            onClick={handleAnalyze}
            disabled={isLoading}
            style={{
              marginTop: '28px',
              padding: '12px 30px',
              backgroundColor: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              opacity: isLoading ? 0.6 : 1,
            }}
          >
            {isLoading ? '분석 중...' : '분석하기'}
          </button>
        </div>

        {error && (
          <div
            style={{
              marginTop: '15px',
              padding: '12px',
              backgroundColor: '#ffebee',
              color: '#c62828',
              borderRadius: '5px',
              border: '1px solid #ef5350',
            }}
          >
            {error}
          </div>
        )}
      </div>

      {/* Analysis Results */}
      {analysisData && (
        <div
          style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          }}
        >
          <ThinkingFlowGraph data={analysisData} />
        </div>
      )}

      {/* Instructions */}
      {!analysisData && !isLoading && (
        <div
          style={{
            backgroundColor: '#f5f5f5',
            padding: '30px',
            borderRadius: '8px',
            textAlign: 'center',
          }}
        >
          <h3 style={{ marginTop: 0, color: '#666' }}>사용 방법</h3>
          <ol
            style={{
              textAlign: 'left',
              maxWidth: '600px',
              margin: '20px auto',
              lineHeight: '2',
            }}
          >
            <li>학생이 문제를 풀고 제출한 후 세션 ID를 확인합니다</li>
            <li>위 입력란에 세션 ID를 입력합니다</li>
            <li>"분석하기" 버튼을 클릭하여 사고 흐름 분석을 실행합니다</li>
            <li>그래프와 지표를 통해 학생의 학습 패턴을 파악합니다</li>
          </ol>

          <div
            style={{
              marginTop: '30px',
              padding: '20px',
              backgroundColor: 'white',
              borderRadius: '5px',
              border: '1px solid #ddd',
            }}
          >
            <h4 style={{ marginTop: 0 }}>분석 지표 설명</h4>
            <div style={{ textAlign: 'left', maxWidth: '600px', margin: '0 auto' }}>
              <p>
                <strong>인지 부하:</strong> 문제의 어려움을 나타내는 지표 (높을수록 어려움)
              </p>
              <p>
                <strong>끈기:</strong> 어려움에도 불구하고 문제를 해결하려는 노력
              </p>
              <p>
                <strong>효율성:</strong> 예상 시간 대비 실제 소요 시간의 효율성
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherDashboard;
