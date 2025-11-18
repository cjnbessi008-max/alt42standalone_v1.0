import { ReflectionCanvas } from './components/ReflectionCanvas';
import { SmartphoneFrame } from './components/SmartphoneFrame';
import { ControlPanel } from './components/ControlPanel';
import { Legend } from './components/Legend';
import { SettingsPanel } from './components/SettingsPanel';

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-800">
      {/* Main content area */}
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-2xl p-8 mb-6">
          <div className="text-center mb-6">
            <h1 className="text-4xl font-bold text-gray-800 mb-2">
              Reflection Pair: 지수-로그 거울 반사
            </h1>
            <p className="text-gray-600">
              지수 함수와 로그 함수의 역함수 관계를 시각적으로 탐구하세요
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div className="bg-gradient-to-br from-red-50 to-pink-50 p-5 rounded-xl border border-red-200">
              <h3 className="text-lg font-bold text-red-800 mb-2 flex items-center gap-2">
                <div className="w-3 h-3 bg-exponential rounded-full" />
                지수 함수
              </h3>
              <p className="text-sm text-gray-700 mb-2">
                <code className="bg-white px-2 py-1 rounded font-mono">y = b<sup>x</sup></code>
              </p>
              <p className="text-xs text-gray-600">
                x가 증가하면 y가 기하급수적으로 증가합니다. 정의역은 모든 실수이고 치역은 양수입니다.
              </p>
            </div>

            <div className="bg-gradient-to-br from-cyan-50 to-teal-50 p-5 rounded-xl border border-cyan-200">
              <h3 className="text-lg font-bold text-cyan-800 mb-2 flex items-center gap-2">
                <div className="w-3 h-3 bg-logarithmic rounded-full" />
                로그 함수
              </h3>
              <p className="text-sm text-gray-700 mb-2">
                <code className="bg-white px-2 py-1 rounded font-mono">y = log<sub>b</sub>(x)</code>
              </p>
              <p className="text-xs text-gray-600">
                지수 함수의 역함수입니다. 정의역은 양수이고 치역은 모든 실수입니다.
              </p>
            </div>
          </div>

          <div className="bg-gradient-to-br from-yellow-50 to-amber-50 p-5 rounded-xl border border-yellow-200">
            <h3 className="text-lg font-bold text-yellow-800 mb-2 flex items-center gap-2">
              <div className="w-6 h-0.5 bg-reflection border-dashed border border-reflection" />
              반사선: y = x
            </h3>
            <p className="text-sm text-gray-700 mb-2">
              두 함수는 대각선 <code className="bg-white px-2 py-1 rounded font-mono">y = x</code>를
              기준으로 완벽하게 대칭입니다.
            </p>
            <p className="text-xs text-gray-600">
              점 (a, b)가 지수 함수 위에 있으면, 점 (b, a)는 로그 함수 위에 있습니다.
              이것이 바로 역함수 관계입니다!
            </p>
          </div>
        </div>

        {/* Interactive Canvas Section */}
        <div className="bg-white rounded-2xl shadow-2xl p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center">
            대화형 시각화
          </h2>
          <div className="relative w-full h-[600px] bg-gray-50 rounded-xl overflow-hidden border-4 border-gray-200">
            <ReflectionCanvas />
            <Legend />
          </div>

          <div className="mt-6 grid md:grid-cols-3 gap-4 text-center">
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl mb-2">🖱️</div>
              <div className="font-semibold text-gray-800">드래그</div>
              <div className="text-sm text-gray-600">그래프 이동</div>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl mb-2">🔍</div>
              <div className="font-semibold text-gray-800">스크롤</div>
              <div className="text-sm text-gray-600">확대/축소</div>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl mb-2">📱</div>
              <div className="font-semibold text-gray-800">스마트폰</div>
              <div className="text-sm text-gray-600">우측 하단 확인</div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-white">
          <p className="text-sm opacity-80">
            © 2024 AI Education System | 독립형 웹앱 | React + TypeScript + Vite
          </p>
        </div>
      </div>

      {/* Settings panel */}
      <SettingsPanel />

      {/* Virtual smartphone display */}
      <SmartphoneFrame>
        <div className="relative w-full h-full">
          <ReflectionCanvas />
          <Legend />
          <ControlPanel />
        </div>
      </SmartphoneFrame>
    </div>
  );
}

export default App;
