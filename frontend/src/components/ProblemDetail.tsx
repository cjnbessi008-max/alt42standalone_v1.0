import type { Problem } from '../types';
import { Lightbulb, TrendingUp, BookOpen, Target } from 'lucide-react';

interface ProblemDetailProps {
  problem: Problem;
}

export default function ProblemDetail({ problem }: ProblemDetailProps) {
  const { reasoning } = problem;

  return (
    <div style={{ padding: '1.5rem', backgroundColor: '#f9fafb' }}>
      {/* 문제 정보 */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h4 style={{ fontWeight: '600', marginBottom: '0.5rem' }}>문제</h4>
        <div style={{ padding: '1rem', backgroundColor: 'white', borderRadius: '8px' }}>
          {problem.questionText}
        </div>
      </div>

      <div className="grid grid-cols-2" style={{ gap: '1rem', marginBottom: '1.5rem' }}>
        {/* 학생 답안 */}
        <div>
          <h4 style={{ fontWeight: '600', marginBottom: '0.5rem' }}>학생 답안</h4>
          <div
            style={{
              padding: '1rem',
              backgroundColor: problem.isCorrect ? '#d1fae5' : '#fee2e2',
              borderRadius: '8px',
            }}
          >
            {problem.studentAnswer || '(답안 없음)'}
          </div>
        </div>

        {/* 난이도 */}
        <div>
          <h4 style={{ fontWeight: '600', marginBottom: '0.5rem' }}>난이도 평가</h4>
          <div style={{ padding: '1rem', backgroundColor: 'white', borderRadius: '8px' }}>
            <span className={`badge badge-${getDifficultyColor(reasoning.difficultyAssessment)}`}>
              {getDifficultyLabel(reasoning.difficultyAssessment)}
            </span>
          </div>
        </div>
      </div>

      {/* 추론 단계 */}
      {reasoning.reasoningSteps && reasoning.reasoningSteps.length > 0 && (
        <div style={{ marginBottom: '1.5rem' }}>
          <h4 style={{ fontWeight: '600', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Target size={20} />
            추론 단계
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {reasoning.reasoningSteps.map((step, index) => (
              <div
                key={index}
                style={{
                  padding: '1rem',
                  backgroundColor: 'white',
                  borderRadius: '8px',
                  borderLeft: '4px solid #3b82f6',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'start', gap: '0.75rem' }}>
                  <div
                    style={{
                      minWidth: '2rem',
                      height: '2rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: '#3b82f6',
                      color: 'white',
                      borderRadius: '50%',
                      fontWeight: 'bold',
                    }}
                  >
                    {step.step}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: '500', marginBottom: '0.25rem' }}>
                      {step.description}
                    </div>
                    <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>
                      개념: {step.concept}
                    </div>
                    {step.formula && (
                      <code style={{ display: 'block', marginTop: '0.5rem' }}>
                        {step.formula}
                      </code>
                    )}
                    {step.explanation && (
                      <div style={{ fontSize: '0.875rem', color: '#4b5563', marginTop: '0.5rem' }}>
                        {step.explanation}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 학생 접근 방식 */}
      {reasoning.studentApproach && (
        <div style={{ marginBottom: '1.5rem' }}>
          <h4 style={{ fontWeight: '600', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Lightbulb size={20} />
            학생 풀이 분석
          </h4>
          <div style={{ padding: '1rem', backgroundColor: 'white', borderRadius: '8px' }}>
            <p style={{ marginBottom: '0.75rem' }}>{reasoning.studentApproach.insights}</p>
            {reasoning.studentApproach.commonMistakes && reasoning.studentApproach.commonMistakes.length > 0 && (
              <div>
                <div style={{ fontWeight: '500', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                  흔한 실수:
                </div>
                <ul style={{ paddingLeft: '1.5rem', fontSize: '0.875rem', color: '#6b7280' }}>
                  {reasoning.studentApproach.commonMistakes.map((mistake, i) => (
                    <li key={i}>{mistake}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 관련 개념 */}
      {reasoning.relatedConcepts && reasoning.relatedConcepts.length > 0 && (
        <div style={{ marginBottom: '1.5rem' }}>
          <h4 style={{ fontWeight: '600', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <BookOpen size={20} />
            관련 개념
          </h4>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {reasoning.relatedConcepts.map((concept, i) => (
              <span key={i} className="badge badge-info">
                {concept}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 추천 학습 주제 */}
      {reasoning.nextRecommendedTopics && reasoning.nextRecommendedTopics.length > 0 && (
        <div>
          <h4 style={{ fontWeight: '600', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <TrendingUp size={20} />
            추천 학습 주제
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {reasoning.nextRecommendedTopics.map((topic, i) => (
              <div
                key={i}
                style={{
                  padding: '0.75rem',
                  backgroundColor: 'white',
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                }}
              >
                <div style={{ fontWeight: '500', marginBottom: '0.25rem' }}>
                  {topic.topic}
                </div>
                <div style={{ color: '#6b7280' }}>{topic.reason}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function getDifficultyColor(difficulty: string): string {
  switch (difficulty) {
    case 'trivial':
    case 'easy':
      return 'success';
    case 'medium':
      return 'warning';
    case 'hard':
    case 'very_hard':
      return 'danger';
    default:
      return 'info';
  }
}

function getDifficultyLabel(difficulty: string): string {
  switch (difficulty) {
    case 'trivial':
      return '매우 쉬움';
    case 'easy':
      return '쉬움';
    case 'medium':
      return '보통';
    case 'hard':
      return '어려움';
    case 'very_hard':
      return '매우 어려움';
    default:
      return difficulty;
  }
}
