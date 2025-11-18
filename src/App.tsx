import React, { useState, useEffect } from 'react';
import SmartphoneFrame from './components/SmartphoneFrame';
import BreakRippleAnimation from './components/BreakRippleAnimation';
import ProblemDisplay from './components/ProblemDisplay';
import { Problem, LMSProblemResponse } from './types';
import { getLMSService } from './utils/lmsService';

const App: React.FC = () => {
  const [currentProblem, setCurrentProblem] = useState<Problem | null>(null);
  const [sessionId, setSessionId] = useState<string>('');
  const [selectedProblemId, setSelectedProblemId] = useState<string>('1');
  const [loading, setLoading] = useState<boolean>(false);
  const [showSmartphone, setShowSmartphone] = useState<boolean>(true);
  const [feedback, setFeedback] = useState<string>('');

  // Load problem from LMS
  const loadProblem = async (problemId: string) => {
    setLoading(true);
    setFeedback('');

    try {
      const lmsService = getLMSService();
      const response: LMSProblemResponse = await lmsService.fetchProblem(problemId);

      if (response.success) {
        setCurrentProblem(response.problem);
        setSessionId(response.sessionId || '');
      } else {
        setFeedback(`문제를 불러오는데 실패했습니다: ${response.error}`);
      }
    } catch (error) {
      console.error('Error loading problem:', error);
      setFeedback('문제를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // Load initial problem
  useEffect(() => {
    loadProblem(selectedProblemId);
  }, []);

  // Handle problem selection change
  const handleProblemChange = (problemId: string) => {
    setSelectedProblemId(problemId);
    loadProblem(problemId);
  };

  // Handle answer submission
  const handleSubmitAnswer = async (answer: string) => {
    if (!currentProblem) return;

    const lmsService = getLMSService();

    try {
      const result = await lmsService.submitAnswer({
        problemId: currentProblem.id,
        studentId: 'demo_student',
        sessionId: sessionId,
        answer: answer,
        timeSpent: 0,
        attempts: 1,
        timestamp: new Date().toISOString()
      });

      if (result.success) {
        if (result.correct) {
          setFeedback('✅ 정답입니다! (Correct!)');
        } else {
          setFeedback(`❌ 틀렸습니다. ${result.feedback || '다시 시도해보세요.'}`);
        }
      } else {
        setFeedback('답안 제출에 실패했습니다.');
      }
    } catch (error) {
      console.error('Error submitting answer:', error);
      setFeedback('답안 제출 중 오류가 발생했습니다.');
    }
  };

  // Handle discontinuity reached event
  const handleDiscontinuityReached = (x: number) => {
    console.log(`Ripple reached discontinuity at x = ${x}`);
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f0f2f5',
      padding: '20px'
    }}>
      {/* Header */}
      <header style={{
        backgroundColor: '#2196F3',
        color: 'white',
        padding: '20px',
        borderRadius: '8px',
        marginBottom: '20px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <h1 style={{ margin: 0, fontSize: '28px' }}>
          🌊 Break Ripple Animation
        </h1>
        <p style={{ margin: '10px 0 0 0', fontSize: '16px', opacity: 0.9 }}>
          불연속점 시각화 도구 | KAIST Touch Math Academy
        </p>
      </header>

      {/* Main Content */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: showSmartphone ? '1fr 400px' : '1fr',
        gap: '20px',
        maxWidth: '1600px',
        margin: '0 auto'
      }}>
        {/* Left Panel - Desktop View */}
        <div>
          {/* Problem Selector */}
          <div style={{
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '8px',
            marginBottom: '20px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{ marginTop: 0 }}>문제 선택 (Select Problem)</h3>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              {['1', '2', '3'].map((id) => (
                <button
                  key={id}
                  onClick={() => handleProblemChange(id)}
                  disabled={loading}
                  style={{
                    padding: '10px 20px',
                    fontSize: '16px',
                    backgroundColor: selectedProblemId === id ? '#2196F3' : '#e0e0e0',
                    color: selectedProblemId === id ? 'white' : '#333',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    fontWeight: selectedProblemId === id ? 'bold' : 'normal'
                  }}
                >
                  문제 {id}
                </button>
              ))}

              <button
                onClick={() => setShowSmartphone(!showSmartphone)}
                style={{
                  padding: '10px 20px',
                  fontSize: '16px',
                  backgroundColor: '#FF9800',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  marginLeft: 'auto'
                }}
              >
                📱 {showSmartphone ? '스마트폰 숨기기' : '스마트폰 보기'}
              </button>
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div style={{
              backgroundColor: 'white',
              padding: '40px',
              borderRadius: '8px',
              textAlign: 'center',
              fontSize: '18px',
              color: '#666'
            }}>
              문제를 불러오는 중...
            </div>
          )}

          {/* Problem Display */}
          {!loading && currentProblem && (
            <div style={{
              backgroundColor: 'white',
              borderRadius: '8px',
              padding: '20px',
              marginBottom: '20px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
              <ProblemDisplay
                problem={currentProblem}
                onSubmitAnswer={handleSubmitAnswer}
                sessionId={sessionId}
              />

              {/* Feedback */}
              {feedback && (
                <div style={{
                  marginTop: '15px',
                  padding: '15px',
                  backgroundColor: feedback.includes('✅') ? '#E8F5E9' : '#FFEBEE',
                  color: feedback.includes('✅') ? '#2E7D32' : '#C62828',
                  borderRadius: '4px',
                  fontSize: '16px',
                  fontWeight: 'bold'
                }}>
                  {feedback}
                </div>
              )}
            </div>
          )}

          {/* Animation Display */}
          {!loading && currentProblem && (
            <div style={{
              backgroundColor: 'white',
              borderRadius: '8px',
              padding: '20px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
              <h3 style={{ marginTop: 0 }}>
                애니메이션 (Animation)
              </h3>
              <BreakRippleAnimation
                mathFunction={currentProblem.mathFunction}
                onDiscontinuityReached={handleDiscontinuityReached}
                config={{
                  speed: 1.0,
                  amplitude: 20,
                  frequency: 2,
                  color: '#2196F3',
                  showDiscontinuity: true,
                  autoPlay: true
                }}
              />
            </div>
          )}
        </div>

        {/* Right Panel - Smartphone Display */}
        {showSmartphone && currentProblem && (
          <div style={{
            position: 'sticky',
            top: '20px',
            height: 'fit-content'
          }}>
            <div style={{
              backgroundColor: 'white',
              borderRadius: '8px',
              padding: '20px',
              marginBottom: '20px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              textAlign: 'center'
            }}>
              <h3 style={{ marginTop: 0 }}>
                📱 스마트폰 미리보기
              </h3>
              <p style={{ fontSize: '14px', color: '#666', margin: 0 }}>
                학생들이 보게 될 화면입니다
              </p>
            </div>

            <SmartphoneFrame
              config={{
                width: 375,
                height: 667,
                position: 'bottom-right',
                scale: 0.9,
                showFrame: true
              }}
            >
              <div style={{ padding: '10px' }}>
                <div style={{
                  backgroundColor: '#2196F3',
                  color: 'white',
                  padding: '15px',
                  borderRadius: '8px 8px 0 0',
                  marginBottom: '10px'
                }}>
                  <h2 style={{
                    margin: 0,
                    fontSize: '18px',
                    textAlign: 'center'
                  }}>
                    {currentProblem.title}
                  </h2>
                </div>

                <BreakRippleAnimation
                  mathFunction={currentProblem.mathFunction}
                  onDiscontinuityReached={handleDiscontinuityReached}
                  width={355}
                  height={350}
                  config={{
                    speed: 1.0,
                    amplitude: 15,
                    frequency: 2,
                    color: '#2196F3',
                    showDiscontinuity: true,
                    autoPlay: true
                  }}
                />

                <div style={{
                  padding: '10px',
                  backgroundColor: '#f5f5f5',
                  borderRadius: '4px',
                  marginTop: '10px',
                  fontSize: '12px'
                }}>
                  <p style={{ margin: '5px 0' }}>
                    <strong>{currentProblem.instructions}</strong>
                  </p>
                </div>
              </div>
            </SmartphoneFrame>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer style={{
        marginTop: '40px',
        padding: '20px',
        textAlign: 'center',
        color: '#666',
        fontSize: '14px'
      }}>
        <p>
          LMS 연동: Moodle 3.7 | MySQL 5.7 | PHP 7.1.9
        </p>
        <p>
          © 2025 KAIST Touch Math Academy - AI Education System Pipeline
        </p>
      </footer>
    </div>
  );
};

export default App;
