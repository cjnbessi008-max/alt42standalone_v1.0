import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/services/authStore'
import { UserRole } from '@/types'

interface LayoutProps {
  children: React.ReactNode
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, clearAuth } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    clearAuth()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <Link to="/" className="flex items-center">
                <span className="text-xl font-bold text-primary-600">LMS</span>
              </Link>
              <div className="ml-10 flex items-center space-x-4">
                <Link to="/problems" className="text-gray-700 hover:text-primary-600">
                  문제 목록
                </Link>
                {user?.role === UserRole.STUDENT && (
                  <Link to="/my-solutions" className="text-gray-700 hover:text-primary-600">
                    내 풀이
                  </Link>
                )}
                {user?.role === UserRole.TEACHER && (
                  <Link to="/teacher/problems" className="text-gray-700 hover:text-primary-600">
                    문제 관리
                  </Link>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {user ? (
                <>
                  <span className="text-sm text-gray-600">
                    {user.full_name || user.username} ({user.role})
                  </span>
                  <button onClick={handleLogout} className="btn-secondary">
                    로그아웃
                  </button>
                </>
              ) : (
                <Link to="/login" className="btn-primary">
                  로그인
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">{children}</main>
    </div>
  )
}
