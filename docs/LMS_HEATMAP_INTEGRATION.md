# LMS 개념 이해도 히트맵 통합 가이드

## 개요

이 문서는 AI 교육 시스템 파이프라인의 LMS 연동 및 개념 이해도 히트맵 기능에 대한 포괄적인 가이드입니다.

## 목차

1. [기능 소개](#기능-소개)
2. [시스템 아키텍처](#시스템-아키텍처)
3. [데이터베이스 스키마](#데이터베이스-스키마)
4. [백엔드 API](#백엔드-api)
5. [프론트엔드 컴포넌트](#프론트엔드-컴포넌트)
6. [LMS 통합](#lms-통합)
7. [설치 및 설정](#설치-및-설정)
8. [사용 예제](#사용-예제)
9. [문제 해결](#문제-해결)

---

## 기능 소개

### 개념 이해도 히트맵

학생들의 개념별 이해도를 시각화하여 교사가 한눈에 파악할 수 있는 기능입니다.

**주요 기능:**
- 학생 × 개념 매트릭스 형태의 히트맵 시각화
- 색상 코딩을 통한 직관적인 이해도 표시
- 개별 셀 클릭 시 상세 정보 표시
- 다양한 색상 테마 지원 (빨강-초록, 파랑-노랑, 회색조)
- 개념별 난이도 분석
- 어려움을 겪는 학생 및 개념 식별

### LMS 통합

외부 학습 관리 시스템(Canvas, Moodle, Blackboard 등)과의 원활한 데이터 연동을 지원합니다.

**주요 기능:**
- LTI 1.1/1.3 표준 지원
- 학생 정보 동기화
- 성적 자동 연동
- 양방향 데이터 동기화
- 실시간 동기화 상태 모니터링

---

## 시스템 아키텍처

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React)                          │
│  ┌───────────────────────────────────────────────────┐      │
│  │  Teacher Dashboard                                 │      │
│  │  ├─ ConceptHeatmap Component                      │      │
│  │  ├─ Module Selection                              │      │
│  │  └─ Concept Analysis                              │      │
│  └───────────────────────────────────────────────────┘      │
└────────────────────────┬────────────────────────────────────┘
                         │ REST API
┌────────────────────────▼────────────────────────────────────┐
│                  Backend API (Node.js/Express)               │
│  ┌──────────────────┐  ┌──────────────────────────────┐    │
│  │ Heatmap Routes   │  │ LMS Integration Routes       │    │
│  │ /api/heatmap/*   │  │ /api/lms/*                   │    │
│  └────────┬─────────┘  └──────────┬───────────────────┘    │
│           │                        │                         │
│  ┌────────▼───────────────────────▼───────────────────┐    │
│  │  ConceptUnderstanding Model                         │    │
│  │  LMSIntegration Service                            │    │
│  └────────────────────┬────────────────────────────────┘    │
└────────────────────────┼────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────┐
│                   PostgreSQL Database                        │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Tables:                                              │  │
│  │  - concepts                                           │  │
│  │  - concept_understanding                              │  │
│  │  - concept_interactions                               │  │
│  │  - lms_integrations                                   │  │
│  │  - lms_sync_log                                       │  │
│  │  - heatmap_configurations                             │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                         │
                         │ LTI/API
┌────────────────────────▼────────────────────────────────────┐
│              External LMS Systems                            │
│       Canvas / Moodle / Blackboard / Custom                 │
└─────────────────────────────────────────────────────────────┘
```

---

## 데이터베이스 스키마

### 주요 테이블

#### 1. concepts (개념)
개념별 메타데이터를 저장합니다.

```sql
CREATE TABLE concepts (
    id UUID PRIMARY KEY,
    module_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    parent_concept_id UUID REFERENCES concepts(id),
    difficulty_level INTEGER CHECK (difficulty_level BETWEEN 1 AND 5),
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

#### 2. concept_understanding (개념 이해도)
학생별 개념 이해도 점수를 추적합니다.

```sql
CREATE TABLE concept_understanding (
    id UUID PRIMARY KEY,
    student_id UUID NOT NULL,
    concept_id UUID NOT NULL REFERENCES concepts(id),
    module_id UUID NOT NULL,
    understanding_score DECIMAL(5,2) CHECK (understanding_score BETWEEN 0 AND 100),
    attempts_count INTEGER DEFAULT 0,
    correct_attempts INTEGER DEFAULT 0,
    time_spent_seconds INTEGER DEFAULT 0,
    last_interaction_at TIMESTAMP,
    mastery_level VARCHAR(20) CHECK (mastery_level IN ('not_started', 'struggling', 'developing', 'proficient', 'mastered')),
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    UNIQUE (student_id, concept_id, module_id)
);
```

**숙련도 레벨 기준:**
- `mastered`: 90-100% (완전 습득)
- `proficient`: 80-89% (능숙)
- `developing`: 60-79% (발전 중)
- `struggling`: 40-59% (어려움)
- `not_started`: 0-39% (미흡)

#### 3. concept_interactions (개념 상호작용)
학생과 개념 간의 모든 상호작용을 기록합니다.

```sql
CREATE TABLE concept_interactions (
    id UUID PRIMARY KEY,
    student_id UUID NOT NULL,
    concept_id UUID NOT NULL REFERENCES concepts(id),
    module_id UUID NOT NULL,
    interaction_type VARCHAR(50) NOT NULL,
    is_correct BOOLEAN,
    score DECIMAL(5,2),
    time_spent_seconds INTEGER,
    metadata JSONB,
    interaction_at TIMESTAMP,
    created_at TIMESTAMP
);
```

**상호작용 유형:**
- `problem_attempt`: 문제 풀이 시도
- `video_watch`: 영상 시청
- `quiz`: 퀴즈 응시
- `practice`: 연습 활동

#### 4. lms_integrations (LMS 통합)
LMS 연결 정보를 저장합니다.

```sql
CREATE TABLE lms_integrations (
    id UUID PRIMARY KEY,
    institution_name VARCHAR(255) NOT NULL,
    lms_type VARCHAR(50) NOT NULL,
    lms_url VARCHAR(500) NOT NULL,
    consumer_key VARCHAR(255) NOT NULL,
    consumer_secret VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    config JSONB,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

**지원되는 LMS 유형:**
- `canvas`: Canvas LMS
- `moodle`: Moodle
- `blackboard`: Blackboard Learn
- `custom`: 커스텀 LMS

---

## 백엔드 API

### Heatmap API

#### GET /api/heatmap/:moduleId
모듈의 히트맵 데이터를 가져옵니다.

**쿼리 파라미터:**
- `studentIds` (optional): 쉼표로 구분된 학생 ID 목록

**응답:**
```json
{
  "success": true,
  "data": {
    "moduleId": "uuid",
    "concepts": ["Fraction Basics", "Adding Fractions", ...],
    "students": ["student-1", "student-2", ...],
    "matrix": [
      {
        "studentId": "student-1",
        "scores": [
          {
            "conceptId": "uuid",
            "score": 85.5,
            "masteryLevel": "proficient",
            "attemptsCount": 12,
            "lastInteractionAt": "2024-01-15T10:30:00Z"
          }
        ]
      }
    ]
  }
}
```

#### POST /api/heatmap/:moduleId/interaction
학생의 개념 상호작용을 기록합니다.

**요청 본문:**
```json
{
  "studentId": "uuid",
  "conceptId": "uuid",
  "interactionType": "problem_attempt",
  "isCorrect": true,
  "score": 100,
  "timeSpentSeconds": 45,
  "metadata": {
    "problemId": "uuid",
    "difficulty": "medium"
  }
}
```

**응답:**
```json
{
  "success": true,
  "data": {
    "interaction": { ... },
    "understanding": {
      "understandingScore": 87.5,
      "masteryLevel": "proficient",
      "attemptsCount": 13
    }
  }
}
```

#### GET /api/heatmap/:moduleId/analysis
모듈의 개념별 분석 데이터를 가져옵니다.

**응답:**
```json
{
  "success": true,
  "data": {
    "summary": {
      "totalConcepts": 10,
      "avgScore": 75.3,
      "totalStudentsAttempted": 25
    },
    "concepts": [
      {
        "conceptId": "uuid",
        "conceptName": "Fraction Basics",
        "avgUnderstandingScore": 85.5,
        "strugglingStudents": 2,
        "masteredStudents": 18
      }
    ],
    "problematicConcepts": [ ... ],
    "masteredConcepts": [ ... ]
  }
}
```

### LMS Integration API

#### POST /api/lms/integration
새 LMS 통합을 생성합니다.

**요청 본문:**
```json
{
  "institutionName": "KAIST",
  "lmsType": "canvas",
  "lmsUrl": "https://canvas.kaist.ac.kr",
  "consumerKey": "your-consumer-key",
  "consumerSecret": "your-consumer-secret",
  "config": {
    "autoSyncGrades": true,
    "syncInterval": 3600
  }
}
```

#### POST /api/lms/sync/:integrationId
LMS와 데이터 동기화를 시작합니다.

**요청 본문:**
```json
{
  "syncType": "students",  // 'students' | 'grades' | 'concepts' | 'full'
  "moduleId": "uuid"
}
```

**응답:**
```json
{
  "success": true,
  "data": {
    "id": "sync-log-uuid",
    "status": "pending",
    "syncType": "students"
  },
  "message": "Synchronization started"
}
```

---

## 프론트엔드 컴포넌트

### ConceptHeatmap 컴포넌트

히트맵 시각화를 위한 메인 컴포넌트입니다.

**사용법:**
```tsx
import ConceptHeatmap from './components/ConceptHeatmap';

<ConceptHeatmap
  moduleId="uuid"
  studentIds={['student-1', 'student-2']}  // optional
  onCellClick={(studentId, conceptName, data) => {
    console.log('Cell clicked:', studentId, conceptName, data);
  }}
  showStudentNames={true}
  showScores={true}
  colorScheme="red-green"  // 'red-green' | 'blue-yellow' | 'grayscale'
  height="600px"
/>
```

**Props:**
- `moduleId` (required): 모듈 ID
- `studentIds` (optional): 표시할 학생 ID 배열
- `onCellClick` (optional): 셀 클릭 시 콜백 함수
- `showStudentNames` (optional): 학생 이름 표시 여부 (기본값: true)
- `showScores` (optional): 점수 표시 여부 (기본값: true)
- `colorScheme` (optional): 색상 테마 (기본값: 'red-green')
- `height` (optional): 히트맵 높이 (기본값: '600px')

### TeacherDashboard 페이지

교사용 대시보드 페이지입니다.

**기능:**
- 모듈 선택
- 히트맵 시각화
- 개념별 분석
- 학생별 상세 정보

---

## LMS 통합

### LTI 1.1 통합

#### 1. LMS에 앱 등록

Canvas 예시:
1. Canvas 관리자 패널 > Developer Keys
2. 새 LTI Key 생성
3. Consumer Key 및 Secret 받기
4. Launch URL 설정: `https://your-domain.com/api/lms/webhook/lti-launch`

#### 2. 시스템에 LMS 통합 추가

```typescript
const response = await apiService.createLMSIntegration({
  institutionName: 'KAIST',
  lmsType: 'canvas',
  lmsUrl: 'https://canvas.kaist.ac.kr',
  consumerKey: 'your-key',
  consumerSecret: 'your-secret',
  config: {
    autoSyncGrades: true,
    syncInterval: 3600
  }
});
```

#### 3. LTI Launch 흐름

1. 학생이 LMS에서 앱을 시작
2. LMS가 POST 요청을 Launch URL로 전송 (OAuth 서명 포함)
3. 시스템이 요청을 검증
4. 세션 생성 및 사용자를 적절한 모듈로 리디렉션

### 성적 동기화

```typescript
await apiService.syncGradesToLMS({
  integrationId: 'integration-uuid',
  moduleId: 'module-uuid',
  studentGrades: [
    { studentId: 'student-1', score: 85, maxScore: 100 },
    { studentId: 'student-2', score: 92, maxScore: 100 }
  ]
});
```

---

## 설치 및 설정

### 1. 데이터베이스 마이그레이션

```bash
# PostgreSQL에 연결
psql -U username -d database_name

# 마이그레이션 실행
\i backend/migrations/001_concept_understanding_heatmap.sql
```

### 2. 환경 변수 설정

`.env` 파일 생성:
```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/dbname

# API
API_PORT=3000
API_BASE_URL=/api

# Frontend
REACT_APP_API_URL=http://localhost:3000/api
```

### 3. 백엔드 설치

```bash
cd backend
npm install
npm run build
npm start
```

### 4. 프론트엔드 설치

```bash
cd frontend
npm install
npm start
```

---

## 사용 예제

### 예제 1: 학생 상호작용 기록

```typescript
import apiService from './services/api';

// 학생이 문제를 풀었을 때
async function recordProblemAttempt(
  moduleId: string,
  studentId: string,
  conceptId: string,
  isCorrect: boolean,
  timeSpent: number
) {
  const result = await apiService.recordInteraction(moduleId, {
    studentId,
    conceptId,
    interactionType: 'problem_attempt',
    isCorrect,
    score: isCorrect ? 100 : 0,
    timeSpentSeconds: timeSpent,
    metadata: {
      problemType: 'multiple_choice',
      difficulty: 'medium'
    }
  });

  console.log('New understanding score:', result.data.understanding.understandingScore);
}
```

### 예제 2: 히트맵 데이터 분석

```typescript
async function analyzeModulePerformance(moduleId: string) {
  const analysis = await apiService.getConceptAnalysis(moduleId);

  // 어려운 개념 식별
  const difficultConcepts = analysis.data.problematicConcepts;

  console.log('Concepts needing attention:');
  difficultConcepts.forEach(concept => {
    console.log(`- ${concept.conceptName}: ${concept.strugglingStudents} students struggling`);
  });

  // 잘 이해된 개념
  const wellUnderstoodConcepts = analysis.data.masteredConcepts;
  console.log('\nWell-understood concepts:');
  wellUnderstoodConcepts.forEach(concept => {
    console.log(`- ${concept.conceptName}: ${concept.masteredStudents} students mastered`);
  });
}
```

### 예제 3: 특정 학생의 진도 추적

```typescript
async function trackStudentProgress(moduleId: string, studentId: string) {
  const understanding = await apiService.getStudentUnderstanding(moduleId, studentId);

  const summary = understanding.data.summary;

  summary.forEach(item => {
    console.log(`${item.concept_name}: ${item.understanding_score}% (${item.mastery_level})`);
  });

  // 개선이 필요한 영역
  const needsImprovement = summary.filter(
    item => item.mastery_level === 'struggling' || item.mastery_level === 'developing'
  );

  console.log('\nAreas needing improvement:');
  needsImprovement.forEach(item => {
    console.log(`- ${item.concept_name}: ${item.attempts_count} attempts`);
  });
}
```

---

## 문제 해결

### 일반적인 문제

#### 1. 히트맵이 로드되지 않음

**증상:** 히트맵 컴포넌트가 "Loading..." 상태에서 멈춤

**해결방법:**
- 브라우저 콘솔에서 API 오류 확인
- 백엔드 서버가 실행 중인지 확인
- `moduleId`가 유효한지 확인
- 데이터베이스 연결 상태 확인

```bash
# 백엔드 로그 확인
tail -f backend/logs/app.log

# 데이터베이스 연결 테스트
psql -U username -d database_name -c "SELECT COUNT(*) FROM concepts;"
```

#### 2. LMS 통합이 실패함

**증상:** LTI launch 요청이 401 Unauthorized 반환

**해결방법:**
- Consumer Key와 Secret이 올바른지 확인
- LMS의 시간이 서버 시간과 동기화되어 있는지 확인 (OAuth timestamp 검증)
- Launch URL이 LMS에 정확히 설정되어 있는지 확인

```typescript
// LTI 요청 디버깅
console.log('OAuth params:', {
  consumer_key: params.oauth_consumer_key,
  timestamp: params.oauth_timestamp,
  nonce: params.oauth_nonce,
  signature: params.oauth_signature
});
```

#### 3. 성적이 LMS로 동기화되지 않음

**증상:** `syncGradesToLMS` 호출 후 LMS에 성적이 나타나지 않음

**해결방법:**
- LMS 통합이 활성화되어 있는지 확인 (`is_active = true`)
- LMS API 권한 확인
- 동기화 로그 확인

```typescript
// 동기화 상태 확인
const syncLogs = await apiService.getLMSSyncStatus(integrationId);
console.log('Recent sync attempts:', syncLogs);
```

### 성능 최적화

#### 대량 데이터 처리

학생 수나 개념 수가 많은 경우:

1. **페이지네이션 사용:**
```typescript
// 학생을 배치로 로드
const batchSize = 50;
for (let i = 0; i < totalStudents; i += batchSize) {
  const studentBatch = students.slice(i, i + batchSize);
  await loadHeatmapData(moduleId, studentBatch);
}
```

2. **인덱스 최적화:**
```sql
-- 자주 쿼리되는 필드에 인덱스 추가
CREATE INDEX idx_concept_understanding_module_score
ON concept_understanding(module_id, understanding_score);
```

3. **캐싱 구현:**
```typescript
// Redis를 사용한 히트맵 데이터 캐싱
const cacheKey = `heatmap:${moduleId}`;
const cached = await redis.get(cacheKey);

if (cached) {
  return JSON.parse(cached);
}

const data = await fetchHeatmapData(moduleId);
await redis.set(cacheKey, JSON.stringify(data), 'EX', 300); // 5분 캐시
return data;
```

---

## 추가 리소스

- [LTI 1.1 명세](https://www.imsglobal.org/specs/ltiv1p1)
- [Canvas LMS API 문서](https://canvas.instructure.com/doc/api/)
- [Moodle LTI 통합 가이드](https://docs.moodle.org/en/LTI)
- [PostgreSQL JSONB 사용법](https://www.postgresql.org/docs/current/datatype-json.html)

---

## 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다.

## 기여

버그 리포트 및 기능 제안은 GitHub Issues를 통해 제출해주세요.

## 문의

기술 지원: support@example.com
문서 개선 제안: docs@example.com
