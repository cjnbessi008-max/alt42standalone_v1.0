import SmartphoneFrame from './components/SmartphoneFrame';
import EquationDisplay from './components/EquationDisplay';
import GraphCanvas from './components/GraphCanvas';
import EquationInput from './components/EquationInput';
import ProblemSelector from './components/ProblemSelector';
import { useEquationStore } from './store/equationStore';
import './index.css';

function App() {
  const { equation } = useEquationStore();

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 p-8">
      {/* 메인 화면 - 좌측 제어 패널 */}
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            Dual Sync 방정식 그래프
          </h1>
          <p className="text-gray-600">
            방정식과 그래프가 실시간으로 동기화됩니다
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 문제 선택 */}
          <ProblemSelector />

          {/* 매개변수 조절 */}
          <EquationInput />
        </div>

        <div className="mt-8 bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            사용법
          </h2>
          <ul className="text-gray-700 space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <span className="text-blue-500 font-bold">1.</span>
              <span>우측 하단의 스마트폰 화면에서 실시간 그래프를 확인하세요</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-500 font-bold">2.</span>
              <span>슬라이더를 조절하면 방정식과 그래프가 동시에 변경됩니다 (Dual Sync)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-500 font-bold">3.</span>
              <span>다양한 문제를 선택하여 연습할 수 있습니다</span>
            </li>
          </ul>
        </div>
      </div>

      {/* 우측 하단 스마트폰 화면 */}
      <SmartphoneFrame>
        <div className="h-full flex flex-col p-4">
          {/* 방정식 표시 영역 */}
          <div className="bg-white/80 backdrop-blur rounded-xl shadow-lg p-4 mb-4">
            <h3 className="text-xs text-gray-500 mb-2 text-center">현재 방정식</h3>
            <EquationDisplay equation={equation} />
          </div>

          {/* 그래프 영역 */}
          <div className="flex-1 bg-white/90 backdrop-blur rounded-xl shadow-lg overflow-hidden">
            <GraphCanvas equation={equation} />
          </div>
        </div>
      </SmartphoneFrame>
    </div>
  );
}

export default App;
