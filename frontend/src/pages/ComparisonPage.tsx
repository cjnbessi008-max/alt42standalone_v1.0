import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { api } from '@/services/api'
import type { Solution, Comparison } from '@/types'
import ReactDiffViewer from 'react-diff-viewer-continued'

export const ComparisonPage: React.FC = () => {
  const { solutionId } = useParams<{ solutionId: string }>()
  const [solution, setSolution] = useState<Solution | null>(null)
  const [modelSolution, setModelSolution] = useState<Solution | null>(null)
  const [comparison, setComparison] = useState<Comparison | null>(null)
  const [loading, setLoading] = useState(true)
  const [comparing, setComparing] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadData = async () => {
      try {
        if (!solutionId) return

        // Load student solution
        const sol = await api.getSolution(solutionId)
        setSolution(sol)

        // Load model solution
        const solutions = await api.getProblemSolutions(sol.problem_id)
        const model = solutions.find((s) => s.is_model_solution)
        setModelSolution(model || null)

        // Check if comparison already exists
        const comparisons = await api.getSolutionComparisons(solutionId)
        if (comparisons.length > 0) {
          setComparison(comparisons[0])
        }
      } catch (err: any) {
        setError('데이터를 불러오지 못했습니다.')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [solutionId])

  const handleCompare = async () => {
    if (!solutionId) return

    setComparing(true)
    setError('')

    try {
      const result = await api.createComparison({
        student_solution_id: solutionId,
      })
      setComparison(result)
    } catch (err: any) {
      setError(err.response?.data?.detail || '비교 실패')
    } finally {
      setComparing(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">로딩 중...</div>
      </div>
    )
  }

  if (!solution) {
    return (
      <div className="rounded-md bg-red-50 p-4">
        <p className="text-sm text-red-800">풀이를 찾을 수 없습니다.</p>
      </div>
    )
  }

  if (!modelSolution) {
    return (
      <div className="rounded-md bg-yellow-50 p-4">
        <p className="text-sm text-yellow-800">이 문제에는 모범 풀이가 없습니다.</p>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">풀이 비교</h1>

      {!comparison ? (
        <div className="card text-center">
          <p className="text-gray-600 mb-4">AI를 사용하여 내 풀이와 모범 풀이를 비교합니다.</p>
          <button onClick={handleCompare} className="btn-primary" disabled={comparing}>
            {comparing ? '비교 중...' : '풀이 비교하기'}
          </button>
          {error && (
            <div className="rounded-md bg-red-50 p-4 mt-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}
        </div>
      ) : (
        <>
          {/* Comparison Results */}
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div className="card">
              <h2 className="text-xl font-bold text-gray-900 mb-2">유사도 점수</h2>
              <div className="text-5xl font-bold text-primary-600">{comparison.similarity_score || 0}%</div>
            </div>
            <div className="card">
              <h2 className="text-xl font-bold text-gray-900 mb-2">AI 피드백</h2>
              <p className="text-gray-700">{comparison.feedback}</p>
            </div>
          </div>

          {/* Strengths */}
          {comparison.strengths && comparison.strengths.length > 0 && (
            <div className="card mb-6 bg-green-50">
              <h2 className="text-xl font-bold text-green-900 mb-3">👍 잘한 점</h2>
              <ul className="space-y-2">
                {comparison.strengths.map((strength, idx) => (
                  <li key={idx} className="flex items-start">
                    <span className="text-green-600 mr-2">•</span>
                    <span className="text-green-800">{strength}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Improvements */}
          {comparison.improvements && comparison.improvements.length > 0 && (
            <div className="card mb-6 bg-blue-50">
              <h2 className="text-xl font-bold text-blue-900 mb-3">💡 개선할 점</h2>
              <ul className="space-y-2">
                {comparison.improvements.map((improvement, idx) => (
                  <li key={idx} className="flex items-start">
                    <span className="text-blue-600 mr-2">•</span>
                    <span className="text-blue-800">{improvement}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Detailed Differences */}
          {comparison.differences && (
            <div className="card mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">상세 분석</h2>
              <div className="space-y-3">
                {comparison.differences.approach && (
                  <div>
                    <h3 className="font-semibold text-gray-800">접근 방법</h3>
                    <p className="text-gray-600">{comparison.differences.approach}</p>
                  </div>
                )}
                {comparison.differences.accuracy && (
                  <div>
                    <h3 className="font-semibold text-gray-800">정확성</h3>
                    <p className="text-gray-600">{comparison.differences.accuracy}</p>
                  </div>
                )}
                {comparison.differences.completeness && (
                  <div>
                    <h3 className="font-semibold text-gray-800">완성도</h3>
                    <p className="text-gray-600">{comparison.differences.completeness}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Side-by-side comparison */}
          <div className="card">
            <h2 className="text-xl font-bold text-gray-900 mb-4">풀이 비교</h2>
            <ReactDiffViewer
              oldValue={modelSolution.content}
              newValue={solution.content}
              splitView={true}
              leftTitle="모범 풀이"
              rightTitle="내 풀이"
              useDarkTheme={false}
            />
          </div>

          {/* Explanations if available */}
          <div className="grid md:grid-cols-2 gap-6 mt-6">
            {modelSolution.explanation && (
              <div className="card">
                <h3 className="font-bold text-gray-900 mb-2">모범 풀이 설명</h3>
                <p className="text-gray-700 whitespace-pre-wrap">{modelSolution.explanation}</p>
              </div>
            )}
            {solution.explanation && (
              <div className="card">
                <h3 className="font-bold text-gray-900 mb-2">내 풀이 설명</h3>
                <p className="text-gray-700 whitespace-pre-wrap">{solution.explanation}</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
