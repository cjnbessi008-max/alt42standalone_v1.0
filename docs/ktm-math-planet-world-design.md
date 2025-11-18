# KTM Math Planet: 통합 World 설계

## 1. 개념 개요 (Concept Overview)

### 핵심 아이디어
**KTM Math Planet**은 KAIST Touch Math의 AI 교육 시스템 파이프라인을 우주 행성 여행 경험으로 재구성한 통합 world입니다. 선생님들은 우주선 선장이 되어 6개의 행성을 순차적으로 방문하며, 각 행성에서 교육 모듈의 다른 부분을 완성해 나갑니다.

### 설계 철학
- **직관적 진행**: 행성 간 여행 메타포로 복잡한 파이프라인을 쉽게 이해
- **시각적 피드백**: 각 단계의 진행 상황을 우주선의 건설 과정으로 표현
- **몰입감**: 교육적이면서도 즐거운 모듈 생성 경험
- **명확한 구조**: 6단계 파이프라인을 6개 행성으로 1:1 매핑

---

## 2. KTM Math Planet 우주 시스템

### 2.1 우주 지도 (Universe Map)

```
                    ☀️ KTM Math Sun (중앙)
                         |
        ┌────────────────┼────────────────┐
        │                │                │
    🌍 Planet 1      🌍 Planet 3      🌍 Planet 5
    Discovery        Data              Creation
        │                │                │
        │                │                │
    🌍 Planet 2      🌍 Planet 4      🌍 Planet 6
    Logic            Interface         Launch
```

### 2.2 행성 시스템 아키텍처

| 행성 번호 | 행성 이름 | 파이프라인 단계 | 색상 테마 | 아이콘 |
|----------|----------|----------------|----------|--------|
| Planet 1 | **Discovery Planet** (발견의 행성) | World Model Reconstruction | 🔵 Blue (탐험) | 🔭 |
| Planet 2 | **Logic Planet** (논리의 행성) | Rule Generation Engine | 🟣 Purple (지성) | 🧮 |
| Planet 3 | **Data Planet** (데이터의 행성) | Data Management | 🟢 Green (성장) | 💾 |
| Planet 4 | **Interface Planet** (상호작용의 행성) | Input Strategy Design | 🟡 Yellow (연결) | 🎮 |
| Planet 5 | **Creation Planet** (창조의 행성) | UI Auto-Generation | 🟠 Orange (창의) | 🎨 |
| Planet 6 | **Launch Planet** (발사의 행성) | Deployment | 🔴 Red (힘) | 🚀 |

---

## 3. 행성 상세 설계

### 3.1 Planet 1: Discovery Planet 🔭 (발견의 행성)

**파이프라인 단계**: World Model Reconstruction (세계관 재구성)

**행성 특징**:
- 미지의 땅을 탐험하는 모험가의 행성
- 안개에 덮인 미스터리한 지형
- 선생님의 자연어 요청을 이해하고 개념을 발견

**주요 활동**:
1. **자연어 입력**: 선생님이 원하는 교육 모듈을 한국어/영어로 설명
2. **AI 탐험**: Claude가 요청을 분석하고 핵심 개념 추출
3. **개념 지도 생성**: 수학 개념들 간의 관계를 시각화
4. **명확화 질문**: AI가 불명확한 부분에 대해 질문

**UI 요소**:
```
┌─────────────────────────────────────────┐
│  🔭 Discovery Planet                     │
│                                          │
│  📝 교육 모듈을 설명해주세요:             │
│  ┌────────────────────────────────────┐ │
│  │ 3학년 학생들을 위한 분수 학습...    │ │
│  │                                    │ │
│  └────────────────────────────────────┘ │
│                                          │
│  🤖 AI가 발견한 개념들:                  │
│  ┌────────────────────────────────────┐ │
│  │  [분수] ──has-a──> [분자]          │ │
│  │     │                              │ │
│  │     └──has-a──> [분모]             │ │
│  │  [피자] ──represents──> [분수]      │ │
│  └────────────────────────────────────┘ │
│                                          │
│  [❓ 질문 있어요] [✅ 다음 행성으로] │
└─────────────────────────────────────────┘
```

**완료 조건**:
- 도메인 모델 생성 완료
- 모든 명확화 질문에 답변 완료
- 개념 그래프가 유효하게 구성됨

---

### 3.2 Planet 2: Logic Planet 🧮 (논리의 행성)

**파이프라인 단계**: Rule Generation Engine (룰 자동 생성)

**행성 특징**:
- 논리와 규칙이 지배하는 질서정연한 행성
- 크리스탈 구조물과 회로 패턴
- 교육 규칙을 코드로 변환

**주요 활동**:
1. **규칙 식별**: World Model에서 비즈니스 룰 추출
2. **복잡도 분석**: 규칙의 복잡도 평가
3. **코드 생성**: 규칙을 Python/JavaScript 코드로 변환
4. **온톨로지 변환**: 복잡한 규칙은 OWL/RDF로 변환

**UI 요소**:
```
┌─────────────────────────────────────────┐
│  🧮 Logic Planet                         │
│                                          │
│  📋 발견된 규칙들:                        │
│  ┌────────────────────────────────────┐ │
│  │ ✅ Rule 1: 분모는 0이 될 수 없음   │ │
│  │    복잡도: 낮음 ████░░░░░░ 40%      │ │
│  │    → JavaScript 함수 생성됨         │ │
│  │                                    │ │
│  │ ⚠️  Rule 2: 분수 덧셈 (다른 분모)  │ │
│  │    복잡도: 높음 ████████░░ 80%      │ │
│  │    → 온톨로지 변환 권장             │ │
│  └────────────────────────────────────┘ │
│                                          │
│  🧪 생성된 코드 미리보기:                │
│  [코드 보기] [테스트 실행]              │
│                                          │
│  [⬅️ 이전] [✅ 다음 행성으로]         │
└─────────────────────────────────────────┘
```

**완료 조건**:
- 모든 비즈니스 룰이 식별됨
- 규칙 코드가 생성되고 테스트 통과
- 복잡한 규칙은 온톨로지로 변환됨

---

### 3.3 Planet 3: Data Planet 💾 (데이터의 행성)

**파이프라인 단계**: Data Management (데이터 검증 및 생성)

**행성 특징**:
- 데이터 크리스탈이 자라는 디지털 정원
- 데이터베이스 스키마가 건축물로 표현됨
- 실제 데이터와 가상 데이터가 공존

**주요 활동**:
1. **스키마 설계**: PostgreSQL 데이터베이스 스키마 자동 생성
2. **데이터 검증**: 기존 데이터 가용성 확인
3. **가상 데이터 생성**: 부족한 데이터는 AI가 realistic pseudo data 생성
4. **데이터베이스 생성**: 스키마 적용 및 초기 데이터 시딩

**UI 요소**:
```
┌─────────────────────────────────────────┐
│  💾 Data Planet                          │
│                                          │
│  🏗️ 데이터베이스 스키마:                 │
│  ┌────────────────────────────────────┐ │
│  │ 📊 fraction_problems                │ │
│  │    - id (UUID)                     │ │
│  │    - numerator_1 (INTEGER)         │ │
│  │    - denominator_1 (INTEGER)       │ │
│  │    - problem_type (VARCHAR)        │ │
│  │                                    │ │
│  │ 📊 student_attempts                 │ │
│  │    - student_id (UUID)             │ │
│  │    - problem_id (UUID)             │ │
│  │    - is_correct (BOOLEAN)          │ │
│  └────────────────────────────────────┘ │
│                                          │
│  💎 데이터 상태:                         │
│  실제 데이터: ▓▓░░░░░░░░ 20%            │
│  가상 데이터: ▓▓▓▓▓▓▓▓░░ 80%            │
│                                          │
│  [📥 데이터 미리보기] [✅ 다음 행성으로] │
└─────────────────────────────────────────┘
```

**완료 조건**:
- 데이터베이스 스키마 생성 완료
- 필요한 데이터가 준비됨 (실제 + 가상)
- 스키마 무결성 검증 통과

---

### 3.4 Planet 4: Interface Planet 🎮 (상호작용의 행성)

**파이프라인 단계**: Input Strategy Design (입력 전략 설계)

**행성 특징**:
- 다양한 인터페이스가 떠다니는 interactive 행성
- 터치, 클릭, 드래그 등 상호작용 방식을 실험
- 학생 입력 방법을 최적화

**주요 활동**:
1. **입력 방법 결정**: 각 데이터에 적합한 입력 방식 선택
   - 수동 입력 (텍스트, 숫자, 선택)
   - 행동 추적 (클릭 패턴, 소요 시간)
   - 대화형 프롬프트 (AI 가이드)
2. **검증 전략**: 실시간 피드백 및 오류 메시지
3. **데이터 흐름 매핑**: 수집된 데이터가 시스템을 통과하는 경로

**UI 요소**:
```
┌─────────────────────────────────────────┐
│  🎮 Interface Planet                     │
│                                          │
│  🎯 입력 전략 설계:                       │
│  ┌────────────────────────────────────┐ │
│  │ 데이터: 분수 답안                   │ │
│  │ 방법: [📝 수동입력] [🖱️ 드래그]   │ │
│  │ 추천: 🌟 드래그 & 드롭 인터페이스  │ │
│  │ 이유: 시각적 학습 효과 증대         │ │
│  │                                    │ │
│  │ 데이터: 학습 시간                   │ │
│  │ 방법: [⏱️ 자동추적]                │ │
│  │ 추천: 🌟 백그라운드 타이머          │ │
│  └────────────────────────────────────┘ │
│                                          │
│  🧪 입력 방식 시뮬레이션:                │
│  [▶️ 미리보기] [✅ 다음 행성으로]      │
└─────────────────────────────────────────┘
```

**완료 조건**:
- 모든 입력 포인트에 대해 방법 결정됨
- 검증 규칙이 정의됨
- 데이터 흐름이 매핑됨

---

### 3.5 Planet 5: Creation Planet 🎨 (창조의 행성)

**파이프라인 단계**: UI Auto-Generation (UI 자동 생성)

**행성 특징**:
- 예술가와 건축가의 행성
- UI 컴포넌트가 실시간으로 조립됨
- React 컴포넌트가 3D 건축물로 시각화

**주요 활동**:
1. **UI 재사용 평가**: 기존 컴포넌트 활용 가능성 검토
2. **UX 여정 분석**: 학생의 학습 경로 매핑
3. **컴포넌트 생성**: React 컴포넌트 자동 생성
4. **스타일링 적용**: 디자인 시스템에 맞춘 스타일
5. **접근성 구현**: WCAG 2.1 AA 준수

**UI 요소**:
```
┌─────────────────────────────────────────┐
│  🎨 Creation Planet                      │
│                                          │
│  🏗️ UI 컴포넌트 생성 중:                 │
│  ┌────────────────────────────────────┐ │
│  │ ✅ FractionVisualizer               │ │
│  │    └─ 피자 그래픽 렌더링 완료       │ │
│  │                                    │ │
│  │ 🔄 FractionInputForm                │ │
│  │    └─ 컴포넌트 생성 중... 75%       │ │
│  │                                    │ │
│  │ ⏳ ProgressTracker                  │ │
│  │    └─ 대기 중...                   │ │
│  └────────────────────────────────────┘ │
│                                          │
│  👁️ 실시간 미리보기:                    │
│  ┌────────────────────────────────────┐ │
│  │   [생성된 UI가 여기 표시됨]         │ │
│  └────────────────────────────────────┘ │
│                                          │
│  [🔄 재생성] [✅ 다음 행성으로]        │
└─────────────────────────────────────────┘
```

**완료 조건**:
- 모든 필요한 UI 컴포넌트 생성됨
- 반응형 디자인 적용됨
- 접근성 요구사항 충족
- 미리보기 테스트 통과

---

### 3.6 Planet 6: Launch Planet 🚀 (발사의 행성)

**파이프라인 단계**: Deployment (시스템 완성)

**행성 특징**:
- 우주 발사대가 있는 하이테크 행성
- 로켓이 조립되고 발사 준비
- 최종 배포 및 테스트

**주요 활동**:
1. **API 생성**: RESTful 엔드포인트 자동 생성
2. **통합 테스트**: End-to-end 워크플로우 검증
3. **Docker 패키징**: 컨테이너 이미지 생성
4. **배포**: 프로덕션 환경에 배포
5. **문서 생성**: 사용자 및 기술 문서 자동 생성

**UI 요소**:
```
┌─────────────────────────────────────────┐
│  🚀 Launch Planet                        │
│                                          │
│  🎯 발사 준비 체크리스트:                 │
│  ┌────────────────────────────────────┐ │
│  │ ✅ API 엔드포인트 생성               │ │
│  │ ✅ 통합 테스트 통과                  │ │
│  │ ✅ Docker 이미지 빌드                │ │
│  │ 🔄 프로덕션 배포 중... 85%           │ │
│  │ ⏳ 문서 생성 대기중...              │ │
│  └────────────────────────────────────┘ │
│                                          │
│  🚀 로켓 상태:                           │
│  ┌────────────────────────────────────┐ │
│  │        🚀                           │ │
│  │        ║║                          │ │
│  │       ╔╩╩╗                         │ │
│  │       ╚══╝                         │ │
│  │    발사 준비 완료!                  │ │
│  └────────────────────────────────────┘ │
│                                          │
│  [📚 문서보기] [🚀 모듈 배포하기]      │
└─────────────────────────────────────────┘
```

**완료 조건**:
- 모든 테스트 통과
- 배포 성공
- 문서 생성 완료
- 모듈이 학생들에게 접근 가능

---

## 4. 사용자 여정 (User Journey)

### 4.1 전체 여정 플로우

```
선생님의 여정:

[시작] 우주선 탑승
   ↓
[Planet 1] 교육 모듈 설명 입력 → AI가 개념 발견
   ↓
[Planet 2] AI가 규칙 생성 → 선생님 검토 및 승인
   ↓
[Planet 3] 데이터베이스 자동 구축 → 데이터 확인
   ↓
[Planet 4] 입력 방식 제안 → 선생님 선택
   ↓
[Planet 5] UI 자동 생성 → 미리보기 및 수정
   ↓
[Planet 6] 최종 배포 → 학생들 사용 시작
   ↓
[완료] 우주선 도착! 🎉
```

### 4.2 우주선 진행률 표시

전체 화면 상단에 항상 표시되는 우주선 진행률:

```
┌─────────────────────────────────────────────────────────────┐
│ 🚀 Module: "분수 학습 모듈"                                  │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━│
│ 🔭──✅──🧮──✅──💾──⏳──🎮──○──🎨──○──🚀──○                │
│ Discovery Logic  Data  Interface Creation Launch             │
│                                                              │
│ 현재 위치: Planet 3 (Data Planet) - 50% 완료                 │
└─────────────────────────────────────────────────────────────┘
```

### 4.3 인터랙션 패턴

**행성 선택**:
- 현재 행성: 활성화 + 애니메이션
- 완료된 행성: 체크마크 + 재방문 가능
- 미래 행성: 잠금 + 회색 처리

**피드백 메커니즘**:
- AI 작업 중: 로딩 애니메이션 + 진행률 바
- 작업 완료: 성공 애니메이션 + 사운드 (선택적)
- 오류 발생: 명확한 오류 메시지 + 수정 제안

**저장 및 복원**:
- 자동 저장: 각 단계 완료 시 자동 저장
- 세션 복원: 언제든지 중단하고 나중에 이어서 작업 가능

---

## 5. UI/UX 상세 설계

### 5.1 메인 우주 지도 화면 (Universe Map View)

```
┌──────────────────────────────────────────────────────────────┐
│  KTM Math Planet                    👤 김수학 선생님  🔔 ⚙️  │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│                        ☀️ KTM Math Sun                        │
│                                                               │
│         🔵 Planet 1           🟢 Planet 3          🟠 Planet 5 │
│         Discovery             Data                Creation    │
│           (✅)                 (⏳)                  (🔒)      │
│                                                               │
│                                                               │
│         🟣 Planet 2           🟡 Planet 4          🔴 Planet 6 │
│         Logic                Interface             Launch     │
│           (✅)                 (🔒)                 (🔒)       │
│                                                               │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━│
│  🚀 우주선 건설 진행률: ▓▓▓▓▓░░░░░ 50%                       │
│  현재 위치: 🟢 Data Planet                                    │
│                                                               │
│  [🔭 현재 행성으로] [📋 모듈 목록] [➕ 새 모듈 만들기]       │
└──────────────────────────────────────────────────────────────┘
```

### 5.2 행성 작업 화면 레이아웃 (Planet Work View)

```
┌──────────────────────────────────────────────────────────────┐
│  [🏠 우주 지도] > 🟢 Data Planet                              │
├──────────────────────────────────────────────────────────────┤
│  ┌────────────────┐  ┌─────────────────────────────────────┐ │
│  │ 🎯 단계 안내    │  │                                     │ │
│  │                │  │     [행성별 주요 작업 영역]          │ │
│  │ 1. 스키마 설계 │  │                                     │ │
│  │ 2. 데이터 검증 │  │                                     │ │
│  │ 3. 가상 데이터 │  │                                     │ │
│  │ 4. DB 생성     │  │                                     │ │
│  │                │  │                                     │ │
│  │ 🤖 AI 도우미   │  │                                     │ │
│  │ [💬 질문하기]  │  │                                     │ │
│  └────────────────┘  └─────────────────────────────────────┘ │
│                                                               │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━│
│  행성 진행률: ▓▓▓▓▓▓▓░░░ 75%                                 │
│  [⬅️ 이전 행성] [✅ 다음 행성으로] [💾 저장]              │
└──────────────────────────────────────────────────────────────┘
```

### 5.3 반응형 디자인 (모바일 대응)

**데스크톱**: 좌우 분할 레이아웃
- 왼쪽: 안내 및 컨트롤
- 오른쪽: 주요 작업 영역

**태블릿**: 상하 스크롤 레이아웃
- 상단: 행성 정보
- 하단: 작업 영역

**모바일**: 단일 컬럼 스크롤
- 컴팩트한 행성 아이콘
- 스와이프 제스처로 행성 간 이동

---

## 6. 기술 구현 방향

### 6.1 프론트엔드 아키텍처

```typescript
// 프로젝트 구조
src/
├── components/
│   ├── universe/
│   │   ├── UniverseMap.tsx          // 우주 지도 메인 화면
│   │   ├── PlanetOrbit.tsx          // 행성 궤도 애니메이션
│   │   └── Spaceship.tsx            // 우주선 진행률 표시
│   ├── planets/
│   │   ├── Planet1_Discovery/
│   │   │   ├── DiscoveryPlanet.tsx
│   │   │   ├── ConceptMap.tsx
│   │   │   └── NLPInput.tsx
│   │   ├── Planet2_Logic/
│   │   │   ├── LogicPlanet.tsx
│   │   │   ├── RuleList.tsx
│   │   │   └── ComplexityAnalyzer.tsx
│   │   ├── Planet3_Data/
│   │   │   ├── DataPlanet.tsx
│   │   │   ├── SchemaVisualizer.tsx
│   │   │   └── DataGenerator.tsx
│   │   ├── Planet4_Interface/
│   │   │   ├── InterfacePlanet.tsx
│   │   │   ├── InputMethodSelector.tsx
│   │   │   └── InteractionSimulator.tsx
│   │   ├── Planet5_Creation/
│   │   │   ├── CreationPlanet.tsx
│   │   │   ├── ComponentBuilder.tsx
│   │   │   └── UIPreview.tsx
│   │   └── Planet6_Launch/
│   │       ├── LaunchPlanet.tsx
│   │       ├── DeploymentChecklist.tsx
│   │       └── RocketAnimation.tsx
│   ├── shared/
│   │   ├── PlanetContainer.tsx      // 공통 행성 레이아웃
│   │   ├── ProgressBar.tsx          // 진행률 컴포넌트
│   │   └── AIAssistant.tsx          // AI 도우미 채팅
│   └── layout/
│       ├── Header.tsx
│       ├── Navigation.tsx
│       └── Footer.tsx
├── store/
│   ├── universeSlice.ts             // 우주 지도 상태
│   ├── journeySlice.ts              // 여정 진행 상태
│   └── moduleSlice.ts               // 모듈 데이터
├── services/
│   ├── pipelineAPI.ts               // 백엔드 파이프라인 API
│   ├── claudeAPI.ts                 // Claude AI 통신
│   └── websocket.ts                 // 실시간 업데이트
├── hooks/
│   ├── usePlanetNavigation.ts       // 행성 간 이동 로직
│   ├── usePipelineProgress.ts       // 파이프라인 진행 추적
│   └── useAutoSave.ts               // 자동 저장
└── types/
    ├── planets.ts                   // 행성 타입 정의
    ├── pipeline.ts                  // 파이프라인 타입
    └── module.ts                    // 모듈 타입
```

### 6.2 상태 관리 (Redux Toolkit)

```typescript
// store/journeySlice.ts
interface JourneyState {
  currentPlanet: number;              // 1-6
  completedPlanets: number[];         // [1, 2]
  moduleId: string;
  progress: {
    planet1: { status: 'completed', data: {...} },
    planet2: { status: 'completed', data: {...} },
    planet3: { status: 'in_progress', data: {...} },
    planet4: { status: 'locked', data: null },
    planet5: { status: 'locked', data: null },
    planet6: { status: 'locked', data: null }
  };
  overallProgress: number;            // 0-100
}
```

### 6.3 백엔드 통합

```typescript
// services/pipelineAPI.ts
export const pipelineAPI = {
  // Planet 1: World Model
  submitTeacherRequest: (request: string) =>
    POST('/api/pipeline/world-model', { request }),

  getConceptMap: (jobId: string) =>
    GET(`/api/pipeline/world-model/${jobId}`),

  // Planet 2: Rules
  generateRules: (worldModel: WorldModel) =>
    POST('/api/pipeline/rules', { worldModel }),

  // Planet 3: Data
  generateSchema: (rules: Rule[]) =>
    POST('/api/pipeline/schema', { rules }),

  // Planet 4: Input Strategy
  designInputStrategy: (schema: Schema) =>
    POST('/api/pipeline/input-strategy', { schema }),

  // Planet 5: UI Generation
  generateUI: (inputStrategy: InputStrategy) =>
    POST('/api/pipeline/ui-generation', { inputStrategy }),

  // Planet 6: Deployment
  deployModule: (moduleData: ModuleData) =>
    POST('/api/pipeline/deploy', { moduleData })
};
```

### 6.4 실시간 업데이트 (WebSocket)

```typescript
// services/websocket.ts
const socket = io('ws://api.ktmplanet.com');

socket.on('pipeline:progress', (data) => {
  // 파이프라인 진행률 업데이트
  dispatch(updateProgress(data));
});

socket.on('planet:completed', (planetNumber) => {
  // 행성 완료 애니메이션
  triggerCompletionAnimation(planetNumber);
});

socket.on('ai:thinking', (message) => {
  // AI 작업 중 상태 표시
  showAIThinkingState(message);
});
```

### 6.5 애니메이션 및 인터랙션 (Framer Motion)

```typescript
// components/planets/PlanetOrbit.tsx
import { motion } from 'framer-motion';

export const PlanetOrbit: React.FC<PlanetOrbitProps> = ({
  planetNumber,
  isActive,
  isCompleted,
  isLocked
}) => {
  return (
    <motion.div
      className="planet-orbit"
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{
        scale: isActive ? 1.2 : 1,
        opacity: 1
      }}
      whileHover={{ scale: isLocked ? 1 : 1.1 }}
      transition={{ duration: 0.3 }}
    >
      <Planet
        number={planetNumber}
        status={isCompleted ? 'completed' : isActive ? 'active' : 'locked'}
      />
    </motion.div>
  );
};
```

---

## 7. 추가 기능 및 개선사항

### 7.1 교육적 요소

**우주 배지 시스템**:
- 첫 모듈 완성: "🏆 First Explorer"
- 5개 모듈 완성: "🌟 Planet Master"
- 복잡한 모듈 완성: "🧠 Logic Genius"

**도움말 시스템**:
- 각 행성마다 인터랙티브 튜토리얼
- AI 도우미 캐릭터 (예: "Astro", 우주 가이드)
- 컨텍스트 기반 도움말 팝업

### 7.2 협업 기능 (Phase 2)

**공동 작업**:
- 여러 선생님이 하나의 모듈을 함께 제작
- 실시간 공동 편집 (Google Docs 스타일)
- 댓글 및 피드백 시스템

**모듈 공유**:
- 완성된 모듈을 다른 선생님과 공유
- 템플릿 마켓플레이스 (인기 모듈 복제)

### 7.3 분석 및 인사이트

**모듈 성과 대시보드**:
- 학생 완료율
- 평균 학습 시간
- 정답률 분석
- A/B 테스트 결과

**AI 제안**:
- "이 모듈은 4학년 학생들에게 어려울 수 있습니다"
- "시각적 요소를 추가하면 참여도가 30% 증가할 것으로 예상됩니다"

---

## 8. 마일스톤 및 개발 로드맵

### Phase 1: 핵심 행성 시스템 (4주)
- [ ] 우주 지도 UI 구현
- [ ] Planet 1 (Discovery) 구현
- [ ] Planet 2 (Logic) 구현
- [ ] 기본 네비게이션 및 상태 관리

### Phase 2: 데이터 및 인터페이스 (4주)
- [ ] Planet 3 (Data) 구현
- [ ] Planet 4 (Interface) 구현
- [ ] 백엔드 파이프라인 통합

### Phase 3: 생성 및 배포 (4주)
- [ ] Planet 5 (Creation) 구현
- [ ] Planet 6 (Launch) 구현
- [ ] End-to-end 테스트

### Phase 4: 폴리싱 및 최적화 (2주)
- [ ] 애니메이션 개선
- [ ] 성능 최적화
- [ ] 접근성 향상
- [ ] 사용자 테스트 및 피드백 반영

---

## 9. 성공 지표

### 사용자 경험 지표:
- **평균 모듈 생성 시간**: < 2시간 (목표: 1.5시간)
- **사용자 만족도**: NPS > 50
- **행성별 완료율**: > 90% (사용자가 중도 포기하지 않음)

### 기술 지표:
- **페이지 로드 시간**: < 2초
- **API 응답 시간**: < 500ms (실시간 업데이트)
- **오류율**: < 1%

### 교육적 효과:
- **선생님 생산성**: 80% 향상
- **모듈 품질**: 85% 이상 minimal adjustment
- **학생 학습 결과**: 기존 모듈 대비 동등 이상

---

## 10. 결론

**KTM Math Planet**은 복잡한 AI 파이프라인을 직관적이고 즐거운 행성 여행 경험으로 변환하여, 선생님들이 기술적 장벽 없이 혁신적인 교육 모듈을 만들 수 있도록 합니다.

### 핵심 가치:
1. **직관성**: 복잡한 기술을 우주 여행 메타포로 단순화
2. **즐거움**: 교육적이면서도 engaging한 사용자 경험
3. **효율성**: 6단계 파이프라인을 명확하게 시각화
4. **자율성**: 선생님이 전체 과정을 통제하고 이해

이 통합 world는 KAIST Touch Math의 AI 교육 시스템을 차별화하고, 선생님들에게 미래지향적이고 혁신적인 도구를 제공합니다.

---

**문서 정보**:
- 버전: 1.0.0
- 작성일: 2025-11-18
- 작성자: Claude AI
- 상태: 설계 완료, 구현 준비
