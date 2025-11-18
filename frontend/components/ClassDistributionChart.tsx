/**
 * ClassDistributionChart Component
 * Displays thinking style distribution for a class
 */
import React from 'react';

interface DistributionData {
  computational: { count: number; percentage: number };
  intuitive: { count: number; percentage: number };
  visual: { count: number; percentage: number };
}

interface ClassDistributionChartProps {
  totalStudents: number;
  distribution: DistributionData;
  hybrids: { count: number; percentage: number };
  className?: string;
}

const styleColors = {
  computational: '#3B82F6',
  intuitive: '#10B981',
  visual: '#F59E0B',
};

const styleLabels = {
  computational: '계산형',
  intuitive: '직관형',
  visual: '그림형',
};

export const ClassDistributionChart: React.FC<ClassDistributionChartProps> = ({
  totalStudents,
  distribution,
  hybrids,
  className = '',
}) => {
  const chartData = [
    { type: 'computational', ...distribution.computational },
    { type: 'intuitive', ...distribution.intuitive },
    { type: 'visual', ...distribution.visual },
  ];

  return (
    <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">학급 사고 스타일 분포</h2>
        <p className="text-sm text-gray-500 mt-1">총 학생 수: {totalStudents}명</p>
      </div>

      {/* Pie Chart (Simplified visualization) */}
      <div className="mb-8">
        <div className="flex h-8 rounded-full overflow-hidden">
          {chartData.map((item) => (
            <div
              key={item.type}
              style={{
                width: `${item.percentage}%`,
                backgroundColor: styleColors[item.type as keyof typeof styleColors],
              }}
              className="transition-all duration-300 hover:opacity-80"
              title={`${styleLabels[item.type as keyof typeof styleLabels]}: ${item.count}명 (${item.percentage}%)`}
            />
          ))}
        </div>
      </div>

      {/* Legend and Stats */}
      <div className="space-y-4">
        {chartData.map((item) => (
          <div
            key={item.type}
            className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: styleColors[item.type as keyof typeof styleColors] }}
              />
              <span className="font-semibold text-gray-700">
                {styleLabels[item.type as keyof typeof styleLabels]}
              </span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-gray-600">{item.count}명</span>
              <span
                className="font-bold text-lg"
                style={{ color: styleColors[item.type as keyof typeof styleColors] }}
              >
                {item.percentage}%
              </span>
            </div>
          </div>
        ))}

        {/* Hybrid students */}
        {hybrids.count > 0 && (
          <div className="flex items-center justify-between p-3 rounded-lg bg-purple-50 border border-purple-200">
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 rounded-full bg-gradient-to-r from-blue-500 to-orange-500" />
              <span className="font-semibold text-gray-700">하이브리드 (복합형)</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-gray-600">{hybrids.count}명</span>
              <span className="font-bold text-lg text-purple-600">{hybrids.percentage}%</span>
            </div>
          </div>
        )}
      </div>

      {/* Insights */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <h3 className="font-semibold text-blue-900 mb-2">💡 교사 팁</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• 다양한 학습 자료를 제공하여 모든 사고 스타일을 지원하세요</li>
          <li>• 그룹 활동 시 서로 다른 스타일의 학생들을 섞어보세요</li>
          <li>• 각 스타일에 맞는 문제 유형을 균형있게 포함하세요</li>
        </ul>
      </div>
    </div>
  );
};

export default ClassDistributionChart;
