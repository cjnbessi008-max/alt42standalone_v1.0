import { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { Concept } from '../types/concept';

interface ConceptNodeProps {
  data: {
    concept: Concept;
    progress: number;
    isCompleted: boolean;
    isLocked: boolean;
    isCurrent: boolean;
  };
}

function ConceptNode({ data }: ConceptNodeProps) {
  const { concept, progress, isCompleted, isLocked, isCurrent } = data;

  // 노드 스타일 결정
  const getBorderColor = () => {
    if (isCurrent) return '#3b82f6'; // 현재 학습 중 - 파란색
    if (isCompleted) return '#22c55e'; // 완료 - 초록색
    if (isLocked) return '#ef4444'; // 잠김 - 빨간색
    return '#94a3b8'; // 기본 - 회색
  };

  const getBackgroundColor = () => {
    if (isCurrent) return '#eff6ff'; // 연한 파란색
    if (isCompleted) return '#f0fdf4'; // 연한 초록색
    if (isLocked) return '#fef2f2'; // 연한 빨간색
    return '#ffffff';
  };

  const getDifficultyColor = () => {
    switch (concept.difficulty) {
      case 'beginner':
        return '#22c55e'; // 초록색
      case 'intermediate':
        return '#f59e0b'; // 주황색
      case 'advanced':
        return '#ef4444'; // 빨간색
      default:
        return '#94a3b8';
    }
  };

  const difficultyLabel = {
    beginner: '초급',
    intermediate: '중급',
    advanced: '고급',
  };

  return (
    <div
      style={{
        padding: '12px 16px',
        borderRadius: '8px',
        border: `2px solid ${getBorderColor()}`,
        backgroundColor: getBackgroundColor(),
        minWidth: '180px',
        maxWidth: '220px',
        boxShadow: isCurrent
          ? '0 4px 12px rgba(59, 130, 246, 0.3)'
          : '0 2px 6px rgba(0, 0, 0, 0.1)',
        transition: 'all 0.3s ease',
        cursor: 'pointer',
      }}
      className="concept-node"
    >
      <Handle type="target" position={Position.Top} style={{ background: getBorderColor() }} />

      <div style={{ marginBottom: '8px' }}>
        <div style={{
          fontSize: '14px',
          fontWeight: 600,
          color: '#1e293b',
          marginBottom: '4px',
          lineHeight: '1.3'
        }}>
          {concept.name}
        </div>
        <div style={{
          fontSize: '11px',
          color: getDifficultyColor(),
          fontWeight: 500,
          marginBottom: '6px',
        }}>
          {difficultyLabel[concept.difficulty]}
        </div>
      </div>

      {/* 진행률 바 */}
      <div style={{
        width: '100%',
        height: '6px',
        backgroundColor: '#e2e8f0',
        borderRadius: '3px',
        overflow: 'hidden',
        marginBottom: '6px',
      }}>
        <div
          style={{
            width: `${progress}%`,
            height: '100%',
            backgroundColor: isCompleted ? '#22c55e' : '#3b82f6',
            transition: 'width 0.3s ease',
          }}
        />
      </div>

      {/* 상태 표시 */}
      <div style={{
        fontSize: '11px',
        color: '#64748b',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <span>{progress}%</span>
        <span>
          {isLocked && '🔒'}
          {isCompleted && '✅'}
          {isCurrent && '📍'}
        </span>
      </div>

      <Handle type="source" position={Position.Bottom} style={{ background: getBorderColor() }} />
    </div>
  );
}

export default memo(ConceptNode);
