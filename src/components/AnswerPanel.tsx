import { useState } from 'react'
import { Problem } from '../api/moodleApi'

interface AnswerPanelProps {
  problem: Problem
  onSubmit: (answer: number) => void
}

export function AnswerPanel({ problem, onSubmit }: AnswerPanelProps) {
  const [answer, setAnswer] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const numAnswer = parseFloat(answer)
    if (!isNaN(numAnswer)) {
      onSubmit(numAnswer)
      setAnswer('')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label htmlFor="answer" className="block text-sm font-medium text-gray-700 mb-1">
          넓이를 입력하세요
        </label>
        <div className="flex gap-2">
          <input
            id="answer"
            type="number"
            step="0.01"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="답을 입력하세요"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kaist-blue"
          />
          <span className="flex items-center px-3 py-2 bg-gray-100 rounded-lg text-sm font-medium text-gray-600">
            {problem.unit}
          </span>
        </div>
      </div>

      <button
        type="submit"
        className="w-full bg-kaist-blue text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition shadow-md active:scale-95"
      >
        제출하기
      </button>

      <div className="text-xs text-gray-500 text-center">
        💡 3D 모델을 회전하고 확대/축소하여 넓이를 이해해보세요
      </div>
    </form>
  )
}
