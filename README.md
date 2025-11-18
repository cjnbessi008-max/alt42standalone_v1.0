# LMS 문제 시간 추적 시스템

LMS(Learning Management System)와 연동하여 학생들의 문제당 소비시간을 정확하게 추적하고 분석하는 시스템입니다.

## 주요 기능

### 1. 실시간 시간 추적
- 문제 시작/종료 자동 감지
- 실제 활동 시간 계산 (탭 전환, 포커스 이탈 고려)
- 밀리초 단위 정확도

### 2. 상호작용 분석
- 클릭 이벤트 추적
- 힌트 요청 횟수
- 문제 풀이 패턴 분석

### 3. 통계 및 분석
- 문제별 평균 소요 시간
- 정답률 분석
- 학생별 진도 추적
- 시간대별 성과 분석

### 4. LMS 통합
- Canvas, Moodle, Blackboard 등 주요 LMS 지원
- JavaScript SDK 제공
- REST API 지원
- LTI 1.3 표준 준수

## 시스템 아키텍처

```
┌─────────────┐
│   LMS       │
│  (Canvas,   │
│  Moodle 등) │
└──────┬──────┘
       │
       │ JavaScript SDK / REST API
       │
┌──────▼──────────────────────┐
│   Frontend (React)          │
│  - ProblemTimeTracker       │
│  - ProblemStatistics        │
│  - useProblemTimeTracking   │
└──────┬──────────────────────┘
       │
       │ HTTP/HTTPS
       │
┌──────▼──────────────────────┐
│   Backend API (Node.js)     │
│  - Time Tracking API        │
│  - Student API              │
│  - Problem API              │
└──────┬──────────────────────┘
       │
       │ PostgreSQL
       │
┌──────▼──────────────────────┐
│   Database                  │
│  - students                 │
│  - problems                 │
│  - problem_attempts         │
│  - time_tracking_events     │
│  - problem_time_analytics   │
└─────────────────────────────┘
```

## 빠른 시작

### 사전 요구사항

- Node.js 18+
- PostgreSQL 15+
- Docker & Docker Compose (선택사항)

### Docker를 사용한 실행

```bash
# 1. 환경 변수 설정
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# 2. Docker Compose로 전체 스택 실행
docker-compose up -d

# 3. 데이터베이스 초기화 확인
docker-compose logs postgres

# 4. 브라우저에서 접속
# Frontend: http://localhost:5173
# Backend API: http://localhost:3000
```

### 수동 설치

#### 1. 데이터베이스 설정

```bash
# PostgreSQL 설치 및 실행
sudo apt-get install postgresql

# 데이터베이스 생성
createdb lms_tracking

# 스키마 적용
psql -d lms_tracking -f database/schema.sql
```

#### 2. 백엔드 설정

```bash
cd backend

# 의존성 설치
npm install

# 환경 변수 설정
cp .env.example .env
# .env 파일 편집 (DATABASE_URL 등)

# 서버 실행
npm run dev
# 서버가 http://localhost:3000 에서 실행됩니다
```

#### 3. 프론트엔드 설정

```bash
cd frontend

# 의존성 설치
npm install

# 환경 변수 설정
cp .env.example .env

# 개발 서버 실행
npm run dev
# 앱이 http://localhost:5173 에서 실행됩니다
```

## API 사용법

### REST API 엔드포인트

#### 문제 시도 시작

```http
POST /api/time-tracking/start
Content-Type: application/json

{
  "student_id": "student_001",
  "problem_id": "problem_math_001"
}
```

#### 시간 이벤트 기록

```http
POST /api/time-tracking/event
Content-Type: application/json

{
  "attempt_id": "uuid-here",
  "event_type": "interaction",
  "event_data": { "element": "BUTTON" }
}
```

#### 문제 완료

```http
POST /api/time-tracking/complete
Content-Type: application/json

{
  "attempt_id": "uuid-here",
  "is_correct": true,
  "answer_data": { "answer": "42" }
}
```

#### 학생 시도 기록 조회

```http
GET /api/time-tracking/attempts/{student_id}
GET /api/time-tracking/attempts/{student_id}?problem_id={problem_id}
```

#### 문제 통계 조회

```http
GET /api/time-tracking/statistics/{problem_id}
```

### JavaScript SDK 사용

```html
<!-- SDK 로드 -->
<script src="lms-time-tracking-sdk.js"></script>

<script>
  // SDK 초기화
  const tracker = LMSTimeTracking.init({
    apiUrl: 'http://localhost:3000/api',
    studentId: 'student_001',
    autoTrack: true,  // 자동 상호작용 추적
    debug: true       // 디버그 로그
  });

  // 문제 시작
  await tracker.startProblem('problem_001');

  // 상호작용 기록
  await tracker.recordInteraction('problem_001', {
    action: 'click',
    element: 'hint-button'
  });

  // 힌트 요청
  await tracker.recordHintRequest('problem_001');

  // 답안 제출
  const result = await tracker.submitAnswer('problem_001', true, {
    answer: '42'
  });

  console.log('Time spent:', result.time_spent_seconds, 'seconds');
</script>
```

### React 컴포넌트 사용

```jsx
import { ProblemTimeTracker } from './components/ProblemTimeTracker';

function MyProblem() {
  return (
    <ProblemTimeTracker
      studentId="student_001"
      problemId="problem_001"
      showTimer={true}
      autoStart={true}
      onComplete={(result) => {
        console.log('Completed!', result);
      }}
    >
      {({ handleSubmit, handleHintClick, recordInteraction }) => (
        <div>
          <h2>2 + 2 = ?</h2>
          <input
            type="text"
            onChange={(e) => recordInteraction({ action: 'typing' })}
          />
          <button onClick={handleHintClick}>힌트</button>
          <button onClick={() => handleSubmit(true, { answer: '4' })}>
            제출
          </button>
        </div>
      )}
    </ProblemTimeTracker>
  );
}
```

### Custom Hook 사용

```jsx
import { useProblemTimeTracking } from './hooks/useProblemTimeTracking';

function MyComponent() {
  const {
    isTracking,
    elapsedTime,
    formattedTime,
    startTracking,
    stopTracking,
    recordInteraction,
    completeAttempt,
  } = useProblemTimeTracking('student_001', 'problem_001', true);

  return (
    <div>
      <div>Time: {formattedTime}</div>
      <button onClick={() => recordInteraction({ action: 'click' })}>
        Click me
      </button>
      <button onClick={() => completeAttempt(true, { answer: '42' })}>
        Submit
      </button>
    </div>
  );
}
```

## LMS 통합 가이드

### Canvas LMS

1. Canvas 관리자 페이지에서 외부 앱 추가
2. LTI 1.3 설정 또는 JavaScript SDK 임베드
3. 자세한 내용: [lms-integration/canvas/README.md](lms-integration/README.md)

### Moodle

1. Moodle 플러그인 설치 또는 HTML 블록에 SDK 추가
2. API 키 설정
3. 자세한 내용: [lms-integration/moodle/README.md](lms-integration/README.md)

### 기타 LMS

JavaScript SDK를 사용하여 모든 웹 기반 LMS와 통합 가능합니다:

```html
<!-- LMS 문제 페이지에 추가 -->
<script src="https://your-domain.com/lms-time-tracking-sdk.js"></script>
<script>
  const tracker = LMSTimeTracking.init({
    apiUrl: 'https://your-api.com/api',
    studentId: getCurrentStudentId(), // LMS에서 학생 ID 가져오기
  });

  tracker.startProblem(getCurrentProblemId());
</script>
```

## 데이터베이스 스키마

### 주요 테이블

#### `students` - 학생 정보
- `id` (UUID, Primary Key)
- `student_id` (VARCHAR, Unique) - LMS 학생 ID
- `name` (VARCHAR)
- `email` (VARCHAR)

#### `problems` - 문제 정보
- `id` (UUID, Primary Key)
- `problem_id` (VARCHAR, Unique) - LMS 문제 ID
- `module_id` (VARCHAR) - 모듈/과정 ID
- `title` (VARCHAR)
- `difficulty_level` (INTEGER)

#### `problem_attempts` - 문제 시도 및 시간 추적
- `id` (UUID, Primary Key)
- `student_id` (UUID, Foreign Key)
- `problem_id` (UUID, Foreign Key)
- `started_at` (TIMESTAMP) - 시작 시간
- `completed_at` (TIMESTAMP) - 완료 시간
- `time_spent_seconds` (INTEGER) - 총 소비 시간
- `active_time_seconds` (INTEGER) - 실제 활동 시간
- `is_correct` (BOOLEAN) - 정답 여부
- `interaction_count` (INTEGER) - 상호작용 횟수
- `hint_requests` (INTEGER) - 힌트 요청 횟수

#### `time_tracking_events` - 상세 시간 이벤트
- `id` (UUID, Primary Key)
- `attempt_id` (UUID, Foreign Key)
- `event_type` (VARCHAR) - start, focus, blur, interaction, hint_request, complete
- `event_timestamp` (TIMESTAMP)
- `event_data` (JSONB) - 추가 이벤트 데이터

## 분석 및 리포트

### 제공되는 통계

1. **문제별 통계**
   - 총 시도 횟수
   - 평균/최소/최대 소요 시간
   - 정답률
   - 평균 상호작용 수

2. **학생별 통계**
   - 문제 풀이 이력
   - 평균 성과
   - 시간 추세

3. **시간대별 분석**
   - 피크 시간 파악
   - 성과 패턴 분석

## 보안 고려사항

- HTTPS 필수 사용 권장
- API 키 인증 (추가 구현 가능)
- CORS 설정 확인
- SQL Injection 방지 (Prepared Statements 사용)
- XSS 방지 (입력 검증)

## 성능 최적화

- 데이터베이스 인덱스 활용
- 연결 풀링 (PostgreSQL Pool)
- 이벤트 배치 처리 (선택사항)
- Redis 캐싱 (선택사항)

## 문제 해결

### 데이터베이스 연결 오류

```bash
# PostgreSQL 실행 확인
sudo systemctl status postgresql

# 연결 테스트
psql -d lms_tracking -U postgres
```

### CORS 오류

backend/.env 파일에서 CORS_ORIGIN 설정 확인:
```
CORS_ORIGIN=http://localhost:5173
```

### SDK 로딩 오류

브라우저 콘솔에서 네트워크 탭 확인, 경로가 정확한지 확인

## 라이선스

MIT License

## 기여

Pull Request와 Issue를 환영합니다!

## 연락처

문의사항이 있으시면 이슈를 등록해주세요.
