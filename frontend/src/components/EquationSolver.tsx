import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import BalanceScale from './BalanceScale';
import {
  applyOperation,
  isSolved,
  extractSolution,
  getNextStepHint,
  EquationState,
} from '../utils/equation';
import { ProblemWithHints, EquationStep } from '../types';
import { progressAPI } from '../services/api';

interface EquationSolverProps {
  problem: ProblemWithHints;
  studentId: number;
  onComplete: (success: boolean, score: number) => void;
}

const EquationSolver: React.FC<EquationSolverProps> = ({
  problem,
  studentId,
  onComplete,
}) => {
  const [equationState, setEquationState] = useState<EquationState>({
    left: problem.equation_left,
    right: problem.equation_right,
    steps: [],
  });

  const [operation, setOperation] = useState<'add' | 'subtract' | 'multiply' | 'divide'>('add');
  const [value, setValue] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [hintsUsed, setHintsUsed] = useState<number>(0);
  const [currentHintIndex, setCurrentHintIndex] = useState<number>(0);
  const [startTime] = useState<number>(Date.now());
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    setMessage(`문제: ${equationState.left} = ${equationState.right}`);
  }, []);

  const handleApplyOperation = () => {
    const numValue = parseFloat(value);

    if (isNaN(numValue)) {
      setMessage('❌ 올바른 숫자를 입력하세요');
      return;
    }

    if (operation === 'divide' && numValue === 0) {
      setMessage('❌ 0으로 나눌 수 없습니다');
      return;
    }

    try {
      const newState = applyOperation(equationState, operation, numValue);
      setEquationState(newState);
      setValue('');

      // Check if solved
      if (isSolved(newState.left, newState.right)) {
        const solution = extractSolution(newState.left, newState.right);
        setMessage(`🎉 풀이 완료! ${solution}`);
      } else {
        setMessage(`✅ 양변에 ${getOperationText(operation, numValue)} 적용됨`);
      }
    } catch (error) {
      setMessage('❌ 계산 중 오류가 발생했습니다');
    }
  };

  const getOperationText = (op: string, val: number): string => {
    switch (op) {
      case 'add':
        return `+${val}`;
      case 'subtract':
        return `-${val}`;
      case 'multiply':
        return `×${val}`;
      case 'divide':
        return `÷${val}`;
      default:
        return '';
    }
  };

  const handleShowHint = () => {
    if (!problem.hints || currentHintIndex >= problem.hints.length) {
      const autoHint = getNextStepHint(equationState.left, equationState.right);
      setMessage(`💡 힌트: ${autoHint}`);
      setHintsUsed((prev) => prev + 1);
      return;
    }

    const hint = problem.hints[currentHintIndex];
    setMessage(`💡 힌트 ${currentHintIndex + 1}: ${hint.hint_text}`);
    setHintsUsed((prev) => prev + 1);
    setCurrentHintIndex((prev) => prev + 1);
  };

  const handleSubmit = async () => {
    const solution = extractSolution(equationState.left, equationState.right);

    if (!solution) {
      setMessage('❌ 방정식을 먼저 풀어주세요 (x = 숫자 형태로)');
      return;
    }

    setIsSubmitting(true);

    try {
      const timeSpent = Math.floor((Date.now() - startTime) / 1000);

      const result = await progressAPI.submitAttempt({
        student_id: studentId,
        problem_id: problem.id,
        steps_taken: equationState.steps,
        student_answer: solution,
        time_spent: timeSpent,
        hints_used: hintsUsed,
      });

      if (result.is_correct) {
        setMessage(`🎉 정답입니다! 점수: ${result.score.toFixed(0)}점`);
        setTimeout(() => {
          onComplete(true, result.score);
        }, 2000);
      } else {
        setMessage(`❌ 틀렸습니다. 다시 시도해보세요!`);
        setTimeout(() => {
          onComplete(false, 0);
        }, 2000);
      }
    } catch (error) {
      console.error('Submit error:', error);
      setMessage('❌ 제출 중 오류가 발생했습니다');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setEquationState({
      left: problem.equation_left,
      right: problem.equation_right,
      steps: [],
    });
    setHintsUsed(0);
    setCurrentHintIndex(0);
    setValue('');
    setMessage(`문제: ${problem.equation_left} = ${problem.equation_right}`);
  };

  const solved = isSolved(equationState.left, equationState.right);

  return (
    <Container>
      <Title>{problem.title}</Title>
      <Difficulty>난이도: {'⭐'.repeat(problem.difficulty_level)}</Difficulty>

      <BalanceScale
        leftSide={equationState.left}
        rightSide={equationState.right}
        isBalanced={true}
      />

      <Message>{message}</Message>

      {!solved && (
        <Controls>
          <OperationSelector>
            <OperationButton
              selected={operation === 'add'}
              onClick={() => setOperation('add')}
            >
              더하기 (+)
            </OperationButton>
            <OperationButton
              selected={operation === 'subtract'}
              onClick={() => setOperation('subtract')}
            >
              빼기 (-)
            </OperationButton>
            <OperationButton
              selected={operation === 'multiply'}
              onClick={() => setOperation('multiply')}
            >
              곱하기 (×)
            </OperationButton>
            <OperationButton
              selected={operation === 'divide'}
              onClick={() => setOperation('divide')}
            >
              나누기 (÷)
            </OperationButton>
          </OperationSelector>

          <InputRow>
            <Input
              type="number"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="숫자 입력"
              onKeyPress={(e) => e.key === 'Enter' && handleApplyOperation()}
            />
            <ApplyButton onClick={handleApplyOperation}>적용</ApplyButton>
          </InputRow>
        </Controls>
      )}

      <ActionButtons>
        <HintButton onClick={handleShowHint} disabled={solved}>
          💡 힌트 ({hintsUsed}개 사용)
        </HintButton>
        <ResetButton onClick={handleReset}>🔄 처음부터</ResetButton>
        {solved && (
          <SubmitButton onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? '제출 중...' : '✅ 제출하기'}
          </SubmitButton>
        )}
      </ActionButtons>

      {equationState.steps.length > 0 && (
        <StepsSection>
          <StepsTitle>풀이 과정</StepsTitle>
          <StepsList>
            {equationState.steps.map((step, index) => (
              <StepItem key={index}>
                <StepNumber>{step.step}.</StepNumber>
                <StepDescription>
                  {getOperationText(step.operation, step.value)} →{' '}
                  {step.leftSide} = {step.rightSide}
                </StepDescription>
              </StepItem>
            ))}
          </StepsList>
        </StepsSection>
      )}
    </Container>
  );
};

export default EquationSolver;

const Container = styled.div`
  padding: 20px;
  max-width: 100%;
`;

const Title = styled.h2`
  text-align: center;
  color: #2c3e50;
  margin-bottom: 5px;
  font-size: 22px;
`;

const Difficulty = styled.div`
  text-align: center;
  color: #f39c12;
  margin-bottom: 20px;
  font-size: 16px;
`;

const Message = styled(motion.div)`
  text-align: center;
  padding: 15px;
  margin: 20px 0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 10px;
  font-size: 16px;
  font-weight: 500;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  min-height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const Controls = styled.div`
  margin: 20px 0;
`;

const OperationSelector = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
  margin-bottom: 15px;
`;

const OperationButton = styled.button<{ selected: boolean }>`
  padding: 12px;
  background: ${({ selected }) =>
    selected ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#e0e0e0'};
  color: ${({ selected }) => (selected ? 'white' : '#333')};
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  }
`;

const InputRow = styled.div`
  display: flex;
  gap: 10px;
`;

const Input = styled.input`
  flex: 1;
  padding: 12px;
  font-size: 18px;
  border: 2px solid #ddd;
  border-radius: 8px;
  outline: none;

  &:focus {
    border-color: #667eea;
  }
`;

const ApplyButton = styled.button`
  padding: 12px 24px;
  background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  }
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 10px;
  margin-top: 20px;
  flex-wrap: wrap;
`;

const Button = styled.button`
  padding: 12px 20px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  }
`;

const HintButton = styled(Button)`
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  color: white;
  flex: 1;
`;

const ResetButton = styled(Button)`
  background: #95a5a6;
  color: white;
  flex: 1;
`;

const SubmitButton = styled(Button)`
  background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
  color: white;
  flex: 2;
  font-size: 16px;
`;

const StepsSection = styled.div`
  margin-top: 30px;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 10px;
`;

const StepsTitle = styled.h3`
  font-size: 18px;
  color: #2c3e50;
  margin-bottom: 10px;
`;

const StepsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const StepItem = styled.div`
  display: flex;
  align-items: center;
  padding: 8px;
  background: white;
  border-radius: 6px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
`;

const StepNumber = styled.span`
  font-weight: bold;
  color: #667eea;
  margin-right: 10px;
  min-width: 25px;
`;

const StepDescription = styled.span`
  color: #2c3e50;
  font-size: 14px;
`;
