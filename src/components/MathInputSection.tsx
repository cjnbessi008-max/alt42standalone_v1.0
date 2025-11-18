import { useState } from 'react'
import { motion } from 'framer-motion'

interface MathInputSectionProps {
  onAnalyze: (input: string) => void
  isAnalyzing: boolean
}

const MathInputSection = ({ onAnalyze, isAnalyzing }: MathInputSectionProps) => {
  const [input, setInput] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (input.trim()) {
      onAnalyze(input)
    }
  }

  const exampleProblems = [
    '분수의 나눗셈: 3/4 ÷ 1/2를 계산하면?',
    'f(x) = x²의 미분은?',
    '∫2x dx를 계산하면?',
    '이차방정식 x² - 5x + 6 = 0의 해는?'
  ]

  const handleExampleClick = (example: string) => {
    setInput(example)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="math-container max-w-3xl mx-auto"
    >
      <h2 className="text-2xl font-bold text-gray-800 mb-4">
        수학 문제를 입력하세요
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="math-input" className="block text-sm font-medium text-gray-700 mb-2">
            문제 또는 풀이 과정
          </label>
          <textarea
            id="math-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="input-area min-h-[200px] resize-y"
            placeholder="예: f(x) = x²을 미분하면 f'(x) = 2x입니다.
또는: 분수 3/4를 1/2로 나누면..."
            disabled={isAnalyzing}
          />
        </div>

        <div className="flex justify-between items-center">
          <p className="text-sm text-gray-600">
            {input.length} 글자
          </p>
          <button
            type="submit"
            disabled={!input.trim() || isAnalyzing}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isAnalyzing ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                분석 중...
              </span>
            ) : (
              'AI로 분석하기'
            )}
          </button>
        </div>
      </form>

      <div className="mt-8">
        <h3 className="text-lg font-semibold text-gray-700 mb-3">
          예시 문제 (클릭하여 입력)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {exampleProblems.map((example, index) => (
            <motion.button
              key={index}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleExampleClick(example)}
              className="text-left p-4 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors"
              disabled={isAnalyzing}
            >
              <p className="text-sm text-blue-900">{example}</p>
            </motion.button>
          ))}
        </div>
      </div>

      <div className="mt-6 p-4 bg-purple-50 rounded-lg border border-purple-200">
        <h3 className="font-semibold text-purple-900 mb-2">💡 사용 팁</h3>
        <ul className="text-sm text-purple-800 space-y-1">
          <li>• 문제의 풀이 과정을 자세히 적을수록 더 정확한 분석이 가능합니다</li>
          <li>• 수식은 일반 텍스트로 입력해도 됩니다 (예: x^2, ∫, √)</li>
          <li>• AI가 헷갈릴 수 있는 부분을 자동으로 찾아 시각적으로 설명해드립니다</li>
        </ul>
      </div>
    </motion.div>
  )
}

export default MathInputSection
