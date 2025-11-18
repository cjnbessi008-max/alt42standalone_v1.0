import React from 'react'
import { motion } from 'framer-motion'

const SmartphoneFrame = ({ children }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 100 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed bottom-6 right-6 z-50"
    >
      {/* 스마트폰 프레임 */}
      <div className="relative bg-gray-900 rounded-[3rem] p-3 shadow-2xl">
        {/* 노치 */}
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-32 h-7 bg-gray-900 rounded-b-3xl z-10"></div>

        {/* 스크린 */}
        <div className="relative bg-white rounded-[2.5rem] overflow-hidden w-[280px] h-[560px]">
          {/* 상태바 */}
          <div className="absolute top-0 left-0 right-0 h-12 bg-gradient-to-b from-gray-100 to-transparent z-10 flex items-center justify-between px-6 pt-2">
            <span className="text-xs font-semibold">9:41</span>
            <div className="flex items-center space-x-1">
              <div className="w-4 h-3 border border-gray-400 rounded-sm relative">
                <div className="absolute inset-0.5 bg-gray-900 rounded-sm"></div>
              </div>
            </div>
          </div>

          {/* 콘텐츠 영역 */}
          <div className="h-full pt-12 overflow-hidden">
            {children}
          </div>
        </div>

        {/* 홈 버튼 인디케이터 */}
        <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 w-32 h-1 bg-gray-700 rounded-full"></div>
      </div>
    </motion.div>
  )
}

export default SmartphoneFrame
