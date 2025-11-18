# 🎓 개념 트리 미니맵 - LMS 학습 도우미

LMS(Learning Management System)와 연동하여 현재 학습 중인 문제의 하위 개념 트리를 시각적으로 표시하는 독립형 웹 애플리케이션입니다.

## ✨ 주요 기능

### 1. 📊 개념 트리 시각화
- **계층적 트리 구조**: 수학 개념을 계층적 트리로 표시
- **인터랙티브 탐색**: 드래그, 줌, 패닝으로 자유롭게 탐색
- **상태 표시**: 각 개념의 학습 진도, 완료 여부, 잠김 상태를 시각적으로 표시

### 2. 🎯 문제 기반 학습
- **현재 문제 표시**: 좌측 패널에 학습 중인 문제 표시
- **관련 개념 하이라이트**: 문제와 관련된 개념들을 자동으로 하이라이트
- **다중 문제 지원**: 드롭다운으로 여러 문제 간 전환 가능

### 3. 📈 학습 진도 추적
- **진행률 표시**: 각 개념별 학습 진도를 바 형태로 표시
- **통계 대시보드**: 전체 개념 수, 완료 개념, 잠긴 개념, 평균 진도 표시
- **선수 학습 관리**: 선수 개념 미완료 시 자동으로 잠김 표시

### 4. 🔍 개념 탐색 기능
- **클릭 상호작용**: 개념 노드 클릭 시 상세 정보 표시
- **관계 하이라이트**: 선택한 개념의 선조/후손 개념 자동 하이라이트
- **미니맵**: 전체 트리 구조를 한눈에 볼 수 있는 미니맵 제공

## 🚀 시작하기

### 설치

```bash
# 의존성 설치
npm install
```

### 개발 서버 실행

```bash
# 개발 모드로 실행
npm run dev
```

브라우저에서 `http://localhost:5173/` 으로 접속

### 프로덕션 빌드

```bash
# 프로덕션 빌드
npm run build

# 빌드 결과 미리보기
npm run preview
```

## 📁 프로젝트 구조

```
concept-minimap/
├── src/
│   ├── components/          # React 컴포넌트
│   │   ├── ConceptNode.tsx      # 개념 노드 컴포넌트
│   │   ├── ConceptMinimap.tsx   # 개념 트리 미니맵
│   │   └── ProblemViewer.tsx    # 문제 뷰어
│   ├── data/                # 데이터
│   │   └── sampleData.ts        # 샘플 개념 트리 및 문제 데이터
│   ├── types/               # TypeScript 타입 정의
│   │   └── concept.ts           # 개념, 문제, LMS 데이터 타입
│   ├── utils/               # 유틸리티 함수
│   │   └── treeLayout.ts        # 트리 레이아웃 계산 함수
│   ├── App.tsx              # 메인 앱 컴포넌트
│   ├── App.css              # 앱 스타일
│   ├── index.css            # 글로벌 스타일
│   └── main.tsx             # 진입점
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## 🎨 화면 구성

### 레이아웃

```
┌─────────────────────────────────────────────────────────┐
│  헤더 (타이틀 + 문제 선택)                                  │
├──────────────────────┬──────────────────────────────────┤
│                      │                                  │
│   문제 뷰어          │      개념 트리 미니맵              │
│   (좌측 45%)         │      (우측 55%)                   │
│                      │                                  │
│  - 문제 정보         │  - 트리 시각화                    │
│  - 문제 내용         │  - 통계 패널                      │
│  - 관련 개념         │  - 범례                          │
│  - 해설              │  - 미니맵                        │
│                      │                                  │
├──────────────────────┴──────────────────────────────────┤
│  푸터 (도움말)                                            │
└─────────────────────────────────────────────────────────┘
```

### 개념 노드 색상 코드

- 🔵 **파란색 테두리**: 현재 학습 중인 개념
- 🟢 **초록색 테두리**: 완료한 개념
- 🔴 **빨간색 테두리**: 잠긴 개념 (선수 학습 필요)
- ⚪ **회색 테두리**: 일반 개념

### 난이도 표시

- 🟢 **초급 (beginner)**: 기본 개념
- 🟠 **중급 (intermediate)**: 중간 난이도
- 🔴 **고급 (advanced)**: 높은 난이도

## 💾 데이터 구조

### Concept (개념)

```typescript
interface Concept {
  id: string;                    // 개념 ID
  name: string;                  // 개념 이름
  description: string;           // 설명
  level: number;                 // 트리 깊이 (0: 루트)
  difficulty: string;            // 난이도
  prerequisites: string[];       // 선수 개념 ID 목록
  children: string[];            // 하위 개념 ID 목록
  learningProgress?: number;     // 학습 진도 (0-100)
  isLocked?: boolean;            // 잠금 상태
}
```

### Problem (문제)

```typescript
interface Problem {
  id: string;                    // 문제 ID
  title: string;                 // 제목
  description: string;           // 설명
  difficulty: string;            // 난이도
  mainConceptId: string;         // 주요 개념 ID
  relatedConceptIds: string[];   // 관련 개념 ID 목록
  content: string;               // 문제 내용
  solution?: string;             // 해설 (선택)
}
```

## 🔧 기술 스택

- **Frontend Framework**: React 19.2
- **Language**: TypeScript 5.9
- **Build Tool**: Vite 7.2
- **Visualization**: React Flow 11.11
- **State Management**: Zustand 5.0
- **Styling**: CSS (인라인 스타일 + CSS 모듈)

## 📝 샘플 데이터

현재 앱에는 **수학 분수 개념**을 중심으로 한 샘플 데이터가 포함되어 있습니다:

- **총 27개 개념**: 수학 기초부터 분수의 사칙연산까지
- **3개 샘플 문제**:
  1. 다른 분모 덧셈 문제
  2. 같은 분모 덧셈 문제
  3. 최소공배수 구하기

## 🎯 주요 인터랙션

### 개념 노드 클릭
- 클릭한 개념의 상세 정보가 팝업으로 표시됩니다
- 선조/후손 개념이 자동으로 하이라이트됩니다
- 다른 개념들은 투명하게 표시됩니다

### 배경 클릭
- 하이라이트가 초기화되어 모든 개념이 정상 표시됩니다

### 문제 변경
- 헤더의 드롭다운에서 문제를 선택하면
- 새 문제의 관련 개념들이 자동으로 하이라이트됩니다
- 개념 트리의 애니메이션이 업데이트됩니다

### 트리 탐색
- **드래그**: 마우스로 캔버스를 드래그하여 이동
- **줌**: 마우스 휠로 확대/축소
- **컨트롤**: 우측 하단의 컨트롤 버튼 사용

## 🔌 실제 LMS 연동 가이드

현재는 샘플 데이터를 사용하지만, 실제 LMS와 연동하려면:

### 1. API 엔드포인트 추가

```typescript
// src/api/lms.ts
export async function fetchCurrentProblem() {
  const response = await fetch('/api/lms/current-problem');
  return response.json();
}

export async function fetchConceptTree() {
  const response = await fetch('/api/lms/concepts');
  return response.json();
}

export async function fetchStudentProgress() {
  const response = await fetch('/api/lms/progress');
  return response.json();
}
```

### 2. App.tsx에서 데이터 로딩

```typescript
useEffect(() => {
  async function loadData() {
    const [problem, concepts, progress] = await Promise.all([
      fetchCurrentProblem(),
      fetchConceptTree(),
      fetchStudentProgress(),
    ]);

    setLmsData({
      currentProblem: problem,
      studentProgress: progress,
      completedConcepts: Object.keys(progress).filter(id => progress[id] === 100),
    });

    setConceptTree(concepts);
  }

  loadData();
}, []);
```

### 3. 실시간 업데이트 (WebSocket)

```typescript
useEffect(() => {
  const ws = new WebSocket('ws://lms-server/progress');

  ws.onmessage = (event) => {
    const update = JSON.parse(event.data);
    setLmsData(prev => ({
      ...prev,
      studentProgress: {
        ...prev.studentProgress,
        [update.conceptId]: update.progress,
      },
    }));
  };

  return () => ws.close();
}, []);
```

## 🎨 커스터마이징

### 색상 테마 변경

`src/components/ConceptNode.tsx`의 `getBorderColor()`, `getBackgroundColor()` 함수에서 색상을 변경할 수 있습니다.

### 트리 레이아웃 조정

`src/utils/treeLayout.ts`의 `levelHeight`, `nodeWidth` 값을 조정하여 노드 간격을 변경할 수 있습니다.

### 샘플 데이터 수정

`src/data/sampleData.ts`에서 개념과 문제 데이터를 자유롭게 수정할 수 있습니다.

## 📄 라이선스

MIT License

## 🤝 기여

이슈와 풀 리퀘스트를 환영합니다!

---

**Made with ❤️ for better learning experience**
