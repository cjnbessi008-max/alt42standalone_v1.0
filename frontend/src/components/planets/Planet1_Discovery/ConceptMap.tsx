/**
 * KTM Math Planet - Concept Map Component
 * Visualizes the discovered world model concepts and relationships
 */

import React from 'react';
import { motion } from 'framer-motion';
import { WorldModel, ConceptNode } from '../../../types/pipeline';

interface ConceptMapProps {
  worldModel: WorldModel;
}

export const ConceptMap: React.FC<ConceptMapProps> = ({ worldModel }) => {
  const getNodeColor = (type: ConceptNode['type']) => {
    switch (type) {
      case 'concept':
        return 'bg-blue-500';
      case 'operation':
        return 'bg-purple-500';
      case 'relationship':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getNodeIcon = (type: ConceptNode['type']) => {
    switch (type) {
      case 'concept':
        return '💡';
      case 'operation':
        return '⚙️';
      case 'relationship':
        return '🔗';
      default:
        return '◯';
    }
  };

  return (
    <div className="space-y-6">
      {/* Concepts */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          🧩 발견된 개념들
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {worldModel.concepts.map((concept, index) => (
            <motion.div
              key={concept.id}
              className={`p-4 rounded-lg border ${getNodeColor(concept.type)} bg-opacity-20 border-current`}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
            >
              <div className="flex items-start gap-2">
                <span className="text-2xl">{getNodeIcon(concept.type)}</span>
                <div className="flex-1">
                  <h4 className="font-semibold text-white">{concept.name}</h4>
                  {concept.description && (
                    <p className="text-xs text-gray-300 mt-1">
                      {concept.description}
                    </p>
                  )}
                  <span className="text-xs text-gray-400 mt-1 inline-block">
                    {concept.type}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Relationships */}
      {worldModel.relationships.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            🔗 관계도
          </h3>
          <div className="space-y-2">
            {worldModel.relationships.map((rel, index) => {
              const source = worldModel.concepts.find(c => c.id === rel.sourceId);
              const target = worldModel.concepts.find(c => c.id === rel.targetId);

              return (
                <motion.div
                  key={rel.id}
                  className="flex items-center gap-3 p-3 bg-white/5 rounded-lg"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded text-sm font-medium">
                    {source?.name || '?'}
                  </div>
                  <div className="flex-1 flex items-center gap-2">
                    <div className="flex-1 h-px bg-gray-600" />
                    <span className="px-2 py-1 bg-green-500/20 text-green-300 rounded text-xs">
                      {rel.relationshipType}
                    </span>
                    <div className="flex-1 h-px bg-gray-600" />
                    <span className="text-gray-400">→</span>
                  </div>
                  <div className="px-3 py-1 bg-purple-500/20 text-purple-300 rounded text-sm font-medium">
                    {target?.name || '?'}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Operations */}
      {worldModel.operations.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            ⚙️ 작업/연산
          </h3>
          <div className="flex flex-wrap gap-2">
            {worldModel.operations.map((operation, index) => (
              <motion.span
                key={index}
                className="px-4 py-2 bg-purple-500/20 text-purple-300 rounded-full text-sm font-medium"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
              >
                {operation}
              </motion.span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
