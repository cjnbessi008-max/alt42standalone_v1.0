import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ConfusingPart } from '../types'

interface RepetitionTrackerProps {
  confusingParts: ConfusingPart[]
}

const RepetitionTracker = ({ confusingParts }: RepetitionTrackerProps) => {
  const [stats, setStats] = useState({
    totalConcepts: 0,
    reviewedConcepts: 0,
    masteredConcepts: 0
  })

  useEffect(() => {
    setStats({
      totalConcepts: confusingParts.length,
      reviewedConcepts: 0,
      masteredConcepts: 0
    })
  }, [confusingParts])

  const progress = stats.totalConcepts > 0
    ? (stats.reviewedConcepts / stats.totalConcepts) * 100
    : 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="math-container bg-gradient-to-r from-indigo-50 to-purple-50 border-2 border-indigo-200"
    >
      <h3 className="text-lg font-bold text-indigo-900 mb-4 flex items-center gap-2">
        <span className="text-2xl">📊</span>
        학습 진행 상황
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="bg-white rounded-lg p-4 text-center shadow-sm">
          <div className="text-3xl font-bold text-blue-600">{stats.totalConcepts}</div>
          <div className="text-sm text-gray-600 mt-1">총 개념 수</div>
        </div>
        <div className="bg-white rounded-lg p-4 text-center shadow-sm">
          <div className="text-3xl font-bold text-yellow-600">{stats.reviewedConcepts}</div>
          <div className="text-sm text-gray-600 mt-1">복습 중</div>
        </div>
        <div className="bg-white rounded-lg p-4 text-center shadow-sm">
          <div className="text-3xl font-bold text-green-600">{stats.masteredConcepts}</div>
          <div className="text-sm text-gray-600 mt-1">마스터 완료</div>
        </div>
      </div>

      <div>
        <div className="flex justify-between text-sm text-gray-700 mb-2">
          <span>전체 진행률</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>
      </div>

      <div className="mt-4 p-3 bg-white rounded-lg">
        <p className="text-sm text-gray-700">
          💪 <span className="font-semibold">학습 팁:</span> 각 개념을 3번 이상 반복해서 보면 장기 기억으로 저장됩니다!
        </p>
      </div>
    </motion.div>
  )
}

export default RepetitionTracker
