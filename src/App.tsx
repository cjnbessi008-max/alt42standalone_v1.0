import React from 'react';
import { PhoneSimulator } from './components/PhoneSimulator';
import { LightInterval } from './components/LightInterval';
import { InequalityInput } from './components/InequalityInput';
import { useStore } from './store/useStore';

function App() {
  const { inequality, visualizationSettings } = useStore();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      {/* 헤더 */}
      <header className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-800 mb-2">
          Light Interval
        </h1>
        <p className="text-gray-600">
          부등식의 실수 해를 빛의 세기로 시각화하는 교육용 웹앱
        </p>
      </header>

      {/* 메인 콘텐츠 */}
      <main className="container mx-auto">
        {/* 부등식 입력 영역 */}
        <InequalityInput />

        {/* 설명 섹션 */}
        <div className="mt-12 max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Light Interval이란?
            </h2>
            <div className="space-y-3 text-gray-600">
              <p>
                부등식의 해를 추상적인 수직선이 아닌, <strong>빛의 세기</strong>로
                시각화하여 학생들이 직관적으로 이해할 수 있도록 돕는 교육 도구입니다.
              </p>
              <p>
                우측 하단의 스마트폰 화면에서 입력한 부등식의 해가 빛으로 표현됩니다:
              </p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>만족하는 구간은 <span className="text-yellow-600 font-semibold">밝게</span> 빛남</li>
                <li>만족하지 않는 구간은 어둡게 표시</li>
                <li>경계점은 포함 여부에 따라 다르게 표시</li>
                <li>열린 구간 (○)과 닫힌 구간 (●)이 명확히 구분됨</li>
              </ul>
            </div>
          </div>
        </div>

        {/* 기능 소개 */}
        <div className="mt-8 max-w-2xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <div className="text-3xl mb-2">🔢</div>
            <h3 className="font-semibold text-gray-800 mb-1">부등식 입력</h3>
            <p className="text-sm text-gray-600">
              간단한 형식으로 다양한 부등식 입력 가능
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <div className="text-3xl mb-2">💡</div>
            <h3 className="font-semibold text-gray-800 mb-1">빛 시각화</h3>
            <p className="text-sm text-gray-600">
              해를 빛의 세기로 직관적으로 표현
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <div className="text-3xl mb-2">📱</div>
            <h3 className="font-semibold text-gray-800 mb-1">스마트폰 UI</h3>
            <p className="text-sm text-gray-600">
              친숙한 모바일 인터페이스로 학습
            </p>
          </div>
        </div>
      </main>

      {/* 스마트폰 시뮬레이터 (우측 하단 고정) */}
      <PhoneSimulator>
        <div className="h-full flex flex-col">
          {/* 앱 헤더 */}
          <div className="bg-gradient-to-r from-primary to-secondary text-white p-4">
            <h2 className="text-lg font-bold">Light Interval</h2>
            <p className="text-sm opacity-90">빛으로 보는 부등식</p>
          </div>

          {/* Light Interval 시각화 영역 */}
          <div className="flex-1 flex items-center justify-center bg-gray-900">
            {inequality ? (
              <div className="w-full h-full">
                <LightInterval
                  inequality={inequality}
                  minValue={visualizationSettings.minValue}
                  maxValue={visualizationSettings.maxValue}
                  resolution={visualizationSettings.resolution}
                  lightColor={visualizationSettings.lightColor}
                  backgroundColor={visualizationSettings.backgroundColor}
                />
                {/* 정보 오버레이 */}
                <div className="absolute bottom-20 left-4 right-4 bg-black/70 text-white p-3 rounded-lg text-sm">
                  <p className="font-mono text-center text-lg mb-1">
                    {inequality.expression}
                  </p>
                  <p className="text-center text-xs opacity-75">
                    밝게 빛나는 구간이 해입니다
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-400 p-8">
                <div className="text-4xl mb-4">💡</div>
                <p className="text-sm">
                  부등식을 입력하면
                  <br />
                  여기에 빛으로 표현됩니다
                </p>
              </div>
            )}
          </div>
        </div>
      </PhoneSimulator>

      {/* 푸터 */}
      <footer className="mt-16 text-center text-gray-500 text-sm">
        <p>KAIST Touch Math Academy | Light Interval v1.0</p>
      </footer>
    </div>
  );
}

export default App;
