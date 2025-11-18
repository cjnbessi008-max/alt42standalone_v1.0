import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Formula, Question, LearningPhase, LearningSession } from '../types';
import { generateQuestions } from '../utils/formulaParser';
import { FormulaDisplay } from './FormulaDisplay';
import { QuestionDisplay } from './QuestionDisplay';
import { startSession, completeSession, updateSession } from '../utils/stats';

interface LearningFlowProps {
  formula: Formula;
  onComplete?: () => void;
  onRestart: () => void;
}

export const LearningFlow: React.FC<LearningFlowProps> = ({
  formula,
  onComplete,
  onRestart
}) => {
  const [phase, setPhase] = useState<LearningPhase>('initial-view');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [showFormula, setShowFormula] = useState(true);
  const [cycleCount, setCycleCount] = useState(0);
  const [questionsAnswered, setQuestionsAnswered] = useState(0);
  const sessionRef = useRef<LearningSession | null>(null);

  // 공식이 변경되면 질문 생성 및 세션 시작
  useEffect(() => {
    const generatedQuestions = generateQuestions(formula);
    setQuestions(generatedQuestions);
    setPhase('initial-view');
    setShowFormula(true);
    setCurrentQuestionIndex(0);
    setCycleCount(0);
    setQuestionsAnswered(0);

    // 새 세션 시작
    sessionRef.current = startSession(formula.id, formula.text);
  }, [formula]);

  // 초기 공식 표시 후 자동으로 첫 질문으로 이동
  useEffect(() => {
    if (phase === 'initial-view') {
      const timer = setTimeout(() => {
        setShowFormula(false);
        setTimeout(() => {
          setPhase('question');
        }, 600);
      }, 3000); // 3초간 공식 표시

      return () => clearTimeout(timer);
    }
  }, [phase]);

  const handleReveal = () => {
    setShowFormula(true);
    setPhase('reveal');

    // 질문 답변 카운트 증가
    setQuestionsAnswered(prev => prev + 1);

    // 2초 후 다음 단계로
    setTimeout(() => {
      setShowFormula(false);
      setTimeout(() => {
        if (currentQuestionIndex < questions.length - 1) {
          // 다음 질문으로
          setCurrentQuestionIndex(prev => prev + 1);
          setPhase('question');
        } else {
          // 모든 질문 완료 - 한 번 더 순환할지 완료할지 결정
          if (cycleCount < 2) {
            // 처음부터 다시 시작 (총 3회 반복)
            setCurrentQuestionIndex(0);
            setPhase('question');
            setCycleCount(prev => prev + 1);
          } else {
            // 학습 완료
            setPhase('complete');

            // 세션 완료 처리
            if (sessionRef.current) {
              const updatedSession = updateSession(
                sessionRef.current,
                questionsAnswered + 1,
                cycleCount + 1
              );
              completeSession(updatedSession);
            }

            onComplete?.();
          }
        }
      }, 600);
    }, 2500);
  };

  const currentQuestion = questions[currentQuestionIndex];
  const highlightComponentId = currentQuestion?.focusComponent;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 md:p-8">
      <div className="max-w-4xl mx-auto pt-8">
        {/* 헤더 */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">
            수학 공식 학습
          </h1>
          <p className="text-gray-600">
            반복 학습으로 공식을 완벽하게 기억하세요
          </p>
          {cycleCount > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="inline-block mt-2 px-4 py-2 bg-green-100 text-green-700 rounded-full text-sm font-medium"
            >
              🔄 반복 {cycleCount + 1}/3
            </motion.div>
          )}
        </motion.div>

        {/* 공식 표시 */}
        <FormulaDisplay
          formula={formula}
          visible={showFormula}
          highlightComponentId={highlightComponentId}
        />

        {/* 질문 표시 */}
        <AnimatePresence mode="wait">
          {phase === 'question' && currentQuestion && (
            <QuestionDisplay
              key={currentQuestion.id}
              question={currentQuestion}
              onReveal={handleReveal}
              questionNumber={currentQuestionIndex + 1}
              totalQuestions={questions.length}
            />
          )}
        </AnimatePresence>

        {/* 완료 화면 */}
        <AnimatePresence>
          {phase === 'complete' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="bg-white rounded-2xl shadow-xl p-8 text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring' }}
                className="text-6xl mb-4"
              >
                🎉
              </motion.div>
              <h2 className="text-3xl font-bold text-gray-800 mb-4">
                학습 완료!
              </h2>
              <p className="text-gray-600 mb-8">
                공식을 {cycleCount + 1}번 반복해서 학습했습니다.<br />
                이제 공식이 장기 기억에 저장되었을 거예요!
              </p>

              {/* 최종 공식 표시 */}
              <div className="mb-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl">
                <div className="text-4xl font-mono text-gray-800 mb-2">
                  {formula.text}
                </div>
                <p className="text-sm text-gray-600">
                  언제든 떠올릴 수 있도록 자주 복습하세요
                </p>
              </div>

              <div className="flex gap-4 justify-center">
                <button
                  onClick={onRestart}
                  className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg"
                >
                  새로운 공식 학습하기
                </button>
                <button
                  onClick={() => {
                    setCycleCount(0);
                    setCurrentQuestionIndex(0);
                    setPhase('initial-view');
                    setShowFormula(true);
                  }}
                  className="px-8 py-3 bg-white text-gray-700 border-2 border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition-all"
                >
                  다시 학습하기
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 하단 컨트롤 */}
        {phase !== 'complete' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center mt-8"
          >
            <button
              onClick={onRestart}
              className="text-gray-600 hover:text-gray-800 underline text-sm"
            >
              다른 공식으로 변경
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
};
