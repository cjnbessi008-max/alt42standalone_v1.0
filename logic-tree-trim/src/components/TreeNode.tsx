/**
 * TreeNode Component
 * 논리 트리의 개별 노드 표시
 */

import React from 'react';
import { motion } from 'framer-motion';
import type { LogicNode } from '../types/logic';

interface TreeNodeProps {
  node: LogicNode;
  depth: number;
  isPruning?: boolean;
}

export const TreeNode: React.FC<TreeNodeProps> = ({ node, depth, isPruning = false }) => {
  const getNodeColor = (type: string) => {
    switch (type) {
      case 'AND':
        return 'bg-blue-500 text-white';
      case 'OR':
        return 'bg-green-500 text-white';
      case 'NOT':
        return 'bg-red-500 text-white';
      case 'VARIABLE':
        return 'bg-purple-500 text-white';
      case 'LITERAL':
        return 'bg-gray-500 text-white';
      default:
        return 'bg-gray-300';
    }
  };

  const getNodeLabel = (node: LogicNode) => {
    if (node.type === 'VARIABLE' || node.type === 'LITERAL') {
      return String(node.value);
    }
    return node.type;
  };

  return (
    <motion.div
      initial={{ scale: 1, opacity: 1 }}
      animate={
        isPruning
          ? { scale: 0, opacity: 0 }
          : { scale: 1, opacity: 1 }
      }
      transition={{ duration: 0.8, ease: 'easeOut' }}
      className="flex flex-col items-center"
    >
      {/* 노드 */}
      <motion.div
        whileHover={{ scale: 1.1 }}
        className={`
          ${getNodeColor(node.type)}
          px-4 py-2 rounded-lg shadow-lg
          font-semibold text-sm
          min-w-[60px] text-center
          cursor-pointer
          transition-all
        `}
      >
        {getNodeLabel(node)}
      </motion.div>

      {/* 자식 노드들 */}
      {node.children && node.children.length > 0 && (
        <div className="flex flex-col items-center mt-4">
          {/* 연결선 */}
          <div className="w-0.5 h-6 bg-gray-400"></div>

          {/* 자식 노드 컨테이너 */}
          <div className="flex gap-8 items-start">
            {node.children.map((child) => (
              <div key={child.id} className="flex flex-col items-center">
                {/* 개별 연결선 */}
                <div className="w-0.5 h-4 bg-gray-400"></div>

                {/* 자식 노드 */}
                <TreeNode node={child} depth={depth + 1} isPruning={isPruning} />
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
};
