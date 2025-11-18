import { useQuery } from '@tanstack/react-query'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Clock, TrendingUp } from 'lucide-react'
import { getHighlightById } from '../services/api'

export default function HighlightDetailPage() {
  const { highlightId } = useParams()

  const { data: highlight, isLoading, error } = useQuery({
    queryKey: ['highlight', highlightId],
    queryFn: () => getHighlightById(highlightId)
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

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Link
        to="/daily"
        className="inline-flex items-center text-blue-600 hover:text-blue-700"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        뒤로 가기
      </Link>

      {/* Highlight Header */}
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="flex items-start justify-between mb-6">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900 mb-3">{highlight.title}</h1>
            <p className="text-lg text-gray-600">{highlight.description}</p>
          </div>
          <div className="ml-6 flex flex-col items-end gap-2">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
              {highlight.clip_type}
            </span>
            <div className="flex items-center text-gray-500 text-sm">
              <Clock className="w-4 h-4 mr-1" />
              {highlight.estimated_duration_minutes}분
            </div>
          </div>
        </div>

        {/* Key Concepts */}
        {highlight.key_concepts && highlight.key_concepts.length > 0 && (
          <div className="mb-6">
            <h3 className="font-semibold text-gray-700 mb-3">핵심 개념</h3>
            <div className="flex flex-wrap gap-2">
              {highlight.key_concepts.map((concept, idx) => (
                <span
                  key={idx}
                  className="inline-block px-3 py-1 bg-blue-50 text-blue-700 rounded-md text-sm font-medium"
                >
                  {concept}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Difficulty */}
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <div className="flex items-center">
            <TrendingUp className="w-4 h-4 mr-1" />
            <span>난이도: {highlight.difficulty_level}/5</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="bg-white rounded-lg shadow-lg p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">학습 내용</h2>

        <div className="prose max-w-none">
          {renderContent(highlight.content)}
        </div>
      </div>
    </div>
  )
}

function renderContent(content) {
  if (typeof content === 'string') {
    return <p className="text-gray-700">{content}</p>
  }

  return (
    <div className="space-y-6">
      {content.introduction && (
        <div>
          <h3 className="text-xl font-semibold text-gray-900 mb-3">소개</h3>
          <p className="text-gray-700">{content.introduction}</p>
        </div>
      )}

      {content.main_content && (
        <div>
          <h3 className="text-xl font-semibold text-gray-900 mb-3">주요 내용</h3>
          {typeof content.main_content === 'string' ? (
            <p className="text-gray-700">{content.main_content}</p>
          ) : (
            <div className="space-y-4">
              {content.main_content.explanation && (
                <p className="text-gray-700">{content.main_content.explanation}</p>
              )}
              {content.main_content.visual_example && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm font-medium text-blue-900 mb-2">시각적 예시</p>
                  <p className="text-blue-700">{content.main_content.visual_example}</p>
                </div>
              )}
              {content.main_content.interactive_element && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-sm font-medium text-green-900 mb-2">인터랙티브 요소</p>
                  <p className="text-green-700">{content.main_content.interactive_element}</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {content.practice_questions && content.practice_questions.length > 0 && (
        <div>
          <h3 className="text-xl font-semibold text-gray-900 mb-3">연습 문제</h3>
          <ul className="list-disc list-inside space-y-2">
            {content.practice_questions.map((question, idx) => (
              <li key={idx} className="text-gray-700">{question}</li>
            ))}
          </ul>
        </div>
      )}

      {content.key_takeaway && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <p className="font-medium text-yellow-900 mb-1">핵심 정리</p>
          <p className="text-yellow-800">{content.key_takeaway}</p>
        </div>
      )}
    </div>
  )
}
