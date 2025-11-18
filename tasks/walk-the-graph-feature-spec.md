# Walk the Graph - Feature Specification (Draft)

## 개요 (Overview)

"Walk the Graph"는 학생들이 수학적 개념을 시각적이고 인터랙티브하게 학습할 수 있도록 하는 기능입니다. 캐릭터가 그래프 위를 걸으며 함수의 의미를 단계별로 설명합니다.

## 기능 목표 (Goals)

1. **시각적 학습**: 추상적인 수학 개념을 구체적인 시각 요소로 표현
2. **능동적 참여**: 학생이 캐릭터의 이동을 통제하며 학습 속도 조절
3. **단계별 설명**: 복잡한 개념을 작은 단계로 나누어 설명
4. **즉각적 피드백**: 학생의 선택에 대한 실시간 반응

## 사용 시나리오 (Use Cases)

### 시나리오 1: 선형 함수 학습 (y = 2x + 1)
```
1. 학생이 "Walk the Graph" 버튼 클릭
2. 캐릭터가 y절편(0, 1)에서 시작
3. 캐릭터: "우리는 (0, 1)에서 출발해요. 이것은 y절편이에요."
4. 학생이 "다음" 클릭
5. 캐릭터가 오른쪽으로 이동 (1, 3)
6. 캐릭터: "x가 1 증가하면 y는 2 증가했어요. 이게 기울기 2의 의미예요!"
```

### 시나리오 2: 개념 관계 그래프 탐색
```
1. 화면에 "분수" 개념 네트워크 표시
   - 중심: "분수"
   - 연결: "분자", "분모", "통분", "약분"
2. 캐릭터가 "분수" 노드에 서 있음
3. 학생이 "분자" 노드 클릭
4. 캐릭터가 화살표를 따라 "분자" 노드로 이동
5. 캐릭터: "분자는 전체 중 선택된 부분의 개수를 나타내요."
```

## 기술 요구사항 (Technical Requirements)

### 1. 그래프 렌더링

#### 옵션 A: 함수 그래프 (Cartesian Plane)
```typescript
interface FunctionGraph {
  type: 'cartesian';
  function: (x: number) => number; // y = f(x)
  domain: [number, number]; // x 범위
  range: [number, number]; // y 범위
  gridlines: boolean;
  labels: {
    xAxis: string;
    yAxis: string;
  };
}
```

#### 옵션 B: 개념 그래프 (Concept Network)
```typescript
interface ConceptGraph {
  type: 'network';
  nodes: Array<{
    id: string;
    label: string;
    position?: { x: number; y: number }; // 자동 레이아웃도 가능
    concept: string; // "fraction", "numerator" 등
  }>;
  edges: Array<{
    from: string; // node id
    to: string;
    relationship: string; // "has-a", "part-of", "prerequisite" 등
    label?: string;
  }>;
}
```

### 2. 캐릭터 시스템

```typescript
interface Character {
  id: string;
  name: string;
  sprite: string; // URL to character image/animation
  position: { x: number; y: number }; // 현재 위치
  animations: {
    idle: string;
    walking: string;
    talking: string;
    thinking: string;
  };
}

interface CharacterController {
  moveToPosition(target: { x: number; y: number }, duration: number): Promise<void>;
  speak(message: string, options?: SpeechOptions): void;
  playAnimation(animation: keyof Character['animations']): void;
}
```

### 3. 내레이션 시스템

```typescript
interface Narration {
  id: string;
  trigger: 'position' | 'interaction' | 'time'; // 트리거 조건
  position?: { x: number; y: number }; // 위치 기반 트리거
  message: {
    ko: string; // 한국어
    en: string; // 영어
  };
  audio?: string; // 음성 파일 URL (선택사항)
  duration?: number; // 자동 진행 시간 (ms)
  choices?: Array<{
    text: { ko: string; en: string };
    nextNarrationId: string;
  }>;
}
```

### 4. 진행 상태 관리

```typescript
interface WalkProgress {
  studentId: string;
  moduleId: string;
  graphId: string;
  currentPosition: { x: number; y: number };
  visitedNodes: string[]; // 방문한 노드/위치
  completedNarrations: string[]; // 들은 설명
  progressPercentage: number; // 0-100
  startedAt: Date;
  lastUpdatedAt: Date;
}
```

## UI/UX 설계

### 화면 레이아웃

```
┌─────────────────────────────────────────────────────┐
│  Walk the Graph: 선형 함수 이해하기           [X]  │
├─────────────────────────────────────────────────────┤
│                                                     │
│     ▲                                               │
│     │                                               │
│   5 │            👤 (캐릭터)                        │
│     │           /│\                                 │
│   4 │          / │ \                                │
│     │           │                                   │
│   3 │    ●──────┼────●                              │
│     │           │   /                               │
│   2 │           │  /  [y = 2x + 1]                  │
│     │           │ /                                 │
│   1 │    START──●────────────►                      │
│     │           │                                   │
│   0 ├───────────┼───────────────►                   │
│     │           0   1   2   3   4                   │
│                                                     │
├─────────────────────────────────────────────────────┤
│  💬 캐릭터 말풍선:                                  │
│  "우리는 (0, 1)에서 출발해요.                       │
│   이것은 y절편이에요."                              │
│                                                     │
│           [이전]  [다음]  [처음부터]                │
└─────────────────────────────────────────────────────┘

Progress: ████████░░░░░░░░░░ 40%
```

### 반응형 디자인 (스마트폰)

```
┌──────────────────┐
│ Walk the Graph  │
├──────────────────┤
│                  │
│   ▲              │
│ 5 │   👤         │
│ 4 │  /│\         │
│ 3 │●─┼─●         │
│ 2 │  │/          │
│ 1 │START●─►      │
│ 0 ├──┼──────►    │
│   0 1 2 3       │
│                  │
├──────────────────┤
│ 💬 "y절편은..."  │
│                  │
│ [이전] [다음]    │
└──────────────────┘
Progress: ████░░ 40%
```

## 데이터 모델

### Database Schema

```sql
-- Walk the Graph 모듈
CREATE TABLE walk_graphs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    module_id UUID NOT NULL REFERENCES modules(id),
    title VARCHAR(200) NOT NULL,
    description TEXT,
    graph_type VARCHAR(20) NOT NULL CHECK (graph_type IN ('cartesian', 'network')),
    graph_config JSONB NOT NULL, -- FunctionGraph or ConceptGraph
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 캐릭터 설정
CREATE TABLE walk_characters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    sprite_idle VARCHAR(500),
    sprite_walking VARCHAR(500),
    sprite_talking VARCHAR(500),
    created_at TIMESTAMP DEFAULT NOW()
);

-- 내레이션 스크립트
CREATE TABLE walk_narrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    graph_id UUID NOT NULL REFERENCES walk_graphs(id),
    sequence_order INTEGER NOT NULL,
    trigger_type VARCHAR(20) NOT NULL,
    trigger_condition JSONB,
    message_ko TEXT NOT NULL,
    message_en TEXT NOT NULL,
    audio_url_ko VARCHAR(500),
    audio_url_en VARCHAR(500),
    auto_advance_delay_ms INTEGER,
    choices JSONB, -- Array of choice objects
    created_at TIMESTAMP DEFAULT NOW()
);

-- 학생 진행 상황
CREATE TABLE walk_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id),
    graph_id UUID NOT NULL REFERENCES walk_graphs(id),
    current_position JSONB NOT NULL,
    visited_nodes JSONB DEFAULT '[]'::jsonb,
    completed_narrations JSONB DEFAULT '[]'::jsonb,
    progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage BETWEEN 0 AND 100),
    started_at TIMESTAMP DEFAULT NOW(),
    last_updated_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP,
    UNIQUE(student_id, graph_id)
);

CREATE INDEX idx_walk_progress_student ON walk_progress(student_id);
CREATE INDEX idx_walk_progress_graph ON walk_progress(graph_id);
```

## 구현 계획

### Phase 1: 기본 인프라 (Week 1-2)
- [ ] React 프로젝트 구조 설정
- [ ] 그래프 렌더링 라이브러리 선택 및 테스트
- [ ] 애니메이션 라이브러리 통합
- [ ] 기본 컴포넌트 구조 설계

### Phase 2: 그래프 시각화 (Week 3-4)
- [ ] Cartesian 좌표계 구현
- [ ] 함수 그래프 렌더링
- [ ] 개념 네트워크 그래프 레이아웃
- [ ] 그리드, 축, 라벨 시스템

### Phase 3: 캐릭터 시스템 (Week 5-6)
- [ ] 캐릭터 스프라이트 통합
- [ ] 이동 애니메이션 (경로 따라가기)
- [ ] 말풍선 UI 컴포넌트
- [ ] 캐릭터 상태 관리

### Phase 4: 내레이션 엔진 (Week 7-8)
- [ ] 내레이션 데이터 구조 설계
- [ ] 트리거 시스템 (위치, 인터랙션, 타임)
- [ ] 다국어 지원 (한국어/영어)
- [ ] 선택지 분기 로직

### Phase 5: 진행 상태 관리 (Week 9-10)
- [ ] 진행 상황 저장/불러오기
- [ ] 체크포인트 시스템
- [ ] 진행률 계산
- [ ] 완료 상태 처리

### Phase 6: 통합 및 테스트 (Week 11-12)
- [ ] 백엔드 API 연동
- [ ] 반응형 디자인 구현
- [ ] 접근성 개선 (키보드 내비게이션)
- [ ] 사용자 테스트 및 피드백 수집

## 기술 스택 권장사항

### 그래프 라이브러리

| 라이브러리 | 장점 | 단점 | 추천도 |
|-----------|------|------|--------|
| **D3.js** | 강력한 커스터마이징, 수학 함수 그래프에 최적 | 학습 곡선 가파름 | ⭐⭐⭐⭐ |
| **Vis.js** | 네트워크 그래프에 강함, 간단한 API | 함수 그래프는 제한적 | ⭐⭐⭐ |
| **React Flow** | React 네이티브, 모던한 API | 수학 그래프는 커스텀 필요 | ⭐⭐⭐⭐ |
| **Recharts** | 간단한 차트에 최적 | 인터랙티브 제한적 | ⭐⭐ |

**권장**: D3.js (함수 그래프) + React Flow (개념 네트워크)

### 애니메이션 라이브러리

| 라이브러리 | 장점 | 단점 | 추천도 |
|-----------|------|------|--------|
| **Framer Motion** | React 최적화, 간단한 API | 복잡한 경로 애니메이션 제한 | ⭐⭐⭐⭐⭐ |
| **GSAP** | 강력한 타임라인, 경로 애니메이션 | 라이선스 비용 (상업용) | ⭐⭐⭐⭐ |
| **Lottie** | 디자이너 협업 용이 | 프로그래밍 제어 제한적 | ⭐⭐⭐ |
| **Three.js** | 3D 가능 | 오버킬, 복잡함 | ⭐⭐ |

**권장**: Framer Motion (주 애니메이션) + GSAP (복잡한 경로)

## 예제 코드 스니펫

### 컴포넌트 구조

```typescript
// WalkTheGraph.tsx
import React, { useState, useEffect } from 'react';
import { GraphRenderer } from './GraphRenderer';
import { Character } from './Character';
import { NarrationBox } from './NarrationBox';
import { ProgressBar } from './ProgressBar';

interface WalkTheGraphProps {
  graphConfig: FunctionGraph | ConceptGraph;
  narrations: Narration[];
  character: Character;
  studentId: string;
}

export const WalkTheGraph: React.FC<WalkTheGraphProps> = ({
  graphConfig,
  narrations,
  character,
  studentId,
}) => {
  const [currentPosition, setCurrentPosition] = useState({ x: 0, y: 0 });
  const [currentNarrationIndex, setCurrentNarrationIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  const handleNext = async () => {
    const nextNarration = narrations[currentNarrationIndex + 1];
    if (!nextNarration) return; // 완료

    // 캐릭터 이동
    if (nextNarration.position) {
      await moveCharacter(nextNarration.position);
    }

    // 내레이션 진행
    setCurrentNarrationIndex(currentNarrationIndex + 1);
    setProgress(((currentNarrationIndex + 1) / narrations.length) * 100);

    // 진행 상황 저장
    await saveProgress({
      studentId,
      currentPosition: nextNarration.position,
      completedNarrations: narrations.slice(0, currentNarrationIndex + 1).map(n => n.id),
      progressPercentage: progress,
    });
  };

  const moveCharacter = async (target: { x: number; y: number }) => {
    // 애니메이션 로직
    setCurrentPosition(target);
  };

  const saveProgress = async (progressData: any) => {
    // API 호출
  };

  return (
    <div className="walk-the-graph">
      <GraphRenderer config={graphConfig}>
        <Character
          position={currentPosition}
          sprite={character.sprite}
          animation="walking"
        />
      </GraphRenderer>

      <NarrationBox
        message={narrations[currentNarrationIndex].message.ko}
        onNext={handleNext}
        onPrevious={() => setCurrentNarrationIndex(Math.max(0, currentNarrationIndex - 1))}
        showNext={currentNarrationIndex < narrations.length - 1}
        showPrevious={currentNarrationIndex > 0}
      />

      <ProgressBar percentage={progress} />
    </div>
  );
};
```

## 오픈 질문 (Open Questions)

### 높은 우선순위
1. **그래프 타입**: 주로 어떤 그래프를 사용하나요?
   - [ ] 함수 그래프 (y = f(x))
   - [ ] 개념 관계도
   - [ ] 둘 다

2. **캐릭터 디자인**: 캐릭터는 누가 디자인하나요?
   - [ ] 개발팀에서 기본 제공
   - [ ] 디자이너 협업 필요
   - [ ] 교사가 선택 가능

3. **음성 지원**: 텍스트만? 음성도?
   - [ ] 텍스트만 (MVP)
   - [ ] 음성 녹음 지원
   - [ ] TTS (Text-to-Speech)

4. **Moodle 연동 시기**: 언제 구현하나요?
   - [ ] 지금 바로 (MVP에 포함)
   - [ ] Phase 3 (PRD 대로)

### 중간 우선순위
5. **인터랙션 방식**:
   - [ ] 자동 진행 (애니메이션 시청)
   - [ ] 학생이 클릭으로 제어
   - [ ] 선택지 기반 분기

6. **모바일 우선순위**:
   - [ ] 데스크톱 우선
   - [ ] 모바일 우선
   - [ ] 동시 개발

## 다음 단계 (Next Steps)

오픈 질문들에 답변해 주시면:
1. 상세 설계 문서 완성
2. 프로토타입 개발 시작
3. 기술 스택 최종 결정
4. 구현 일정 수립

답변을 기다리겠습니다! 🚀
