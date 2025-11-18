import { Link } from 'react-router-dom';

export default function HomePage() {
  return (
    <div className="px-4 py-16 sm:px-6 lg:px-8">
      {/* Hero Section */}
      <div className="text-center">
        <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
          <span className="block">풀이 과정의</span>
          <span className="block text-indigo-600">논리적 간격 정량화</span>
        </h1>
        <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
          AI 기반 분석으로 학생의 문제 풀이 과정을 평가하고,
          논리적 간격을 정량화하여 맞춤형 피드백을 제공합니다.
        </p>
        <div className="mt-5 max-w-md mx-auto sm:flex sm:justify-center md:mt-8">
          <div className="rounded-md shadow">
            <Link
              to="/problems"
              className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 md:py-4 md:text-lg md:px-10"
            >
              문제 풀어보기
            </Link>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="mt-20">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          <div className="pt-6">
            <div className="flow-root bg-white rounded-lg px-6 pb-8">
              <div className="-mt-6">
                <div>
                  <span className="inline-flex items-center justify-center p-3 bg-indigo-500 rounded-md shadow-lg">
                    <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </span>
                </div>
                <h3 className="mt-8 text-lg font-medium text-gray-900 tracking-tight">단계별 분석</h3>
                <p className="mt-5 text-base text-gray-500">
                  학생의 풀이 단계를 하나하나 분석하여 누락된 논리적 단계를 찾아냅니다.
                </p>
              </div>
            </div>
          </div>

          <div className="pt-6">
            <div className="flow-root bg-white rounded-lg px-6 pb-8">
              <div className="-mt-6">
                <div>
                  <span className="inline-flex items-center justify-center p-3 bg-indigo-500 rounded-md shadow-lg">
                    <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </span>
                </div>
                <h3 className="mt-8 text-lg font-medium text-gray-900 tracking-tight">AI 기반 정량화</h3>
                <p className="mt-5 text-base text-gray-500">
                  Claude AI를 활용하여 논리적 간격을 객관적으로 측정하고 점수화합니다.
                </p>
              </div>
            </div>
          </div>

          <div className="pt-6">
            <div className="flow-root bg-white rounded-lg px-6 pb-8">
              <div className="-mt-6">
                <div>
                  <span className="inline-flex items-center justify-center p-3 bg-indigo-500 rounded-md shadow-lg">
                    <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                    </svg>
                  </span>
                </div>
                <h3 className="mt-8 text-lg font-medium text-gray-900 tracking-tight">맞춤형 피드백</h3>
                <p className="mt-5 text-base text-gray-500">
                  분석 결과를 바탕으로 학생에게 구체적이고 실행 가능한 피드백을 제공합니다.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <div className="mt-20">
        <h2 className="text-3xl font-extrabold text-gray-900 text-center">
          작동 방식
        </h2>
        <div className="mt-10 grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="text-center">
            <div className="flex items-center justify-center h-12 w-12 rounded-md bg-indigo-500 text-white mx-auto text-xl font-bold">
              1
            </div>
            <h3 className="mt-4 text-lg font-medium text-gray-900">문제 선택</h3>
            <p className="mt-2 text-base text-gray-500">
              풀고 싶은 수학 문제를 선택합니다
            </p>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center h-12 w-12 rounded-md bg-indigo-500 text-white mx-auto text-xl font-bold">
              2
            </div>
            <h3 className="mt-4 text-lg font-medium text-gray-900">풀이 제출</h3>
            <p className="mt-2 text-base text-gray-500">
              단계별로 풀이 과정을 작성합니다
            </p>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center h-12 w-12 rounded-md bg-indigo-500 text-white mx-auto text-xl font-bold">
              3
            </div>
            <h3 className="mt-4 text-lg font-medium text-gray-900">AI 분석</h3>
            <p className="mt-2 text-base text-gray-500">
              AI가 논리적 간격을 분석합니다
            </p>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center h-12 w-12 rounded-md bg-indigo-500 text-white mx-auto text-xl font-bold">
              4
            </div>
            <h3 className="mt-4 text-lg font-medium text-gray-900">결과 확인</h3>
            <p className="mt-2 text-base text-gray-500">
              점수와 상세 피드백을 확인합니다
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
