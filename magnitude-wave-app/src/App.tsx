import { useState } from 'react';
import { MagnitudeWave } from './components/MagnitudeWave';
import { MobilePreview } from './components/MobilePreview';
import { ControlPanel } from './components/ControlPanel';

function App() {
  const [magnitude, setMagnitude] = useState(50);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-blue-100 to-pink-100">
      {/* Header */}
      <header className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900">
            📊 Magnitude Wave - 숫자 크기 시각화
          </h1>
          <p className="mt-2 text-gray-600">
            LMS 연동형 수학 교육 애플리케이션 | Moodle 3.7 호환
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Main Display */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                메인 디스플레이
              </h2>
              <div className="flex justify-center">
                <MagnitudeWave magnitude={magnitude} width={500} height={350} />
              </div>
            </div>

            {/* Information Panel */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                💡 사용 방법
              </h3>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start">
                  <span className="mr-2">1️⃣</span>
                  <span>
                    오른쪽 패널에서 슬라이더나 직접 입력으로 값을 조절하세요.
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">2️⃣</span>
                  <span>
                    LMS 시뮬레이션에서 문제를 선택하면 답이 자동으로 적용됩니다.
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">3️⃣</span>
                  <span>
                    우측 하단의 모바일 미리보기에서 스마트폰 화면을 확인하세요.
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">4️⃣</span>
                  <span>
                    숫자가 클수록 물결의 진폭이 커지는 것을 관찰하세요.
                  </span>
                </li>
              </ul>
            </div>

            {/* Technical Info */}
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
              <h3 className="text-lg font-semibold mb-4">🔧 기술 스펙</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="opacity-80">LMS</p>
                  <p className="font-semibold">Moodle 3.7</p>
                </div>
                <div>
                  <p className="opacity-80">데이터베이스</p>
                  <p className="font-semibold">MySQL 5.7</p>
                </div>
                <div>
                  <p className="opacity-80">프론트엔드</p>
                  <p className="font-semibold">React + TypeScript</p>
                </div>
                <div>
                  <p className="opacity-80">애니메이션</p>
                  <p className="font-semibold">Canvas API</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Control Panel */}
          <div>
            <ControlPanel
              magnitude={magnitude}
              onMagnitudeChange={setMagnitude}
            />
          </div>
        </div>
      </main>

      {/* Mobile Preview - Fixed Bottom Right */}
      <MobilePreview magnitude={magnitude} />

      {/* Footer */}
      <footer className="mt-12 bg-white border-t">
        <div className="max-w-7xl mx-auto px-4 py-6 text-center text-gray-600 text-sm">
          <p>© 2024 Magnitude Wave | AI Education System</p>
          <p className="mt-1">Built with React, TypeScript, and Canvas API</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
