import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { FaClock, FaCheckCircle, FaTimesCircle, FaChartLine } from 'react-icons/fa';
import { useTimelineStore } from '../../store/timelineStore';
import StepCard from './StepCard';

const PanelContainer = styled.div`
  background: rgba(255, 255, 255, 0.95);
  border-radius: 20px;
  padding: 25px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
  max-width: 800px;
  width: 100%;
`;

const PanelHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 25px;
  padding-bottom: 15px;
  border-bottom: 2px solid #e0e0e0;
`;

const Title = styled.h2`
  font-size: 24px;
  color: #333;
  display: flex;
  align-items: center;
  gap: 10px;
`;

const StatusBadge = styled.div`
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;

  ${props => props.status === 'recording' && `
    background: #4caf50;
    color: white;
  `}

  ${props => props.status === 'completed' && `
    background: #2196f3;
    color: white;
  `}

  ${props => props.status === 'idle' && `
    background: #f0f0f0;
    color: #666;
  `}
`;

const TimelineContent = styled.div`
  min-height: 400px;
  max-height: 600px;
  overflow-y: auto;

  &::-webkit-scrollbar {
    width: 8px;
  }

  &::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 10px;
  }

  &::-webkit-scrollbar-thumb {
    background: #888;
    border-radius: 10px;

    &:hover {
      background: #555;
    }
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 60px 20px;
  color: #999;
`;

const EmptyIcon = styled.div`
  font-size: 64px;
  margin-bottom: 20px;
  opacity: 0.3;
`;

const EmptyText = styled.div`
  font-size: 18px;
  margin-bottom: 10px;
`;

const EmptySubtext = styled.div`
  font-size: 14px;
  color: #bbb;
`;

const StepsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 15px;
`;

const TimelineStats = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 15px;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 2px solid #e0e0e0;
`;

const StatCard = styled.div`
  background: linear-gradient(135deg, ${props => props.color1} 0%, ${props => props.color2} 100%);
  color: white;
  padding: 15px;
  border-radius: 12px;
  text-align: center;
`;

const StatValue = styled.div`
  font-size: 28px;
  font-weight: bold;
  margin-bottom: 5px;
`;

const StatLabel = styled.div`
  font-size: 13px;
  opacity: 0.9;
`;

const TimelineVisualizer = styled.div`
  position: relative;
  padding-left: 40px;
  margin-bottom: 20px;

  &::before {
    content: '';
    position: absolute;
    left: 15px;
    top: 0;
    bottom: 0;
    width: 3px;
    background: linear-gradient(180deg, #667eea 0%, #764ba2 100%);
  }
`;

const TimelinePanel = () => {
  const { currentTimeline, steps, isRecording } = useTimelineStore();
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    if (isRecording) {
      const interval = setInterval(() => {
        const start = new Date(currentTimeline.started_at);
        const now = new Date();
        const elapsed = Math.floor((now - start) / 1000);
        setElapsedTime(elapsed);
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [isRecording, currentTimeline]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatus = () => {
    if (!currentTimeline) return 'idle';
    if (isRecording) return 'recording';
    return 'completed';
  };

  const getStatusText = () => {
    const status = getStatus();
    if (status === 'recording') return '기록 중';
    if (status === 'completed') return '완료';
    return '대기 중';
  };

  const getStatusIcon = () => {
    const status = getStatus();
    if (status === 'recording') return <FaClock />;
    if (status === 'completed') {
      return currentTimeline?.is_correct ? <FaCheckCircle /> : <FaTimesCircle />;
    }
    return <FaChartLine />;
  };

  return (
    <PanelContainer>
      <PanelHeader>
        <Title>
          <FaChartLine /> Solve Timeline
        </Title>
        <StatusBadge status={getStatus()}>
          {getStatusIcon()}
          {getStatusText()}
        </StatusBadge>
      </PanelHeader>

      {!currentTimeline ? (
        <TimelineContent>
          <EmptyState>
            <EmptyIcon>📊</EmptyIcon>
            <EmptyText>타임라인이 없습니다</EmptyText>
            <EmptySubtext>
              우측 스마트폰 화면에서 새 문제를 시작하면<br />
              풀이 과정이 여기에 표시됩니다
            </EmptySubtext>
          </EmptyState>
        </TimelineContent>
      ) : (
        <>
          <TimelineContent>
            {steps.length === 0 ? (
              <EmptyState>
                <EmptyIcon>⏳</EmptyIcon>
                <EmptyText>풀이를 시작하세요</EmptyText>
                <EmptySubtext>각 단계가 자동으로 기록됩니다</EmptySubtext>
              </EmptyState>
            ) : (
              <TimelineVisualizer>
                <StepsList>
                  {steps.map((step, index) => (
                    <StepCard key={index} step={step} stepNumber={index + 1} />
                  ))}
                </StepsList>
              </TimelineVisualizer>
            )}
          </TimelineContent>

          <TimelineStats>
            <StatCard color1="#667eea" color2="#764ba2">
              <StatValue>{steps.length}</StatValue>
              <StatLabel>총 단계</StatLabel>
            </StatCard>

            <StatCard color1="#f093fb" color2="#f5576c">
              <StatValue>{formatTime(elapsedTime)}</StatValue>
              <StatLabel>경과 시간</StatLabel>
            </StatCard>

            {currentTimeline.is_correct !== undefined && (
              <StatCard
                color1={currentTimeline.is_correct ? "#4caf50" : "#f44336"}
                color2={currentTimeline.is_correct ? "#8bc34a" : "#e91e63"}
              >
                <StatValue>{currentTimeline.is_correct ? '✓' : '✗'}</StatValue>
                <StatLabel>{currentTimeline.is_correct ? '정답' : '오답'}</StatLabel>
              </StatCard>
            )}
          </TimelineStats>
        </>
      )}
    </PanelContainer>
  );
};

export default TimelinePanel;
