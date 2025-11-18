import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '@/services/api'
import type { Solution } from '@/types'

export const MySolutions: React.FC = () => {
  const [solutions, setSolutions] = useState<Solution[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadSolutions = async () => {
      try {
        const data = await api.getMySolutions()
        setSolutions(data)
      } catch (err: any) {
        setError('풀이 목록을 불러오지 못했습니다.')
      } finally {
        setLoading(false)
      }
    }

    loadSolutions()
  }, [])

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">로딩 중...</div>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">내 풀이</h1>

      {error && (
        <div className="rounded-md bg-red-50 p-4 mb-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {solutions.length === 0 ? (
        <div className="card text-center">
          <p className="text-gray-600 mb-4">아직 제출한 풀이가 없습니다.</p>
          <Link to="/problems" className="btn-primary">
            문제 풀러 가기
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {solutions.map((solution) => (
            <div key={solution.id} className="card">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="text-sm text-gray-500">제출 일시: {new Date(solution.submitted_at).toLocaleString('ko-KR')}</p>
                  {solution.score !== null && solution.score !== undefined && (
                    <p className="text-lg font-semibold text-primary-600">점수: {solution.score}점</p>
                  )}
                </div>
                <Link to={`/solutions/${solution.id}/compare`} className="btn-primary">
                  비교하기
                </Link>
              </div>
              <div className="bg-gray-50 rounded p-4 mb-3">
                <p className="text-sm text-gray-600 font-mono whitespace-pre-wrap line-clamp-3">{solution.content}</p>
              </div>
              {solution.explanation && (
                <div className="text-sm text-gray-600">
                  <span className="font-semibold">설명:</span> {solution.explanation}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
