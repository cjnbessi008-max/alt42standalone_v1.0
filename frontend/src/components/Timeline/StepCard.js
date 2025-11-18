import React, { useState } from 'react';
import styled from 'styled-components';
import { FaChevronDown, FaChevronUp, FaLightbulb, FaClock } from 'react-icons/fa';
import { InlineMath } from 'react-katex';

const Card = styled.div`
  background: white;
  border: 2px solid ${props => props.expanded ? '#667eea' : '#e0e0e0'};
  border-radius: 12px;
  padding: 15px;
  cursor: pointer;
  transition: all 0.3s;
  position: relative;

  &:hover {
    border-color: #667eea;
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.2);
  }
`;

const StepHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const StepNumber = styled.div`
  position: absolute;
  left: -38px;
  top: 15px;
  width: 28px;
  height: 28px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 14px;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.4);
`;

const StepInfo = styled.div`
  flex: 1;
`;

const RuleBadge = styled.div`
  display: inline-block;
  background: #f0f0f0;
  color: #667eea;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  margin-bottom: 8px;
`;

const Expression = styled.div`
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin: 8px 0;
  font-family: 'Courier New', monospace;
`;

const Arrow = styled.div`
  color: #667eea;
  font-size: 20px;
  margin: 5px 0;
  text-align: center;
`;

const ExpandIcon = styled.div`
  color: #999;
  font-size: 18px;
  transition: transform 0.3s;
  transform: ${props => props.expanded ? 'rotate(180deg)' : 'rotate(0)'};
`;

const StepDetails = styled.div`
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px solid #e0e0e0;
  display: ${props => props.expanded ? 'block' : 'none'};
`;

const DetailRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
  font-size: 14px;
  color: #666;
`;

const DetailIcon = styled.div`
  color: #667eea;
`;

const DetailText = styled.div`
  flex: 1;
`;

const ExplanationBox = styled.div`
  background: #f8f9fa;
  padding: 12px;
  border-radius: 8px;
  margin-top: 10px;
  font-size: 14px;
  color: #555;
  line-height: 1.5;
`;

const RULE_LABELS = {
  'add_both_sides': '양변에 더하기',
  'subtract_both_sides': '양변에서 빼기',
  'multiply_both_sides': '양변에 곱하기',
  'divide_both_sides': '양변을 나누기',
  'combine_like_terms': '동류항 정리',
  'distribute': '분배법칙',
  'factor': '인수분해',
  'simplify': '단순화',
  'isolate_variable': '변수 고립'
};

const StepCard = ({ step, stepNumber }) => {
  const [expanded, setExpanded] = useState(false);

  const formatDuration = (ms) => {
    if (!ms) return '-';
    const seconds = Math.floor(ms / 1000);
    if (seconds < 60) return `${seconds}초`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}분 ${remainingSeconds}초`;
  };

  const getRuleLabel = (ruleKey) => {
    return RULE_LABELS[ruleKey] || ruleKey;
  };

  return (
    <Card expanded={expanded} onClick={() => setExpanded(!expanded)}>
      <StepNumber>{stepNumber}</StepNumber>

      <StepHeader>
        <StepInfo>
          <RuleBadge>{getRuleLabel(step.rule_applied || step.action_type)}</RuleBadge>
          <Expression>{step.from_expression}</Expression>
          <Arrow>↓</Arrow>
          <Expression>{step.to_expression}</Expression>
        </StepInfo>
        <ExpandIcon expanded={expanded}>
          {expanded ? <FaChevronUp /> : <FaChevronDown />}
        </ExpandIcon>
      </StepHeader>

      <StepDetails expanded={expanded}>
        {step.explanation && (
          <DetailRow>
            <DetailIcon><FaLightbulb /></DetailIcon>
            <DetailText>
              <strong>설명:</strong>
              <ExplanationBox>{step.explanation}</ExplanationBox>
            </DetailText>
          </DetailRow>
        )}

        <DetailRow>
          <DetailIcon><FaClock /></DetailIcon>
          <DetailText>
            <strong>소요 시간:</strong> {formatDuration(step.duration_ms)}
          </DetailText>
        </DetailRow>

        {step.rule_category && (
          <DetailRow>
            <DetailIcon>🏷️</DetailIcon>
            <DetailText>
              <strong>카테고리:</strong> {step.rule_category}
            </DetailText>
          </DetailRow>
        )}

        {step.hint_used && (
          <DetailRow>
            <DetailIcon>💡</DetailIcon>
            <DetailText style={{ color: '#ff9800' }}>
              힌트 사용됨
            </DetailText>
          </DetailRow>
        )}

        {step.is_correct === false && (
          <DetailRow>
            <DetailIcon>⚠️</DetailIcon>
            <DetailText style={{ color: '#f44336' }}>
              오류가 있을 수 있는 단계
            </DetailText>
          </DetailRow>
        )}
      </StepDetails>
    </Card>
  );
};

export default StepCard;
