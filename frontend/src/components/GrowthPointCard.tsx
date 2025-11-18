import { TrendingUp, Lightbulb } from 'lucide-react';
import type { GrowthInsight } from '../types';

interface Props {
  insight: GrowthInsight;
}

const dimensionColors: Record<string, string> = {
  '자기_조절_능력': 'bg-blue-100 text-blue-800 border-blue-300',
  '학습_효율성': 'bg-green-100 text-green-800 border-green-300',
  '실수에서의_학습': 'bg-purple-100 text-purple-800 border-purple-300',
  '자기_인식': 'bg-yellow-100 text-yellow-800 border-yellow-300',
  '학습_전략_발전': 'bg-pink-100 text-pink-800 border-pink-300',
};

const dimensionNames: Record<string, string> = {
  '자기_조절_능력': '자기 조절 능력',
  '학습_효율성': '학습 효율성',
  '실수에서의_학습': '실수에서의 학습',
  '자기_인식': '자기 인식',
  '학습_전략_발전': '학습 전략 발전',
};

export default function GrowthPointCard({ insight }: Props) {
  const colorClass = dimensionColors[insight.dimension] || 'bg-gray-100 text-gray-800 border-gray-300';
  const dimensionName = dimensionNames[insight.dimension] || insight.dimension;

  return (
    <div className="card hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium border ${colorClass}`}>
            {dimensionName}
          </span>
        </div>
        {insight.improvement_percentage !== undefined && insight.improvement_percentage > 0 && (
          <div className="flex items-center text-green-600">
            <TrendingUp className="w-5 h-5 mr-1" />
            <span className="font-bold text-lg">+{insight.improvement_percentage}%</span>
          </div>
        )}
      </div>

      <h3 className="text-xl font-bold text-gray-900 mb-3">{insight.title}</h3>

      <p className="text-gray-700 mb-4 leading-relaxed">{insight.description}</p>

      {insight.recommendation && (
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
          <div className="flex items-start">
            <Lightbulb className="w-5 h-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-blue-800 mb-1">추천 사항</p>
              <p className="text-sm text-blue-700">{insight.recommendation}</p>
            </div>
          </div>
        </div>
      )}

      {insight.evidence_data && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            {insight.evidence_data.metric}: {insight.evidence_data.previous_value} → {insight.evidence_data.current_value}
            {' '}({insight.evidence_data.comparison_period})
          </p>
        </div>
      )}
    </div>
  );
}
