import React from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '@/services/authStore'
import { UserRole } from '@/types'

export const Home: React.FC = () => {
  const { user, isAuthenticated } = useAuthStore()

  if (!isAuthenticated()) {
    return (
      <div className="text-center py-20">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">LMS 풀이 비교 시스템</h1>
        <p className="text-xl text-gray-600 mb-8">AI 기반 학습 관리 시스템</p>
        <div className="flex gap-4 justify-center">
          <Link to="/login" className="btn-primary text-lg">
            로그인
          </Link>
          <Link to="/register" className="btn-secondary text-lg">
            회원가입
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          환영합니다, {user?.full_name || user?.username}님!
        </h1>
        <p className="text-xl text-gray-600">
          {user?.role === UserRole.STUDENT && '문제를 풀고 AI 피드백을 받아보세요.'}
          {user?.role === UserRole.TEACHER && '문제를 생성하고 학생들의 풀이를 관리하세요.'}
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Link to="/problems" className="card hover:shadow-lg transition-shadow">
          <div className="text-4xl mb-4">📚</div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">문제 목록</h3>
          <p className="text-gray-600">다양한 문제를 둘러보고 풀어보세요.</p>
        </Link>

        {user?.role === UserRole.STUDENT && (
          <Link to="/my-solutions" className="card hover:shadow-lg transition-shadow">
            <div className="text-4xl mb-4">✍️</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">내 풀이</h3>
            <p className="text-gray-600">제출한 풀이와 피드백을 확인하세요.</p>
          </Link>
        )}

        {user?.role === UserRole.TEACHER && (
          <>
            <Link to="/teacher/problems" className="card hover:shadow-lg transition-shadow">
              <div className="text-4xl mb-4">⚙️</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">문제 관리</h3>
              <p className="text-gray-600">문제를 생성하고 관리하세요.</p>
            </Link>
            <Link to="/teacher/problems/new" className="card hover:shadow-lg transition-shadow">
              <div className="text-4xl mb-4">➕</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">새 문제 만들기</h3>
              <p className="text-gray-600">새로운 문제를 생성하세요.</p>
            </Link>
          </>
        )}

        <div className="card bg-primary-50 border-2 border-primary-200">
          <div className="text-4xl mb-4">🤖</div>
          <h3 className="text-xl font-bold text-primary-900 mb-2">AI 풀이 비교</h3>
          <p className="text-primary-700">Claude AI가 모범 풀이와 비교하여 상세한 피드백을 제공합니다.</p>
        </div>
      </div>

      <div className="mt-12 card bg-gray-50">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">주요 기능</h2>
        <ul className="space-y-3 text-gray-700">
          <li className="flex items-start">
            <span className="text-primary-600 mr-2">✓</span>
            <span>문제 풀이 제출 및 관리</span>
          </li>
          <li className="flex items-start">
            <span className="text-primary-600 mr-2">✓</span>
            <span>AI 기반 모범 풀이 비교</span>
          </li>
          <li className="flex items-start">
            <span className="text-primary-600 mr-2">✓</span>
            <span>상세한 피드백 및 개선 제안</span>
          </li>
          <li className="flex items-start">
            <span className="text-primary-600 mr-2">✓</span>
            <span>유사도 점수 및 강점/개선점 분석</span>
          </li>
          <li className="flex items-start">
            <span className="text-primary-600 mr-2">✓</span>
            <span>시각적 차이점 비교</span>
          </li>
        </ul>
      </div>
    </div>
  )
}
