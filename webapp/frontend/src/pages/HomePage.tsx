import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getStudents } from '../services/api'

interface Student {
  id: number
  name: string
  grade_level: string
  problems_attempted: number
  problems_mastered: number
  avg_score: number
}

export default function HomePage() {
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStudents()
  }, [])

  const loadStudents = async () => {
    try {
      const response = await getStudents()
      setStudents(response.data.data)
    } catch (error) {
      console.error('Failed to load students:', error)
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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">
          개념-문제 매칭 및 추천 시스템
        </h1>
        <p className="text-gray-600 text-lg">
          AI 기반 하이브리드 추천 알고리즘으로 학생별 맞춤 학습 경로를 제공합니다
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-semibold mb-4">🎯 주요 기능</h2>
          <ul className="space-y-3">
            <li className="flex items-start">
              <span className="text-green-500 mr-2">✓</span>
              <span>하이브리드 추천 알고리즘 (컨텐츠 기반 + 협업 필터링 + 지식 그래프)</span>
            </li>
            <li className="flex items-start">
              <span className="text-green-500 mr-2">✓</span>
              <span>D3.js 기반 인터랙티브 개념-문제 관계 시각화</span>
            </li>
            <li className="flex items-start">
              <span className="text-green-500 mr-2">✓</span>
              <span>학생별 학습 분석 및 성취도 추적</span>
            </li>
            <li className="flex items-start">
              <span className="text-green-500 mr-2">✓</span>
              <span>약점 개념 자동 파악 및 보강 문제 추천</span>
            </li>
          </ul>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-semibold mb-4">📊 통계</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded">
              <div className="text-3xl font-bold text-blue-600">{students.length}</div>
              <div className="text-gray-600">총 학생 수</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded">
              <div className="text-3xl font-bold text-green-600">
                {students.reduce((sum, s) => sum + (s.problems_mastered || 0), 0)}
              </div>
              <div className="text-gray-600">마스터한 문제</div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-semibold mb-6">👨‍🎓 학생 목록</h2>
        <div className="grid gap-4">
          {students.map((student) => (
            <Link
              key={student.id}
              to={`/student/${student.id}`}
              className="p-4 border rounded-lg hover:shadow-lg transition hover:border-purple-500"
            >
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-semibold">{student.name}</h3>
                  <p className="text-gray-600 text-sm">{student.grade_level}</p>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-600">
                    문제 시도: {student.problems_attempted || 0}
                  </div>
                  <div className="text-sm text-gray-600">
                    마스터: {student.problems_mastered || 0}
                  </div>
                  <div className="text-lg font-semibold text-purple-600">
                    평균: {student.avg_score ? student.avg_score.toFixed(1) : 'N/A'}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
