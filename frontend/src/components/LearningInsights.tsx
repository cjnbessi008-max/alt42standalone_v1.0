import type { LearningPattern } from '../types';
import { Brain, TrendingUp, Target, Lightbulb } from 'lucide-react';

interface LearningInsightsProps {
  pattern: LearningPattern;
}

export default function LearningInsights({ pattern }: LearningInsightsProps) {
  const { insights } = pattern;

  if (!insights) return null;

  return (
    <div className="card">
      <div className="card-header">
        <h2 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Brain size={24} />
          학습 인사이트
        </h2>
      </div>

      {/* 전반적인 성과 */}
      {insights.overallPerformance && (
        <div style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ fontWeight: '600', marginBottom: '0.75rem', fontSize: '1.125rem' }}>
            📊 전반적인 성과
          </h3>
          <p style={{ marginBottom: '1rem', color: '#4b5563' }}>
            {insights.overallPerformance.summary}
          </p>

          <div className="grid grid-cols-2" style={{ gap: '1rem' }}>
            {insights.overallPerformance.strengths && insights.overallPerformance.strengths.length > 0 && (
              <div style={{ padding: '1rem', backgroundColor: '#d1fae5', borderRadius: '8px' }}>
                <div style={{ fontWeight: '500', marginBottom: '0.5rem', color: '#065f46' }}>
                  ✅ 강점
                </div>
                <ul style={{ paddingLeft: '1.5rem', fontSize: '0.875rem', color: '#047857' }}>
                  {insights.overallPerformance.strengths.map((strength, i) => (
                    <li key={i}>{strength}</li>
                  ))}
                </ul>
              </div>
            )}

            {insights.overallPerformance.weaknesses && insights.overallPerformance.weaknesses.length > 0 && (
              <div style={{ padding: '1rem', backgroundColor: '#fef3c7', borderRadius: '8px' }}>
                <div style={{ fontWeight: '500', marginBottom: '0.5rem', color: '#92400e' }}>
                  📈 개선 영역
                </div>
                <ul style={{ paddingLeft: '1.5rem', fontSize: '0.875rem', color: '#b45309' }}>
                  {insights.overallPerformance.weaknesses.map((weakness, i) => (
                    <li key={i}>{weakness}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 개념 숙달도 */}
      {insights.conceptMastery && (
        <div style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ fontWeight: '600', marginBottom: '0.75rem', fontSize: '1.125rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Target size={20} />
            개념 숙달도
          </h3>

          <div className="grid grid-cols-3" style={{ gap: '1rem' }}>
            {insights.conceptMastery.strong && insights.conceptMastery.strong.length > 0 && (
              <div>
                <div style={{ fontWeight: '500', marginBottom: '0.5rem', color: '#065f46' }}>
                  🌟 숙달된 개념
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {insights.conceptMastery.strong.map((concept, i) => (
                    <span key={i} className="badge badge-success">
                      {concept}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {insights.conceptMastery.developing && insights.conceptMastery.developing.length > 0 && (
              <div>
                <div style={{ fontWeight: '500', marginBottom: '0.5rem', color: '#1e40af' }}>
                  📚 발전 중
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {insights.conceptMastery.developing.map((concept, i) => (
                    <span key={i} className="badge badge-info">
                      {concept}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {insights.conceptMastery.needsWork && insights.conceptMastery.needsWork.length > 0 && (
              <div>
                <div style={{ fontWeight: '500', marginBottom: '0.5rem', color: '#92400e' }}>
                  💪 더 연습 필요
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {insights.conceptMastery.needsWork.map((concept, i) => (
                    <span key={i} className="badge badge-warning">
                      {concept}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 추천 사항 */}
      {insights.recommendations && (
        <div style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ fontWeight: '600', marginBottom: '0.75rem', fontSize: '1.125rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <TrendingUp size={20} />
            추천 학습 방향
          </h3>

          <div className="grid grid-cols-2" style={{ gap: '1rem' }}>
            {insights.recommendations.nextTopics && insights.recommendations.nextTopics.length > 0 && (
              <div style={{ padding: '1rem', backgroundColor: '#dbeafe', borderRadius: '8px' }}>
                <div style={{ fontWeight: '500', marginBottom: '0.5rem', color: '#1e40af' }}>
                  📖 다음 학습 주제
                </div>
                <ul style={{ paddingLeft: '1.5rem', fontSize: '0.875rem', color: '#1e3a8a' }}>
                  {insights.recommendations.nextTopics.map((topic, i) => (
                    <li key={i}>{topic}</li>
                  ))}
                </ul>
              </div>
            )}

            {insights.recommendations.practiceAreas && insights.recommendations.practiceAreas.length > 0 && (
              <div style={{ padding: '1rem', backgroundColor: '#fef3c7', borderRadius: '8px' }}>
                <div style={{ fontWeight: '500', marginBottom: '0.5rem', color: '#92400e' }}>
                  🎯 집중 연습 영역
                </div>
                <ul style={{ paddingLeft: '1.5rem', fontSize: '0.875rem', color: '#78350f' }}>
                  {insights.recommendations.practiceAreas.map((area, i) => (
                    <li key={i}>{area}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {insights.recommendations.studyTips && insights.recommendations.studyTips.length > 0 && (
            <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#f3f4f6', borderRadius: '8px' }}>
              <div style={{ fontWeight: '500', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Lightbulb size={18} />
                학습 팁
              </div>
              <ul style={{ paddingLeft: '1.5rem', fontSize: '0.875rem', color: '#4b5563' }}>
                {insights.recommendations.studyTips.map((tip, i) => (
                  <li key={i}>{tip}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* 격려 메시지 */}
      {insights.motivationalMessage && (
        <div
          style={{
            padding: '1rem',
            backgroundColor: '#fef3c7',
            borderRadius: '8px',
            borderLeft: '4px solid #f59e0b',
          }}
        >
          <div style={{ fontWeight: '500', marginBottom: '0.5rem', color: '#92400e' }}>
            💪 응원 메시지
          </div>
          <p style={{ fontSize: '0.875rem', color: '#78350f' }}>
            {insights.motivationalMessage}
          </p>
        </div>
      )}
    </div>
  );
}
