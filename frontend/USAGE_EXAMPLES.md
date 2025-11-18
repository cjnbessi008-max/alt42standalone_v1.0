# 사용 예제

## 1. 기본 이해도 막대 표시

```tsx
import React from 'react';
import { UnderstandingBar } from './components/UnderstandingBar';

function MyComponent() {
  return (
    <div>
      <h2>현재 이해도</h2>
      <UnderstandingBar
        level={2}
        showLabel={true}
        showDescription={true}
      />
    </div>
  );
}
```

## 2. 실시간 이해도 업데이트

```tsx
import React, { useState, useEffect } from 'react';
import { UnderstandingBar } from './components/UnderstandingBar';
import { understandingService } from './services/understandingService';

function LiveUnderstanding({ studentId, moduleId }) {
  const [level, setLevel] = useState(1);

  useEffect(() => {
    // 초기 이해도 로드
    const loadUnderstanding = async () => {
      const data = await understandingService.getUnderstandingLevel({
        studentId,
        moduleId
      });
      setLevel(data.level);
    };

    loadUnderstanding();

    // 실시간 업데이트 (WebSocket 연결 시뮬레이션)
    const interval = setInterval(async () => {
      const data = await understandingService.getUnderstandingLevel({
        studentId,
        moduleId
      });
      setLevel(data.level);
    }, 5000); // 5초마다 업데이트

    return () => clearInterval(interval);
  }, [studentId, moduleId]);

  return (
    <UnderstandingBar
      level={level}
      animate={true}
      size="large"
    />
  );
}
```

## 3. 여러 모듈의 이해도 표시

```tsx
import React, { useState, useEffect } from 'react';
import { UnderstandingBarCompact } from './components/UnderstandingBar';

function ModuleList({ studentId, modules }) {
  const [understandingLevels, setUnderstandingLevels] = useState({});

  useEffect(() => {
    // 모든 모듈의 이해도 로드
    const loadAllLevels = async () => {
      const levels = {};
      for (const module of modules) {
        const data = await understandingService.getUnderstandingLevel({
          studentId,
          moduleId: module.id
        });
        levels[module.id] = data.level;
      }
      setUnderstandingLevels(levels);
    };

    loadAllLevels();
  }, [studentId, modules]);

  return (
    <div>
      {modules.map(module => (
        <div key={module.id} style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span>{module.name}</span>
          <UnderstandingBarCompact level={understandingLevels[module.id] || 1} />
        </div>
      ))}
    </div>
  );
}
```

## 4. 사용자 정의 스타일링

```tsx
import React from 'react';
import { UnderstandingBar } from './components/UnderstandingBar';
import './CustomStyles.css'; // 추가 스타일

function CustomStyled() {
  return (
    <div className="custom-understanding-container">
      <UnderstandingBar
        level={3}
        showLabel={true}
        size="large"
      />
      <style>{`
        .custom-understanding-container .understanding-bar__container {
          height: 80px;
          border-radius: 16px;
        }
        .custom-understanding-container .understanding-bar__segment {
          font-size: 18px;
          font-weight: 700;
        }
      `}</style>
    </div>
  );
}
```

## 5. 진도 업데이트 후 이해도 갱신

```tsx
import React, { useState } from 'react';
import { UnderstandingBar } from './components/UnderstandingBar';
import { understandingService } from './services/understandingService';

function ProblemSolver({ studentId, moduleId }) {
  const [level, setLevel] = useState(1);
  const [accuracy, setAccuracy] = useState(0);
  const [problemsAttempted, setProblemsAttempted] = useState(0);

  const handleProblemSubmit = async (isCorrect) => {
    const newAttempts = problemsAttempted + 1;
    const newAccuracy = isCorrect
      ? ((accuracy * problemsAttempted) + 100) / newAttempts
      : (accuracy * problemsAttempted) / newAttempts;

    setProblemsAttempted(newAttempts);
    setAccuracy(newAccuracy);

    // 이해도 업데이트
    const updated = await understandingService.updateUnderstandingLevel({
      studentId,
      moduleId,
      metrics: {
        accuracy: newAccuracy,
        problemsAttempted: newAttempts,
        consistencyScore: 75 // 예시 값
      }
    });

    setLevel(updated.level);
  };

  return (
    <div>
      <UnderstandingBar level={level} />
      <div>
        <p>정확도: {accuracy.toFixed(1)}%</p>
        <p>시도한 문제: {problemsAttempted}개</p>
      </div>
      <button onClick={() => handleProblemSubmit(true)}>정답</button>
      <button onClick={() => handleProblemSubmit(false)}>오답</button>
    </div>
  );
}
```

## 6. 이해도 히스토리 표시

```tsx
import React, { useState, useEffect } from 'react';
import { UnderstandingBar } from './components/UnderstandingBar';
import { understandingService } from './services/understandingService';

function UnderstandingHistory({ studentId, moduleId }) {
  const [currentLevel, setCurrentLevel] = useState(1);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const loadData = async () => {
      const data = await understandingService.getUnderstandingLevel({
        studentId,
        moduleId
      });
      setCurrentLevel(data.level);
      setHistory(data.history || []);
    };

    loadData();
  }, [studentId, moduleId]);

  return (
    <div>
      <h3>현재 이해도</h3>
      <UnderstandingBar level={currentLevel} />

      <h3>이해도 변화</h3>
      <ul>
        {history.map((entry, index) => (
          <li key={index}>
            {entry.achievedAt.toLocaleDateString('ko-KR')} -
            레벨 {entry.level} ({entry.trigger})
          </li>
        ))}
      </ul>
    </div>
  );
}
```

## 7. 교사용 대시보드 - 반 전체 이해도

```tsx
import React, { useState, useEffect } from 'react';
import { UnderstandingBarCompact } from './components/UnderstandingBar';
import { understandingService } from './services/understandingService';

function ClassDashboard({ moduleId, students }) {
  const [distribution, setDistribution] = useState({ 1: 0, 2: 0, 3: 0 });
  const [studentLevels, setStudentLevels] = useState({});

  useEffect(() => {
    const loadClassData = async () => {
      // 전체 분포 가져오기
      const dist = await understandingService.getModuleUnderstandingDistribution(moduleId);
      setDistribution(dist);

      // 각 학생별 이해도
      const levels = {};
      for (const student of students) {
        const data = await understandingService.getUnderstandingLevel({
          studentId: student.id,
          moduleId
        });
        levels[student.id] = data.level;
      }
      setStudentLevels(levels);
    };

    loadClassData();
  }, [moduleId, students]);

  return (
    <div>
      <h2>반 전체 이해도 분포</h2>
      <div style={{ display: 'flex', gap: '16px' }}>
        <div>기초: {distribution[1]}명</div>
        <div>중급: {distribution[2]}명</div>
        <div>숙달: {distribution[3]}명</div>
      </div>

      <h3>학생별 이해도</h3>
      <table>
        <thead>
          <tr>
            <th>학생 이름</th>
            <th>이해도</th>
          </tr>
        </thead>
        <tbody>
          {students.map(student => (
            <tr key={student.id}>
              <td>{student.name}</td>
              <td>
                <UnderstandingBarCompact level={studentLevels[student.id] || 1} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

## 8. Mock 데이터로 테스트

```tsx
import React, { useState, useEffect } from 'react';
import { UnderstandingBar } from './components/UnderstandingBar';
import { understandingService } from './services/understandingService';

function TestComponent() {
  const [level, setLevel] = useState(1);

  useEffect(() => {
    // Mock 데이터 사용
    const loadMockData = async () => {
      const data = await understandingService.getMockUnderstandingData(
        'test-student',
        'test-module'
      );
      setLevel(data.level);
    };

    loadMockData();
  }, []);

  return (
    <div>
      <h2>테스트 컴포넌트</h2>
      <UnderstandingBar
        level={level}
        showLabel={true}
        showDescription={true}
        animate={true}
      />
    </div>
  );
}
```

## 9. 로컬에서 이해도 계산

```tsx
import React, { useState } from 'react';
import { UnderstandingBar } from './components/UnderstandingBar';
import { understandingService } from './services/understandingService';

function LocalCalculation() {
  const [metrics, setMetrics] = useState({
    accuracy: 0,
    problemsAttempted: 0,
    consistencyScore: 0,
    correctStreak: 0,
    averageTimePerProblem: 0
  });

  const level = understandingService.calculateUnderstandingLevel(metrics);

  return (
    <div>
      <UnderstandingBar level={level} />

      <div>
        <label>
          정확도:
          <input
            type="number"
            value={metrics.accuracy}
            onChange={(e) => setMetrics({...metrics, accuracy: Number(e.target.value)})}
          />
        </label>
        <label>
          시도한 문제:
          <input
            type="number"
            value={metrics.problemsAttempted}
            onChange={(e) => setMetrics({...metrics, problemsAttempted: Number(e.target.value)})}
          />
        </label>
        <label>
          일관성 점수:
          <input
            type="number"
            value={metrics.consistencyScore}
            onChange={(e) => setMetrics({...metrics, consistencyScore: Number(e.target.value)})}
          />
        </label>
      </div>
    </div>
  );
}
```

## 10. 반응형 디자인

```tsx
import React, { useState, useEffect } from 'react';
import { UnderstandingBar, UnderstandingBarCompact } from './components/UnderstandingBar';

function ResponsiveUnderstanding({ level }) {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return isMobile ? (
    <UnderstandingBarCompact level={level} />
  ) : (
    <UnderstandingBar
      level={level}
      size="large"
      showLabel={true}
      showDescription={true}
    />
  );
}
```
