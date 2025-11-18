import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { FaPlay, FaCheck, FaTimes, FaLightbulb } from 'react-icons/fa';
import { timelineAPI } from '../../services/api';
import { useTimelineStore } from '../../store/timelineStore';
import { evaluate } from 'mathjs';
import 'katex/dist/katex.min.css';
import { InlineMath } from 'react-katex';

const SolverContainer = styled.div`
  padding: 20px;
  height: 100%;
  display: flex;
  flex-direction: column;
`;

const Title = styled.h2`
  font-size: 20px;
  color: #333;
  margin-bottom: 20px;
  text-align: center;
`;

const ProblemCard = styled.div`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 20px;
  border-radius: 15px;
  margin-bottom: 20px;
`;

const ProblemText = styled.div`
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 10px;
`;

const Equation = styled.div`
  font-size: 24px;
  font-weight: bold;
  text-align: center;
  padding: 15px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 10px;
  font-family: 'Courier New', monospace;
`;

const InputSection = styled.div`
  margin-bottom: 20px;
`;

const Label = styled.label`
  display: block;
  font-size: 14px;
  color: #666;
  margin-bottom: 8px;
  font-weight: 600;
`;

const Input = styled.input`
  width: 100%;
  padding: 12px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 16px;
  transition: border-color 0.3s;

  &:focus {
    outline: none;
    border-color: #667eea;
  }
`;

const Select = styled.select`
  width: 100%;
  padding: 12px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 16px;
  background: white;

  &:focus {
    outline: none;
    border-color: #667eea;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 10px;
  margin-top: 10px;
`;

const Button = styled.button`
  flex: 1;
  padding: 12px;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.3s;

  ${props => props.primary && `
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;

    &:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
    }
  `}

  ${props => props.success && `
    background: #4caf50;
    color: white;

    &:hover:not(:disabled) {
      background: #45a049;
    }
  `}

  ${props => props.secondary && `
    background: #f0f0f0;
    color: #333;

    &:hover:not(:disabled) {
      background: #e0e0e0;
    }
  `}

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const StepsCounter = styled.div`
  text-align: center;
  padding: 10px;
  background: #f5f5f5;
  border-radius: 8px;
  margin-top: 10px;
  font-size: 14px;
  color: #666;
`;

const HintBox = styled.div`
  background: #fff3cd;
  border: 1px solid #ffeaa7;
  padding: 12px;
  border-radius: 8px;
  margin-top: 10px;
  font-size: 14px;
  color: #856404;
`;

const SAMPLE_PROBLEMS = [
  { equation: '2x + 4 = 10', difficulty: 'easy', answer: '3' },
  { equation: '3x - 2 = 10', difficulty: 'medium', answer: '4' },
  { equation: '5x + 3 = 2x + 15', difficulty: 'medium', answer: '4' },
  { equation: '4(x - 2) = 12', difficulty: 'hard', answer: '5' }
];

const RULES = [
  { value: 'add_both_sides', label: '양변에 더하기', category: 'algebraic' },
  { value: 'subtract_both_sides', label: '양변에서 빼기', category: 'algebraic' },
  { value: 'multiply_both_sides', label: '양변에 곱하기', category: 'algebraic' },
  { value: 'divide_both_sides', label: '양변을 나누기', category: 'algebraic' },
  { value: 'combine_like_terms', label: '동류항 정리', category: 'algebraic' },
  { value: 'distribute', label: '분배법칙', category: 'algebraic' },
  { value: 'simplify', label: '단순화', category: 'arithmetic' }
];

const EquationSolver = ({ studentId, studentName }) => {
  const { currentTimeline, steps, startTimeline, addStep, completeTimeline, resetTimeline } = useTimelineStore();
  const [problem, setProblem] = useState(null);
  const [currentExpression, setCurrentExpression] = useState('');
  const [nextExpression, setNextExpression] = useState('');
  const [selectedRule, setSelectedRule] = useState('');
  const [explanation, setExplanation] = useState('');
  const [stepStartTime, setStepStartTime] = useState(null);
  const [showHint, setShowHint] = useState(false);

  // 새 문제 시작
  const startNewProblem = async () => {
    const randomProblem = SAMPLE_PROBLEMS[Math.floor(Math.random() * SAMPLE_PROBLEMS.length)];
    setProblem(randomProblem);
    setCurrentExpression(randomProblem.equation);
    setNextExpression('');
    setSelectedRule('');
    setExplanation('');
    setShowHint(false);

    // 타임라인 시작
    try {
      const result = await timelineAPI.create({
        student_id: studentId,
        student_name: studentName,
        equation: randomProblem.equation,
        difficulty_level: randomProblem.difficulty,
        problem_id: `prob-${Date.now()}`
      });

      startTimeline(result.timeline);
      setStepStartTime(Date.now());
    } catch (error) {
      console.error('Error starting timeline:', error);
      alert('타임라인 시작 중 오류가 발생했습니다.');
    }
  };

  // 단계 추가
  const handleAddStep = async () => {
    if (!nextExpression.trim() || !selectedRule) {
      alert('다음 식과 적용 규칙을 입력해주세요.');
      return;
    }

    const duration = stepStartTime ? Date.now() - stepStartTime : 0;
    const stepData = {
      action_type: selectedRule,
      from_expression: currentExpression,
      to_expression: nextExpression,
      rule_applied: selectedRule,
      rule_category: RULES.find(r => r.value === selectedRule)?.category || 'algebraic',
      explanation: explanation || '',
      duration_ms: duration
    };

    try {
      await timelineAPI.addStep(currentTimeline.id, stepData);
      addStep(stepData);

      // 다음 단계로
      setCurrentExpression(nextExpression);
      setNextExpression('');
      setExplanation('');
      setStepStartTime(Date.now());
      setShowHint(false);
    } catch (error) {
      console.error('Error adding step:', error);
      alert('단계 추가 중 오류가 발생했습니다.');
    }
  };

  // 풀이 완료
  const handleComplete = async () => {
    const finalAnswer = nextExpression.trim();
    if (!finalAnswer) {
      alert('최종 답을 입력해주세요.');
      return;
    }

    // 답 검증 (간단한 비교)
    const isCorrect = finalAnswer.toLowerCase().includes(problem.answer) ||
                      finalAnswer.includes(`x = ${problem.answer}`) ||
                      finalAnswer === problem.answer;

    try {
      await timelineAPI.complete(currentTimeline.id, finalAnswer, isCorrect);
      completeTimeline(finalAnswer, isCorrect);

      alert(isCorrect ? '정답입니다! 🎉' : '아쉽지만 오답입니다. 다시 시도해보세요.');

      // 리셋
      setTimeout(() => {
        resetTimeline();
        setProblem(null);
      }, 2000);
    } catch (error) {
      console.error('Error completing timeline:', error);
      alert('완료 처리 중 오류가 발생했습니다.');
    }
  };

  return (
    <SolverContainer>
      <Title>방정식 풀이</Title>

      {!problem ? (
        <Button primary onClick={startNewProblem}>
          <FaPlay /> 새 문제 시작
        </Button>
      ) : (
        <>
          <ProblemCard>
            <ProblemText>문제: 다음 방정식을 풀어보세요</ProblemText>
            <Equation>
              <InlineMath math={problem.equation.replace(/x/g, 'x')} />
            </Equation>
          </ProblemCard>

          <InputSection>
            <Label>현재 식</Label>
            <Input
              type="text"
              value={currentExpression}
              readOnly
              style={{ background: '#f5f5f5' }}
            />
          </InputSection>

          <InputSection>
            <Label>적용할 규칙</Label>
            <Select
              value={selectedRule}
              onChange={(e) => setSelectedRule(e.target.value)}
            >
              <option value="">규칙을 선택하세요</option>
              {RULES.map(rule => (
                <option key={rule.value} value={rule.value}>
                  {rule.label}
                </option>
              ))}
            </Select>
          </InputSection>

          <InputSection>
            <Label>다음 식</Label>
            <Input
              type="text"
              value={nextExpression}
              onChange={(e) => setNextExpression(e.target.value)}
              placeholder="예: 2x = 6"
            />
          </InputSection>

          <InputSection>
            <Label>설명 (선택사항)</Label>
            <Input
              type="text"
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              placeholder="이 단계에 대한 설명을 입력하세요"
            />
          </InputSection>

          <ButtonGroup>
            <Button primary onClick={handleAddStep}>
              단계 추가
            </Button>
            <Button secondary onClick={() => setShowHint(!showHint)}>
              <FaLightbulb /> 힌트
            </Button>
          </ButtonGroup>

          {showHint && (
            <HintBox>
              힌트: 변수 x를 한쪽으로 모으고, 상수를 다른쪽으로 이동시켜보세요!
            </HintBox>
          )}

          <StepsCounter>
            현재 단계: {steps.length}
          </StepsCounter>

          <ButtonGroup style={{ marginTop: 'auto' }}>
            <Button success onClick={handleComplete}>
              <FaCheck /> 풀이 완료
            </Button>
            <Button secondary onClick={() => {
              resetTimeline();
              setProblem(null);
            }}>
              <FaTimes /> 취소
            </Button>
          </ButtonGroup>
        </>
      )}
    </SolverContainer>
  );
};

export default EquationSolver;
