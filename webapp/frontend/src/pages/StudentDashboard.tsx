import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { getStudentById, getRecommendations, getAnalytics } from '../services/api'

export default function StudentDashboard() {
  const { id } = useParams()
  const [student, setStudent] = useState<any>(null)
  const [recommendations, setRecommendations] = useState<any[]>([])
  const [analytics, setAnalytics] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (id) {
      loadDashboard(parseInt(id))
    }
  }, [id])

  const loadDashboard = async (studentId: number) => {
    try {
      const [studentRes, recsRes, analyticsRes] = await Promise.all([
        getStudentById(studentId),
        getRecommendations(studentId, 10),
        getAnalytics(studentId)
      ])

      setStudent(studentRes.data.data)
      setRecommendations(recsRes.data.data)
      setAnalytics(analyticsRes.data.data)
    } catch (error) {
      console.error('Failed to load dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">로딩 중...</div>
      </div>
    )
  }

  if (!student) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-xl">학생을 찾을 수 없습니다.</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Student Header */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">{student.name}</h1>
            <p className="text-gray-600">{student.grade_level}</p>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-600">평균 점수</div>
            <div className="text-3xl font-bold text-purple-600">
              {student.avg_score ? student.avg_score.toFixed(1) : 'N/A'}
            </div>
          </div>
        </div>

        {analytics?.overall && (
          <div className="grid grid-cols-4 gap-4 mt-6">
            <div className="text-center p-4 bg-blue-50 rounded">
              <div className="text-2xl font-bold text-blue-600">
                {analytics.overall.total_problems_attempted}
              </div>
              <div className="text-sm text-gray-600">시도한 문제</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded">
              <div className="text-2xl font-bold text-green-600">
                {analytics.overall.mastered_count}
              </div>
              <div className="text-sm text-gray-600">마스터</div>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded">
              <div className="text-2xl font-bold text-yellow-600">
                {analytics.overall.completed_count}
              </div>
              <div className="text-sm text-gray-600">완료</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded">
              <div className="text-2xl font-bold text-purple-600">
                {analytics.overall.total_concepts_studied}
              </div>
              <div className="text-sm text-gray-600">학습한 개념</div>
            </div>
          </div>
        )}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recommendations */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-semibold mb-4 flex items-center">
            <span className="mr-2">🎯</span>
            추천 문제
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            AI가 분석한 당신에게 최적화된 문제들
          </p>
          <div className="space-y-3">
            {recommendations.map((rec, idx) => (
              <div
                key={idx}
                className="p-4 border rounded-lg hover:shadow-md transition"
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-lg">{rec.problem.title}</h3>
                  <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded">
                    {(rec.confidence * 100).toFixed(0)}% 적합
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-2">
                  {rec.concept.name}
                </p>
                <p className="text-xs text-gray-500">
                  {rec.reason}
                </p>
                <div className="flex gap-2 mt-2">
                  {rec.supporting_algorithms.map((alg: string) => (
                    <span
                      key={alg}
                      className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded"
                    >
                      {alg}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Weaknesses & Strengths */}
        <div className="space-y-6">
          {/* Weaknesses */}
          {analytics?.weaknesses && analytics.weaknesses.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-semibold mb-4 flex items-center">
                <span className="mr-2">⚠️</span>
                보강이 필요한 개념
              </h2>
              <div className="space-y-2">
                {analytics.weaknesses.map((weak: any) => (
                  <div key={weak.id} className="p-3 bg-red-50 rounded">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{weak.name}</span>
                      <span className="text-sm text-red-600">
                        평균 {weak.avg_score.toFixed(0)}점
                      </span>
                    </div>
                    <div className="text-xs text-gray-600 mt-1">
                      {weak.total_attempts}번 시도, {weak.problem_count}개 문제
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Strengths */}
          {analytics?.strengths && analytics.strengths.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-semibold mb-4 flex items-center">
                <span className="mr-2">⭐</span>
                잘하는 개념
              </h2>
              <div className="space-y-2">
                {analytics.strengths.map((strength: any) => (
                  <div key={strength.id} className="p-3 bg-green-50 rounded">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{strength.name}</span>
                      <span className="text-sm text-green-600">
                        평균 {strength.avg_score.toFixed(0)}점
                      </span>
                    </div>
                    <div className="text-xs text-gray-600 mt-1">
                      {strength.mastered_count}/{strength.problem_count} 마스터
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
