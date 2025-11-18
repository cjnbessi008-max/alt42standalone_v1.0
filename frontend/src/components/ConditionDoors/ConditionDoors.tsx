import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Problem, DoorState } from '../../types';
import './ConditionDoors.css';

interface ConditionDoorsProps {
  problem: Problem;
  onAnswer: (conditionType: 'necessary' | 'sufficient', isCorrect: boolean) => void;
}

const ConditionDoors: React.FC<ConditionDoorsProps> = ({ problem, onAnswer }) => {
  const [necessaryDoorState, setNecessaryDoorState] = useState<DoorState>('closed');
  const [sufficientDoorState, setSufficientDoorState] = useState<DoorState>('closed');
  const [selectedDoor, setSelectedDoor] = useState<'necessary' | 'sufficient' | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);

  // 문 클릭 핸들러
  const handleDoorClick = (doorType: 'necessary' | 'sufficient') => {
    if (selectedDoor) return; // 이미 선택된 경우 무시

    setSelectedDoor(doorType);

    if (doorType === 'necessary') {
      setNecessaryDoorState('opening');
      setTimeout(() => {
        setNecessaryDoorState('open');
        const isCorrect = problem.necessaryCondition.isCorrect;
        onAnswer('necessary', isCorrect);
        setShowExplanation(true);
      }, 1000);
    } else {
      setSufficientDoorState('opening');
      setTimeout(() => {
        setSufficientDoorState('open');
        const isCorrect = problem.sufficientCondition.isCorrect;
        onAnswer('sufficient', isCorrect);
        setShowExplanation(true);
      }, 1000);
    }
  };

  // 리셋
  const handleReset = () => {
    setNecessaryDoorState('closed');
    setSufficientDoorState('closed');
    setSelectedDoor(null);
    setShowExplanation(false);
  };

  return (
    <div className="condition-doors-container">
      {/* 문제 표시 */}
      <div className="problem-section">
        <h2 className="problem-title">{problem.title}</h2>
        <p className="problem-description">{problem.description}</p>

        <div className="logic-statement">
          <div className="statement-box premise">
            <span className="label">전제 (P):</span>
            <span className="content">{problem.premise}</span>
          </div>
          <div className="arrow">→</div>
          <div className="statement-box conclusion">
            <span className="label">결론 (Q):</span>
            <span className="content">{problem.conclusion}</span>
          </div>
        </div>

        <p className="instruction">
          올바른 조건의 문을 선택하세요!
        </p>
      </div>

      {/* 두 개의 문 */}
      <div className="doors-section">
        {/* 필요조건 문 */}
        <div className="door-wrapper">
          <h3 className="door-label">필요조건</h3>
          <p className="door-description">P는 Q의 필요조건</p>

          <motion.div
            className={`door necessary ${necessaryDoorState} ${selectedDoor === 'necessary' ? 'selected' : ''}`}
            onClick={() => handleDoorClick('necessary')}
            whileHover={!selectedDoor ? { scale: 1.02 } : {}}
            whileTap={!selectedDoor ? { scale: 0.98 } : {}}
          >
            <div className="door-panel left">
              <div className="door-handle"></div>
            </div>
            <div className="door-panel right">
              <div className="door-handle"></div>
            </div>

            <AnimatePresence>
              {necessaryDoorState === 'open' && (
                <motion.div
                  className={`door-result ${problem.necessaryCondition.isCorrect ? 'correct' : 'incorrect'}`}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                >
                  {problem.necessaryCondition.isCorrect ? '✓' : '✗'}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>

        {/* 충분조건 문 */}
        <div className="door-wrapper">
          <h3 className="door-label">충분조건</h3>
          <p className="door-description">P는 Q의 충분조건</p>

          <motion.div
            className={`door sufficient ${sufficientDoorState} ${selectedDoor === 'sufficient' ? 'selected' : ''}`}
            onClick={() => handleDoorClick('sufficient')}
            whileHover={!selectedDoor ? { scale: 1.02 } : {}}
            whileTap={!selectedDoor ? { scale: 0.98 } : {}}
          >
            <div className="door-panel left">
              <div className="door-handle"></div>
            </div>
            <div className="door-panel right">
              <div className="door-handle"></div>
            </div>

            <AnimatePresence>
              {sufficientDoorState === 'open' && (
                <motion.div
                  className={`door-result ${problem.sufficientCondition.isCorrect ? 'correct' : 'incorrect'}`}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                >
                  {problem.sufficientCondition.isCorrect ? '✓' : '✗'}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>

      {/* 설명 및 리셋 */}
      <AnimatePresence>
        {showExplanation && problem.explanation && (
          <motion.div
            className="explanation-section"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <div className="explanation-box">
              <h3>설명</h3>
              <p>{problem.explanation}</p>
              <button className="reset-button" onClick={handleReset}>
                다시 풀기
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ConditionDoors;
