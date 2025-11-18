import React, { useState, useEffect } from 'react';
import SubstitutionVisualizer from './components/student/substitution/SubstitutionVisualizer';
import type { SubstitutionProblem } from './types/substitution';
import './styles/substitution-glow.css';

/**
 * Main App Component
 * Substitution Glow 기능 데모
 */
function App() {
  const [problems, setProblems] = useState<any[]>([]);
  const [selectedProblem, setSelectedProblem] = useState<SubstitutionProblem | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [completionMessage, setCompletionMessage] = useState<string | null>(null);

  /**
   * 문제 목록 불러오기
   */
  useEffect(() => {
    fetchProblems();
  }, []);

  const fetchProblems = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/substitution/problems');
      const data = await response.json();

      if (data.success) {
        setProblems(data.problems);
      } else {
        setError('문제를 불러오는데 실패했습니다.');
      }
    } catch (err) {
      setError('서버 연결에 실패했습니다.');
      console.error('Error fetching problems:', err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * 특정 문제 불러오기
   */
  const loadProblem = async (problemId: string) => {
    try {
      setLoading(true);
      setError(null);
      setCompletionMessage(null);

      const response = await fetch(`/api/substitution/problems/${problemId}`);
      const data = await response.json();

      if (data.success) {
        setSelectedProblem(data.problem);
      } else {
        setError('문제를 불러오는데 실패했습니다.');
      }
    } catch (err) {
      setError('서버 연결에 실패했습니다.');
      console.error('Error loading problem:', err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * 문제 완료 처리
   */
  const handleComplete = (score: number) => {
    setCompletionMessage(
      `축하합니다! 문제를 완료했습니다. 점수: ${score}점`
    );

    setTimeout(() => {
      setSelectedProblem(null);
      setCompletionMessage(null);
    }, 3000);
  };

  /**
   * 문제 목록으로 돌아가기
   */
  const backToList = () => {
    setSelectedProblem(null);
    setCompletionMessage(null);
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '40px 20px'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        {/* 헤더 */}
        <header style={{
          textAlign: 'center',
          marginBottom: '40px',
          color: 'white'
        }}>
          <h1 style={{
            fontSize: '48px',
            fontWeight: 'bold',
            marginBottom: '16px',
            textShadow: '0 2px 4px rgba(0,0,0,0.2)'
          }}>
            ✨ Substitution Glow
          </h1>
          <p style={{
            fontSize: '20px',
            opacity: 0.9
          }}>
            치환 과정을 시각화하고 학습하세요
          </p>
          <p style={{
            fontSize: '16px',
            opacity: 0.8,
            marginTop: '8px'
          }}>
            AI Education System - KAIST Touch Math Academy
          </p>
        </header>

        {/* 메인 컨텐츠 */}
        <main style={{
          backgroundColor: 'white',
          borderRadius: '16px',
          padding: '32px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
          minHeight: '500px'
        }}>
          {/* 로딩 상태 */}
          {loading && (
            <div style={{
              textAlign: 'center',
              padding: '60px',
              fontSize: '18px',
              color: '#666'
            }}>
              로딩 중...
            </div>
          )}

          {/* 에러 메시지 */}
          {error && (
            <div style={{
              backgroundColor: '#ffebee',
              border: '2px solid #f44336',
              borderRadius: '8px',
              padding: '16px',
              marginBottom: '20px',
              color: '#c62828'
            }}>
              {error}
            </div>
          )}

          {/* 완료 메시지 */}
          {completionMessage && (
            <div style={{
              backgroundColor: '#e8f5e9',
              border: '2px solid #4caf50',
              borderRadius: '8px',
              padding: '20px',
              marginBottom: '20px',
              color: '#2e7d32',
              fontSize: '18px',
              textAlign: 'center',
              animation: 'fadeIn 0.5s ease-in-out'
            }}>
              {completionMessage}
            </div>
          )}

          {/* 문제 선택 화면 */}
          {!selectedProblem && !loading && (
            <div>
              <h2 style={{
                fontSize: '24px',
                fontWeight: 'bold',
                marginBottom: '24px',
                color: '#333'
              }}>
                문제 선택
              </h2>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                gap: '20px'
              }}>
                {problems.map((problem) => (
                  <div
                    key={problem.id}
                    onClick={() => loadProblem(problem.id)}
                    style={{
                      border: '2px solid #e0e0e0',
                      borderRadius: '12px',
                      padding: '24px',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      backgroundColor: '#fafafa'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#673AB7';
                      e.currentTarget.style.transform = 'translateY(-4px)';
                      e.currentTarget.style.boxShadow = '0 4px 16px rgba(103, 58, 183, 0.2)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#e0e0e0';
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <h3 style={{
                      fontSize: '20px',
                      fontWeight: 'bold',
                      marginBottom: '12px',
                      color: '#673AB7'
                    }}>
                      {problem.title}
                    </h3>
                    <p style={{
                      fontSize: '14px',
                      color: '#666',
                      marginBottom: '16px',
                      lineHeight: '1.5'
                    }}>
                      {problem.description}
                    </p>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      fontSize: '12px',
                      color: '#999'
                    }}>
                      <span>난이도: {'⭐'.repeat(problem.difficulty)}</span>
                      <span>{problem.stepCount}단계</span>
                    </div>
                  </div>
                ))}
              </div>

              {problems.length === 0 && !loading && (
                <div style={{
                  textAlign: 'center',
                  padding: '60px',
                  color: '#999'
                }}>
                  문제가 없습니다.
                </div>
              )}
            </div>
          )}

          {/* 문제 풀이 화면 */}
          {selectedProblem && !loading && (
            <div>
              <button
                onClick={backToList}
                style={{
                  marginBottom: '20px',
                  padding: '10px 20px',
                  fontSize: '14px',
                  backgroundColor: '#f5f5f5',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                ← 목록으로 돌아가기
              </button>

              <SubstitutionVisualizer
                problem={selectedProblem}
                onComplete={handleComplete}
              />
            </div>
          )}
        </main>

        {/* 푸터 */}
        <footer style={{
          textAlign: 'center',
          marginTop: '40px',
          color: 'white',
          opacity: 0.8,
          fontSize: '14px'
        }}>
          <p>AI Education System Pipeline - Version 1.0.0</p>
          <p>Developed with React, TypeScript, Node.js</p>
        </footer>
      </div>
    </div>
  );
}

export default App;
