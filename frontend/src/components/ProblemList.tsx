import { useState } from 'react';
import type { Problem } from '../types';
import ProblemDetail from './ProblemDetail';
import { CheckCircle, XCircle, Clock, ChevronDown, ChevronUp } from 'lucide-react';

interface ProblemListProps {
  problems: Problem[];
}

export default function ProblemList({ problems }: ProblemListProps) {
  const [expandedProblem, setExpandedProblem] = useState<string | null>(null);

  const toggleProblem = (problemId: string) => {
    setExpandedProblem(expandedProblem === problemId ? null : problemId);
  };

  return (
    <div className="card">
      <div className="card-header">
        <h2 className="card-title">오늘 푼 문제 ({problems.length}개)</h2>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {problems.map((problem, index) => {
          const isExpanded = expandedProblem === problem.problemId;

          return (
            <div
              key={problem.problemId}
              style={{
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  padding: '1rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  backgroundColor: isExpanded ? '#f9fafb' : 'white',
                  transition: 'background-color 0.2s',
                }}
                onClick={() => toggleProblem(problem.problemId)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1 }}>
                  <div
                    style={{
                      fontWeight: 'bold',
                      fontSize: '1.125rem',
                      color: '#6b7280',
                      minWidth: '2rem',
                    }}
                  >
                    #{index + 1}
                  </div>

                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontWeight: '500',
                        marginBottom: '0.25rem',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: isExpanded ? 'normal' : 'nowrap',
                      }}
                    >
                      {problem.questionText}
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      {problem.reasoning.concepts.map((concept, i) => (
                        <span
                          key={i}
                          className="badge badge-info"
                          style={{ fontSize: '0.75rem' }}
                        >
                          {concept}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <Clock size={16} color="#6b7280" />
                      <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                        {Math.round(problem.timeSpentSeconds / 60)}분
                      </span>
                    </div>

                    {problem.isCorrect ? (
                      <CheckCircle size={24} color="#10b981" />
                    ) : (
                      <XCircle size={24} color="#ef4444" />
                    )}

                    {isExpanded ? (
                      <ChevronUp size={20} color="#6b7280" />
                    ) : (
                      <ChevronDown size={20} color="#6b7280" />
                    )}
                  </div>
                </div>
              </div>

              {isExpanded && (
                <div style={{ borderTop: '1px solid #e5e7eb' }}>
                  <ProblemDetail problem={problem} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
