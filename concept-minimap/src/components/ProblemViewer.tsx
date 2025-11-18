import { Problem, Concept } from '../types/concept';

interface ProblemViewerProps {
  problem: Problem;
  concepts: Record<string, Concept>;
  onConceptClick?: (conceptId: string) => void;
}

export default function ProblemViewer({
  problem,
  concepts,
  onConceptClick,
}: ProblemViewerProps) {
  const mainConcept = concepts[problem.mainConceptId];

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return '#22c55e';
      case 'medium':
        return '#f59e0b';
      case 'hard':
        return '#ef4444';
      default:
        return '#94a3b8';
    }
  };

  const difficultyLabel = {
    easy: '쉬움',
    medium: '보통',
    hard: '어려움',
  };

  return (
    <div
      style={{
        padding: '24px',
        height: '100%',
        overflowY: 'auto',
        backgroundColor: '#f8fafc',
      }}
    >
      {/* 문제 헤더 */}
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '24px',
          marginBottom: '20px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
          <h2 style={{ margin: 0, fontSize: '24px', color: '#1e293b' }}>
            {problem.title}
          </h2>
          <span
            style={{
              padding: '4px 12px',
              borderRadius: '16px',
              fontSize: '13px',
              fontWeight: 500,
              color: 'white',
              backgroundColor: getDifficultyColor(problem.difficulty),
            }}
          >
            {difficultyLabel[problem.difficulty]}
          </span>
        </div>

        <p style={{ color: '#64748b', fontSize: '14px', margin: '0 0 16px 0' }}>
          {problem.description}
        </p>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
          <span style={{ color: '#64748b' }}>주요 개념:</span>
          <button
            onClick={() => onConceptClick?.(problem.mainConceptId)}
            style={{
              padding: '4px 12px',
              borderRadius: '6px',
              border: '1px solid #3b82f6',
              backgroundColor: '#eff6ff',
              color: '#3b82f6',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 500,
            }}
          >
            {mainConcept?.name || problem.mainConceptId}
          </button>
        </div>
      </div>

      {/* 문제 내용 */}
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '24px',
          marginBottom: '20px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
        }}
      >
        <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', color: '#1e293b' }}>
          문제
        </h3>
        <div
          style={{
            whiteSpace: 'pre-line',
            lineHeight: '1.8',
            fontSize: '15px',
            color: '#334155',
            backgroundColor: '#f1f5f9',
            padding: '20px',
            borderRadius: '8px',
            border: '1px solid #e2e8f0',
          }}
        >
          {problem.content}
        </div>
      </div>

      {/* 관련 개념들 */}
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '24px',
          marginBottom: '20px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
        }}
      >
        <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', color: '#1e293b' }}>
          관련 개념 ({problem.relatedConceptIds.length}개)
        </h3>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '8px',
          }}
        >
          {problem.relatedConceptIds.map((conceptId) => {
            const concept = concepts[conceptId];
            if (!concept) return null;

            const isMain = conceptId === problem.mainConceptId;

            return (
              <button
                key={conceptId}
                onClick={() => onConceptClick?.(conceptId)}
                style={{
                  padding: '8px 14px',
                  borderRadius: '8px',
                  border: isMain ? '2px solid #3b82f6' : '1px solid #e2e8f0',
                  backgroundColor: isMain ? '#eff6ff' : 'white',
                  color: isMain ? '#3b82f6' : '#475569',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: isMain ? 600 : 400,
                  transition: 'all 0.2s',
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = isMain ? '#dbeafe' : '#f1f5f9';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = isMain ? '#eff6ff' : 'white';
                }}
              >
                {concept.name}
                {concept.isLocked && ' 🔒'}
                {concept.learningProgress === 100 && ' ✅'}
              </button>
            );
          })}
        </div>
      </div>

      {/* 해설 (있는 경우) */}
      {problem.solution && (
        <details
          style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '24px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
          }}
        >
          <summary
            style={{
              cursor: 'pointer',
              fontSize: '18px',
              fontWeight: 600,
              color: '#1e293b',
              marginBottom: '12px',
            }}
          >
            해설 보기
          </summary>
          <div
            style={{
              whiteSpace: 'pre-line',
              lineHeight: '1.8',
              fontSize: '15px',
              color: '#334155',
              backgroundColor: '#fef3c7',
              padding: '20px',
              borderRadius: '8px',
              marginTop: '12px',
              border: '1px solid #fde68a',
            }}
          >
            {problem.solution}
          </div>
        </details>
      )}
    </div>
  );
}
