import { motion, AnimatePresence } from 'framer-motion'
import { ConfusingPart } from '../types'
import { useState, useEffect } from 'react'

interface ConfusingPartCardProps {
  part: ConfusingPart
  isExpanded: boolean
  onToggle: () => void
  index: number
}

const ConfusingPartCard = ({ part, isExpanded, onToggle, index }: ConfusingPartCardProps) => {
  const [viewCount, setViewCount] = useState(0)
  const [showConfetti, setShowConfetti] = useState(false)

  useEffect(() => {
    if (isExpanded) {
      setViewCount(prev => prev + 1)

      // Show confetti on 3rd view (mastery)
      if (viewCount + 1 === 3) {
        setShowConfetti(true)
        setTimeout(() => setShowConfetti(false), 2000)
      }
    }
  }, [isExpanded])

  const getMasteryLevel = () => {
    if (viewCount === 0) return { level: '새로운 개념', color: 'bg-gray-200', textColor: 'text-gray-700' }
    if (viewCount === 1) return { level: '복습 필요', color: 'bg-yellow-200', textColor: 'text-yellow-800' }
    if (viewCount === 2) return { level: '거의 마스터!', color: 'bg-orange-200', textColor: 'text-orange-800' }
    return { level: '마스터 완료! 🎉', color: 'bg-green-200', textColor: 'text-green-800' }
  }

  const mastery = getMasteryLevel()

  const gradients = [
    'from-blue-400 to-purple-500',
    'from-green-400 to-blue-500',
    'from-pink-400 to-red-500',
    'from-yellow-400 to-orange-500',
  ]

  const gradient = gradients[index % gradients.length]

  return (
    <motion.div
      layout
      className="math-container relative overflow-hidden"
      animate={{
        boxShadow: isExpanded
          ? '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
          : '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)'
      }}
    >
      {/* Confetti Effect */}
      <AnimatePresence>
        {showConfetti && (
          <div className="absolute inset-0 pointer-events-none z-50 overflow-hidden">
            {[...Array(30)].map((_, i) => (
              <motion.div
                key={i}
                initial={{
                  top: '50%',
                  left: '50%',
                  opacity: 1,
                  scale: 0
                }}
                animate={{
                  top: `${Math.random() * 100}%`,
                  left: `${Math.random() * 100}%`,
                  opacity: 0,
                  scale: 1
                }}
                transition={{ duration: 1, ease: 'easeOut' }}
                className="absolute w-2 h-2 rounded-full"
                style={{
                  backgroundColor: ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff'][i % 5]
                }}
              />
            ))}
          </div>
        )}
      </AnimatePresence>

      {/* Header */}
      <button
        onClick={onToggle}
        className="w-full text-left"
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <motion.div
                className={`w-12 h-12 rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center text-white font-bold text-xl shadow-lg`}
                whileHover={{ scale: 1.1, rotate: 5 }}
                whileTap={{ scale: 0.9 }}
              >
                {index + 1}
              </motion.div>
              <h3 className="text-xl font-bold text-gray-800">
                {part.text}
              </h3>
            </div>

            <p className="text-gray-600 ml-15">
              {part.reason}
            </p>

            <div className="flex items-center gap-2 mt-3 ml-15">
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${mastery.color} ${mastery.textColor}`}>
                {mastery.level}
              </span>
              <span className="text-sm text-gray-500">
                조회 {viewCount}회
              </span>
            </div>
          </div>

          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.3 }}
            className="ml-4 text-gray-400"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </motion.div>
        </div>
      </button>

      {/* Expanded Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="mt-6 pt-6 border-t border-gray-200">
              {/* Explanation */}
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="expanded-explanation mb-6"
              >
                <h4 className="font-bold text-blue-900 mb-2 flex items-center gap-2">
                  <span className="text-2xl">💡</span>
                  자세한 설명
                </h4>
                <p className="text-gray-700 leading-relaxed">
                  {part.explanation}
                </p>
              </motion.div>

              {/* Examples */}
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <h4 className="font-bold text-purple-900 mb-3 flex items-center gap-2">
                  <span className="text-2xl">📝</span>
                  예제로 익히기
                </h4>
                <div className="space-y-3">
                  {part.examples.map((example, i) => (
                    <motion.div
                      key={i}
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.3 + i * 0.1 }}
                      whileHover={{ x: 5 }}
                      className="p-4 bg-purple-50 rounded-lg border-l-4 border-purple-400"
                    >
                      <p className="font-mono text-gray-800">{example}</p>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              {/* Repetition Encouragement */}
              {viewCount < 3 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="mt-6 p-4 bg-gradient-to-r from-amber-50 to-yellow-50 rounded-lg border border-amber-200"
                >
                  <p className="text-sm text-amber-900">
                    <span className="font-semibold">반복 학습 팁:</span> 이 개념을 {3 - viewCount}번 더 확인하면 완전히 마스터할 수 있습니다!
                    {viewCount === 0 && ' 처음 배우는 개념이니 천천히 이해해보세요.'}
                    {viewCount === 1 && ' 한 번 더 복습하면 기억에 오래 남아요.'}
                    {viewCount === 2 && ' 거의 다 왔어요! 한 번만 더!'}
                  </p>
                </motion.div>
              )}

              {viewCount >= 3 && (
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="mt-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border-2 border-green-300"
                >
                  <p className="text-green-900 font-semibold flex items-center gap-2">
                    <span className="text-2xl">🎓</span>
                    훌륭해요! 이 개념을 완전히 이해했습니다!
                  </p>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default ConfusingPartCard
