# Distraction Detection System - Complete Guide

## 목차 (Table of Contents)

1. [개요 (Overview)](#개요-overview)
2. [시스템 아키텍처 (System Architecture)](#시스템-아키텍처-system-architecture)
3. [데이터베이스 스키마 (Database Schema)](#데이터베이스-스키마-database-schema)
4. [프론트엔드 통합 (Frontend Integration)](#프론트엔드-통합-frontend-integration)
5. [백엔드 API (Backend API)](#백엔드-api-backend-api)
6. [교사 대시보드 (Teacher Dashboard)](#교사-대시보드-teacher-dashboard)
7. [분석 및 리포트 (Analytics & Reports)](#분석-및-리포트-analytics--reports)
8. [설정 및 배포 (Setup & Deployment)](#설정-및-배포-setup--deployment)
9. [문제 해결 (Troubleshooting)](#문제-해결-troubleshooting)

---

## 개요 (Overview)

### 기능 요약

산만함 감지 시스템은 LMS(Learning Management System)와 통합되어 학습자의 집중도를 실시간으로 모니터링하고, 산만해진 지점을 자동으로 표시하는 기능을 제공합니다.

**주요 기능:**
- ✅ 실시간 산만함 감지 (페이지 블러, 탭 전환, 비활성 등)
- ✅ 자동 표시 및 시각화
- ✅ 교사용 마킹 대시보드
- ✅ 학생별 산만함 분석
- ✅ 개입 권장 시스템
- ✅ 트렌드 분석 (주별, 월별)

### 사용 사례

1. **교사**: 학생들의 산만함 패턴을 모니터링하고, 필요한 경우 개입
2. **학생**: 자신의 집중도를 실시간으로 확인하고 개선
3. **관리자**: 전체 시스템의 효과성을 분석하고 개선점 파악

---

## 시스템 아키텍처 (System Architecture)

### 전체 구조

```
┌─────────────────────────────────────────────────────────────┐
│                      Student Interface                      │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  DistractionTracker (JavaScript Library)             │  │
│  │  - Page blur detection                                │  │
│  │  - Tab switch detection                               │  │
│  │  - Inactivity monitoring                              │  │
│  │  - Event batching & transmission                      │  │
│  └──────────────────────────────────────────────────────┘  │
│                           │                                  │
│                           ▼ (POST events)                    │
└───────────────────────────┼──────────────────────────────────┘
                            │
┌───────────────────────────▼──────────────────────────────────┐
│                      Backend API                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Distraction Routes                                   │  │
│  │  - Event ingestion (single/batch)                     │  │
│  │  - Mark creation & update                             │  │
│  │  - Analytics retrieval                                │  │
│  │  - Threshold configuration                            │  │
│  └──────────────────────────────────────────────────────┘  │
│                           │                                  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Distraction Service                                  │  │
│  │  - Business logic                                     │  │
│  │  - Session aggregation                                │  │
│  │  - Threshold checking                                 │  │
│  │  - Intervention triggering                            │  │
│  └──────────────────────────────────────────────────────┘  │
│                           │                                  │
└───────────────────────────┼──────────────────────────────────┘
                            │
┌───────────────────────────▼──────────────────────────────────┐
│                      PostgreSQL Database                     │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  distraction_events         (raw events)              │  │
│  │  distraction_sessions       (aggregated per session)  │  │
│  │  distraction_marks          (teacher annotations)     │  │
│  │  daily_distraction_analytics (trends)                │  │
│  │  distraction_interventions  (action logs)            │  │
│  │  distraction_thresholds     (configuration)          │  │
│  └──────────────────────────────────────────────────────┘  │
└───────────────────────────┼──────────────────────────────────┘
                            │
┌───────────────────────────▼──────────────────────────────────┐
│                  Analytics Aggregation Job                   │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Daily scheduled task (cron)                          │  │
│  │  - Aggregate raw events                               │  │
│  │  - Calculate trends                                   │  │
│  │  - Correlate with performance                         │  │
│  │  - Generate insights                                  │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
┌───────────────────────────▼──────────────────────────────────┐
│                      Teacher Dashboard                       │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  DistractionMarkingDashboard (React)                  │  │
│  │  - View unmarked events                               │  │
│  │  - Filter & search                                    │  │
│  │  - Mark events with category/severity                │  │
│  │  - Add notes & recommendations                        │  │
│  │  - View analytics & trends                            │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### 데이터 흐름 (Data Flow)

1. **이벤트 감지**: 학생이 학습 중 산만한 행동 발생 (예: 탭 전환)
2. **이벤트 수집**: `DistractionTracker` 라이브러리가 이벤트 감지 및 배치 처리
3. **API 전송**: 배치된 이벤트를 백엔드 API로 전송
4. **데이터 저장**: `distraction_events` 테이블에 저장
5. **세션 집계**: 트리거가 자동으로 `distraction_sessions` 업데이트
6. **임계값 확인**: 임계값 초과 시 `distraction_interventions` 생성
7. **교사 검토**: 교사가 대시보드에서 이벤트 확인
8. **마킹**: 교사가 이벤트를 분류하고 `distraction_marks` 생성
9. **일일 집계**: Cron job이 `daily_distraction_analytics` 업데이트
10. **트렌드 분석**: 주별/월별 트렌드 계산 및 표시

---

## 데이터베이스 스키마 (Database Schema)

### 주요 테이블

#### 1. `distraction_events` (원시 이벤트)

```sql
CREATE TABLE distraction_events (
    id UUID PRIMARY KEY,
    student_id UUID NOT NULL,
    module_id UUID NOT NULL,
    problem_id VARCHAR(255),
    session_id UUID NOT NULL,
    event_type VARCHAR(50) NOT NULL,
    severity_level VARCHAR(20) NOT NULL,
    duration_seconds INTEGER NOT NULL,
    metadata JSONB DEFAULT '{}',
    problem_context JSONB DEFAULT '{}',
    event_timestamp TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

**이벤트 유형 (event_type):**
- `page_blur`: 브라우저 창 포커스 잃음
- `tab_switch`: 다른 탭으로 전환
- `mouse_idle`: 마우스 비활성
- `keyboard_idle`: 키보드 비활성
- `inactivity`: 결합 비활성
- `window_resize`: 창 크기 조정
- `copy_paste`: 복사/붙여넣기
- `devtools_open`: 개발자 도구 열림

**심각도 수준 (severity_level):**
- `minor`: < 10초
- `moderate`: 10-30초
- `major`: 30-60초
- `critical`: > 60초

#### 2. `distraction_marks` (교사 마킹) - 핵심 기능

```sql
CREATE TABLE distraction_marks (
    id UUID PRIMARY KEY,
    distraction_event_id UUID UNIQUE NOT NULL,
    student_id UUID NOT NULL,
    module_id UUID NOT NULL,
    category VARCHAR(50) NOT NULL,
    severity VARCHAR(20) NOT NULL,
    context_notes TEXT,
    root_cause_analysis TEXT,
    action_taken VARCHAR(255),
    intervention_recommended BOOLEAN DEFAULT FALSE,
    marked_by_user_id UUID NOT NULL,
    marked_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

**카테고리 (category):**
- `legitimate_break`: 정당한 휴식
- `off_task`: 작업 이탈
- `technical_issue`: 기술적 문제
- `external_interruption`: 외부 방해
- `confusion`: 혼란/이해 부족
- `cheating_attempt`: 부정행위 시도
- `false_positive`: 오탐지
- `other`: 기타

#### 3. `distraction_sessions` (세션 집계)

```sql
CREATE TABLE distraction_sessions (
    id UUID PRIMARY KEY,
    student_id UUID NOT NULL,
    module_id UUID NOT NULL,
    session_id UUID UNIQUE NOT NULL,
    session_start TIMESTAMP NOT NULL,
    total_events INTEGER DEFAULT 0,
    total_distraction_duration_seconds INTEGER DEFAULT 0,
    distraction_percentage DECIMAL(5,2) DEFAULT 0.00,
    flagged_for_intervention BOOLEAN DEFAULT FALSE
);
```

#### 4. `daily_distraction_analytics` (일일 분석)

```sql
CREATE TABLE daily_distraction_analytics (
    id UUID PRIMARY KEY,
    student_id UUID NOT NULL,
    module_id UUID,
    date DATE NOT NULL,
    sessions_count INTEGER DEFAULT 0,
    average_distraction_percentage DECIMAL(5,2) DEFAULT 0.00,
    trend_week_over_week DECIMAL(6,2),
    trend_month_over_month DECIMAL(6,2),
    UNIQUE(student_id, module_id, date)
);
```

---

## 프론트엔드 통합 (Frontend Integration)

### 1. DistractionTracker 라이브러리 사용

#### 설치 및 import

```typescript
import { DistractionTracker } from '@/lib/DistractionTracker';
```

#### 기본 사용법

```typescript
const tracker = new DistractionTracker({
  studentId: 'uuid-here',
  moduleId: 'uuid-here',
  sessionId: 'uuid-here',
  apiEndpoint: '/api/modules/uuid-here/distraction-events',

  // Optional configuration
  mouseIdleThreshold: 30000,  // 30 seconds
  keyboardIdleThreshold: 30000,
  inactivityThreshold: 60000, // 60 seconds

  enableBatching: true,
  batchSize: 10,
  batchInterval: 5000, // 5 seconds

  debug: false,

  // Callbacks
  onEventDetected: (event) => {
    console.log('Distraction detected:', event);
  },
  onEventSent: (event) => {
    console.log('Event sent to server:', event);
  },
  onError: (error) => {
    console.error('Error:', error);
  },
});

// Start tracking
tracker.start();

// Update problem context when student moves to next problem
tracker.updateProblemContext('problem-2', {
  difficulty: 'hard',
  topic: 'fractions',
});

// Stop tracking
tracker.stop();
```

#### React Hook 사용

```typescript
import { useDistractionTracker } from '@/lib/DistractionTracker';

function StudentLearningInterface() {
  const { tracker, isTracking, updateProblemContext } = useDistractionTracker({
    studentId,
    moduleId,
    sessionId,
    apiEndpoint: `/api/modules/${moduleId}/distraction-events`,
    autoStart: true,
  });

  const handleProblemChange = (problemId: string) => {
    updateProblemContext(problemId, {
      difficulty: 'medium',
      topic: 'algebra',
    });
  };

  return (
    <div>
      {isTracking && <div>Tracking active</div>}
      {/* Your learning interface */}
    </div>
  );
}
```

### 2. DistractionIndicator 컴포넌트 (자동 표시)

```typescript
import { DistractionIndicator } from '@/components/student/DistractionIndicator';

function StudentProblemPage() {
  return (
    <div>
      <DistractionIndicator
        studentId={studentId}
        moduleId={moduleId}
        sessionId={sessionId}
        apiEndpoint={`/api/modules/${moduleId}/distraction-events`}
        showTimeline={true}
        showAlerts={true}
        showFocusStatus={true}
        onDistractionDetected={(event) => {
          // Handle distraction event
        }}
      />

      {/* Your problem content */}
    </div>
  );
}
```

**기능:**
- ✅ 실시간 집중 상태 표시
- ✅ 산만함 알림 (major/critical 이벤트)
- ✅ 타임라인 시각화
- ✅ 휴식 권장 (연속 산만함 감지 시)

---

## 백엔드 API (Backend API)

### API 엔드포인트

#### 1. 이벤트 생성

**단일 이벤트**
```http
POST /api/modules/:moduleId/distraction-events
Authorization: Bearer <token>
Content-Type: application/json

{
  "studentId": "uuid",
  "sessionId": "uuid",
  "eventType": "page_blur",
  "durationSeconds": 15,
  "metadata": {},
  "problemContext": {}
}
```

**배치 이벤트**
```http
POST /api/modules/:moduleId/distraction-events/batch
Authorization: Bearer <token>
Content-Type: application/json

{
  "events": [
    {
      "studentId": "uuid",
      "sessionId": "uuid",
      "eventType": "tab_switch",
      "durationSeconds": 5
    },
    // ... more events
  ]
}
```

#### 2. 이벤트 조회

```http
GET /api/modules/:moduleId/distraction-events
  ?studentId=uuid
  &eventType=page_blur
  &startDate=2025-11-01
  &endDate=2025-11-18
  &unmarkedOnly=true
  &limit=50
  &offset=0
Authorization: Bearer <teacher-token>
```

#### 3. 마킹 생성

```http
POST /api/modules/:moduleId/distraction-marks
Authorization: Bearer <teacher-token>
Content-Type: application/json

{
  "distractionEventId": "uuid",
  "studentId": "uuid",
  "category": "off_task",
  "severity": "moderate",
  "contextNotes": "학생이 소셜 미디어를 브라우징하고 있었음",
  "rootCauseAnalysis": "어려운 문제로 인한 집중력 저하",
  "actionTaken": "학생에게 알림 전송",
  "interventionRecommended": true,
  "interventionType": "1:1 상담"
}
```

#### 4. 분석 조회

**학생 요약**
```http
GET /api/modules/:moduleId/student/:studentId/distraction-summary
Authorization: Bearer <teacher-token>
```

**모듈 분석**
```http
GET /api/modules/:moduleId/distraction-analytics
  ?startDate=2025-11-01
  &endDate=2025-11-18
  &groupBy=day
Authorization: Bearer <teacher-token>
```

#### 5. 임계값 설정

```http
PUT /api/modules/:moduleId/distraction-thresholds
Authorization: Bearer <teacher-token>
Content-Type: application/json

{
  "criticalPercentage": 50,
  "warningPercentage": 30,
  "minorPercentage": 10,
  "autoPauseOnCritical": false,
  "sendTeacherAlerts": true,
  "sendStudentReminders": true
}
```

---

## 교사 대시보드 (Teacher Dashboard)

### DistractionMarkingDashboard 컴포넌트

```typescript
import { DistractionMarkingDashboard } from '@/components/teacher/DistractionMarkingDashboard';

function TeacherModulePage() {
  return (
    <DistractionMarkingDashboard moduleId={moduleId} />
  );
}
```

### 주요 기능

1. **이벤트 목록**
   - 미표시 이벤트 필터링
   - 학생별, 날짜별, 유형별 필터
   - 페이지네이션

2. **통계 요약**
   - 전체 이벤트 수
   - 심각도별 분류 (critical, major, moderate, minor)
   - 미표시 이벤트 수

3. **마킹 인터페이스**
   - 카테고리 선택
   - 심각도 평가
   - 상황 메모 작성
   - 근본 원인 분석
   - 개입 권장 설정

4. **분석 보기**
   - 학생별 산만함 트렌드
   - 시간대별 패턴
   - 학업 성과와의 상관관계

---

## 분석 및 리포트 (Analytics & Reports)

### 일일 집계 작업 (Daily Aggregation Job)

#### 실행 방법

**수동 실행:**
```bash
npm run job:distraction-analytics
```

**Cron 스케줄링:**
```bash
# crontab -e
0 2 * * * cd /path/to/app && npm run job:distraction-analytics >> /var/log/distraction-analytics.log 2>&1
```

#### 집계 내용

1. **일일 통계**
   - 학생별, 모듈별 세션 수
   - 평균 산만함 비율
   - 이벤트 유형 분석
   - 심각도 분석

2. **트렌드 계산**
   - 주별 변화율 (week-over-week)
   - 월별 변화율 (month-over-month)

3. **성과 상관관계**
   - 산만함 수준별 정확도
   - 집중도와 성취도의 관계

4. **인사이트 생성**
   - 개입이 필요한 학생 식별
   - 개선 중인 학생 파악
   - 패턴 및 이상 탐지

### 리포트 예시

#### 학생 요약 리포트

```json
{
  "studentId": "uuid",
  "moduleId": "uuid",
  "period": "2025-11-01 to 2025-11-18",
  "summary": {
    "totalSessions": 25,
    "avgDistractionPercentage": 18.5,
    "totalEvents": 147,
    "totalDuration": 3240,
    "trend": {
      "weekOverWeek": -12.3,
      "monthOverMonth": -8.7
    }
  },
  "eventBreakdown": {
    "page_blur": 52,
    "tab_switch": 38,
    "inactivity": 31,
    "mouse_idle": 26
  },
  "severityBreakdown": {
    "critical": 8,
    "major": 23,
    "moderate": 61,
    "minor": 55
  },
  "academicCorrelation": {
    "problemsAttempted": 158,
    "problemsCorrect": 124,
    "accuracy": 78.5,
    "correlation": -0.42
  },
  "recommendation": "학생의 산만함이 감소 추세입니다. 긍정적 피드백을 제공하세요."
}
```

---

## 설정 및 배포 (Setup & Deployment)

### 1. 데이터베이스 설정

```bash
# PostgreSQL 연결
psql -U postgres

# 데이터베이스 생성
CREATE DATABASE ai_education;

# 스키마 적용
\c ai_education
\i database/schemas/distraction_detection.sql
```

### 2. 환경 변수

```env
# .env

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ai_education
DB_USER=postgres
DB_PASSWORD=your_password

# API
API_PORT=3000
API_BASE_URL=http://localhost:3000

# Analytics
CLEANUP_OLD_DATA=true
DATA_RETENTION_DAYS=90

# Authentication
JWT_SECRET=your_jwt_secret
```

### 3. 백엔드 실행

```bash
# 의존성 설치
cd backend
npm install

# 개발 모드
npm run dev

# 프로덕션 빌드
npm run build
npm run start
```

### 4. 프론트엔드 실행

```bash
# 의존성 설치
cd frontend
npm install

# 개발 모드
npm run dev

# 프로덕션 빌드
npm run build
```

### 5. 테스트 실행

```bash
# 단위 테스트
npm run test

# 통합 테스트
npm run test:integration

# E2E 테스트
npm run test:e2e
```

---

## 문제 해결 (Troubleshooting)

### 일반적인 문제

#### 1. 이벤트가 전송되지 않음

**증상**: 프론트엔드에서 이벤트가 감지되지만 서버에 도달하지 않음

**해결책**:
```javascript
// 1. 네트워크 탭 확인
// 2. CORS 설정 확인
// 3. API 엔드포인트 URL 확인
// 4. 인증 토큰 확인

// Debug 모드 활성화
const tracker = new DistractionTracker({
  // ... other options
  debug: true,
});
```

#### 2. 세션 집계가 업데이트되지 않음

**증상**: `distraction_sessions` 테이블이 업데이트되지 않음

**해결책**:
```sql
-- 트리거가 활성화되어 있는지 확인
SELECT * FROM pg_trigger
WHERE tgname = 'after_distraction_event_insert';

-- 수동으로 집계 함수 호출
SELECT update_session_aggregates('session-uuid-here');
```

#### 3. 일일 집계 작업 실패

**증상**: Cron job이 실행되지 않거나 실패

**해결책**:
```bash
# 로그 확인
tail -f /var/log/distraction-analytics.log

# 수동으로 실행하여 에러 확인
npm run job:distraction-analytics

# 데이터베이스 연결 확인
psql -U postgres -d ai_education -c "SELECT 1;"
```

#### 4. 대시보드 로딩 느림

**증상**: 교사 대시보드가 느리게 로드됨

**해결책**:
```sql
-- 인덱스 확인
SELECT * FROM pg_indexes
WHERE tablename IN ('distraction_events', 'distraction_marks');

-- 필요시 인덱스 재생성
REINDEX TABLE distraction_events;

-- 통계 업데이트
ANALYZE distraction_events;
```

### 성능 최적화

1. **배치 처리 크기 조정**
```typescript
const tracker = new DistractionTracker({
  enableBatching: true,
  batchSize: 20,  // 기본값: 10
  batchInterval: 10000,  // 10초 (기본값: 5초)
});
```

2. **데이터베이스 인덱스 최적화**
```sql
-- 복합 인덱스 추가
CREATE INDEX idx_events_student_module_time
ON distraction_events(student_id, module_id, event_timestamp DESC);
```

3. **구식 데이터 정리**
```sql
-- 90일 이상 된 원시 이벤트 삭제
DELETE FROM distraction_events
WHERE event_timestamp < NOW() - INTERVAL '90 days';
```

---

## 부록 (Appendix)

### A. 산만함 심각도 기준

| 지속 시간 | 심각도 | 권장 조치 |
|----------|--------|----------|
| < 10초 | Minor | 모니터링만 |
| 10-30초 | Moderate | 주의 필요 |
| 30-60초 | Major | 개입 고려 |
| > 60초 | Critical | 즉시 개입 |

### B. 카테고리별 대응 가이드

| 카테고리 | 대응 방법 |
|---------|----------|
| `legitimate_break` | 정상, 조치 불필요 |
| `off_task` | 집중도 개선 상담 |
| `technical_issue` | 기술 지원 제공 |
| `external_interruption` | 학습 환경 개선 권장 |
| `confusion` | 추가 설명 및 도움 제공 |
| `cheating_attempt` | 경고 및 모니터링 강화 |
| `false_positive` | 시스템 조정 |

### C. 관련 파일 위치

```
alt42standalone_v1.0/
├── database/
│   └── schemas/
│       └── distraction_detection.sql
├── backend/
│   ├── src/
│   │   ├── api/
│   │   │   └── distraction.routes.ts
│   │   ├── services/
│   │   │   └── distraction.service.ts
│   │   └── jobs/
│   │       └── distraction-analytics-aggregation.ts
│   └── tests/
│       └── integration/
│           └── distraction-detection.test.ts
├── frontend/
│   └── src/
│       ├── lib/
│       │   └── DistractionTracker.ts
│       └── components/
│           ├── student/
│           │   └── DistractionIndicator.tsx
│           └── teacher/
│               └── DistractionMarkingDashboard.tsx
└── docs/
    └── DISTRACTION_DETECTION_GUIDE.md
```

---

## 연락처 및 지원

문제가 발생하거나 질문이 있으시면:
- GitHub Issues: [프로젝트 저장소]/issues
- 이메일: support@kaist.ac.kr
- 문서: [프로젝트 URL]/docs

---

**마지막 업데이트**: 2025-11-18
**버전**: 1.0.0
