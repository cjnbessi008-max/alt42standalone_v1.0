import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AnalysisResult } from '../types'
import ConfusingPartCard from './ConfusingPartCard'
import RepetitionTracker from './RepetitionTracker'

interface AnalysisDisplayProps {
  result: AnalysisResult
  onReset: () => void
}

const AnalysisDisplay = ({ result, onReset }: AnalysisDisplayProps) => {
  const [expandedParts, setExpandedParts] = useState<Set<string>>(new Set())

  const toggleExpanded = (partId: string) => {
    setExpandedParts(prev => {
      const newSet = new Set(prev)
      if (newSet.has(partId)) {
        newSet.delete(partId)
      } else {
        newSet.add(partId)
      }
      return newSet
    })
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="math-container">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              분석 결과
            </h2>
            <p className="text-gray-600">{result.overallSummary}</p>
          </div>
          <button
            onClick={onReset}
            className="btn-secondary ml-4"
          >
            새 문제 입력
          </button>
        </div>
      </div>

      {/* Original Input */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="math-container bg-gray-50"
      >
        <h3 className="text-lg font-semibold text-gray-700 mb-2">
          입력하신 내용
        </h3>
        <p className="text-gray-800 whitespace-pre-wrap">{result.originalInput}</p>
      </motion.div>

      {/* Repetition Tracker */}
      <RepetitionTracker confusingParts={result.confusingParts} />

      {/* Confusing Parts */}
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-gray-800 px-2">
          주의가 필요한 개념들
        </h3>
        <AnimatePresence>
          {result.confusingParts.map((part, index) => (
            <motion.div
              key={part.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <ConfusingPartCard
                part={part}
                isExpanded={expandedParts.has(part.id)}
                onToggle={() => toggleExpanded(part.id)}
                index={index}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-center gap-4 pt-8">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            // Expand all
            setExpandedParts(new Set(result.confusingParts.map(p => p.id)))
          }}
          className="btn-secondary"
        >
          모두 펼치기
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            // Collapse all
            setExpandedParts(new Set())
          }}
          className="btn-secondary"
        >
          모두 접기
        </motion.button>
      </div>
    </motion.div>
  )
}

export default AnalysisDisplay
