import React from 'react';
import { motion } from 'framer-motion';
import { Problem } from '../types';
import './ProblemSelector.css';

interface ProblemSelectorProps {
  problems: Problem[];
  currentProblemId: string;
  onSelectProblem: (problem: Problem) => void;
}

export const ProblemSelector: React.FC<ProblemSelectorProps> = ({
  problems,
  currentProblemId,
  onSelectProblem,
}) => {
  return (
    <div className="problem-selector">
      <h2 className="selector-title">문제 선택</h2>
      <div className="problems-list">
        {problems.map((problem, index) => (
          <motion.button
            key={problem.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onSelectProblem(problem)}
            className={`problem-card ${
              problem.id === currentProblemId ? 'active' : ''
            }`}
          >
            <div className="problem-number">{index + 1}</div>
            <div className="problem-info">
              <h3 className="problem-title">{problem.title}</h3>
              <p className="problem-description">{problem.description}</p>
            </div>
            {problem.id === currentProblemId && (
              <motion.div
                layoutId="active-indicator"
                className="active-indicator"
              />
            )}
          </motion.button>
        ))}
      </div>
    </div>
  );
};
