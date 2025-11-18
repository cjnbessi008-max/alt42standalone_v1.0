import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '@/services/api'
import type { Problem } from '@/types'

export const ProblemList: React.FC = () => {
  const [problems, setProblems] = useState<Problem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadProblems = async () => {
      try {
        const data = await api.getProblems()
        setProblems(data)
      } catch (err: any) {
        setError('문제 목록을 불러오지 못했습니다.')
      } finally {
        setLoading(false)
      }
    }

    loadProblems()
  }, [])

  const getDifficultyBadge = (difficulty: string) => {
    const classes = {
      easy: 'badge-easy',
      medium: 'badge-medium',
      hard: 'badge-hard',
    }
    return classes[difficulty as keyof typeof classes] || 'badge'
  }

  const getTypeBadge = (type: string) => {
    const classes = {
      math: 'badge-math',
      coding: 'badge-coding',
      essay: 'badge-essay',
    }
    return classes[type as keyof typeof classes] || 'badge'
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">로딩 중...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-md bg-red-50 p-4">
        <p className="text-sm text-red-800">{error}</p>
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">문제 목록</h1>
      </div>

      {problems.length === 0 ? (
        <div className="card text-center text-gray-500">아직 문제가 없습니다.</div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {problems.map((problem) => (
            <Link key={problem.id} to={`/problems/${problem.id}`} className="card hover:shadow-lg transition-shadow">
              <div className="flex justify-between items-start mb-3">
                <h3 className="text-lg font-semibold text-gray-900">{problem.title}</h3>
                <div className="flex gap-2">
                  <span className={getDifficultyBadge(problem.difficulty)}>
                    {problem.difficulty === 'easy' ? '쉬움' : problem.difficulty === 'medium' ? '보통' : '어려움'}
                  </span>
                  <span className={getTypeBadge(problem.problem_type)}>
                    {problem.problem_type === 'math' ? '수학' : problem.problem_type === 'coding' ? '코딩' : '서술형'}
                  </span>
                </div>
              </div>
              <p className="text-gray-600 text-sm line-clamp-3">{problem.description}</p>
              <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
                <span>배점: {problem.max_score}점</span>
                {problem.time_limit_minutes && <span>시간: {problem.time_limit_minutes}분</span>}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
