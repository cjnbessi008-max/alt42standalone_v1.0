import React, { useState, useEffect, useCallback } from 'react';
import GraphCanvas from './components/GraphCanvas';
import {
  parseFunction,
  FunctionData,
  PRESET_FUNCTIONS
} from './utils/mathUtils';
import {
  parseMoodleParams,
  sendResponseToMoodle,
  notifyMoodleReady,
  reportProgress,
  StudentResponse
} from './utils/moodleIntegration';
import './App.css';

interface Interaction {
  x: number;
  y: number;
  slope: number;
  time: number;
}

const App: React.FC = () => {
  const [functionData, setFunctionData] = useState<FunctionData | null>(null);
  const [customExpression, setCustomExpression] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [problemId, setProblemId] = useState<string>('standalone');

  // 그래프 범위
  const [xMin, setXMin] = useState(-10);
  const [xMax, setXMax] = useState(10);
  const [yMin, setYMin] = useState(-10);
  const [yMax, setYMax] = useState(10);

  // Moodle 연동 초기화
  useEffect(() => {
    const moodleData = parseMoodleParams();

    if (moodleData) {
      // Moodle에서 전달된 문제 정보로 초기화
      setProblemId(moodleData.problemId);
      setXMin(moodleData.xMin);
      setXMax(moodleData.xMax);
      setYMin(moodleData.yMin);
      setYMax(moodleData.yMax);

      try {
        const fn = parseFunction(moodleData.functionExpression);
        setFunctionData(fn);
        setError(null);
      } catch (err) {
        setError(`함수 파싱 실패: ${err}`);
      }

      // Moodle에 준비 완료 알림
      notifyMoodleReady();
    } else {
      // 기본 함수 로드
      loadPresetFunction(0);
    }
  }, []);

  // 프리셋 함수 로드
  const loadPresetFunction = useCallback((index: number) => {
    const preset = PRESET_FUNCTIONS[index];
    if (!preset) return;

    try {
      const fn = parseFunction(preset.expression);
      setFunctionData(fn);
      setCustomExpression(preset.expression);
      setError(null);
      setShowMenu(false);
    } catch (err) {
      setError(`함수 로드 실패: ${err}`);
    }
  }, []);

  // 커스텀 함수 파싱
  const handleCustomFunction = useCallback(() => {
    if (!customExpression.trim()) {
      setError('함수 표현식을 입력하세요');
      return;
    }

    try {
      const fn = parseFunction(customExpression);
      setFunctionData(fn);
      setError(null);
      setShowMenu(false);
    } catch (err) {
      setError(`함수 파싱 실패: ${err}`);
    }
  }, [customExpression]);

  // 드래그 이벤트 핸들러
  const handleDragPoint = useCallback((x: number, y: number, slope: number) => {
    const interaction: Interaction = {
      x,
      y,
      slope,
      time: Date.now()
    };

    setInteractions(prev => [...prev, interaction]);

    // 진행률 보고 (10번 인터랙션마다)
    if (interactions.length % 10 === 0) {
      reportProgress(Math.min(100, interactions.length * 2));
    }
  }, [interactions.length]);

  // 완료 버튼 핸들러
  const handleComplete = useCallback(() => {
    const response: StudentResponse = {
      problemId,
      timestamp: Date.now(),
      interactions,
      completed: true
    };

    sendResponseToMoodle(response);
    reportProgress(100);

    alert('학습 결과가 저장되었습니다!');
  }, [problemId, interactions]);

  // 리셋 핸들러
  const handleReset = useCallback(() => {
    setInteractions([]);
    reportProgress(0);
  }, []);

  if (!functionData) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>함수를 로드하는 중...</p>
      </div>
    );
  }

  return (
    <div className="app">
      <GraphCanvas
        functionData={functionData}
        xMin={xMin}
        xMax={xMax}
        yMin={yMin}
        yMax={yMax}
        onDragPoint={handleDragPoint}
      />

      {/* 플로팅 메뉴 버튼 */}
      <button
        className="menu-toggle"
        onClick={() => setShowMenu(!showMenu)}
        aria-label="메뉴 열기"
      >
        ☰
      </button>

      {/* 사이드 메뉴 */}
      {showMenu && (
        <div className="side-menu">
          <div className="menu-header">
            <h2>Drag-to-Slope</h2>
            <button
              className="close-btn"
              onClick={() => setShowMenu(false)}
              aria-label="메뉴 닫기"
            >
              ✕
            </button>
          </div>

          <div className="menu-content">
            {/* 현재 함수 정보 */}
            <div className="function-info">
              <h3>현재 함수</h3>
              <div className="function-expression">
                f(x) = {functionData.expression}
              </div>
              <div className="derivative-expression">
                f'(x) = {functionData.derivativeExpression}
              </div>
            </div>

            {/* 프리셋 함수 목록 */}
            <div className="preset-functions">
              <h3>함수 선택</h3>
              {PRESET_FUNCTIONS.map((preset, index) => (
                <button
                  key={index}
                  className="preset-btn"
                  onClick={() => loadPresetFunction(index)}
                >
                  {preset.name}
                  <div className="preset-desc">{preset.description}</div>
                </button>
              ))}
            </div>

            {/* 커스텀 함수 입력 */}
            <div className="custom-function">
              <h3>직접 입력</h3>
              <input
                type="text"
                value={customExpression}
                onChange={(e) => setCustomExpression(e.target.value)}
                placeholder="예: x^2 + 2*x - 1"
                onKeyPress={(e) => e.key === 'Enter' && handleCustomFunction()}
              />
              <button onClick={handleCustomFunction}>적용</button>
            </div>

            {/* 에러 메시지 */}
            {error && (
              <div className="error-message">
                {error}
              </div>
            )}

            {/* 학습 통계 */}
            <div className="stats">
              <h3>학습 통계</h3>
              <p>인터랙션 횟수: {interactions.length}</p>
              <div className="action-buttons">
                <button onClick={handleReset} className="reset-btn">
                  초기화
                </button>
                <button onClick={handleComplete} className="complete-btn">
                  완료
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 도움말 오버레이 */}
      {interactions.length === 0 && (
        <div className="help-overlay">
          <div className="help-text">
            👆 그래프를 터치하거나 드래그하여<br />
            접선을 확인해보세요!
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
