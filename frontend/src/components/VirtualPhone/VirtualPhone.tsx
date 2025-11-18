import React, { useState, useEffect } from 'react';
import './VirtualPhone.css';
import WrongMoveAlert from '../WrongMoveAlert/WrongMoveAlert';
import { Problem, StudentInteraction, WrongMoveEvent } from '../../types';

interface VirtualPhoneProps {
  problem: Problem | null;
  onInteraction: (interaction: StudentInteraction) => void;
}

const VirtualPhone: React.FC<VirtualPhoneProps> = ({ problem, onInteraction }) => {
  const [wrongMoveEvents, setWrongMoveEvents] = useState<WrongMoveEvent[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [userInput, setUserInput] = useState('');

  useEffect(() => {
    // Reset when problem changes
    setCurrentStep(0);
    setUserInput('');
    setWrongMoveEvents([]);
  }, [problem]);

  const handleSubmit = () => {
    if (!problem) return;

    const isCorrect = validateAnswer(userInput, problem);

    const interaction: StudentInteraction = {
      id: `interaction_${Date.now()}`,
      problemId: problem.id,
      studentId: 'demo_student', // TODO: Get from auth
      timestamp: new Date(),
      action: userInput,
      isCorrect,
      stepId: problem.steps?.[currentStep]?.id,
    };

    onInteraction(interaction);

    if (!isCorrect) {
      // Trigger wrong move alert
      const wrongMove: WrongMoveEvent = {
        id: `wrong_${Date.now()}`,
        timestamp: new Date(),
        problemId: problem.id,
        stepId: problem.steps?.[currentStep]?.id,
        incorrectAction: userInput,
        expectedAction: problem.steps?.[currentStep]?.expectedAction || String(problem.correctAnswer),
        severity: 'high',
      };

      setWrongMoveEvents(prev => [...prev, wrongMove]);

      // Remove the event after animation
      setTimeout(() => {
        setWrongMoveEvents(prev => prev.filter(e => e.id !== wrongMove.id));
      }, 2000);
    } else {
      // Move to next step or complete
      if (problem.steps && currentStep < problem.steps.length - 1) {
        setCurrentStep(prev => prev + 1);
        setUserInput('');
      } else {
        alert('문제를 완료했습니다! 🎉');
      }
    }
  };

  const validateAnswer = (input: string, problem: Problem): boolean => {
    // Simple validation - can be enhanced
    if (Array.isArray(problem.correctAnswer)) {
      return problem.correctAnswer.includes(input.trim());
    }
    return input.trim().toLowerCase() === String(problem.correctAnswer).toLowerCase();
  };

  return (
    <div className="virtual-phone-container">
      <div className="virtual-phone">
        <div className="phone-frame">
          <div className="phone-notch"></div>

          <div className="phone-screen">
            {problem ? (
              <div className="problem-content">
                <h2 className="problem-title">{problem.title}</h2>
                <p className="problem-description">{problem.description}</p>

                {problem.steps && problem.steps.length > 0 && (
                  <div className="step-indicator">
                    단계 {currentStep + 1} / {problem.steps.length}
                  </div>
                )}

                {problem.steps && problem.steps[currentStep] && (
                  <div className="current-step">
                    <p>{problem.steps[currentStep].description}</p>
                  </div>
                )}

                <div className="input-area">
                  <input
                    type="text"
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
                    placeholder="답을 입력하세요..."
                    className="problem-input"
                  />
                  <button onClick={handleSubmit} className="submit-button">
                    확인
                  </button>
                </div>

                <div className="problem-meta">
                  <span className="difficulty">{problem.difficulty}</span>
                  <span className="subject">{problem.subject}</span>
                </div>
              </div>
            ) : (
              <div className="no-problem">
                <p>문제를 불러오는 중...</p>
              </div>
            )}
          </div>

          <div className="phone-home-button"></div>
        </div>

        {/* Wrong Move Alert Overlay */}
        <WrongMoveAlert events={wrongMoveEvents} />
      </div>
    </div>
  );
};

export default VirtualPhone;
