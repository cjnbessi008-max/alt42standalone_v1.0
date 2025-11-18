import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import type { NodeType } from '../../types';

interface CustomNodeData {
  label: string;
  description?: string;
  nodeType: NodeType;
  isCorrect?: boolean | null;
  isHighlighted?: boolean;
  isSelected?: boolean;
  onNodeClick?: () => void;
}

/**
 * Custom Node Component for React Flow
 * Displays individual tree nodes with styling based on type and state
 */
const CustomNode: React.FC<NodeProps<CustomNodeData>> = ({ data }) => {
  const getNodeColor = (): string => {
    const colors = {
      problem: '#4ecdc4',
      approach: '#95e1d3',
      step: '#f38181',
      answer: '#ffd93d'
    };
    return colors[data.nodeType] || '#ddd';
  };

  const getNodeIcon = (): string => {
    const icons = {
      problem: '❓',
      approach: '🎯',
      step: '📝',
      answer: '✅'
    };
    return icons[data.nodeType] || '•';
  };

  const getBorderColor = (): string => {
    if (data.isSelected) return '#2d3748';
    if (data.isHighlighted) return '#ff6b6b';
    if (data.isCorrect === true) return '#51cf66';
    if (data.isCorrect === false) return '#ff6b6b';
    return '#cbd5e0';
  };

  return (
    <div
      onClick={data.onNodeClick}
      style={{
        padding: '12px 16px',
        borderRadius: '8px',
        background: getNodeColor(),
        border: `3px solid ${getBorderColor()}`,
        minWidth: '150px',
        maxWidth: '250px',
        boxShadow: data.isHighlighted || data.isSelected
          ? '0 4px 12px rgba(0,0,0,0.3)'
          : '0 2px 6px rgba(0,0,0,0.1)',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        transform: data.isHighlighted ? 'scale(1.05)' : 'scale(1)',
        opacity: data.isHighlighted ? 1 : 0.9
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.opacity = '1';
        e.currentTarget.style.transform = 'scale(1.05)';
      }}
      onMouseLeave={(e) => {
        if (!data.isHighlighted) {
          e.currentTarget.style.opacity = '0.9';
          e.currentTarget.style.transform = 'scale(1)';
        }
      }}
    >
      <Handle
        type="target"
        position={Position.Top}
        style={{ background: '#555', width: 8, height: 8 }}
      />

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
        <span style={{ fontSize: '18px' }}>{getNodeIcon()}</span>
        <span style={{
          fontWeight: 'bold',
          fontSize: '14px',
          color: '#2d3748',
          flex: 1
        }}>
          {data.label}
        </span>
        {data.isCorrect === true && <span style={{ fontSize: '16px' }}>✓</span>}
        {data.isCorrect === false && <span style={{ fontSize: '16px' }}>✗</span>}
      </div>

      {data.description && (
        <div style={{
          fontSize: '12px',
          color: '#4a5568',
          marginTop: '4px',
          lineHeight: '1.4'
        }}>
          {data.description}
        </div>
      )}

      <Handle
        type="source"
        position={Position.Bottom}
        style={{ background: '#555', width: 8, height: 8 }}
      />
    </div>
  );
};

export default memo(CustomNode);
