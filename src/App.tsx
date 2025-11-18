import { useState, useEffect } from 'react'
import { ProblemSelector } from './components/ProblemSelector'
import { AreaVisualization3D } from './components/AreaVisualization3D'
import { AnswerPanel } from './components/AnswerPanel'
import { PhoneFrame } from './components/PhoneFrame'
import { fetchProblems, Problem } from './api/moodleApi'

function App() {
  const [problems, setProblems] = useState<Problem[]>([])
  const [currentProblem, setCurrentProblem] = useState<Problem | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadProblems()
  }, [])

  const loadProblems = async () => {
    try {
      setLoading(true)
      const data = await fetchProblems()
      setProblems(data)
      if (data.length > 0) {
        setCurrentProblem(data[0])
      }
    } catch (err) {
      setError('문제를 불러오는 데 실패했습니다.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleProblemSelect = (problem: Problem) => {
    setCurrentProblem(problem)
  }

  const handleAnswerSubmit = (answer: number) => {
    if (!currentProblem) return

    const isCorrect = Math.abs(answer - currentProblem.answer) < 0.01

    if (isCorrect) {
      alert('정답입니다! 🎉')
    } else {
      alert(`틀렸습니다. 다시 생각해보세요! 정답: ${currentProblem.answer}${currentProblem.unit}`)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-kaist-blue"></div>
          <p className="mt-4 text-gray-600">문제를 불러오는 중...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md">
          <h2 className="text-xl font-bold text-red-600 mb-4">오류</h2>
          <p className="text-gray-700">{error}</p>
          <button
            onClick={loadProblems}
            className="mt-4 px-4 py-2 bg-kaist-blue text-white rounded hover:bg-blue-700 transition"
          >
            다시 시도
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 md:p-8">
      <div className="container mx-auto">
        {/* 헤더 */}
        <header className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-kaist-blue mb-2">
            3D Area Space
          </h1>
          <p className="text-gray-600">넓이를 3D로 감각화하는 학습 공간</p>
        </header>

        {/* 메인 컨텐츠 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 문제 선택 패널 */}
          <div className="lg:col-span-1">
            <ProblemSelector
              problems={problems}
              currentProblem={currentProblem}
              onSelectProblem={handleProblemSelect}
            />
          </div>

          {/* 3D 시각화 및 답변 패널 */}
          <div className="lg:col-span-2 space-y-6">
            {/* 문제 정보 */}
            {currentProblem && (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-2">
                  {currentProblem.title}
                </h2>
                <p className="text-gray-600">{currentProblem.description}</p>
              </div>
            )}

            {/* 우측 하단 가상 스마트폰 화면 */}
            <div className="relative">
              <PhoneFrame>
                {currentProblem ? (
                  <div className="h-full flex flex-col">
                    {/* 3D 시각화 영역 */}
                    <div className="flex-1 bg-gray-900">
                      <AreaVisualization3D problem={currentProblem} />
                    </div>

                    {/* 답변 입력 영역 */}
                    <div className="bg-white p-4 border-t">
                      <AnswerPanel
                        problem={currentProblem}
                        onSubmit={handleAnswerSubmit}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center text-gray-500">
                    문제를 선택해주세요
                  </div>
                )}
              </PhoneFrame>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
