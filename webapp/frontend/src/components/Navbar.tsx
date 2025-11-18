import { Link } from 'react-router-dom'

export default function Navbar() {
  return (
    <nav className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="text-2xl font-bold">
            🎓 개념-문제 매칭 시스템
          </Link>
          <div className="flex gap-6">
            <Link to="/" className="hover:text-purple-200 transition">
              홈
            </Link>
            <Link to="/visualization" className="hover:text-purple-200 transition">
              시각화
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
}
