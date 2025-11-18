import { useQuery } from '@tanstack/react-query'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { getModuleById, getModuleHighlights } from '../services/api'

export default function ModuleDetailPage() {
  const { moduleId } = useParams()

  const { data: module, isLoading: moduleLoading } = useQuery({
    queryKey: ['module', moduleId],
    queryFn: () => getModuleById(moduleId)
  })

  const { data: highlightsData, isLoading: highlightsLoading } = useQuery({
    queryKey: ['module-highlights', moduleId],
    queryFn: () => getModuleHighlights(moduleId)
  })

  if (moduleLoading || highlightsLoading) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const highlights = highlightsData?.highlights || []

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Link
        to="/modules"
        className="inline-flex items-center text-blue-600 hover:text-blue-700"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        모듈 목록으로 돌아가기
      </Link>

      {/* Module Info */}
      <div className="bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">{module.name}</h1>
        <p className="text-gray-600 mb-6">{module.description}</p>

        <div className="flex flex-wrap gap-4">
          <div className="flex items-center text-sm text-gray-500">
            <span className="font-medium mr-2">과목:</span>
            {module.subject}
          </div>
          <div className="flex items-center text-sm text-gray-500">
            <span className="font-medium mr-2">학년:</span>
            {module.grade_level}
          </div>
          <div className="flex items-center text-sm text-gray-500">
            <span className="font-medium mr-2">상태:</span>
            {module.status}
          </div>
        </div>
      </div>

      {/* Highlights */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          하이라이트 클립 ({highlights.length})
        </h2>

        {highlights.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-500">이 모듈에는 아직 하이라이트가 없습니다.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {highlights.map((highlight) => (
              <Link
                key={highlight.id}
                to={`/highlights/${highlight.id}`}
                className="block bg-white rounded-lg shadow p-6 hover:shadow-lg transition"
              >
                <h3 className="font-semibold text-gray-900 mb-2">{highlight.title}</h3>
                <p className="text-sm text-gray-600 mb-3">{highlight.description}</p>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{highlight.clip_type}</span>
                  <span>{highlight.estimated_duration_minutes}분</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
