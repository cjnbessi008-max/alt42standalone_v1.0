import React, { useState, useEffect } from 'react'
import SmartphoneFrame from './components/SmartphoneFrame'
import ShapeAnimation from './components/ShapeAnimation'
import { problemService } from './services/api'

function App() {
  const [currentProblem, setCurrentProblem] = useState(null)
  const [problems, setProblems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // 초기 데이터 로드
  useEffect(() => {
    loadProblems()
  }, [])

  const loadProblems = async () => {
    try {
      setLoading(true)
      const data = await problemService.getAll()
      setProblems(data)
      if (data.length > 0) {
        setCurrentProblem(data[0])
      }
      setError(null)
    } catch (err) {
      console.error('Failed to load problems:', err)
      setError('문제를 불러오는데 실패했습니다.')
      // 백엔드가 없을 경우 샘플 데이터 사용
      loadSampleData()
    } finally {
      setLoading(false)
    }
  }

  const loadSampleData = () => {
    const sampleProblems = [
      {
        id: 1,
        title: '원의 넓이 구하기',
        shapeType: 'circle',
        radius: 5,
        summary: '반지름 5cm 원의 넓이는?',
        difficulty: 'easy'
      },
      {
        id: 2,
        title: '삼각형의 넓이',
        shapeType: 'triangle',
        base: 8,
        height: 6,
        summary: '밑변 8cm, 높이 6cm 삼각형',
        difficulty: 'medium'
      },
      {
        id: 3,
        title: '직사각형 둘레',
        shapeType: 'rectangle',
        width: 10,
        height: 6,
        summary: '가로 10cm, 세로 6cm 직사각형',
        difficulty: 'easy'
      }
    ]
    setProblems(sampleProblems)
    setCurrentProblem(sampleProblems[0])
  }

  const handleNextProblem = () => {
    const currentIndex = problems.findIndex(p => p.id === currentProblem?.id)
    const nextIndex = (currentIndex + 1) % problems.length
    setCurrentProblem(problems[nextIndex])
  }

  const handlePrevProblem = () => {
    const currentIndex = problems.findIndex(p => p.id === currentProblem?.id)
    const prevIndex = currentIndex - 1 < 0 ? problems.length - 1 : currentIndex - 1
    setCurrentProblem(problems[prevIndex])
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-100 to-pink-100">
      {/* 메인 컨텐츠 */}
      <div className="container mx-auto px-4 py-8">
        {/* 헤더 */}
        <header className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-800 mb-4">
            3초 도형 요약
          </h1>
          <p className="text-xl text-gray-600">
            도형 문제의 핵심을 3초 애니메이션으로 이해하세요
          </p>
        </header>

        {/* 문제 리스트 */}
        <div className="max-w-4xl mx-auto">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">로딩 중...</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">문제 목록</h2>

              {error && (
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-yellow-700">
                        {error} 샘플 데이터를 사용합니다.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid gap-4">
                {problems.map((problem) => (
                  <div
                    key={problem.id}
                    onClick={() => setCurrentProblem(problem)}
                    className={`p-6 rounded-lg cursor-pointer transition-all border-2 ${
                      currentProblem?.id === problem.id
                        ? 'border-purple-500 bg-purple-50 shadow-md'
                        : 'border-gray-200 hover:border-purple-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-800 mb-2">
                          {problem.title}
                        </h3>
                        <p className="text-gray-600 text-sm">
                          {problem.summary}
                        </p>
                      </div>
                      <div className="ml-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          problem.shapeType === 'circle' ? 'bg-blue-100 text-blue-700' :
                          problem.shapeType === 'triangle' ? 'bg-green-100 text-green-700' :
                          'bg-purple-100 text-purple-700'
                        }`}>
                          {problem.shapeType === 'circle' ? '원' :
                           problem.shapeType === 'triangle' ? '삼각형' :
                           problem.shapeType === 'rectangle' ? '사각형' : '도형'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* 네비게이션 */}
              <div className="flex justify-between items-center mt-8">
                <button
                  onClick={handlePrevProblem}
                  className="px-6 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg font-semibold text-gray-700 transition-colors"
                >
                  ← 이전
                </button>
                <span className="text-gray-600">
                  {problems.findIndex(p => p.id === currentProblem?.id) + 1} / {problems.length}
                </span>
                <button
                  onClick={handleNextProblem}
                  className="px-6 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg font-semibold text-gray-700 transition-colors"
                >
                  다음 →
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 설명 */}
        <div className="max-w-4xl mx-auto mt-12 text-center">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-3">사용 방법</h3>
            <div className="text-gray-600 space-y-2">
              <p>1. 좌측에서 문제를 선택하세요</p>
              <p>2. 우측 하단 스마트폰에서 3초 애니메이션을 확인하세요</p>
              <p>3. '다시 보기' 버튼으로 애니메이션을 반복할 수 있습니다</p>
            </div>
          </div>
        </div>
      </div>

      {/* 우측 하단 스마트폰 화면 */}
      {currentProblem && (
        <SmartphoneFrame>
          <ShapeAnimation problem={currentProblem} />
        </SmartphoneFrame>
      )}
    </div>
  )
}

export default App
