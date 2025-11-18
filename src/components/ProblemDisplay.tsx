import React, { useState } from 'react';
import { Problem, AnswerSubmission } from '@/types';

interface ProblemDisplayProps {
  problem: Problem;
  onSubmitAnswer: (answer: string) => void;
  sessionId: string;
  studentId?: string;
}

/**
 * ProblemDisplay Component
 * Displays problem information and collects student answers
 */
const ProblemDisplay: React.FC<ProblemDisplayProps> = ({
  problem,
  onSubmitAnswer,
  sessionId,
  studentId = 'student_demo'
}) => {
  const [answer, setAnswer] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [startTime] = useState(Date.now());
  const [showHints, setShowHints] = useState(false);
  const [currentHintIndex, setCurrentHintIndex] = useState(0);

  const handleSubmit = () => {
    if (!answer.trim()) {
      alert('답을 입력해주세요.');
      return;
    }

    const timeSpent = Math.floor((Date.now() - startTime) / 1000);
    setAttempts(prev => prev + 1);

    onSubmitAnswer(answer);
  };

  const showNextHint = () => {
    if (problem.hints && currentHintIndex < problem.hints.length) {
      setCurrentHintIndex(prev => prev + 1);
      setShowHints(true);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return '#4CAF50';
      case 'medium':
        return '#FF9800';
      case 'hard':
        return '#f44336';
      default:
        return '#2196F3';
    }
  };

  const getDifficultyText = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return '쉬움 (Easy)';
      case 'medium':
        return '보통 (Medium)';
      case 'hard':
        return '어려움 (Hard)';
      default:
        return difficulty;
    }
  };

  return (
    <div style={{
      padding: '20px',
      backgroundColor: '#f5f5f5',
      borderRadius: '8px',
      marginBottom: '20px'
    }}>
      {/* Problem Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '15px'
      }}>
        <h2 style={{ margin: 0, color: '#333' }}>{problem.title}</h2>
        <span style={{
          padding: '5px 15px',
          backgroundColor: getDifficultyColor(problem.difficulty),
          color: 'white',
          borderRadius: '20px',
          fontSize: '14px',
          fontWeight: 'bold'
        }}>
          {getDifficultyText(problem.difficulty)}
        </span>
      </div>

      {/* Problem Description */}
      <p style={{
        fontSize: '16px',
        color: '#555',
        lineHeight: '1.6',
        marginBottom: '15px'
      }}>
        {problem.description}
      </p>

      {/* Instructions */}
      <div style={{
        backgroundColor: '#E3F2FD',
        padding: '15px',
        borderRadius: '4px',
        borderLeft: '4px solid #2196F3',
        marginBottom: '15px'
      }}>
        <strong style={{ color: '#1976D2' }}>📝 지시사항 (Instructions):</strong>
        <p style={{ margin: '10px 0 0 0', color: '#333' }}>
          {problem.instructions}
        </p>
      </div>

      {/* Function Information */}
      <div style={{
        backgroundColor: 'white',
        padding: '15px',
        borderRadius: '4px',
        marginBottom: '15px',
        border: '1px solid #ddd'
      }}>
        <h3 style={{ marginTop: 0, color: '#333' }}>함수 정보 (Function Details)</h3>
        <div style={{ fontSize: '14px', color: '#555' }}>
          <p><strong>정의역 (Domain):</strong> [{problem.mathFunction.domain[0]}, {problem.mathFunction.domain[1]}]</p>
          <p><strong>치역 (Range):</strong> [{problem.mathFunction.range[0]}, {problem.mathFunction.range[1]}]</p>
          <p><strong>불연속점 개수:</strong> {problem.mathFunction.discontinuityPoints.length}개</p>
        </div>

        {/* Discontinuity Points Details */}
        <div style={{ marginTop: '15px' }}>
          <strong style={{ color: '#FF5722' }}>불연속점 상세 정보:</strong>
          {problem.mathFunction.discontinuityPoints.map((point, index) => (
            <div key={index} style={{
              backgroundColor: '#FFF3E0',
              padding: '10px',
              marginTop: '10px',
              borderRadius: '4px',
              fontSize: '14px'
            }}>
              <p style={{ margin: '5px 0' }}>
                <strong>x = {point.x}</strong>
              </p>
              <p style={{ margin: '5px 0' }}>
                좌극한 (Left Limit): {point.leftLimit !== null ? point.leftLimit : '존재하지 않음'}
              </p>
              <p style={{ margin: '5px 0' }}>
                우극한 (Right Limit): {point.rightLimit !== null ? point.rightLimit : '존재하지 않음'}
              </p>
              <p style={{ margin: '5px 0' }}>
                함수값 (Function Value): {point.functionValue !== null ? point.functionValue : '정의되지 않음'}
              </p>
              <p style={{ margin: '5px 0' }}>
                <em style={{ color: '#E64A19' }}>타입: {point.type}</em>
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Hints Section */}
      {problem.hints && problem.hints.length > 0 && (
        <div style={{ marginBottom: '15px' }}>
          <button
            onClick={showNextHint}
            disabled={currentHintIndex >= problem.hints.length}
            style={{
              padding: '8px 16px',
              backgroundColor: currentHintIndex >= problem.hints.length ? '#ccc' : '#FF9800',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: currentHintIndex >= problem.hints.length ? 'not-allowed' : 'pointer',
              fontSize: '14px'
            }}
          >
            💡 힌트 보기 ({currentHintIndex}/{problem.hints.length})
          </button>

          {showHints && currentHintIndex > 0 && (
            <div style={{
              marginTop: '10px',
              backgroundColor: '#FFF9C4',
              padding: '15px',
              borderRadius: '4px',
              borderLeft: '4px solid #FBC02D'
            }}>
              {problem.hints.slice(0, currentHintIndex).map((hint, index) => (
                <p key={index} style={{ margin: '5px 0', color: '#333' }}>
                  <strong>힌트 {index + 1}:</strong> {hint}
                </p>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Answer Input */}
      <div style={{
        backgroundColor: 'white',
        padding: '15px',
        borderRadius: '4px',
        border: '1px solid #ddd'
      }}>
        <label style={{
          display: 'block',
          marginBottom: '10px',
          fontWeight: 'bold',
          color: '#333'
        }}>
          답변을 입력하세요 (Your Answer):
        </label>
        <input
          type="text"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder="예: jump, removable, infinite..."
          style={{
            width: '100%',
            padding: '12px',
            fontSize: '16px',
            border: '2px solid #ddd',
            borderRadius: '4px',
            boxSizing: 'border-box',
            marginBottom: '10px'
          }}
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              handleSubmit();
            }
          }}
        />

        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span style={{ fontSize: '14px', color: '#666' }}>
            시도 횟수 (Attempts): {attempts}
          </span>

          <button
            onClick={handleSubmit}
            style={{
              padding: '12px 24px',
              fontSize: '16px',
              backgroundColor: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = '#45a049';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = '#4CAF50';
            }}
          >
            제출 (Submit)
          </button>
        </div>
      </div>

      {/* Metadata */}
      {problem.metadata && (
        <div style={{
          marginTop: '15px',
          fontSize: '12px',
          color: '#999',
          display: 'flex',
          gap: '15px',
          flexWrap: 'wrap'
        }}>
          <span>과목: {problem.metadata.subject}</span>
          <span>학년: {problem.metadata.gradeLevel}</span>
          <span>주제: {problem.metadata.topic}</span>
          {problem.metadata.tags.length > 0 && (
            <span>태그: {problem.metadata.tags.join(', ')}</span>
          )}
        </div>
      )}
    </div>
  );
};

export default ProblemDisplay;
