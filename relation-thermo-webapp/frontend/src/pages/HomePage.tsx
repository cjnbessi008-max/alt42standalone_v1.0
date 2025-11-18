import React from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/auth.store';

const HomePage: React.FC = () => {
  const { user } = useAuthStore();

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-100 via-white to-secondary-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Hero section */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            환영합니다, {user?.name}님!
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            집합의 관계를 온도계로 학습하세요
          </p>

          <Link
            to="/practice"
            className="inline-block bg-primary-500 hover:bg-primary-600 text-white font-bold py-4 px-8 rounded-lg text-lg transition-colors"
          >
            학습 시작하기
          </Link>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="text-4xl mb-4">🌡️</div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">
              온도계 시각화
            </h3>
            <p className="text-gray-600">
              확신도를 온도계로 표현하여 직관적으로 학습하세요
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="text-4xl mb-4">📱</div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">
              가상 스마트폰
            </h3>
            <p className="text-gray-600">
              우측 하단의 스마트폰 화면에서 문제를 풀어보세요
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="text-4xl mb-4">📊</div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">실시간 통계</h3>
            <p className="text-gray-600">
              학습 진행 상황과 성과를 실시간으로 확인하세요
            </p>
          </div>
        </div>

        {/* About section */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-4">
            집합 관계란?
          </h2>
          <div className="grid md:grid-cols-2 gap-6 text-gray-600">
            <div>
              <h4 className="font-semibold text-primary-600 mb-2">
                ⊆ 부분집합 (Subset)
              </h4>
              <p>A의 모든 원소가 B에 포함되는 관계</p>
            </div>
            <div>
              <h4 className="font-semibold text-primary-600 mb-2">
                ⊇ 초집합 (Superset)
              </h4>
              <p>B의 모든 원소가 A에 포함되는 관계</p>
            </div>
            <div>
              <h4 className="font-semibold text-primary-600 mb-2">
                = 같음 (Equal)
              </h4>
              <p>두 집합이 완전히 동일한 원소를 가지는 관계</p>
            </div>
            <div>
              <h4 className="font-semibold text-primary-600 mb-2">
                ∅ 서로소 (Disjoint)
              </h4>
              <p>두 집합에 공통 원소가 하나도 없는 관계</p>
            </div>
            <div>
              <h4 className="font-semibold text-primary-600 mb-2">
                ∩ 교집합 존재 (Intersect)
              </h4>
              <p>두 집합에 공통 원소가 있는 관계</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
