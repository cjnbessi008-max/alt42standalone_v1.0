import { Link } from 'react-router-dom'
import { Calendar, BookOpen, Sparkles, TrendingUp } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl shadow-2xl p-12 text-white">
        <div className="max-w-3xl">
          <h1 className="text-5xl font-bold mb-4">
            AI 기반 교육 시스템
          </h1>
          <p className="text-xl text-blue-100 mb-8">
            인공지능이 선별한 맞춤형 학습 하이라이트로 더 효과적인 학습을 경험하세요
          </p>
          <div className="flex gap-4">
            <Link
              to="/daily"
              className="inline-flex items-center px-6 py-3 bg-white text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition"
            >
              <Calendar className="w-5 h-5 mr-2" />
              오늘의 하이라이트 보기
            </Link>
            <Link
              to="/modules"
              className="inline-flex items-center px-6 py-3 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-400 transition"
            >
              <BookOpen className="w-5 h-5 mr-2" />
              학습 모듈 탐색
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <FeatureCard
          icon={<Sparkles className="w-8 h-8 text-yellow-500" />}
          title="AI 기반 추천"
          description="Claude AI가 학습 내용을 분석하여 핵심 개념과 활동을 자동으로 추출합니다"
          color="yellow"
        />
        <FeatureCard
          icon={<Calendar className="w-8 h-8 text-blue-500" />}
          title="일일 하이라이트"
          description="매일 맞춤형 학습 하이라이트를 제공하여 학습 효율을 극대화합니다"
          color="blue"
        />
        <FeatureCard
          icon={<TrendingUp className="w-8 h-8 text-green-500" />}
          title="진도 추적"
          description="학생의 학습 진도와 성과를 실시간으로 추적하고 분석합니다"
          color="green"
        />
      </section>

      {/* How It Works */}
      <section className="bg-white rounded-xl shadow-lg p-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-6">어떻게 작동하나요?</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Step
            number="1"
            title="모듈 생성"
            description="교사가 자연어로 학습 모듈을 요청합니다"
          />
          <Step
            number="2"
            title="AI 분석"
            description="Claude AI가 핵심 개념과 관계를 분석합니다"
          />
          <Step
            number="3"
            title="하이라이트 추출"
            description="중요한 학습 포인트를 자동으로 추출합니다"
          />
          <Step
            number="4"
            title="맞춤 추천"
            description="학생에게 최적화된 학습 경로를 제공합니다"
          />
        </div>
      </section>

      {/* Stats */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          value="AI 기반"
          label="자동 하이라이트 생성"
          color="blue"
        />
        <StatCard
          value="5-15분"
          label="클립당 평균 학습 시간"
          color="green"
        />
        <StatCard
          value="맞춤형"
          label="개인화된 학습 경로"
          color="purple"
        />
      </section>
    </div>
  )
}

function FeatureCard({ icon, title, description, color }) {
  const colorClasses = {
    yellow: 'bg-yellow-50 border-yellow-200',
    blue: 'bg-blue-50 border-blue-200',
    green: 'bg-green-50 border-green-200'
  }

  return (
    <div className={`${colorClasses[color]} border-2 rounded-xl p-6`}>
      <div className="mb-4">{icon}</div>
      <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  )
}

function Step({ number, title, description }) {
  return (
    <div className="text-center">
      <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-600 text-white rounded-full text-xl font-bold mb-4">
        {number}
      </div>
      <h4 className="font-semibold text-gray-900 mb-2">{title}</h4>
      <p className="text-sm text-gray-600">{description}</p>
    </div>
  )
}

function StatCard({ value, label, color }) {
  const colorClasses = {
    blue: 'from-blue-600 to-blue-700',
    green: 'from-green-600 to-green-700',
    purple: 'from-purple-600 to-purple-700'
  }

  return (
    <div className={`bg-gradient-to-br ${colorClasses[color]} rounded-xl shadow-lg p-6 text-white`}>
      <div className="text-3xl font-bold mb-2">{value}</div>
      <div className="text-sm opacity-90">{label}</div>
    </div>
  )
}
