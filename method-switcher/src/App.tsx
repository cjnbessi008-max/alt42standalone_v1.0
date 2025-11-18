import { useState, useEffect } from 'react';
import { PhoneSimulator } from './components/PhoneSimulator';
import { MethodSwitcher } from './components/MethodSwitcher';
import { createMockLMSConnector } from './services/lmsConnector';
import { ProblemData, IntegrationMethod } from './types/integration';
import './App.css';

function App() {
  const [problem, setProblem] = useState<ProblemData | null>(null);
  const [loading, setLoading] = useState(true);

  // LMS에서 문제 가져오기
  useEffect(() => {
    const loadProblem = async () => {
      const lmsConnector = createMockLMSConnector();
      try {
        // URL 파라미터에서 문제 ID 가져오기 (없으면 기본값 '1')
        const urlParams = new URLSearchParams(window.location.search);
        const problemId = urlParams.get('problemId') || '1';

        const problemData = await lmsConnector.fetchProblem(problemId);
        setProblem(problemData);
      } catch (error) {
        console.error('Failed to load problem:', error);
        // 폴백 문제 데이터
        setProblem({
          id: '1',
          functionExpression: 'x**2',
          lowerBound: 0,
          upperBound: 2,
          exactValue: 8 / 3,
          difficulty: 'easy'
        });
      } finally {
        setLoading(false);
      }
    };

    loadProblem();
  }, []);

  // 답안 제출 핸들러
  const handleSubmit = async (method: IntegrationMethod, value: number) => {
    if (!problem) return;

    const lmsConnector = createMockLMSConnector();
    const success = await lmsConnector.submitAnswer(problem.id, value, method);

    if (success) {
      alert(`답안이 제출되었습니다!\n방법: ${method}\n값: ${value.toFixed(6)}`);
    } else {
      alert('답안 제출에 실패했습니다.');
    }
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        backgroundColor: '#f3f4f6'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '50px',
            height: '50px',
            border: '4px solid #e5e7eb',
            borderTop: '4px solid #3b82f6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }} />
          <p style={{ marginTop: '16px', color: '#6b7280' }}>문제 로딩 중...</p>
        </div>
      </div>
    );
  }

  if (!problem) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        backgroundColor: '#f3f4f6'
      }}>
        <p style={{ color: '#ef4444' }}>문제를 불러올 수 없습니다.</p>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f3f4f6',
      padding: '20px',
      position: 'relative'
    }}>
      {/* 메인 설명 영역 */}
      <div style={{
        maxWidth: '800px',
        margin: '0 auto',
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        padding: '24px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        marginBottom: '100px'
      }}>
        <h1 style={{
          fontSize: '28px',
          fontWeight: 'bold',
          marginBottom: '16px',
          color: '#1f2937'
        }}>
          적분법 비교 학습 시스템
        </h1>

        <p style={{ color: '#6b7280', marginBottom: '24px', lineHeight: '1.6' }}>
          다양한 수치 적분법을 시각적으로 비교하고 학습할 수 있는 대화형 도구입니다.
          우측 하단의 가상 스마트폰 화면에서 각 적분법을 선택하고 애니메이션으로 동작 원리를 확인하세요.
        </p>

        <div style={{
          backgroundColor: '#f9fafb',
          borderRadius: '8px',
          padding: '16px',
          marginBottom: '16px'
        }}>
          <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px', color: '#374151' }}>
            현재 문제
          </h3>
          <div style={{ fontSize: '14px', color: '#6b7280', lineHeight: '1.8' }}>
            <div>• 함수: <code style={{ backgroundColor: '#e5e7eb', padding: '2px 8px', borderRadius: '4px' }}>
              f(x) = {problem.functionExpression}
            </code></div>
            <div>• 적분 구간: [{problem.lowerBound}, {problem.upperBound}]</div>
            {problem.exactValue && (
              <div>• 정확한 값: {problem.exactValue.toFixed(6)}</div>
            )}
            <div>• 난이도: {problem.difficulty === 'easy' ? '쉬움' : problem.difficulty === 'medium' ? '보통' : '어려움'}</div>
          </div>
        </div>

        <div style={{
          backgroundColor: '#eff6ff',
          borderLeft: '4px solid #3b82f6',
          borderRadius: '8px',
          padding: '16px',
          marginBottom: '16px'
        }}>
          <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px', color: '#1e40af' }}>
            사용 가능한 적분법
          </h3>
          <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '14px', color: '#1e40af', lineHeight: '1.8' }}>
            <li><strong>사다리꼴 법</strong>: 구간을 사다리꼴로 근사 (중간 정확도)</li>
            <li><strong>심슨 법</strong>: 2차 함수로 근사 (높은 정확도)</li>
            <li><strong>직사각형 법</strong>: 중점 높이의 직사각형 사용 (낮은 정확도)</li>
            <li><strong>몬테카를로 법</strong>: 무작위 샘플링 (확률적 방법)</li>
          </ul>
        </div>

        <div style={{
          backgroundColor: '#fef3c7',
          borderLeft: '4px solid #f59e0b',
          borderRadius: '8px',
          padding: '16px'
        }}>
          <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px', color: '#92400e' }}>
            💡 학습 팁
          </h3>
          <p style={{ margin: 0, fontSize: '14px', color: '#92400e', lineHeight: '1.6' }}>
            각 적분법의 애니메이션을 관찰하며 어떻게 함수의 넓이를 근사하는지 이해해보세요.
            "모든 방법 비교하기" 버튼을 눌러 정확도를 비교할 수 있습니다.
          </p>
        </div>
      </div>

      {/* 가상 스마트폰 화면 (우측 하단) */}
      <PhoneSimulator>
        <MethodSwitcher problem={problem} onSubmit={handleSubmit} />
      </PhoneSimulator>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default App;
