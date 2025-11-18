import { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, Lightbulb, Send, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { attemptsAPI, problemsAPI } from '../../services/api';
import { socketService } from '../../services/socket';
import { useBehaviorTracking } from '../../hooks/useBehaviorTracking';
import type { User, Problem, StudentAttempt, Hint } from '../../types';

interface ProblemSolverProps {
  problem: Problem;
  student: User;
  onBack: () => void;
}

export default function ProblemSolver({ problem, student, onBack }: ProblemSolverProps) {
  const [attempt, setAttempt] = useState<StudentAttempt | null>(null);
  const [answer, setAnswer] = useState('');
  const [startTime] = useState(Date.now());
  const [showHint, setShowHint] = useState(false);
  const [currentHint, setCurrentHint] = useState<Hint | null>(null);
  const [hintLevel, setHintLevel] = useState(0);
  const [overthinkingNotification, setOverthinkingNotification] = useState<any>(null);
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<{ isCorrect: boolean; message: string } | null>(null);

  const { trackEvent } = useBehaviorTracking({
    studentId: student.id,
    problemId: problem.id,
    attemptId: attempt?.id || '',
    enabled: !!attempt && !submitted,
  });

  useEffect(() => {
    startAttempt();
    setupSocket();

    return () => {
      socketService.disconnect();
    };
  }, []);

  const startAttempt = async () => {
    try {
      const attemptData = await attemptsAPI.start(student.id, problem.id);
      setAttempt(attemptData);

      // Join socket room
      const socket = socketService.connect();
      socketService.studentJoin(student.id, problem.id, attemptData.id);
    } catch (error) {
      console.error('Failed to start attempt:', error);
    }
  };

  const setupSocket = () => {
    // Listen for hint suggestions
    socketService.onHintSuggest((data) => {
      setOverthinkingNotification({
        type: 'hint',
        message: data.message,
        eventId: data.eventId,
        score: data.score,
      });
    });

    // Listen for overthinking alerts
    socketService.onOverthinkingAlert((data) => {
      setOverthinkingNotification({
        type: 'alert',
        message: data.message,
        eventId: data.eventId,
        score: data.score,
      });
    });

    // Listen for hint responses
    socketService.onHintResponse((hint) => {
      setCurrentHint(hint);
      setShowHint(true);
    });
  };

  const handleAnswerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newAnswer = e.target.value;
    setAnswer(newAnswer);

    // Track answer modification
    if (attempt) {
      trackEvent('input_change', { value: newAnswer });

      if (newAnswer !== attempt.answer) {
        trackEvent('answer_modify');
        attemptsAPI.update(attempt.id, newAnswer);
      }
    }
  };

  const handleRequestHint = async () => {
    const nextLevel = hintLevel + 1;
    setHintLevel(nextLevel);

    try {
      const hint = await problemsAPI.getHint(problem.id, nextLevel);
      setCurrentHint(hint);
      setShowHint(true);

      // Dismiss overthinking notification
      if (overthinkingNotification) {
        socketService.dismissOverthinking(overthinkingNotification.eventId);
        setOverthinkingNotification(null);
      }
    } catch (error) {
      console.error('Failed to get hint:', error);
    }
  };

  const handleDismissNotification = () => {
    if (overthinkingNotification) {
      socketService.dismissOverthinking(overthinkingNotification.eventId);
      setOverthinkingNotification(null);
    }
  };

  const handleSubmit = async () => {
    if (!attempt || !answer.trim()) return;

    const timeSpent = Math.floor((Date.now() - startTime) / 1000);

    try {
      const result = await attemptsAPI.submit(attempt.id, answer, timeSpent);
      setSubmitted(true);
      setResult({
        isCorrect: result.isCorrect || false,
        message: result.isCorrect
          ? '정답입니다! 잘하셨어요!'
          : `틀렸습니다. 정답은 "${problem.correctAnswer}"입니다.`,
      });

      trackEvent('submit', { isCorrect: result.isCorrect, timeSpent });
    } catch (error) {
      console.error('Failed to submit answer:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button
            onClick={onBack}
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-2"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            문제 목록으로 돌아가기
          </button>
          <h1 className="text-2xl font-bold text-gray-900">{problem.title}</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">문제</h2>
          <p className="text-gray-700 whitespace-pre-wrap mb-6">{problem.description}</p>

          {!submitted ? (
            <div className="space-y-4">
              <div>
                <label htmlFor="answer" className="block text-sm font-medium text-gray-700 mb-2">
                  답변
                </label>
                <input
                  id="answer"
                  type="text"
                  value={answer}
                  onChange={handleAnswerChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="답을 입력하세요"
                  autoFocus
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleSubmit}
                  disabled={!answer.trim()}
                  className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-4 h-4 mr-2" />
                  제출하기
                </button>

                {problem.hints && problem.hints.length > 0 && hintLevel < problem.hints.length && (
                  <button
                    onClick={handleRequestHint}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <Lightbulb className="w-4 h-4 mr-2" />
                    힌트 {hintLevel + 1}
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div
              className={`rounded-md p-4 ${
                result?.isCorrect
                  ? 'bg-green-50 border border-green-200'
                  : 'bg-red-50 border border-red-200'
              }`}
            >
              <div className="flex items-start">
                {result?.isCorrect ? (
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-600 mt-0.5" />
                )}
                <div className="ml-3 flex-1">
                  <h3
                    className={`text-sm font-medium ${
                      result?.isCorrect ? 'text-green-800' : 'text-red-800'
                    }`}
                  >
                    {result?.message}
                  </h3>
                  <div className="mt-4">
                    <button
                      onClick={onBack}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                    >
                      다른 문제 풀기
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Overthinking Notification */}
        {overthinkingNotification && !submitted && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6 rounded">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertCircle className="h-5 w-5 text-yellow-400" />
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm text-yellow-700">{overthinkingNotification.message}</p>
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={handleRequestHint}
                    className="text-sm font-medium text-yellow-800 hover:text-yellow-900"
                  >
                    힌트 보기
                  </button>
                  <button
                    onClick={handleDismissNotification}
                    className="text-sm font-medium text-yellow-600 hover:text-yellow-700"
                  >
                    괜찮아요
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Hint Display */}
        {showHint && currentHint && (
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
            <div className="flex">
              <div className="flex-shrink-0">
                <Lightbulb className="h-5 w-5 text-blue-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">힌트 {currentHint.level}</h3>
                <p className="mt-2 text-sm text-blue-700">{currentHint.text}</p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
