import { useEffect, useState } from 'react';
import { HistogramBeat } from './components/HistogramBeat';
import { SmartphoneFrame } from './components/SmartphoneFrame';
import { useResponsive } from './hooks/useResponsive';
import type { ProblemData, HistogramData } from './types/histogram.types';
import { getMoodleSessionFromUrl, loadProblem, submitAnswer, getMockProblemData } from './utils/lmsApi';
import type { MoodleSession } from './types/lms.types';

function App() {
  const responsive = useResponsive();
  const [problemData, setProblemData] = useState<ProblemData | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [moodleSession, setMoodleSession] = useState<MoodleSession | null>(null);
  const [startTime] = useState(Date.now());

  // LMS 세션 및 문제 데이터 로드
  useEffect(() => {
    const initializeApp = async () => {
      setLoading(true);

      // URL에서 Moodle 세션 정보 추출
      const session = getMoodleSessionFromUrl();
      setMoodleSession(session);

      if (session) {
        // 실제 LMS에서 문제 불러오기
        try {
          const response = await loadProblem({
            sessionKey: session.sessionKey,
            activityId: session.activityId,
          });

          if (response.success && response.data) {
            setProblemData(response.data);
          } else {
            // LMS 연동 실패시 Mock 데이터 사용
            console.warn('LMS 연동 실패, Mock 데이터 사용:', response.error);
            setProblemData(getMockProblemData());
          }
        } catch (error) {
          console.error('문제 로드 실패:', error);
          setProblemData(getMockProblemData());
        }
      } else {
        // URL 파라미터가 없을 경우 Mock 데이터 사용 (개발/테스트)
        console.log('개발 모드: Mock 데이터 사용');
        setProblemData(getMockProblemData());
      }

      setLoading(false);
    };

    initializeApp();
  }, []);

  // 막대 클릭 핸들러
  const handleBarClick = (index: number, data: HistogramData) => {
    console.log('Bar clicked:', index, data);
    setSelectedAnswer(data.label);
    setFeedback('');
  };

  // 답안 제출
  const handleSubmit = async () => {
    if (!selectedAnswer || !problemData) return;

    const timeSpent = Math.floor((Date.now() - startTime) / 1000);

    // 정답 확인
    const isCorrect = selectedAnswer === problemData.correctAnswer;

    if (moodleSession) {
      // LMS에 제출
      try {
        const response = await submitAnswer({
          sessionKey: moodleSession.sessionKey,
          problemId: problemData.id,
          answer: selectedAnswer,
          timeSpent,
        });

        if (response.success && response.data) {
          setFeedback(
            response.data.correct
              ? `정답입니다! 🎉 (점수: ${response.data.score})`
              : `오답입니다. ${response.data.feedback || ''}`
          );
        }
      } catch (error) {
        console.error('답안 제출 실패:', error);
        setFeedback(isCorrect ? '정답입니다! 🎉' : '오답입니다.');
      }
    } else {
      // Mock 피드백
      setFeedback(isCorrect ? '정답입니다! 🎉' : '오답입니다. 다시 시도해보세요.');
    }
  };

  // 히스토그램 컨텐츠
  const histogramContent = (
    <div
      style={{
        padding: '20px',
        maxWidth: '800px',
        margin: '0 auto',
      }}
    >
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <div
            style={{
              display: 'inline-block',
              width: '50px',
              height: '50px',
              border: '4px solid #f3f3f3',
              borderTop: '4px solid #667eea',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
            }}
          />
          <p style={{ marginTop: '20px', color: '#666' }}>문제를 불러오는 중...</p>
        </div>
      ) : problemData ? (
        <>
          {/* 문제 제목 */}
          <div
            style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              padding: '20px',
              borderRadius: '12px',
              marginBottom: '20px',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            }}
          >
            <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 'bold' }}>
              📊 Histogram Beat
            </h2>
            <p style={{ margin: '10px 0 0 0', fontSize: '14px', opacity: 0.9 }}>
              음악 리듬처럼 반응하는 히스토그램 학습 앱
            </p>
          </div>

          {/* 문제 텍스트 */}
          <div
            style={{
              background: '#f8f9fa',
              padding: '20px',
              borderRadius: '12px',
              marginBottom: '20px',
              border: '2px solid #e9ecef',
            }}
          >
            <h3 style={{ marginTop: 0, color: '#495057' }}>문제</h3>
            <p style={{ fontSize: '16px', lineHeight: '1.6', color: '#212529' }}>
              {problemData.questionText}
            </p>
          </div>

          {/* 히스토그램 */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              marginBottom: '20px',
            }}
          >
            <HistogramBeat
              data={problemData.histogramData}
              config={{
                width: Math.min(responsive.width - 80, 600),
                height: 400,
                beatIntensity: 0.2,
                beatFrequency: 1.5,
              }}
              onBarClick={handleBarClick}
            />
          </div>

          {/* 선택된 답안 */}
          {selectedAnswer && (
            <div
              style={{
                background: '#e7f5ff',
                border: '2px solid #339af0',
                padding: '15px',
                borderRadius: '8px',
                marginBottom: '20px',
              }}
            >
              <strong>선택한 답:</strong> {selectedAnswer}
            </div>
          )}

          {/* 피드백 */}
          {feedback && (
            <div
              style={{
                background: feedback.includes('정답') ? '#d3f9d8' : '#ffe3e3',
                border: `2px solid ${feedback.includes('정답') ? '#51cf66' : '#ff6b6b'}`,
                padding: '15px',
                borderRadius: '8px',
                marginBottom: '20px',
              }}
            >
              {feedback}
            </div>
          )}

          {/* 제출 버튼 */}
          <button
            onClick={handleSubmit}
            disabled={!selectedAnswer}
            style={{
              width: '100%',
              padding: '15px',
              fontSize: '18px',
              fontWeight: 'bold',
              color: 'white',
              background: selectedAnswer
                ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                : '#adb5bd',
              border: 'none',
              borderRadius: '8px',
              cursor: selectedAnswer ? 'pointer' : 'not-allowed',
              transition: 'all 0.3s ease',
            }}
            onMouseEnter={(e) => {
              if (selectedAnswer) {
                e.currentTarget.style.transform = 'scale(1.02)';
                e.currentTarget.style.boxShadow = '0 6px 12px rgba(102, 126, 234, 0.4)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            {selectedAnswer ? '답안 제출하기' : '막대를 클릭하여 답을 선택하세요'}
          </button>

          {/* 안내 메시지 */}
          <div
            style={{
              marginTop: '20px',
              padding: '15px',
              background: '#fff3bf',
              border: '1px solid #ffd43b',
              borderRadius: '8px',
              fontSize: '14px',
              color: '#495057',
            }}
          >
            💡 <strong>사용 방법:</strong> 히스토그램의 막대를 클릭하여 답을 선택하세요.
            막대들이 음악 리듬처럼 반응합니다!
          </div>
        </>
      ) : (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <p style={{ color: '#dc3545', fontSize: '18px' }}>
            문제를 불러올 수 없습니다.
          </p>
        </div>
      )}
    </div>
  );

  return (
    <>
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
      {responsive.isDesktop ? (
        <>
          {/* 데스크톱: 메인 화면 + 스마트폰 프레임 */}
          <div
            style={{
              minHeight: '100vh',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              padding: '40px 20px',
            }}
          >
            <div
              style={{
                maxWidth: '1200px',
                margin: '0 auto',
                background: 'white',
                borderRadius: '20px',
                padding: '40px',
                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
              }}
            >
              {histogramContent}
            </div>
          </div>
          <SmartphoneFrame position="bottom-right" width={375} height={667}>
            {histogramContent}
          </SmartphoneFrame>
        </>
      ) : (
        /* 모바일/태블릿: 전체 화면 */
        histogramContent
      )}
    </>
  );
}

export default App;
