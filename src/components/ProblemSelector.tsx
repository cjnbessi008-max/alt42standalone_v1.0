import { Problem } from '../api/moodleApi'

interface ProblemSelectorProps {
  problems: Problem[]
  currentProblem: Problem | null
  onSelectProblem: (problem: Problem) => void
}

export function ProblemSelector({
  problems,
  currentProblem,
  onSelectProblem,
}: ProblemSelectorProps) {
  const getShapeEmoji = (shape: string) => {
    switch (shape) {
      case 'rectangle':
        return '📐'
      case 'square':
        return '⬜'
      case 'circle':
        return '🔵'
      case 'triangle':
        return '🔺'
      default:
        return '📏'
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-xl font-bold text-gray-800 mb-4">문제 목록</h2>
      <div className="space-y-2">
        {problems.map((problem) => (
          <button
            key={problem.id}
            onClick={() => onSelectProblem(problem)}
            className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
              currentProblem?.id === problem.id
                ? 'border-kaist-blue bg-blue-50 shadow-md'
                : 'border-gray-200 hover:border-kaist-blue hover:bg-gray-50'
            }`}
          >
            <div className="flex items-start gap-3">
              <span className="text-2xl">{getShapeEmoji(problem.shape)}</span>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-800">
                  {problem.title}
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  {problem.description}
                </p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
