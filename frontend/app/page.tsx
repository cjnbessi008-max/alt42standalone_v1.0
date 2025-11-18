export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-gradient-to-b from-blue-50 to-white">
      <div className="text-center space-y-8">
        <h1 className="text-6xl font-bold text-primary">
          MathFlow
        </h1>
        <p className="text-2xl text-gray-600">
          수포자를 위한 중독형 수학 웹앱
        </p>
        <p className="text-lg text-gray-500 max-w-2xl">
          문제를 풀면 즉각적인 시각 효과가 나타나고,
          <br />
          연속 성공하면 콤보가 터지고,
          <br />
          수학 개념이 살아 움직이는 애니메이션으로 변신합니다.
        </p>

        <div className="flex gap-4 justify-center mt-8">
          <button className="bg-primary text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-primary/90 transition-colors">
            시작하기
          </button>
          <button className="border-2 border-primary text-primary px-8 py-4 rounded-lg text-lg font-semibold hover:bg-primary/5 transition-colors">
            둘러보기
          </button>
        </div>

        <div className="mt-16 text-sm text-gray-400">
          Frontend: Next.js 14 + React 18 + TypeScript + TailwindCSS
          <br />
          Backend: FastAPI + PostgreSQL (Coming Soon)
        </div>
      </div>
    </main>
  )
}
