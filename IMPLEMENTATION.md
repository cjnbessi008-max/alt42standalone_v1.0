# Implementation Guide: LMS 문제 한 줄 압축 표시

## 구현 개요

LMS 문제를 한 줄로 초압축하여 표시하는 기능을 구현했습니다.

## 핵심 기능

### 1. 문제 압축 알고리즘 (`frontend/src/utils/problemCompressor.ts`)

문제 데이터를 다음 형식으로 압축:
```
[TYPE] Subject • Lv.X • Title (max 50 chars)
```

**압축 로직:**
```typescript
function compressProblem(problem: Problem): CompressedProblem {
  const typeIcon = getProblemTypeIcon(problem.type);  // [FR], [MC], etc.
  const difficultyLevel = `Lv.${problem.difficulty}`; // Lv.1 ~ Lv.5
  const truncatedTitle = problem.title.length > 50
    ? problem.title.substring(0, 47) + '...'
    : problem.title;

  const compressed = `${typeIcon} ${problem.subject} • ${difficultyLevel} • ${truncatedTitle}`;

  return { id: problem.id, compressed, original: problem };
}
```

### 2. 압축 표시 컴포넌트 (`CompressedProblemList.tsx`)

**주요 기능:**
- 문제 목록을 한 줄씩 표시
- 클릭 시 상세 정보 토글
- 새로고침 버튼
- 로딩/에러 상태 처리
- 반응형 디자인

**사용 예시:**
```tsx
<CompressedProblemList moduleId="demo-module-001" limit={100} />
```

### 3. API 서비스 (`frontend/src/services/problemService.ts`)

백엔드 API와 통신하여 문제 데이터 가져오기:

```typescript
// 문제 목록 가져오기
const problems = await fetchProblems(moduleId, limit);

// 단일 문제 가져오기
const problem = await fetchProblemById(moduleId, problemId);

// 답안 제출
const result = await submitAnswer(moduleId, problemId, answer);
```

### 4. 백엔드 API (`backend/api/`)

**엔드포인트:**
- `GET /api/modules/:moduleId/problems` - 문제 목록
- `GET /api/modules/:moduleId/problems/:problemId` - 단일 문제
- `POST /api/modules/:moduleId/submit` - 답안 제출
- `GET /api/modules/:moduleId/status` - 모듈 상태

**Mock 데이터 생성:**
- 7가지 문제 유형 (fraction, multiple-choice, calculation, etc.)
- 7개 과목 (Mathematics, Physics, Chemistry, etc.)
- 5단계 난이도
- 동적 문제 데이터 생성

## 압축 형식 예시

### Before (압축 전)
```json
{
  "id": "demo-module-001-problem-0001",
  "type": "fraction",
  "subject": "Mathematics",
  "difficulty": 1,
  "title": "Add two fractions with different denominators",
  "description": "Given two fractions, find their sum and simplify the result.",
  "data": { "numerator1": 3, "denominator1": 4, "numerator2": 1, "denominator2": 2 }
}
```

### After (압축 후)
```
[FR] Mathematics • Lv.1 • Add two fractions with different denominators
```

**압축 효과:**
- 6줄 → 1줄 (83% 공간 절약)
- 핵심 정보만 한눈에 파악
- 필요시 클릭으로 전체 정보 확인

## UI/UX 특징

### 1. 한 줄 표시
- 인덱스 번호 + 압축된 문제 정보
- 마우스 오버 시 툴팁으로 메타데이터 표시
- 선택된 항목 하이라이트

### 2. 상세 정보 토글
```
1. [FR] Mathematics • Lv.1 • Add two fractions...
   ┗━━ ID: demo-module-001-problem-0001
       Description: Given two fractions, find their sum...
       Data: { numerator1: 3, denominator1: 4, ... }
```

### 3. 색상 코딩
- 기본: 회색 배경 (#f8f9fa)
- 호버: 밝은 회색 (#e9ecef) + 파란 테두리
- 선택: 하늘색 배경 (#e7f3ff) + 그림자 효과

### 4. 반응형
- 데스크톱: 전체 기능
- 태블릿: 중간 크기
- 모바일: 작은 폰트, 세로 레이아웃

## 성능 최적화

### 1. 캐싱
- Backend: Mock 데이터 캐싱 (Map 사용)
- Frontend: API 응답 캐싱 (향후 React Query 추가 가능)

### 2. 압축 알고리즘
- O(1) 시간 복잡도
- 메모리 효율적 (원본 데이터 참조)

### 3. 렌더링 최적화
- CSS 트랜지션 최소화
- 가상 스크롤링 준비 (향후)

## 확장 가능성

### 1. 필터링
```typescript
// 난이도별 필터
const filtered = problems.filter(p => p.original.difficulty >= 3);

// 과목별 필터
const mathProblems = problems.filter(p => p.original.subject === 'Mathematics');

// 타입별 필터
const fractionProblems = problems.filter(p => p.original.type === 'fraction');
```

### 2. 정렬
```typescript
// 난이도순
problems.sort((a, b) => a.original.difficulty - b.original.difficulty);

// 과목순
problems.sort((a, b) => a.original.subject.localeCompare(b.original.subject));
```

### 3. 검색
```typescript
// 제목 검색
const searchResults = problems.filter(p =>
  p.original.title.toLowerCase().includes(searchTerm.toLowerCase())
);
```

### 4. 커스텀 압축 형식
```typescript
// 사용자 정의 압축 형식
function customCompress(problem: Problem, format: string): string {
  return format
    .replace('{type}', getProblemTypeIcon(problem.type))
    .replace('{subject}', problem.subject)
    .replace('{level}', `Lv.${problem.difficulty}`)
    .replace('{title}', problem.title);
}

// 사용 예시
customCompress(problem, '{type} {level} - {title}');
// Output: [FR] Lv.1 - Add two fractions...
```

## 통합 방법

### LMS와 통합하기

1. **API 엔드포인트 변경**
   ```typescript
   // frontend/src/services/problemService.ts
   const API_BASE_URL = 'https://your-lms-api.com/api';
   ```

2. **데이터 모델 조정**
   ```typescript
   // LMS 데이터 구조에 맞춰 Problem interface 수정
   interface Problem {
     id: string;
     type: string;
     subject: string;
     difficulty: number;
     title: string;
     description: string;
     // LMS 특화 필드 추가
     lmsId?: string;
     courseId?: string;
     moduleId?: string;
   }
   ```

3. **인증 추가**
   ```typescript
   // API 요청에 토큰 추가
   const response = await axios.get(url, {
     headers: {
       'Authorization': `Bearer ${token}`
     }
   });
   ```

## 테스트

### 수동 테스트
1. Backend 서버 시작: `cd backend && npm run dev`
2. Frontend 서버 시작: `cd frontend && npm run dev`
3. 브라우저에서 `http://localhost:5173` 접속
4. 문제 목록이 압축 형식으로 표시되는지 확인
5. 문제 클릭 시 상세 정보 토글 확인
6. 새로고침 버튼 동작 확인

### API 테스트
```bash
# 문제 목록 가져오기
curl http://localhost:3000/api/modules/demo-module-001/problems?limit=10

# 단일 문제 가져오기
curl http://localhost:3000/api/modules/demo-module-001/problems/demo-module-001-problem-0001

# 답안 제출
curl -X POST http://localhost:3000/api/modules/demo-module-001/submit \
  -H "Content-Type: application/json" \
  -d '{"problemId":"demo-module-001-problem-0001","answer":{"numerator":5,"denominator":4}}'
```

## 향후 개선 사항

1. **필터 및 검색 UI 추가**
2. **페이지네이션 구현**
3. **가상 스크롤링** (1000개 이상 문제 처리)
4. **실시간 업데이트** (WebSocket)
5. **오프라인 지원** (Service Worker)
6. **접근성 개선** (ARIA 레이블, 키보드 네비게이션)
7. **다국어 지원** (i18n)
8. **테마 커스터마이제이션**

## 기술 스택 요약

| Layer | Technology |
|-------|-----------|
| Frontend Framework | React 18 + TypeScript |
| Build Tool | Vite |
| HTTP Client | Axios |
| Styling | CSS3 |
| Backend Framework | Express.js |
| Runtime | Node.js |
| API Style | RESTful |

## 파일 구조 요약

```
alt42standalone_v1.0/
├── frontend/
│   ├── src/
│   │   ├── components/ProblemDisplay/
│   │   │   ├── CompressedProblemList.tsx    ← 핵심 컴포넌트
│   │   │   └── CompressedProblemList.css
│   │   ├── services/
│   │   │   └── problemService.ts            ← API 통신
│   │   ├── utils/
│   │   │   └── problemCompressor.ts         ← 압축 알고리즘
│   │   ├── App.tsx
│   │   └── main.tsx
│   └── package.json
│
└── backend/
    ├── api/
    │   ├── routes/
    │   │   └── problems.js                  ← API 라우트
    │   ├── utils/
    │   │   └── mockData.js                  ← Mock 데이터
    │   └── server.js                        ← Express 서버
    └── package.json
```
