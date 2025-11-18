import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '@/services/api'
import { useAuthStore } from '@/services/authStore'
import type { Problem, Solution } from '@/types'
import ReactMarkdown from 'react-markdown'

export const ProblemDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [problem, setProblem] = useState<Problem | null>(null)
  const [solution, setSolution] = useState('')
  const [explanation, setExplanation] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    const loadProblem = async () => {
      try {
        if (!id) return
        const data = await api.getProblem(id)
        setProblem(data)
      } catch (err: any) {
        setError('문제를 불러오지 못했습니다.')
      } finally {
        setLoading(false)
      }
    }

    loadProblem()
  }, [id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!id || !solution.trim()) return

    setSubmitting(true)
    setError('')
    setSuccess('')

    try {
      const submittedSolution = await api.submitSolution({
        problem_id: id,
        content: solution,
        explanation: explanation || undefined,
      })

      setSuccess('풀이가 제출되었습니다!')
      setSolution('')
      setExplanation('')

      // Navigate to comparison page after 1 second
      setTimeout(() => {
        navigate(`/solutions/${submittedSolution.id}/compare`)
      }, 1000)
    } catch (err: any) {
      setError(err.response?.data?.detail || '제출 실패')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">로딩 중...</div>
      </div>
    )
  }

  if (!problem) {
    return (
      <div className="rounded-md bg-red-50 p-4">
        <p className="text-sm text-red-800">문제를 찾을 수 없습니다.</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="card mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">{problem.title}</h1>
        <div className="flex gap-3 mb-6">
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
          <span className="badge bg-gray-100 text-gray-800">배점: {problem.max_score}점</span>
          {problem.time_limit_minutes && (
            <span className="badge bg-gray-100 text-gray-800">시간: {problem.time_limit_minutes}분</span>
          )}
        </div>
        <div className="prose max-w-none">
          <ReactMarkdown>{problem.description}</ReactMarkdown>
        </div>
      </div>

      <div className="card">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">풀이 제출</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="solution" className="block text-sm font-medium text-gray-700 mb-2">
              풀이 내용
            </label>
            <textarea
              id="solution"
              rows={10}
              className="input font-mono"
              placeholder="풀이를 입력하세요..."
              value={solution}
              onChange={(e) => setSolution(e.target.value)}
              required
            />
          </div>
          <div>
            <label htmlFor="explanation" className="block text-sm font-medium text-gray-700 mb-2">
              풀이 설명 (선택)
            </label>
            <textarea
              id="explanation"
              rows={5}
              className="input"
              placeholder="풀이 과정을 설명해주세요..."
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
            />
          </div>

          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {success && (
            <div className="rounded-md bg-green-50 p-4">
              <p className="text-sm text-green-800">{success}</p>
            </div>
          )}

          <button type="submit" className="btn-primary w-full" disabled={submitting}>
            {submitting ? '제출 중...' : '풀이 제출'}
          </button>
        </form>
      </div>
    </div>
  )
}
