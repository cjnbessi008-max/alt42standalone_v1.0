import { useState } from 'react'
import PhoneFrame from './components/PhoneSimulator/PhoneFrame'

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="text-3xl">🎵</div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Term Melody</h1>
                <p className="text-sm text-gray-500">항의 변화를 음악으로</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                연결됨
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Side - Dashboard */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">문제 목록</h2>
              <div className="text-gray-500 text-center py-12">
                <p className="mb-2">Moodle에서 문제를 불러오는 중...</p>
                <div className="animate-pulse flex justify-center">
                  <div className="h-2 w-32 bg-gray-200 rounded"></div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">설정</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    음악 템포 (BPM)
                  </label>
                  <input
                    type="range"
                    min="60"
                    max="180"
                    defaultValue="120"
                    className="w-full"
                  />
                  <div className="text-sm text-gray-500 text-center mt-1">120 BPM</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    음계
                  </label>
                  <select className="w-full border border-gray-300 rounded-md px-3 py-2">
                    <option value="major">메이저 (Major)</option>
                    <option value="minor">마이너 (Minor)</option>
                    <option value="pentatonic">펜타토닉 (Pentatonic)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Phone Simulator (Fixed Position) */}
          <div className="lg:col-span-1">
            <PhoneFrame />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-16 bg-white border-t">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <p className="text-center text-gray-500 text-sm">
            Term Melody v1.0.0 - Moodle 3.7 LMS 연동
          </p>
        </div>
      </footer>
    </div>
  )
}

export default App
