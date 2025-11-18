import React, { useState } from 'react';
import { useExamStore } from '../store/examStore';

interface ExamSetupScreenProps {
  onStart: () => void;
}

const ExamSetupScreen: React.FC<ExamSetupScreenProps> = ({ onStart }) => {
  const [examName, setExamName] = useState('');
  const [totalTimeMinutes, setTotalTimeMinutes] = useState(50);
  const [questionCount, setQuestionCount] = useState(25);
  const [preTensionLevel, setPreTensionLevel] = useState<number>(5);
  const [showBreathing, setShowBreathing] = useState(false);

  const createSession = useExamStore((state) => state.createSession);
  const startSession = useExamStore((state) => state.startSession);

  const handleStart = () => {
    if (!examName.trim()) {
      alert('시험 이름을 입력해주세요.');
      return;
    }

    createSession(examName, totalTimeMinutes, questionCount, preTensionLevel);
    setShowBreathing(true);
  };

  const handleBreathingComplete = () => {
    startSession();
    onStart();
  };

  if (showBreathing) {
    return <BreathingGuide onComplete={handleBreathingComplete} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-2xl w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">시험 시뮬레이터</h1>
          <p className="text-gray-600">점수 올려주는 시간 운영 근육을 키우세요</p>
        </div>

        <div className="space-y-6">
          {/* 시험 이름 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              시험 이름
            </label>
            <input
              type="text"
              value={examName}
              onChange={(e) => setExamName(e.target.value)}
              placeholder="예: 중2 1학기 중간고사, 모의고사 3회차"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* 시험 시간 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              총 시험 시간 (분)
            </label>
            <div className="flex items-center space-x-4">
              <input
                type="range"
                min="10"
                max="120"
                step="5"
                value={totalTimeMinutes}
                onChange={(e) => setTotalTimeMinutes(Number(e.target.value))}
                className="flex-1"
              />
              <span className="text-xl font-semibold text-blue-600 w-16 text-right">
                {totalTimeMinutes}분
              </span>
            </div>
          </div>

          {/* 문항 수 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              문항 수
            </label>
            <div className="flex items-center space-x-4">
              <input
                type="range"
                min="5"
                max="50"
                step="1"
                value={questionCount}
                onChange={(e) => setQuestionCount(Number(e.target.value))}
                className="flex-1"
              />
              <span className="text-xl font-semibold text-blue-600 w-16 text-right">
                {questionCount}개
              </span>
            </div>
          </div>

          {/* 긴장도 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              지금 긴장 정도는? (0: 매우 편안함 ~ 10: 매우 긴장됨)
            </label>
            <div className="flex items-center space-x-4">
              <input
                type="range"
                min="0"
                max="10"
                step="1"
                value={preTensionLevel}
                onChange={(e) => setPreTensionLevel(Number(e.target.value))}
                className="flex-1"
              />
              <span className="text-xl font-semibold text-blue-600 w-16 text-right">
                {preTensionLevel}
              </span>
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>😌 편안함</span>
              <span>😰 긴장됨</span>
            </div>
          </div>

          {/* 전략 설명 */}
          <div className="bg-blue-50 rounded-lg p-4 space-y-2">
            <h3 className="font-semibold text-gray-800">3라운드 전략</h3>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>• <span className="font-medium">1라운드:</span> 전 문제 훑기 + 쉬운 문제만 1분 안에 풀기</li>
              <li>• <span className="font-medium">2라운드:</span> 보통 난이도 문제 정리 (2분 이내)</li>
              <li>• <span className="font-medium">3라운드:</span> 어려운 문제 선택 공략 or 과감히 버리기</li>
            </ul>
          </div>

          {/* 시작 버튼 */}
          <button
            onClick={handleStart}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 rounded-lg transition-colors duration-200 shadow-lg hover:shadow-xl"
          >
            시험 시작하기
          </button>
        </div>
      </div>
    </div>
  );
};

// 호흡 가이드 컴포넌트
const BreathingGuide: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const [phase, setPhase] = useState<'inhale' | 'hold' | 'exhale'>('inhale');
  const [seconds, setSeconds] = useState(4);
  const [cycle, setCycle] = useState(0);

  React.useEffect(() => {
    const timer = setInterval(() => {
      setSeconds((prev) => {
        if (prev > 1) return prev - 1;

        // 다음 단계로 전환
        if (phase === 'inhale') {
          setPhase('hold');
          return 4;
        } else if (phase === 'hold') {
          setPhase('exhale');
          return 4;
        } else {
          // 사이클 완료
          const nextCycle = cycle + 1;
          if (nextCycle >= 2) {
            clearInterval(timer);
            setTimeout(onComplete, 500);
            return 0;
          }
          setCycle(nextCycle);
          setPhase('inhale');
          return 4;
        }
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [phase, cycle, onComplete]);

  const phaseText = {
    inhale: '들이마시기',
    hold: '멈추기',
    exhale: '내쉬기',
  };

  const phaseColor = {
    inhale: 'from-blue-400 to-blue-600',
    hold: 'from-purple-400 to-purple-600',
    exhale: 'from-green-400 to-green-600',
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-100 flex items-center justify-center p-4">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-8">
          시작하기 전에 심호흡 🧘‍♀️
        </h2>
        <p className="text-gray-600 mb-12">
          목표는 만점이 아니라 시간 안에 쉬운 문제를 하나도 안 남기는 것
        </p>

        <div className="relative">
          <div className={`w-48 h-48 mx-auto rounded-full bg-gradient-to-br ${phaseColor[phase]} flex items-center justify-center shadow-2xl transform transition-transform duration-1000 ${phase === 'inhale' ? 'scale-110' : phase === 'exhale' ? 'scale-90' : 'scale-100'}`}>
            <div className="text-white">
              <div className="text-4xl font-bold mb-2">{seconds}</div>
              <div className="text-lg">{phaseText[phase]}</div>
            </div>
          </div>
        </div>

        <div className="mt-8 text-gray-600">
          {cycle + 1} / 2 사이클
        </div>
      </div>
    </div>
  );
};

export default ExamSetupScreen;
