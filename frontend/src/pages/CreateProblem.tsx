import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '@/services/api'
import { ProblemType, ProblemDifficulty } from '@/types'

export const CreateProblem: React.FC = () => {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    problem_type: ProblemType.MATH,
    difficulty: ProblemDifficulty.MEDIUM,
    max_score: 100,
    time_limit_minutes: 0,
    model_solution_content: '',
    model_solution_explanation: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const data = {
        ...formData,
        time_limit_minutes: formData.time_limit_minutes > 0 ? formData.time_limit_minutes : undefined,
        model_solution_content: formData.model_solution_content || undefined,
        model_solution_explanation: formData.model_solution_explanation || undefined,
      }
      await api.createProblem(data)
      navigate('/teacher/problems')
    } catch (err: any) {
      setError(err.response?.data?.detail || '문제 생성 실패')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: name === 'max_score' || name === 'time_limit_minutes' ? parseInt(value) || 0 : value,
    })
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">새 문제 만들기</h1>

      <form onSubmit={handleSubmit} className="card space-y-6">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
            문제 제목
          </label>
          <input
            id="title"
            name="title"
            type="text"
            required
            className="input"
            value={formData.title}
            onChange={handleChange}
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
            문제 설명
          </label>
          <textarea
            id="description"
            name="description"
            rows={8}
            required
            className="input"
            placeholder="Markdown 형식을 지원합니다."
            value={formData.description}
            onChange={handleChange}
          />
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="problem_type" className="block text-sm font-medium text-gray-700 mb-2">
              문제 유형
            </label>
            <select
              id="problem_type"
              name="problem_type"
              className="input"
              value={formData.problem_type}
              onChange={handleChange}
            >
              <option value={ProblemType.MATH}>수학</option>
              <option value={ProblemType.CODING}>코딩</option>
              <option value={ProblemType.ESSAY}>서술형</option>
            </select>
          </div>

          <div>
            <label htmlFor="difficulty" className="block text-sm font-medium text-gray-700 mb-2">
              난이도
            </label>
            <select
              id="difficulty"
              name="difficulty"
              className="input"
              value={formData.difficulty}
              onChange={handleChange}
            >
              <option value={ProblemDifficulty.EASY}>쉬움</option>
              <option value={ProblemDifficulty.MEDIUM}>보통</option>
              <option value={ProblemDifficulty.HARD}>어려움</option>
            </select>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="max_score" className="block text-sm font-medium text-gray-700 mb-2">
              배점
            </label>
            <input
              id="max_score"
              name="max_score"
              type="number"
              min="1"
              required
              className="input"
              value={formData.max_score}
              onChange={handleChange}
            />
          </div>

          <div>
            <label htmlFor="time_limit_minutes" className="block text-sm font-medium text-gray-700 mb-2">
              제한 시간 (분, 0 = 무제한)
            </label>
            <input
              id="time_limit_minutes"
              name="time_limit_minutes"
              type="number"
              min="0"
              className="input"
              value={formData.time_limit_minutes}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="border-t pt-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">모범 풀이 (선택)</h2>

          <div className="space-y-4">
            <div>
              <label htmlFor="model_solution_content" className="block text-sm font-medium text-gray-700 mb-2">
                모범 풀이 내용
              </label>
              <textarea
                id="model_solution_content"
                name="model_solution_content"
                rows={8}
                className="input font-mono"
                placeholder="모범 풀이를 입력하세요..."
                value={formData.model_solution_content}
                onChange={handleChange}
              />
            </div>

            <div>
              <label htmlFor="model_solution_explanation" className="block text-sm font-medium text-gray-700 mb-2">
                모범 풀이 설명
              </label>
              <textarea
                id="model_solution_explanation"
                name="model_solution_explanation"
                rows={5}
                className="input"
                placeholder="풀이 과정을 설명해주세요..."
                value={formData.model_solution_explanation}
                onChange={handleChange}
              />
            </div>
          </div>
        </div>

        {error && (
          <div className="rounded-md bg-red-50 p-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <div className="flex gap-4">
          <button type="submit" className="btn-primary flex-1" disabled={loading}>
            {loading ? '생성 중...' : '문제 생성'}
          </button>
          <button type="button" className="btn-secondary" onClick={() => navigate('/teacher/problems')}>
            취소
          </button>
        </div>
      </form>
    </div>
  )
}
