import { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '../store/authStore';
import { sessionAPI, questionAPI, staminaAPI } from '../services/api';
import StaminaMeter from '../components/StaminaMeter';
import QuestionCard from '../components/QuestionCard';
import SessionSummary from '../components/SessionSummary';

interface Session {
  id: number;
  userId: number;
  startedAt: string;
}

interface Question {
  id: number;
  questionNumber: number;
  questionText: string;
  questionType: string;
  correctAnswer: string;
  difficultyLevel: number;
}

interface StaminaMetrics {
  fatigueIndex: number;
  recommendedBreak: boolean;
  breakUrgency: string;
  accuracyRate: number;
  avgResponseTime: number;
}

export default function StudentPage() {
  const { user } = useAuthStore();
  const [session, setSession] = useState<Session | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [questionNumber, setQuestionNumber] = useState(1);
  const [staminaMetrics, setStaminaMetrics] = useState<StaminaMetrics | null>(null);
  const [sessionEnded, setSessionEnded] = useState(false);
  const [sessionSummary, setSessionSummary] = useState<any>(null);

  // Tracking metrics
  const [startTime, setStartTime] = useState<number>(0);
  const [hesitationCount, setHesitationCount] = useState(0);
  const [clickCount, setClickCount] = useState(0);
  const [keystrokeCount, setKeystrokeCount] = useState(0);
  const [focusLostCount, setFocusLostCount] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');

  const questionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    startSession();

    // Track focus loss
    const handleBlur = () => {
      if (session && currentQuestion) {
        setFocusLostCount((prev) => prev + 1);
      }
    };

    window.addEventListener('blur', handleBlur);
    return () => window.removeEventListener('blur', handleBlur);
  }, []);

  const startSession = async () => {
    try {
      const response = await sessionAPI.start();
      if (response.data.success) {
        setSession(response.data.session);
        generateQuestion(response.data.session.id, 1);
      }
    } catch (error) {
      console.error('Failed to start session:', error);
    }
  };

  const generateQuestion = async (sessionId: number, qNumber: number) => {
    // Generate a simple math question
    const num1 = Math.floor(Math.random() * 20) + 1;
    const num2 = Math.floor(Math.random() * 20) + 1;
    const operations = ['+', '-', '×'];
    const operation = operations[Math.floor(Math.random() * operations.length)];

    let correctAnswer: number;
    switch (operation) {
      case '+':
        correctAnswer = num1 + num2;
        break;
      case '-':
        correctAnswer = num1 - num2;
        break;
      case '×':
        correctAnswer = num1 * num2;
        break;
      default:
        correctAnswer = 0;
    }

    const questionText = `${num1} ${operation} ${num2} = ?`;

    try {
      const response = await questionAPI.create({
        sessionId,
        questionNumber: qNumber,
        questionText,
        questionType: 'fill_in',
        correctAnswer: correctAnswer.toString(),
        difficultyLevel: Math.ceil(qNumber / 5),
      });

      if (response.data.success) {
        setCurrentQuestion(response.data.question);
        setStartTime(Date.now());
        setUserAnswer('');
        setHesitationCount(0);
        setClickCount(0);
        setKeystrokeCount(0);
        setFocusLostCount(0);
      }
    } catch (error) {
      console.error('Failed to create question:', error);
    }
  };

  const handleAnswerChange = (value: string) => {
    if (userAnswer !== '' && value === '') {
      setHesitationCount((prev) => prev + 1);
    }
    setUserAnswer(value);
    setKeystrokeCount((prev) => prev + 1);
  };

  const handleSubmitAnswer = async () => {
    if (!currentQuestion || !session) return;

    const responseTimeMs = Date.now() - startTime;
    setClickCount((prev) => prev + 1);

    try {
      const response = await questionAPI.answer(currentQuestion.id, {
        userAnswer,
        responseTimeMs,
        hesitationCount,
        clickCount: clickCount + 1,
        keystrokeCount,
        focusLostCount,
      });

      if (response.data.success) {
        // Fetch updated stamina metrics
        fetchStaminaMetrics();

        // Wait a moment to show feedback, then next question
        setTimeout(() => {
          if (questionNumber < 20) {
            setQuestionNumber((prev) => prev + 1);
            generateQuestion(session.id, questionNumber + 1);
          } else {
            endSession();
          }
        }, 1000);
      }
    } catch (error) {
      console.error('Failed to submit answer:', error);
    }
  };

  const fetchStaminaMetrics = async () => {
    if (!session) return;

    try {
      const response = await staminaAPI.getSessionMetrics(session.id);
      if (response.data.success && response.data.metrics) {
        setStaminaMetrics({
          fatigueIndex: parseFloat(response.data.metrics.fatigue_index),
          recommendedBreak: response.data.metrics.recommended_break,
          breakUrgency: response.data.metrics.break_urgency,
          accuracyRate: parseFloat(response.data.metrics.accuracy_rate),
          avgResponseTime: parseFloat(response.data.metrics.avg_response_time_ms),
        });
      }
    } catch (error) {
      console.error('Failed to fetch stamina metrics:', error);
    }
  };

  const endSession = async () => {
    if (!session) return;

    try {
      const response = await sessionAPI.end(session.id);
      if (response.data.success) {
        setSessionSummary(response.data.session);
        setSessionEnded(true);
      }
    } catch (error) {
      console.error('Failed to end session:', error);
    }
  };

  const handleRestart = () => {
    setSessionEnded(false);
    setQuestionNumber(1);
    setStaminaMetrics(null);
    startSession();
  };

  if (sessionEnded && sessionSummary) {
    return <SessionSummary summary={sessionSummary} onRestart={handleRestart} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            사고 체력 측정 학습
          </h1>
          <p className="text-gray-600">
            환영합니다, {user?.fullName}님! 문제를 풀면서 사고 체력을 측정합니다.
          </p>
        </div>

        {/* Stamina Meter */}
        {staminaMetrics && (
          <div className="mb-6">
            <StaminaMeter metrics={staminaMetrics} />
          </div>
        )}

        {/* Progress */}
        <div className="card mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">진행 상황</span>
            <span className="text-sm text-gray-600">
              {questionNumber} / 20 문제
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-primary-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(questionNumber / 20) * 100}%` }}
            />
          </div>
        </div>

        {/* Question Card */}
        {currentQuestion && (
          <div ref={questionRef}>
            <QuestionCard
              question={currentQuestion}
              userAnswer={userAnswer}
              onAnswerChange={handleAnswerChange}
              onSubmit={handleSubmitAnswer}
              onClick={() => setClickCount((prev) => prev + 1)}
            />
          </div>
        )}

        {/* Break Recommendation */}
        {staminaMetrics?.recommendedBreak && (
          <div className={`card mt-6 ${
            staminaMetrics.breakUrgency === 'required' ? 'bg-red-50 border-2 border-red-300 pulse-warning' :
            staminaMetrics.breakUrgency === 'recommended' ? 'bg-yellow-50 border-2 border-yellow-300' :
            'bg-blue-50 border-2 border-blue-300'
          }`}>
            <h3 className="font-bold text-lg mb-2">
              {staminaMetrics.breakUrgency === 'required' ? '⚠️ 휴식이 필요합니다!' :
               staminaMetrics.breakUrgency === 'recommended' ? '💡 휴식을 권장합니다' :
               'ℹ️ 잠시 쉬어가세요'}
            </h3>
            <p className="text-gray-700">
              사고 체력이 저하되고 있습니다. 짧은 휴식 후 더 좋은 성과를 낼 수 있습니다.
            </p>
            <button
              onClick={endSession}
              className="btn btn-warning mt-4"
            >
              지금 휴식하기
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
