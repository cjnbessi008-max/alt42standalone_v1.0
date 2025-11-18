import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '@/services/api'
import type { Problem } from '@/types'

export const TeacherProblems: React.FC = () => {
  const [problems, setProblems] = useState<Problem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadProblems()
  }, [])

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

  const handleDelete = async (id: string) => {
    if (!confirm('정말로 이 문제를 삭제하시겠습니까?')) return

    try {
      await api.deleteProblem(id)
      setProblems(problems.filter((p) => p.id !== id))
    } catch (err: any) {
      alert('삭제 실패: ' + (err.response?.data?.detail || '알 수 없는 오류'))
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">로딩 중...</div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">문제 관리</h1>
        <Link to="/teacher/problems/new" className="btn-primary">
          + 새 문제 만들기
        </Link>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-4 mb-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {problems.length === 0 ? (
        <div className="card text-center text-gray-500">아직 문제가 없습니다.</div>
      ) : (
        <div className="space-y-4">
          {problems.map((problem) => (
            <div key={problem.id} className="card">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{problem.title}</h3>
                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">{problem.description}</p>
                  <div className="flex gap-2">
                    <span
                      className={
                        problem.difficulty === 'easy'
                          ? 'badge-easy'
                          : problem.difficulty === 'medium'
                            ? 'badge-medium'
                            : 'badge-hard'
                      }
                    >
                      {problem.difficulty === 'easy' ? '쉬움' : problem.difficulty === 'medium' ? '보통' : '어려움'}
                    </span>
                    <span
                      className={
                        problem.problem_type === 'math'
                          ? 'badge-math'
                          : problem.problem_type === 'coding'
                            ? 'badge-coding'
                            : 'badge-essay'
                      }
                    >
                      {problem.problem_type === 'math' ? '수학' : problem.problem_type === 'coding' ? '코딩' : '서술형'}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Link to={`/teacher/problems/${problem.id}/edit`} className="btn-secondary">
                    수정
                  </Link>
                  <button onClick={() => handleDelete(problem.id)} className="btn-danger">
                    삭제
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
