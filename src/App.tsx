import { useState, useEffect } from 'react';
import { SmartphoneFrame } from './components/SmartphoneFrame';
import { GraphView } from './components/GraphView';
import { ProblemDisplay } from './components/ProblemDisplay';
import { fetchProblemFromLMS } from './utils/lmsAdapter';
import { deriveFunction } from './utils/derivative';
import type { Problem, MathFunction, AnimationState } from './types';

function App() {
  const [problem, setProblem] = useState<Problem | null>(null);
  const [functions, setFunctions] = useState<MathFunction[]>([]);
  const [animationState, setAnimationState] = useState<AnimationState>('idle');
  const [isDerivativeShown, setIsDerivativeShown] = useState(false);
  const [loading, setLoading] = useState(true);

  // 컴포넌트 마운트 시 LMS에서 문제 가져오기
  useEffect(() => {
    loadProblem();
  }, []);

  const loadProblem = async () => {
    setLoading(true);
    try {
      const fetchedProblem = await fetchProblemFromLMS();
      setProblem(fetchedProblem);
      setFunctions([fetchedProblem.function]);
      setIsDerivativeShown(false);
    } catch (error) {
      console.error('문제 로딩 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  // Derivative Pulse 애니메이션 실행
  const handleDerivative = async () => {
    if (!problem || isDerivativeShown) return;

    // 1단계: Pulse 애니메이션 시작
    setAnimationState('pulsing');

    // 600ms 후 (애니메이션 완료 후)
    setTimeout(() => {
      // 2단계: 미분 함수 추가
      const derivedFunc = deriveFunction(problem.function);
      setFunctions([problem.function, derivedFunc]);
      setAnimationState('transitioning');

      // 3단계: 전환 애니메이션 후 idle로 복귀
      setTimeout(() => {
        setAnimationState('idle');
        setIsDerivativeShown(true);
      }, 800);
    }, 600);
  };

  // 다음 문제 로드
  const handleNextProblem = () => {
    loadProblem();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white text-xl font-semibold">문제 로딩 중...</div>
      </div>
    );
  }

  if (!problem) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white text-xl font-semibold">문제를 찾을 수 없습니다</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8">
      {/* 메인 대시보드 */}
      <div className="max-w-6xl mx-auto">
        <header className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-white mb-2">
            AI 교육 시스템
          </h1>
          <p className="text-purple-200">
            Derivative Pulse 애니메이션과 함께하는 미분 학습
          </p>
        </header>

        {/* LMS 연동 정보 */}
        <div className="mb-6 bg-white/10 backdrop-blur-md rounded-lg p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-80">📚 LMS 연동</p>
              <p className="font-semibold">Moodle Mock 데이터 (문제 ID: {problem.id})</p>
            </div>
            <button
              onClick={handleNextProblem}
              className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors text-sm font-semibold"
            >
              다음 문제
            </button>
          </div>
        </div>

        {/* 데스크톱 뷰 */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">📊 함수 시각화</h2>
          <GraphView
            functions={functions}
            animationState={animationState}
            xRange={[-5, 5]}
          />

          {/* 설명 */}
          <div className="mt-4 p-4 bg-white/5 rounded-lg">
            <h3 className="text-white font-semibold mb-2">💡 Derivative Pulse란?</h3>
            <p className="text-purple-100 text-sm">
              미분 버튼을 누르면 그래프가 <strong>살짝 수축하는 펄스 애니메이션</strong>이 나타나며,
              원본 함수의 미분 함수가 빨간색 선으로 추가됩니다.
              이 시각적 효과는 미분이 함수의 순간 변화율을 나타낸다는 개념을 직관적으로 전달합니다.
            </p>
          </div>
        </div>
      </div>

      {/* 우측 하단 스마트폰 화면 */}
      <SmartphoneFrame>
        <div className="h-full flex flex-col">
          <ProblemDisplay
            problem={problem}
            onDerivative={handleDerivative}
            isDerivativeShown={isDerivativeShown}
          />

          <div className="flex-1">
            <GraphView
              functions={functions}
              animationState={animationState}
              xRange={[-5, 5]}
            />
          </div>

          {/* 결과 표시 */}
          {isDerivativeShown && (
            <div className="p-6 bg-green-50 border-t border-green-200">
              <div className="flex items-start gap-3">
                <div className="text-2xl">✅</div>
                <div>
                  <h4 className="font-semibold text-green-900 mb-1">미분 완료!</h4>
                  <p className="text-sm text-green-700">
                    빨간색 선이 미분 함수 f'(x)입니다.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </SmartphoneFrame>
    </div>
  );
}

export default App;
