/**
 * 가상 스마트폰 프레임 컴포넌트
 * 우측 하단에 고정되어 표시됨
 */

import { useState } from 'react'
import PhoneScreen from './PhoneScreen'

export default function PhoneFrame() {
  const [isMinimized, setIsMinimized] = useState(false)

  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setIsMinimized(false)}
          className="bg-indigo-600 text-white p-4 rounded-full shadow-lg hover:bg-indigo-700 transition-colors"
          title="스마트폰 화면 표시"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
            />
          </svg>
        </button>
      </div>
    )
  }

  return (
    <div className="sticky top-8">
      {/* Phone Container */}
      <div className="relative mx-auto" style={{ width: '300px' }}>
        {/* 최소화 버튼 */}
        <button
          onClick={() => setIsMinimized(true)}
          className="absolute -top-8 right-0 text-gray-400 hover:text-gray-600 transition-colors"
          title="최소화"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>

        {/* Phone Frame */}
        <div className="relative bg-phone-frame rounded-[3rem] p-3 shadow-phone">
          {/* Notch */}
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-32 h-6 bg-phone-notch rounded-b-3xl z-10"></div>

          {/* Screen */}
          <div className="relative bg-white rounded-[2.5rem] overflow-hidden" style={{ height: '600px' }}>
            <PhoneScreen />
          </div>

          {/* Home Indicator */}
          <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 w-32 h-1 bg-gray-300 rounded-full"></div>
        </div>

        {/* Phone Label */}
        <div className="text-center mt-4">
          <p className="text-sm text-gray-500">가상 스마트폰</p>
        </div>
      </div>
    </div>
  )
}
