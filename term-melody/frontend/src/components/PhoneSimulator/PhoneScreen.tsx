/**
 * 스마트폰 화면 콘텐츠
 */

import { useState } from 'react'

export default function PhoneScreen() {
  const [isPlaying, setIsPlaying] = useState(false)

  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-purple-50 to-pink-50">
      {/* Status Bar */}
      <div className="flex items-center justify-between px-6 pt-8 pb-2 text-xs">
        <span className="font-medium">9:41</span>
        <div className="flex items-center space-x-1">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
          </svg>
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
          </svg>
        </div>
      </div>

      {/* App Content */}
      <div className="flex-1 px-6 py-4 overflow-y-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Term Melody</h1>
          <p className="text-sm text-gray-600">항의 변화를 들어보세요</p>
        </div>

        {/* Problem Display */}
        <div className="bg-white rounded-2xl p-4 shadow-sm mb-4">
          <div className="text-sm text-gray-500 mb-2">현재 문제</div>
          <div className="text-lg font-semibold mb-4">
            x + 3 = 7
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">일차방정식</span>
            <span>•</span>
            <span>난이도: 쉬움</span>
          </div>
        </div>

        {/* Term Changes Visualization */}
        <div className="bg-white rounded-2xl p-4 shadow-sm mb-4">
          <div className="text-sm font-medium text-gray-700 mb-3">항의 변화</div>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
              <span className="font-mono">x + 3</span>
              <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
              <span className="font-mono">x + 5</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-pink-50 rounded-lg">
              <span className="font-mono">x + 5</span>
              <svg className="w-5 h-5 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
              <span className="font-mono">2x + 1</span>
            </div>
          </div>
        </div>

        {/* Waveform Visualization (Placeholder) */}
        <div className="bg-white rounded-2xl p-4 shadow-sm mb-4">
          <div className="text-sm font-medium text-gray-700 mb-3">음악 파형</div>
          <div className="h-24 flex items-end justify-around space-x-1">
            {[...Array(20)].map((_, i) => (
              <div
                key={i}
                className="flex-1 bg-gradient-to-t from-indigo-500 to-purple-500 rounded-t"
                style={{
                  height: `${Math.random() * 100}%`,
                  animation: isPlaying ? `wave 1s ease-in-out infinite ${i * 0.1}s` : 'none',
                }}
              ></div>
            ))}
          </div>
        </div>

        {/* Play Controls */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className={`w-full py-4 rounded-xl font-semibold text-white transition-all transform active:scale-95 ${
              isPlaying
                ? 'bg-gradient-to-r from-red-500 to-pink-500'
                : 'bg-gradient-to-r from-indigo-500 to-purple-500'
            }`}
          >
            <div className="flex items-center justify-center space-x-2">
              {isPlaying ? (
                <>
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <span>일시정지</span>
                </>
              ) : (
                <>
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                  </svg>
                  <span>재생</span>
                </>
              )}
            </div>
          </button>

          <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
            <span>0:00</span>
            <div className="flex-1 mx-4 h-1 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all"
                style={{ width: isPlaying ? '45%' : '0%' }}
              ></div>
            </div>
            <span>0:08</span>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes wave {
          0%, 100% {
            transform: scaleY(1);
          }
          50% {
            transform: scaleY(0.5);
          }
        }
      `}</style>
    </div>
  )
}
