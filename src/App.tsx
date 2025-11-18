/**
 * Main App Component
 * Demonstrates Term Slide Animation with Moodle Integration
 */

import React, { useState, useEffect } from 'react';
import { SmartphoneDisplay } from './components/SmartphoneDisplay';
import { TermSlideViewer } from './components/TermSlideViewer';
import { useTermNavigation } from './hooks/useTermNavigation';
import { Term } from './types';
import './App.css';

// Sample data (would come from Moodle in production)
const sampleTerms: Term[] = [
  {
    id: 'term-1',
    title: '문제 1: 분수의 기본 개념',
    description: '분수가 무엇인지 이해하고 표현해봅시다.',
    content: '분수는 전체를 여러 부분으로 나눈 것 중 일부를 나타내는 수입니다.\n\n예를 들어, 피자 한 판을 4조각으로 나누었을 때, 그 중 1조각은 전체의 1/4입니다.\n\n분수는 분자(위의 수)와 분모(아래의 수)로 구성됩니다.',
    order: 0,
    metadata: {
      questionType: 'multiple_choice',
      points: 10,
      category: '기초 수학',
    },
  },
  {
    id: 'term-2',
    title: '문제 2: 분수의 덧셈',
    description: '같은 분모를 가진 분수끼리 더하는 방법을 배워봅시다.',
    content: '같은 분모를 가진 분수의 덧셈:\n\n1/4 + 2/4 = ?\n\n풀이:\n1. 분모는 그대로 둡니다 (4)\n2. 분자끼리 더합니다 (1 + 2 = 3)\n3. 답: 3/4\n\n분모가 같을 때는 분자만 더하면 됩니다!',
    order: 1,
    metadata: {
      questionType: 'short_answer',
      points: 15,
      category: '분수 연산',
    },
  },
  {
    id: 'term-3',
    title: '문제 3: 분수의 시각화',
    description: '원형 그래프로 분수를 표현해봅시다.',
    content: '3/8을 원형 그래프로 나타내면:\n\n• 원을 8등분으로 나눕니다\n• 그 중 3개 부분을 색칠합니다\n\n이렇게 시각적으로 표현하면 분수를 더 쉽게 이해할 수 있습니다.\n\n실생활에서는 시계, 피자, 케이크 등을 나눌 때 분수를 자주 사용합니다.',
    order: 2,
    metadata: {
      questionType: 'essay',
      points: 20,
      category: '시각화',
    },
  },
  {
    id: 'term-4',
    title: '문제 4: 분수의 크기 비교',
    description: '두 분수의 크기를 비교하는 방법을 배워봅시다.',
    content: '다음 중 어느 분수가 더 클까요?\n\nA) 2/5\nB) 3/5\n\n풀이:\n분모가 같으므로 분자만 비교하면 됩니다.\n3 > 2 이므로,\n3/5 > 2/5\n\n정답: B) 3/5가 더 큽니다.\n\n분모가 같을 때는 분자가 큰 것이 더 큰 분수입니다!',
    order: 3,
    metadata: {
      questionType: 'multiple_choice',
      points: 12,
      category: '분수 비교',
    },
  },
  {
    id: 'term-5',
    title: '문제 5: 종합 문제',
    description: '배운 내용을 모두 활용하여 문제를 풀어봅시다.',
    content: '지민이는 케이크를 8조각으로 나누었습니다.\n첫 번째 날에 2조각을, 두 번째 날에 3조각을 먹었습니다.\n\n질문:\n1. 지민이가 먹은 케이크는 전체의 몇 분의 몇일까요?\n2. 남은 케이크는 전체의 몇 분의 몇일까요?\n\n풀이:\n1. 먹은 양: 2/8 + 3/8 = 5/8\n2. 남은 양: 8/8 - 5/8 = 3/8\n\n답: 지민이는 5/8을 먹었고, 3/8이 남았습니다.',
    order: 4,
    metadata: {
      questionType: 'essay',
      points: 25,
      category: '종합 문제',
    },
  },
];

function App() {
  const [terms] = useState<Term[]>(sampleTerms);
  const [moodleConnected, setMoodleConnected] = useState(false);

  const {
    currentIndex,
    currentTerm,
    direction,
    canGoNext,
    canGoPrevious,
    goNext,
    goPrevious,
    progress,
  } = useTermNavigation({
    terms,
    enableKeyboard: true,
    loop: false,
  });

  useEffect(() => {
    // Simulate Moodle connection check
    setTimeout(() => {
      setMoodleConnected(true);
    }, 1000);
  }, []);

  return (
    <div className="app">
      <div className="main-content">
        <header className="app-header">
          <h1>Alt42 Standalone - Term Slide Demo</h1>
          <div className="connection-status">
            <span
              className={`status-indicator ${moodleConnected ? 'connected' : 'disconnected'}`}
            />
            <span className="status-text">
              {moodleConnected ? 'Moodle 연결됨' : 'Moodle 연결 중...'}
            </span>
          </div>
        </header>

        <div className="info-panel">
          <h2>사용 방법</h2>
          <ul>
            <li>우측 하단의 가상 스마트폰 화면에서 문제를 확인하세요</li>
            <li>
              <kbd>→</kbd> 또는 <kbd>Space</kbd>: 다음 문제
            </li>
            <li>
              <kbd>←</kbd>: 이전 문제
            </li>
            <li>화면 내 버튼으로도 이동할 수 있습니다</li>
          </ul>

          <div className="current-term-info">
            <h3>현재 문제 정보</h3>
            {currentTerm && (
              <div className="term-details">
                <p>
                  <strong>제목:</strong> {currentTerm.title}
                </p>
                <p>
                  <strong>진행률:</strong> {Math.round(progress)}%
                </p>
                <p>
                  <strong>문제 번호:</strong> {currentIndex + 1} / {terms.length}
                </p>
              </div>
            )}
          </div>

          <div className="tech-stack">
            <h3>기술 스택</h3>
            <ul>
              <li>React 18 + TypeScript</li>
              <li>Framer Motion (애니메이션)</li>
              <li>Moodle 3.7 연동 (PHP 7.1.9, MySQL 5.7)</li>
              <li>부드러운 Term Slide 애니메이션</li>
            </ul>
          </div>
        </div>
      </div>

      <SmartphoneDisplay
        config={{
          width: 375,
          height: 667,
          position: 'bottom-right',
          scale: 0.75,
        }}
      >
        <TermSlideViewer
          terms={terms}
          currentIndex={currentIndex}
          direction={direction}
          onNext={canGoNext ? goNext : undefined}
          onPrevious={canGoPrevious ? goPrevious : undefined}
          showProgress={true}
          progress={progress}
        />
      </SmartphoneDisplay>
    </div>
  );
}

export default App;
