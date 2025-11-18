import { Outlet, Link } from 'react-router-dom'
import { Home, Calendar, BookOpen } from 'lucide-react'

export default function Layout() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link to="/" className="text-2xl font-bold text-blue-600">
                AI 교육 시스템
              </Link>
            </div>
            <nav className="flex space-x-8">
              <Link
                to="/"
                className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 transition"
              >
                <Home className="w-4 h-4 mr-2" />
                홈
              </Link>
              <Link
                to="/daily"
                className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 transition"
              >
                <Calendar className="w-4 h-4 mr-2" />
                오늘의 하이라이트
              </Link>
              <Link
                to="/modules"
                className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 transition"
              >
                <BookOpen className="w-4 h-4 mr-2" />
                학습 모듈
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-sm text-gray-500">
            © 2025 KAIST Touch Math Academy. AI 기반 교육 시스템.
          </p>
        </div>
      </footer>
    </div>
  )
}
