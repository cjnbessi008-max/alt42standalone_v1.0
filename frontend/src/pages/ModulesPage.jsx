import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { BookOpen, Clock, Star } from 'lucide-react'
import { getModules } from '../services/api'

export default function ModulesPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['modules'],
    queryFn: () => getModules({ status: 'active' })
  })

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-600">오류: {error.message}</p>
      </div>
    )
  }

  const modules = data?.modules || []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">학습 모듈</h1>
          <p className="text-gray-600 mt-2">
            AI가 생성한 교육 모듈 {modules.length}개
          </p>
        </div>
      </div>

      {/* Modules Grid */}
      {modules.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">아직 생성된 모듈이 없습니다.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {modules.map((module) => (
            <ModuleCard key={module.id} module={module} />
          ))}
        </div>
      )}
    </div>
  )
}

function ModuleCard({ module }) {
  return (
    <Link
      to={`/modules/${module.id}`}
      className="block bg-white rounded-lg shadow hover:shadow-xl transition-all duration-200 overflow-hidden group"
    >
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition">
              {module.name}
            </h3>
            <p className="text-sm text-gray-600 line-clamp-2">
              {module.description}
            </p>
          </div>
          <span className={`ml-3 px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(module.status)}`}>
            {getStatusLabel(module.status)}
          </span>
        </div>

        <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
          <span className="inline-flex items-center">
            <BookOpen className="w-4 h-4 mr-1" />
            {module.subject}
          </span>
          <span>{module.grade_level}</span>
        </div>

        <div className="flex items-center text-xs text-gray-400">
          <Clock className="w-3 h-3 mr-1" />
          {new Date(module.created_at).toLocaleDateString('ko-KR')}
        </div>
      </div>

      <div className="bg-gray-50 px-6 py-3 border-t border-gray-100">
        <span className="text-sm text-blue-600 font-medium group-hover:text-blue-700">
          하이라이트 보기 →
        </span>
      </div>
    </Link>
  )
}

function getStatusLabel(status) {
  const labels = {
    generating: '생성 중',
    active: '활성',
    archived: '보관됨',
    failed: '실패'
  }
  return labels[status] || status
}

function getStatusBadgeColor(status) {
  const colors = {
    generating: 'bg-yellow-100 text-yellow-800',
    active: 'bg-green-100 text-green-800',
    archived: 'bg-gray-100 text-gray-800',
    failed: 'bg-red-100 text-red-800'
  }
  return colors[status] || 'bg-gray-100 text-gray-800'
}
