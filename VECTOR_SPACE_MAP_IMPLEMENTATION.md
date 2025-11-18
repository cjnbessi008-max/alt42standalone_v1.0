# Vector Space Map Implementation Guide

## 프로젝트 개요

이 프로젝트는 **Moodle LMS 3.7**과 연동하여 퀴즈 문제의 개념을 벡터 공간에 시각화하는 시스템입니다.

### 주요 특징

1. **Moodle 3.7 연동**: PHP 7.1.9, MySQL 5.7 환경
2. **스마트폰 UI**: 우측 하단 가상 스마트폰 화면에 앱 표시
3. **Vector Space Map**: D3.js 기반 개념 관계 시각화
4. **학습 경로 추적**: 학생의 개념 학습 진행도 시각화

## 구현 완료 항목

### ✅ Frontend (React + TypeScript + Vite)

```
frontend/
├── src/
│   ├── components/
│   │   ├── SmartphoneFrame.tsx            # 스마트폰 프레임 컴포넌트
│   │   ├── SmartphoneFrame.css
│   │   └── VectorSpaceMap/
│   │       ├── VectorSpaceMap.tsx         # 메인 Vector Space Map
│   │       ├── VectorSpaceMap.css
│   │       ├── components/
│   │       │   ├── ConceptPanel.tsx       # 개념 상세 패널
│   │       │   ├── ConceptPanel.css
│   │       │   ├── Legend.tsx             # 범례
│   │       │   └── Legend.css
│   │       ├── hooks/
│   │       │   ├── useVectorData.ts       # 벡터 데이터 페칭
│   │       │   ├── useLearningPath.ts     # 학습 경로
│   │       │   └── useInteraction.ts      # 사용자 상호작용
│   │       └── utils/
│   │           ├── colorMapping.ts        # 색상 매핑 유틸리티
│   │           └── forceSimulation.ts     # D3 Force Simulation
│   ├── services/
│   │   ├── moodleApi.ts                   # Moodle Web Service API
│   │   └── vectorSpaceApi.ts              # Vector Space API
│   ├── types/
│   │   └── index.ts                       # TypeScript 타입 정의
│   ├── App.tsx                            # 메인 앱
│   ├── App.css
│   ├── main.tsx
│   └── index.css
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

## 핵심 컴포넌트 설명

### 1. SmartphoneFrame

**위치**: `frontend/src/components/SmartphoneFrame.tsx`

**기능**:
- 우측 하단에 가상 스마트폰 화면 표시
- 노치, 상태바, 제스처바 포함
- 크기 조절 가능 (small, medium, large)
- 위치 조절 가능 (4방향)

**사용 예시**:
```tsx
<SmartphoneFrame position="bottom-right" size="medium">
  <YourApp />
</SmartphoneFrame>
```

### 2. VectorSpaceMap

**위치**: `frontend/src/components/VectorSpaceMap/VectorSpaceMap.tsx`

**기능**:
- D3.js Force-Directed Graph로 개념 시각화
- 노드 클릭/드래그/호버 인터랙션
- 줌/팬 기능
- 학습 경로 오버레이
- 색상 스키마 변경 (카테고리/난이도/숙달도)

**주요 Props**:
```typescript
interface VectorSpaceMapProps {
  moduleId: string;
  interactiveMode?: 'explore' | 'student-progress' | 'edit';
  dimension?: '2d' | '3d';
  colorScheme?: 'by-category' | 'by-difficulty' | 'by-mastery';
  onConceptSelect?: (concept: Concept) => void;
  studentId?: string;
}
```

### 3. Moodle API Service

**위치**: `frontend/src/services/moodleApi.ts`

**기능**:
- Moodle 3.7 Web Service API 호출
- 퀴즈 모듈 정보 가져오기
- 퀴즈 문제 목록 가져오기
- 학생 시도 기록 분석
- 개념 태그 추출

**사용 예시**:
```typescript
import { initMoodleApi, getMoodleApi } from '@services/moodleApi';

// 초기화
initMoodleApi('http://moodle-server/moodle', 'your-ws-token');

// API 사용
const api = getMoodleApi();
const questions = await api.getQuizQuestions(quizId);
```

### 4. Vector Space API Service

**위치**: `frontend/src/services/vectorSpaceApi.ts`

**기능**:
- 백엔드 API와 통신
- Vector Space 데이터 가져오기
- 개념 상세 정보 조회
- 학습 경로 기록
- Moodle 퀴즈로부터 Vector Space 생성

## 데이터 구조

### Concept (개념)

```typescript
interface Concept {
  id: string;
  name: string;
  description: string;
  category: string;
  difficulty: number; // 1-5
  position?: { x: number; y: number; z?: number };
  embedding?: number[];
  parentConceptId?: string;
  metadata?: Record<string, any>;
}
```

### ConceptRelationship (개념 관계)

```typescript
interface ConceptRelationship {
  id: string;
  sourceId: string;
  targetId: string;
  type: 'prerequisite' | 'similar' | 'extends' | 'related';
  weight: number; // 0-1
}
```

### VectorSpaceData

```typescript
interface VectorSpaceData {
  concepts: Concept[];
  relationships: ConceptRelationship[];
  clusters?: ConceptCluster[];
  metadata?: {
    moduleId: string;
    moduleName: string;
    totalConcepts: number;
    generatedAt: string;
  };
}
```

## 시각화 상세

### D3.js Force Simulation

**파일**: `frontend/src/components/VectorSpaceMap/utils/forceSimulation.ts`

**적용된 Forces**:
- `forceLink`: 개념 간 연결 관계
- `forceManyBody`: 노드 간 반발력 (-300)
- `forceCenter`: 중심 정렬
- `forceCollide`: 충돌 방지 (반경 30px)

**드래그 동작**:
- `dragstarted`: alpha 0.3으로 시뮬레이션 재시작
- `dragged`: 노드 위치 업데이트
- `dragended`: 고정 해제

### 색상 매핑

**파일**: `frontend/src/components/VectorSpaceMap/utils/colorMapping.ts`

**색상 스키마**:

1. **by-category** (카테고리별):
   - fraction: #FF6B6B (빨강)
   - operation: #4ECDC4 (청록)
   - geometry: #45B7D1 (파랑)
   - algebra: #96CEB4 (초록)
   - statistics: #FFEAA7 (노랑)
   - probability: #DFE6E9 (회색)
   - logic: #A29BFE (보라)
   - measurement: #FD79A8 (분홍)

2. **by-difficulty** (난이도별):
   - Level 1: #2ECC71 (초록)
   - Level 2: #F1C40F (노랑)
   - Level 3: #E67E22 (주황)
   - Level 4: #E74C3C (빨강)
   - Level 5: #8E44AD (보라)

3. **by-mastery** (숙달도별):
   - Low (0-30%): #E74C3C (빨강)
   - Medium (30-70%): #F39C12 (주황)
   - High (70-100%): #27AE60 (초록)

## Moodle 연동 플로우

### 1. Moodle Web Service 설정

1. **관리자 → 고급 기능**
   - "웹 서비스 활성화" 체크

2. **외부 서비스 생성**
   - 서비스 이름: "AI Education System"
   - 필요 함수:
     - `mod_quiz_get_quizzes_by_courses`
     - `mod_quiz_get_quiz_questions`
     - `mod_quiz_get_user_attempts`
     - `core_course_get_courses`

3. **토큰 생성**
   - 사용자에게 Web Service 토큰 발급
   - `.env` 파일에 저장

### 2. 데이터 페칭 플로우

```
사용자 요청
    ↓
Moodle API Service
    ↓
GET /webservice/rest/server.php
    ↓
퀴즈 문제 데이터 (JSON)
    ↓
개념 추출 (프론트엔드 또는 백엔드)
    ↓
Vector Space API로 전송
    ↓
임베딩 생성 (백엔드)
    ↓
Vector Space Map 렌더링
```

## 실행 방법

### 개발 환경

```bash
cd frontend
npm install
cp .env.example .env
# .env 파일 편집 (Moodle URL 및 토큰 입력)
npm run dev
```

### 프로덕션 빌드

```bash
npm run build
npm run preview
```

## 다음 단계 (백엔드 구현 필요)

### 1. Python AI Pipeline (선택사항)

```python
# pipeline/src/world_model/semantic_embeddings.py
from sentence_transformers import SentenceTransformer

def generate_embeddings(concepts):
    model = SentenceTransformer('all-MiniLM-L6-v2')
    embeddings = model.encode([c['description'] for c in concepts])
    return embeddings
```

### 2. PostgreSQL + pgvector (선택사항)

```sql
-- 개념 테이블
CREATE TABLE concepts (
    id UUID PRIMARY KEY,
    module_id UUID,
    name VARCHAR(255),
    description TEXT,
    embedding vector(384),
    category VARCHAR(100),
    difficulty INT
);

-- 벡터 유사도 검색
SELECT name, 1 - (embedding <=> query_vector) as similarity
FROM concepts
ORDER BY embedding <=> query_vector
LIMIT 10;
```

### 3. Node.js API (선택사항)

```typescript
// backend/src/routes/vector-space.ts
app.get('/api/modules/:id/vector-space', async (req, res) => {
  const moduleId = req.params.id;
  const vectorData = await getVectorSpaceData(moduleId);
  res.json(vectorData);
});
```

## 문제 해결

### CORS 에러

Moodle `config.php`에 추가:

```php
header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
```

### 토큰 인증 실패

1. Web Service 활성화 확인
2. 토큰과 서비스 연결 확인
3. 사용자 권한 확인

## 기술 스택 요약

- **Frontend**: React 18, TypeScript, Vite
- **Visualization**: D3.js 7.x
- **State Management**: Zustand
- **HTTP Client**: Axios
- **LMS**: Moodle 3.7 (PHP 7.1.9, MySQL 5.7)
- **Styling**: CSS Modules

## 참고 자료

- [Moodle Web Services Documentation](https://docs.moodle.org/dev/Web_services)
- [D3.js Force Layout](https://d3js.org/d3-force)
- [React TypeScript](https://react.dev/learn/typescript)
- [Vite Documentation](https://vitejs.dev/)

---

**구현 완료일**: 2025-01-XX
**작성자**: Claude Code Agent
**버전**: 1.0.0
