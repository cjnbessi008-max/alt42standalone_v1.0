import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import VirtualPhone from './components/VirtualPhone/VirtualPhone';
import ProblemDisplay from './components/ProblemDisplay/ProblemDisplay';
import { QuizProblem } from './types';
import apiService from './services/api';

const AppContainer = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 40px 20px;
`;

const Header = styled.header`
  text-align: center;
  color: white;
  margin-bottom: 40px;
`;

const Title = styled.h1`
  font-size: 48px;
  font-weight: 700;
  margin-bottom: 10px;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
`;

const Subtitle = styled.p`
  font-size: 18px;
  opacity: 0.9;
  font-weight: 300;
`;

const MainContent = styled.div`
  max-width: 1400px;
  margin: 0 auto;
`;

const ControlPanel = styled.div`
  background: white;
  padding: 30px;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  margin-bottom: 40px;
`;

const ControlRow = styled.div`
  display: flex;
  gap: 15px;
  align-items: center;
  flex-wrap: wrap;
`;

const Input = styled.input`
  padding: 12px 16px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 16px;
  flex: 1;
  min-width: 200px;
  transition: all 0.2s ease;

  &:focus {
    outline: none;
    border-color: #667eea;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  }
`;

const Button = styled.button`
  padding: 12px 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
  }

  &:active {
    transform: translateY(0);
  }

  &:disabled {
    background: #ccc;
    cursor: not-allowed;
    transform: none;
  }
`;

const ToggleButton = styled(Button)<{ active: boolean }>`
  background: ${({ active }) =>
    active
      ? 'linear-gradient(135deg, #ff8c00, #ffa500)'
      : 'linear-gradient(135deg, #888, #aaa)'};
`;

const StatusMessage = styled.div<{ type: 'error' | 'success' | 'info' }>`
  padding: 12px 16px;
  border-radius: 8px;
  margin-top: 15px;
  font-size: 14px;
  background: ${({ type }) => {
    switch (type) {
      case 'error':
        return '#ffebee';
      case 'success':
        return '#e8f5e9';
      case 'info':
      default:
        return '#e3f2fd';
    }
  }};
  color: ${({ type }) => {
    switch (type) {
      case 'error':
        return '#c62828';
      case 'success':
        return '#2e7d32';
      case 'info':
      default:
        return '#1565c0';
    }
  }};
  border: 1px solid
    ${({ type }) => {
      switch (type) {
        case 'error':
          return '#ef9a9a';
        case 'success':
          return '#a5d6a7';
        case 'info':
        default:
          return '#90caf9';
      }
    }};
`;

const DemoInfo = styled.div`
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  padding: 20px;
  border-radius: 12px;
  color: white;
  margin-bottom: 30px;
  border: 1px solid rgba(255, 255, 255, 0.2);
`;

const DemoTitle = styled.h3`
  font-size: 18px;
  margin-bottom: 10px;
  font-weight: 600;
`;

const DemoText = styled.p`
  font-size: 14px;
  line-height: 1.6;
  opacity: 0.9;
`;

const App: React.FC = () => {
  const [problemId, setProblemId] = useState<string>('1');
  const [problem, setProblem] = useState<QuizProblem | null>(null);
  const [showTrapShadows, setShowTrapShadows] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  // Load demo problem on mount
  useEffect(() => {
    loadDemoProblem();
  }, []);

  const loadDemoProblem = () => {
    // Demo problem data (when backend is not available)
    const demoProblem: QuizProblem = {
      question: {
        id: 1,
        name: '데모 문제: 분수의 덧셈',
        questiontext: `
          <p><strong>다음 분수의 덧셈을 계산하세요:</strong></p>
          <p style="font-size: 24px; text-align: center; margin: 20px 0;">
            1/4 + 1/2 = ?
          </p>
          <p>힌트: 분모를 같게 만들어야 합니다.</p>
        `,
        questiontextformat: 1,
        qtype: 'multichoice',
        penalty: 0.33,
        defaultmark: 1.0,
      },
      answers: [
        {
          id: 1,
          answer: '2/6',
          fraction: 0,
          feedback: '분모를 잘못 계산했습니다.',
        },
        {
          id: 2,
          answer: '3/4',
          fraction: 1,
          feedback: '정답입니다! 1/4 + 2/4 = 3/4',
        },
        {
          id: 3,
          answer: '2/4',
          fraction: 0,
          feedback: '분자를 다시 확인해보세요.',
        },
        {
          id: 4,
          answer: '1/6',
          fraction: 0,
          feedback: '덧셈이 아니라 뺄셈을 한 것 같습니다.',
        },
      ],
      trapPoints: [
        {
          id: 1,
          questionId: 1,
          type: 'text' as any,
          position: { x: 15, y: 25, width: 70, height: 15 },
          severity: 'high' as any,
          description: '함정: 분모를 먼저 같게 만들어야 합니다!',
          errorRate: 72.5,
        },
        {
          id: 2,
          questionId: 1,
          type: 'option' as any,
          position: { x: 10, y: 65, width: 80, height: 8 },
          severity: 'medium' as any,
          description: '주의: 이 답은 분모만 더한 잘못된 답입니다.',
          errorRate: 58.3,
        },
      ],
    };

    setProblem(demoProblem);
    setSuccess('데모 문제가 로드되었습니다.');
    setTimeout(() => setSuccess(''), 3000);
  };

  const loadProblem = async () => {
    if (!problemId) {
      setError('문제 ID를 입력하세요.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const data = await apiService.getProblem(parseInt(problemId));
      setProblem(data);
      setSuccess('문제를 성공적으로 불러왔습니다.');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(
        '문제를 불러오는 데 실패했습니다. 백엔드 서버가 실행 중인지 확인하세요.'
      );
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppContainer>
      <Header>
        <Title>🎯 ALT42 Trap Shadow</Title>
        <Subtitle>
          Moodle 퀴즈 문제의 함정 포인트를 시각화하는 가상 스마트폰 앱
        </Subtitle>
      </Header>

      <MainContent>
        <DemoInfo>
          <DemoTitle>📱 데모 모드</DemoTitle>
          <DemoText>
            현재 데모 문제가 우측 하단의 가상 스마트폰에 표시됩니다.
            오렌지색 그림자가 함정 포인트를 나타냅니다. 마우스를 올려보세요!
          </DemoText>
        </DemoInfo>

        <ControlPanel>
          <h2 style={{ marginBottom: '20px', color: '#333' }}>제어판</h2>

          <ControlRow>
            <Input
              type="number"
              value={problemId}
              onChange={(e) => setProblemId(e.target.value)}
              placeholder="문제 ID 입력"
            />
            <Button onClick={loadProblem} disabled={loading}>
              {loading ? '로딩 중...' : '문제 불러오기'}
            </Button>
            <Button onClick={loadDemoProblem}>데모 문제 로드</Button>
            <ToggleButton
              active={showTrapShadows}
              onClick={() => setShowTrapShadows(!showTrapShadows)}
            >
              {showTrapShadows ? '🎯 함정 표시 ON' : '🎯 함정 표시 OFF'}
            </ToggleButton>
          </ControlRow>

          {error && <StatusMessage type="error">{error}</StatusMessage>}
          {success && <StatusMessage type="success">{success}</StatusMessage>}

          {!problem && !error && !success && (
            <StatusMessage type="info">
              문제 ID를 입력하고 "문제 불러오기" 버튼을 클릭하거나,
              "데모 문제 로드" 버튼을 클릭하세요.
            </StatusMessage>
          )}
        </ControlPanel>
      </MainContent>

      {/* Virtual Phone with Problem Display */}
      {problem && (
        <VirtualPhone position="bottom-right">
          <ProblemDisplay problem={problem} showTrapShadows={showTrapShadows} />
        </VirtualPhone>
      )}
    </AppContainer>
  );
};

export default App;
