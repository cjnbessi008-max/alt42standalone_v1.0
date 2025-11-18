# 집중 이탈 감지 및 휴식 가이드 시스템

LMS와 연동된 집중 이탈 감지 및 15초 멍때리기 가이드 시스템 문서

## 📋 목차

1. [개요](#개요)
2. [시스템 아키텍처](#시스템-아키텍처)
3. [주요 기능](#주요-기능)
4. [설치 및 설정](#설치-및-설정)
5. [사용 방법](#사용-방법)
6. [API 문서](#api-문서)
7. [데이터베이스 스키마](#데이터베이스-스키마)
8. [커스터마이징](#커스터마이징)

---

## 개요

### 목적

학생의 학습 중 집중 이탈을 자동으로 감지하고, 15초간의 짧은 휴식 가이드를 제공하여 학습 효율성을 높이는 시스템입니다.

### 주요 특징

- ✅ **자동 감지**: 페이지 가시성, 마우스/키보드 활동 추적
- ✅ **다양한 활동**: 호흡, 스트레칭, 눈 휴식, 마음챙김
- ✅ **LMS 연동**: 집중도 데이터 자동 수집 및 분석
- ✅ **실시간 통계**: 학생별, 모듈별 집중도 리포트
- ✅ **접근성**: WCAG 2.1 AA 준수
- ✅ **반응형**: 모바일/태블릿/데스크톱 지원

---

## 시스템 아키텍처

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (React)                      │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  ┌─────────────────────────────────────────────────┐   │
│  │    StudentLearningContainer                     │   │
│  │  (통합 컨테이너)                                │   │
│  └─────────────┬───────────────────────────────────┘   │
│                │                                         │
│    ┌───────────┴───────────┐                            │
│    │                       │                            │
│    ▼                       ▼                            │
│  ┌──────────────┐    ┌──────────────┐                  │
│  │ useFocusDetection │ IdleBreakGuide │                │
│  │  (감지 훅)   │    │ (가이드 UI)   │                │
│  └──────┬───────┘    └───────┬──────┘                  │
│         │                    │                          │
│         └────────┬───────────┘                          │
│                  │                                       │
│                  ▼                                       │
│         ┌────────────────────┐                          │
│         │ focusTrackingService │                        │
│         │  (이벤트 전송)      │                         │
│         └─────────┬──────────┘                          │
└───────────────────┼──────────────────────────────────────┘
                    │
                    │ HTTP/REST
                    │
┌───────────────────▼──────────────────────────────────────┐
│                Backend (Node.js + Express)               │
├──────────────────────────────────────────────────────────┤
│                                                           │
│  ┌────────────────────────────────────────────────┐     │
│  │  /api/focus-tracking/*                         │     │
│  │  (REST API Endpoints)                          │     │
│  └─────────────┬──────────────────────────────────┘     │
│                │                                         │
│                ▼                                         │
│  ┌──────────────────────────────────────────────┐       │
│  │  FocusTrackingController                     │       │
│  └─────────────┬────────────────────────────────┘       │
│                │                                         │
│                ▼                                         │
│  ┌──────────────────────────────────────────────┐       │
│  │  FocusTrackingService                        │       │
│  │  (비즈니스 로직)                             │       │
│  └─────────────┬────────────────────────────────┘       │
└────────────────┼────────────────────────────────────────┘
                 │
                 │ SQL
                 │
┌────────────────▼─────────────────────────────────────────┐
│              PostgreSQL Database                         │
├──────────────────────────────────────────────────────────┤
│                                                           │
│  • focus_tracking_events      (이벤트 저장)             │
│  • student_focus_summary      (요약 통계)               │
│  • focus_tracking_sessions    (세션 정보)               │
│                                                           │
└──────────────────────────────────────────────────────────┘
```

---

## 주요 기능

### 1. 집중 이탈 감지

#### 감지 방법

1. **Page Visibility API**
   - 탭 전환 감지
   - 브라우저 최소화 감지

2. **활동 추적**
   - 마우스 이동
   - 키보드 입력
   - 스크롤
   - 터치 이벤트

3. **비활동 임계값**
   - 기본: 30초
   - 커스터마이징 가능

#### 감지 이벤트

```typescript
{
  eventType: 'focus_lost',
  timestamp: 1700000000000,
  studentId: 'student123',
  moduleId: 'module456',
  sessionId: 'session_abc123',
  metadata: {
    idleTime: 30000,  // 30초
    pageUrl: '/learn/fractions'
  }
}
```

### 2. 15초 멍때리기 가이드

#### 활동 유형

| 아이콘 | 활동명 | 설명 |
|--------|--------|------|
| 🫁 | 호흡하기 | 4초 들이마시기 → 2초 정지 → 4초 내쉬기 |
| 🤸 | 스트레칭 | 팔, 목, 어깨, 허리 스트레칭 |
| 👁️ | 눈 휴식 | 눈 감기, 먼 곳 보기, 눈동자 운동 |
| 🧘 | 마음챙김 | 현재 순간 집중, 감각 느끼기 |

#### UI 특징

- **원형 타이머**: 15초 카운트다운
- **단계별 지침**: 4단계 가이드
- **진행률 표시**: 하단 프로그레스 바
- **건너뛰기**: 선택적으로 비활성화 가능
- **애니메이션**: 부드러운 전환 효과

### 3. LMS 연동

#### 수집 데이터

- 집중 이탈 횟수
- 휴식 완료/건너뛰기 횟수
- 총 집중 시간 / 비활동 시간
- 세션별 활동 내역
- 모듈별 집중도 패턴

#### 통계 분석

```typescript
interface FocusStatistics {
  studentId: string;
  moduleId: string;
  totalFocusTime: number;        // 총 집중 시간 (초)
  totalIdleTime: number;         // 총 비활동 시간 (초)
  focusLostCount: number;        // 집중 이탈 횟수
  breaksCompleted: number;       // 완료한 휴식 횟수
  breaksSkipped: number;         // 건너뛴 휴식 횟수
  averageBreakDuration: number;  // 평균 휴식 시간 (초)
  lastActivityTimestamp: number; // 마지막 활동 시간
}
```

---

## 설치 및 설정

### 1. 데이터베이스 설정

```bash
# PostgreSQL 접속
psql -U postgres

# 데이터베이스 생성
CREATE DATABASE ai_education;

# 마이그레이션 실행
\c ai_education
\i backend/src/database/migrations/001_create_focus_tracking_tables.sql
```

### 2. 백엔드 설정

```bash
cd backend

# 환경 변수 설정
cp .env.example .env

# .env 파일 수정
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ai_education
DB_USER=postgres
DB_PASSWORD=your_password

# 의존성 설치
npm install

# 서버 시작
npm run dev
```

### 3. 프론트엔드 설정

```bash
cd frontend

# 의존성 설치
npm install

# 개발 서버 시작
npm run dev
```

---

## 사용 방법

### 기본 사용법

```tsx
import { StudentLearningContainer } from './components/StudentLearningContainer';

function LearningPage() {
  return (
    <StudentLearningContainer
      studentId="student123"
      moduleId="module456"
      idleThreshold={30000}    // 30초
      breakDuration={15}        // 15초
      enableBreakGuide={true}
      allowSkipBreak={true}
    >
      {/* 학습 콘텐츠 */}
      <YourLearningContent />
    </StudentLearningContainer>
  );
}
```

### 고급 사용법

#### 1. 커스텀 감지 로직

```tsx
import { useFocusDetection } from './hooks/useFocusDetection';

function CustomComponent() {
  const { isFocusLost, idleTime } = useFocusDetection({
    idleThreshold: 60000, // 60초
    trackVisibility: true,
    trackActivity: true,
    onFocusLost: () => {
      console.log('Focus lost!');
      // 커스텀 처리
    },
    onIdleDetected: (time) => {
      console.log('Idle time:', time);
      // 커스텀 처리
    },
  });

  return (
    <div>
      {isFocusLost && <p>집중해주세요!</p>}
      <p>비활동 시간: {Math.floor(idleTime / 1000)}초</p>
    </div>
  );
}
```

#### 2. 독립적으로 휴식 가이드 사용

```tsx
import { IdleBreakGuide } from './components/IdleBreakGuide';

function CustomBreak() {
  const [showBreak, setShowBreak] = useState(false);

  return (
    <>
      <button onClick={() => setShowBreak(true)}>
        휴식하기
      </button>

      <IdleBreakGuide
        isOpen={showBreak}
        duration={15}
        onComplete={() => {
          setShowBreak(false);
          console.log('휴식 완료!');
        }}
        onLogActivity={(activity) => {
          console.log('Activity:', activity);
        }}
      />
    </>
  );
}
```

#### 3. 통계 조회

```tsx
import focusTrackingService from './services/focusTrackingService';

async function fetchStatistics() {
  const stats = await focusTrackingService.getStatistics(
    'student123',
    'module456'
  );

  console.log('집중 통계:', stats);
  // {
  //   totalFocusTime: 3600,
  //   focusLostCount: 5,
  //   breaksCompleted: 3,
  //   ...
  // }
}
```

---

## API 문서

### POST /api/focus-tracking/events

집중 추적 이벤트 기록

**Request Body:**
```json
{
  "events": [
    {
      "eventType": "focus_lost",
      "timestamp": 1700000000000,
      "studentId": "student123",
      "moduleId": "module456",
      "sessionId": "session_abc123",
      "metadata": {
        "idleTime": 30000
      }
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Successfully logged 1 events",
  "count": 1
}
```

### GET /api/focus-tracking/statistics

학생의 집중도 통계 조회

**Query Parameters:**
- `studentId` (required): 학생 ID
- `moduleId` (required): 모듈 ID

**Response:**
```json
{
  "studentId": "student123",
  "moduleId": "module456",
  "totalFocusTime": 3600,
  "totalIdleTime": 300,
  "focusLostCount": 5,
  "breaksCompleted": 3,
  "breaksSkipped": 2,
  "averageBreakDuration": 14.5,
  "lastActivityTimestamp": 1700000000000
}
```

### GET /api/focus-tracking/sessions/:sessionId

세션 상세 정보 조회

**Response:**
```json
{
  "sessionId": "session_abc123",
  "studentId": "student123",
  "moduleId": "module456",
  "startedAt": 1700000000000,
  "endedAt": 1700003600000,
  "events": [...]
}
```

### GET /api/focus-tracking/reports/daily

일별 집중도 리포트

**Query Parameters:**
- `studentId` (required): 학생 ID
- `date` (required): 날짜 (ISO 8601 형식)

**Response:**
```json
{
  "studentId": "student123",
  "date": "2024-11-18T00:00:00.000Z",
  "totalSessions": 3,
  "focusLostCount": 5,
  "breaksCompleted": 3,
  "breaksSkipped": 2,
  "averageBreakDuration": 14.5
}
```

### GET /api/focus-tracking/reports/module

모듈별 집중도 리포트

**Query Parameters:**
- `moduleId` (required): 모듈 ID

**Response:**
```json
{
  "moduleId": "module456",
  "totalStudents": 25,
  "totalSessions": 150,
  "averageFocusLostPerSession": 2.3,
  "averageBreaksCompletedPerSession": 1.8,
  "focusLostStandardDeviation": 0.8
}
```

---

## 데이터베이스 스키마

### focus_tracking_events

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | SERIAL | Primary Key |
| event_type | VARCHAR(50) | 이벤트 타입 |
| timestamp | TIMESTAMPTZ | 이벤트 발생 시간 |
| student_id | VARCHAR(255) | 학생 ID |
| module_id | VARCHAR(255) | 모듈 ID |
| session_id | VARCHAR(255) | 세션 ID |
| metadata | JSONB | 추가 메타데이터 |
| created_at | TIMESTAMPTZ | 생성 시간 |

### student_focus_summary

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | SERIAL | Primary Key |
| student_id | VARCHAR(255) | 학생 ID |
| module_id | VARCHAR(255) | 모듈 ID |
| total_focus_time_seconds | NUMERIC | 총 집중 시간 (초) |
| total_idle_time_seconds | NUMERIC | 총 비활동 시간 (초) |
| focus_lost_count | INTEGER | 집중 이탈 횟수 |
| breaks_completed | INTEGER | 완료한 휴식 횟수 |
| breaks_skipped | INTEGER | 건너뛴 휴식 횟수 |
| average_break_duration_seconds | NUMERIC | 평균 휴식 시간 (초) |
| last_activity_at | TIMESTAMPTZ | 마지막 활동 시간 |
| updated_at | TIMESTAMPTZ | 업데이트 시간 |

### focus_tracking_sessions

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | SERIAL | Primary Key |
| session_id | VARCHAR(255) | 세션 ID (UNIQUE) |
| student_id | VARCHAR(255) | 학생 ID |
| module_id | VARCHAR(255) | 모듈 ID |
| started_at | TIMESTAMPTZ | 시작 시간 |
| ended_at | TIMESTAMPTZ | 종료 시간 |
| total_duration_seconds | NUMERIC | 총 세션 시간 (초) |
| focus_lost_count | INTEGER | 집중 이탈 횟수 |
| breaks_completed | INTEGER | 완료한 휴식 횟수 |
| breaks_skipped | INTEGER | 건너뛴 휴식 횟수 |
| created_at | TIMESTAMPTZ | 생성 시간 |
| updated_at | TIMESTAMPTZ | 업데이트 시간 |

---

## 커스터마이징

### 1. 휴식 활동 추가

`frontend/src/components/IdleBreakGuide.tsx` 파일의 `BREAK_ACTIVITIES` 배열에 새 활동 추가:

```typescript
const BREAK_ACTIVITIES: BreakActivity[] = [
  // ... 기존 활동들
  {
    type: 'custom_activity',
    title: '나만의 활동',
    description: '설명',
    instructions: [
      '단계 1',
      '단계 2',
      '단계 3',
      '단계 4',
    ],
    icon: '🎯',
  },
];
```

### 2. 감지 임계값 조정

```tsx
<StudentLearningContainer
  idleThreshold={60000}  // 60초로 변경
  breakDuration={30}      // 30초로 변경
>
```

### 3. 스타일 커스터마이징

`frontend/src/components/IdleBreakGuide.css` 파일 수정:

```css
.idle-break-container {
  background: linear-gradient(135deg, #your-color-1 0%, #your-color-2 100%);
  /* 원하는 스타일 적용 */
}
```

### 4. 데이터 보존 기간 설정

기본적으로 30일 이상 오래된 이벤트를 삭제합니다. 기간 변경:

```sql
-- migrations 파일에서 수정
DELETE FROM focus_tracking_events
WHERE timestamp < NOW() - INTERVAL '90 days';  -- 90일로 변경
```

---

## 성능 최적화

### 1. 이벤트 배치 전송

- 10초마다 자동으로 이벤트 큐 전송
- 페이지 언로드 시 즉시 전송
- 중요 이벤트 (focus_lost, break_completed) 즉시 전송

### 2. 데이터베이스 최적화

- 인덱스 활용 (student_id, module_id, session_id, timestamp)
- 요약 테이블 자동 업데이트 (트리거 사용)
- 오래된 데이터 정기 삭제

### 3. 프론트엔드 최적화

- `useCallback`/`useMemo` 활용
- 이벤트 리스너 최적화
- CSS 애니메이션 (GPU 가속)

---

## 접근성

### 준수 사항

- ✅ WCAG 2.1 Level AA
- ✅ 키보드 네비게이션 지원
- ✅ 스크린 리더 지원 (ARIA 속성)
- ✅ 고대비 모드 지원
- ✅ 애니메이션 감소 모드 지원

### ARIA 속성

```tsx
<div
  role="dialog"
  aria-modal="true"
  aria-labelledby="idle-break-title"
  aria-describedby="idle-break-description"
>
```

---

## 문제 해결

### 1. 이벤트가 저장되지 않음

- 데이터베이스 연결 확인
- 환경 변수 확인 (.env)
- 네트워크 탭에서 API 요청 확인

### 2. 집중 이탈이 감지되지 않음

- 브라우저 권한 확인
- idleThreshold 값 확인
- 개발자 도구 콘솔 확인

### 3. 휴식 가이드가 표시되지 않음

- `enableBreakGuide` prop 확인
- CSS 파일 로드 확인
- z-index 충돌 확인

---

## 라이선스

MIT License

---

## 지원

문의사항이나 버그 리포트는 GitHub Issues를 이용해주세요.
