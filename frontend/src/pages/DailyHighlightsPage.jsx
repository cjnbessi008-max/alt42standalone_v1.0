import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { Star, Clock, TrendingUp } from 'lucide-react'
import { getDailyHighlights } from '../services/api'

export default function DailyHighlightsPage() {
  const today = new Date()

  const { data, isLoading, error } = useQuery({
    queryKey: ['daily-highlights', format(today, 'yyyy-MM-dd')],
    queryFn: () => getDailyHighlights(format(today, 'yyyy-MM-dd'))
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

  const highlights = data?.highlights || []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg shadow-lg p-8 text-white">
        <h1 className="text-3xl font-bold mb-2">오늘의 추천 하이라이트</h1>
        <p className="text-blue-100">
          {format(today, 'yyyy년 M월 d일 EEEE', { locale: ko })}
        </p>
        <p className="mt-2 text-sm text-blue-100">
          AI가 선정한 오늘의 학습 하이라이트 {highlights.length}개
        </p>
      </div>

      {/* Highlights Grid */}
      {highlights.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-gray-500">오늘의 하이라이트가 아직 생성되지 않았습니다.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {highlights.map((item) => (
            <HighlightCard key={item.id} highlight={item} />
          ))}
        </div>
      )}
    </div>
  )
}

function HighlightCard({ highlight }) {
  const clip = highlight.clip

  return (
    <Link
      to={`/highlights/${clip.id}`}
      className="block bg-white rounded-lg shadow hover:shadow-xl transition-all duration-200 overflow-hidden group"
    >
      {/* Badge */}
      <div className="bg-gradient-to-r from-yellow-400 to-orange-400 px-4 py-2">
        <div className="flex items-center justify-between text-white text-sm font-medium">
          <span className="flex items-center">
            <Star className="w-4 h-4 mr-1 fill-current" />
            AI 추천
          </span>
          <span>{Math.round(highlight.confidence_score * 100)}% 신뢰도</span>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <div className="flex items-start justify-between mb-3">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            {getClipTypeLabel(clip.clip_type)}
          </span>
          <div className="flex items-center text-gray-500 text-sm">
            <Clock className="w-4 h-4 mr-1" />
            {clip.estimated_duration_minutes}분
          </div>
        </div>

        <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition">
          {clip.title}
        </h3>

        <p className="text-sm text-gray-600 mb-4 line-clamp-2">
          {clip.description}
        </p>

        {/* Reason */}
        <div className="bg-blue-50 rounded-md p-3 mb-4">
          <p className="text-xs text-blue-700 flex items-start">
            <TrendingUp className="w-4 h-4 mr-1 mt-0.5 flex-shrink-0" />
            <span>{highlight.recommendation_reason}</span>
          </p>
        </div>

        {/* Key Concepts */}
        {clip.key_concepts && clip.key_concepts.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {clip.key_concepts.slice(0, 3).map((concept, idx) => (
              <span
                key={idx}
                className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded"
              >
                #{concept}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  )
}

function getClipTypeLabel(type) {
  const labels = {
    concept: '개념 학습',
    activity: '실습 활동',
    example: '예제 풀이',
    assessment: '평가',
    summary: '요약'
  }
  return labels[type] || type
}
