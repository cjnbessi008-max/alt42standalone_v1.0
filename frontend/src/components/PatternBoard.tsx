/**
 * Pattern board component for displaying and manipulating sequences
 */
import React, { useEffect, useState } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { DraggableElement } from './DraggableElement';
import { motion } from 'framer-motion';
import { useGameState } from '../hooks/useGameState';

interface PatternBoardProps {
  onSubmit: () => void;
  showCorrectness?: boolean;
}

export const PatternBoard: React.FC<PatternBoardProps> = ({ onSubmit, showCorrectness }) => {
  const {
    currentProblem,
    currentSequence,
    swapElements,
    resetSequence,
    timeElapsed,
    attemptNumber,
  } = useGameState();

  const [correctnessMap, setCorrectnessMap] = useState<(boolean | undefined)[]>([]);

  useEffect(() => {
    if (showCorrectness && currentProblem) {
      // This would be populated after submission
      setCorrectnessMap(currentSequence.map(() => undefined));
    }
  }, [showCorrectness, currentSequence, currentProblem]);

  if (!currentProblem) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-500">No problem loaded</p>
      </div>
    );
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const timeProgress = (timeElapsed / currentProblem.time_limit_seconds) * 100;
  const isTimeWarning = timeProgress > 75;

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="p-6 space-y-6">
        {/* Problem Header */}
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-gray-800">{currentProblem.title}</h2>
          {currentProblem.description && (
            <p className="text-sm text-gray-600">{currentProblem.description}</p>
          )}
          {currentProblem.pattern_hint && (
            <div className="bg-yellow-100 border-l-4 border-yellow-500 p-3 rounded">
              <p className="text-xs text-yellow-800">
                <span className="font-semibold">💡 Hint:</span> {currentProblem.pattern_hint}
              </p>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-white rounded-lg p-3 shadow">
            <p className="text-xs text-gray-500">Time</p>
            <p className={`text-lg font-bold ${isTimeWarning ? 'text-red-500' : 'text-primary'}`}>
              {formatTime(timeElapsed)}
            </p>
          </div>
          <div className="bg-white rounded-lg p-3 shadow">
            <p className="text-xs text-gray-500">Attempts</p>
            <p className="text-lg font-bold text-primary">
              {attemptNumber + 1}/{currentProblem.max_attempts}
            </p>
          </div>
          <div className="bg-white rounded-lg p-3 shadow">
            <p className="text-xs text-gray-500">Points</p>
            <p className="text-lg font-bold text-primary">{currentProblem.points}</p>
          </div>
        </div>

        {/* Time Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2">
          <motion.div
            className={`h-2 rounded-full ${isTimeWarning ? 'bg-red-500' : 'bg-primary'}`}
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(timeProgress, 100)}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>

        {/* Pattern Board */}
        <div className="bg-white rounded-xl p-6 shadow-lg">
          <p className="text-sm text-gray-600 mb-4 text-center">
            Drag and drop to rearrange the elements
          </p>
          <div className="flex justify-center items-center gap-3 flex-wrap">
            {currentSequence.map((value, index) => (
              <DraggableElement
                key={`${value}-${index}`}
                value={value}
                index={index}
                onSwap={swapElements}
                isCorrect={correctnessMap[index]}
              />
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={resetSequence}
            className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-bold py-3 px-6 rounded-lg transition-colors"
          >
            🔄 Reset
          </button>
          <button
            onClick={onSubmit}
            className="flex-1 bg-primary hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors shadow-lg"
          >
            ✓ Submit
          </button>
        </div>
      </div>
    </DndProvider>
  );
};
