# Alt42 집중력 추적 및 정신정렬 루틴 가이드

## 개요

Alt42 집중력 추적 시스템은 학생의 학습 집중도를 모니터링하고, 집중력이 떨어질 때 자동으로 10초 정신정렬 루틴을 제공하여 학습 효율을 극대화하는 시스템입니다.

## 주요 기능

### 1. 실시간 집중도 추적
- 학생의 상호작용 패턴 모니터링 (클릭, 입력, 스크롤 등)
- 유휴 시간(idle time) 자동 감지
- 집중도 점수 실시간 계산

### 2. 10초 정신정렬 루틴
학생의 집중력이 깨졌을 때 자동으로 제공되는 짧은 루틴:

#### 호흡 정렬 (breathing)
- 심호흡을 통한 집중력 회복
- 시각적 애니메이션 가이드
- 3-2-5 호흡법 (들숨 3초, 정지 2초, 날숨 5초)

#### 스트레칭 (stretching)
- 간단한 스트레칭으로 긴장 해소
- 자세 교정 가이드
- 상체 중심 움직임

#### 눈 운동 (eye_exercise)
- 눈의 피로 완화
- 원거리 응시 훈련
- 깜빡임 유도

### 3. 학생별 맞춤 설정
- 유휴 타임아웃 조정 (기본 2분)
- 선호 루틴 타입 설정
- 자동 휴식 주기 설정 (기본 30분)
- 알림 활성화/비활성화

### 4. 분석 대시보드
- 총 학습 시간 및 세션 수
- 평균 집중도 점수
- 휴식 패턴 분석
- 루틴 효과성 평가

## 시스템 아키텍처

```
┌─────────────────────────────────────────────────────────┐
│                   Frontend (React)                       │
│  ┌──────────────────┐  ┌──────────────────────────┐     │
│  │ Mental Alignment │  │ Focus Tracking Hook      │     │
│  │ Routine Modal    │  │ (useFocusTracking)       │     │
│  └──────────────────┘  └──────────────────────────┘     │
└─────────────────────────────────────────────────────────┘
                          │
                          │ REST API / WebSocket
                          ▼
┌─────────────────────────────────────────────────────────┐
│                Backend (Python FastAPI)                  │
│  ┌──────────────────┐  ┌──────────────────────────┐     │
│  │ Focus Tracking   │  │ Mental Alignment         │     │
│  │ Service          │  │ Routine Service          │     │
│  └──────────────────┘  └──────────────────────────┘     │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│              Database (PostgreSQL 15+)                   │
│  • focus_sessions                                        │
│  • focus_breaks                                          │
│  • mental_alignment_routines                             │
│  • student_focus_preferences                             │
│  • moodle_integration_log                                │
└─────────────────────────────────────────────────────────┘
```

## 기술 스택

### Backend
- **Language**: Python 3.11+
- **Framework**: FastAPI
- **Database**: PostgreSQL 15+
- **ORM**: SQLAlchemy

### Frontend
- **Framework**: React 18+ with TypeScript
- **State Management**: React Hooks
- **HTTP Client**: Axios
- **Styling**: CSS3 with animations

### Moodle Integration
- **Version**: Moodle 3.7+
- **PHP Version**: 7.1.9+
- **MySQL Version**: 5.7+

## 설치 가이드

### 1. 데이터베이스 설정

```bash
# PostgreSQL 데이터베이스 생성
createdb alt42_focus_tracking

# 마이그레이션 실행
psql -d alt42_focus_tracking -f backend/migrations/001_create_focus_tracking_tables.sql
```

### 2. Backend 설정

```bash
cd backend

# 가상환경 생성 및 활성화
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 의존성 설치
pip install fastapi uvicorn sqlalchemy psycopg2-binary python-dotenv

# 환경 변수 설정
cat > .env << EOF
DATABASE_URL=postgresql://postgres:password@localhost:5432/alt42_focus_tracking
SQL_ECHO=false
EOF

# 서버 실행
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 3. Frontend 설정

```bash
cd frontend

# 의존성 설치
npm install

# 환경 변수 설정
cat > .env << EOF
REACT_APP_API_URL=http://localhost:8000
EOF

# 개발 서버 실행
npm start
```

### 4. Moodle 플러그인 설치

```bash
# Moodle 플러그인 디렉토리로 복사
cp -r moodle-integration /path/to/moodle/local/alt42_focus

# Moodle 관리자 페이지에서 플러그인 설치
# Site administration > Notifications
```

#### Moodle 플러그인 설정

1. **Site administration** > **Plugins** > **Local plugins** > **Alt42 Focus Tracking**
2. 다음 설정 입력:
   - **API Base URL**: `http://localhost:8000/api/v1/focus`
   - **API Key**: (선택사항) 인증 토큰
   - **Instance ID**: 현재 Moodle 인스턴스 식별자 (예: `kaist_moodle`)

## API 사용 가이드

### 세션 관리

#### 세션 시작
```http
POST /api/v1/focus/sessions
Content-Type: application/json

{
  "student_id": "kaist_12345",
  "module_id": "math_algebra_01"
}
```

#### 상호작용 기록
```http
POST /api/v1/focus/sessions/{session_id}/interact
```

#### 세션 종료
```http
POST /api/v1/focus/sessions/{session_id}/end
```

### 집중 중단 관리

#### 중단 필요 여부 확인
```http
GET /api/v1/focus/breaks/check/{session_id}?student_id=kaist_12345
```

응답:
```json
{
  "should_trigger_break": true,
  "break_reason": "idle_timeout"
}
```

#### 집중 중단 기록 생성
```http
POST /api/v1/focus/breaks
Content-Type: application/json

{
  "session_id": 123,
  "student_id": "kaist_12345",
  "break_reason": "idle_timeout",
  "idle_duration_seconds": 150,
  "routine_type": "breathing"
}
```

### 정신정렬 루틴

#### 추천 루틴 조회
```http
GET /api/v1/focus/routines/recommend/{student_id}
```

응답:
```json
{
  "id": 1,
  "routine_type": "breathing",
  "title": "10초 호흡 정렬",
  "description": "심호흡을 통한 집중력 회복",
  "duration_seconds": 10,
  "instructions": [
    "눈을 감으세요",
    "코로 깊게 숨을 들이마시세요 (3초)",
    "잠시 멈추세요 (2초)",
    "입으로 천천히 숨을 내쉬세요 (5초)",
    "다시 집중할 준비가 되었습니다"
  ],
  "animation_config": {
    "type": "breathing_circle",
    "colors": ["#4A90E2", "#7ED321"],
    "animation_duration": 10
  }
}
```

### 학생 설정

#### 설정 조회 (없으면 자동 생성)
```http
GET /api/v1/focus/preferences/{student_id}
```

#### 설정 업데이트
```http
PATCH /api/v1/focus/preferences/{student_id}
Content-Type: application/json

{
  "idle_timeout_seconds": 180,
  "preferred_routine_type": "stretching",
  "enable_auto_breaks": true
}
```

### 분석 데이터

#### 학생 분석 데이터 조회
```http
GET /api/v1/focus/analytics/{student_id}?days=30
```

응답:
```json
{
  "student_id": "kaist_12345",
  "total_sessions": 45,
  "total_study_time_minutes": 2340.5,
  "average_focus_score": 78.3,
  "total_breaks": 89,
  "most_common_break_reason": "idle_timeout",
  "favorite_routine_type": "breathing",
  "completion_rate": 92.1,
  "avg_routine_effectiveness": 4.2
}
```

## React 컴포넌트 사용 예시

### useFocusTracking Hook

```typescript
import { useFocusTracking } from './hooks/useFocusTracking';
import MentalAlignmentRoutineModal from './components/MentalAlignmentRoutine';

function LearningModule() {
  const {
    session,
    currentBreak,
    showRoutineModal,
    completeBreak,
    skipBreak,
    triggerManualBreak
  } = useFocusTracking({
    studentId: 'kaist_12345',
    moduleId: 'math_algebra_01',
    autoStart: true
  });

  return (
    <div>
      <h1>학습 모듈</h1>
      <button onClick={triggerManualBreak}>
        휴식 시작
      </button>

      {showRoutineModal && currentBreak && (
        <MentalAlignmentRoutineModal
          isOpen={showRoutineModal}
          breakId={currentBreak.id}
          studentId="kaist_12345"
          onComplete={completeBreak}
          onSkip={skipBreak}
        />
      )}
    </div>
  );
}
```

## Moodle 연동 예시

### 코스 페이지에 집중도 추적 추가

```php
<?php
require_once(__DIR__ . '/local/alt42_focus/classes/focus_tracker.php');

$tracker = new \local_alt42_focus\focus_tracker();

// 세션 시작
$session = $tracker->start_session($USER->id, $COURSE->id, 'course_' . $COURSE->id);

// JavaScript 주입
echo $tracker->inject_tracking_script($USER->id, $COURSE->id, 'course_' . $COURSE->id);
?>
```

### 학생 분석 보기

```php
<?php
$tracker = new \local_alt42_focus\focus_tracker();
$student_id = $tracker->get_student_identifier($USER->id);
$analytics = $tracker->get_analytics($student_id, 30);

echo "총 학습 시간: " . $analytics['total_study_time_minutes'] . " 분<br>";
echo "평균 집중도: " . $analytics['average_focus_score'] . " 점<br>";
?>
```

## 데이터베이스 스키마

### focus_sessions
학생의 학습 세션 집중도 추적

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key |
| student_id | VARCHAR(255) | 학생 ID |
| module_id | VARCHAR(255) | 모듈 ID |
| session_start | TIMESTAMP | 세션 시작 시간 |
| session_end | TIMESTAMP | 세션 종료 시간 |
| focus_score | DECIMAL(5,2) | 집중도 점수 (0-100) |
| interaction_count | INTEGER | 상호작용 횟수 |

### focus_breaks
집중력이 깨진 시점과 정신정렬 루틴 기록

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key |
| session_id | INTEGER | 세션 ID (FK) |
| break_reason | VARCHAR(50) | 중단 이유 |
| routine_type | VARCHAR(50) | 루틴 타입 |
| routine_completed_at | TIMESTAMP | 루틴 완료 시간 |
| effectiveness_rating | INTEGER | 효과성 평가 (1-5) |

## 성능 최적화

### 데이터베이스 인덱스
```sql
CREATE INDEX idx_focus_sessions_student ON focus_sessions(student_id);
CREATE INDEX idx_focus_breaks_session ON focus_breaks(session_id);
```

### API 캐싱
- Redis를 사용한 세션 데이터 캐싱
- 루틴 데이터는 메모리 캐시

### Frontend 최적화
- React.memo를 사용한 컴포넌트 최적화
- useMemo/useCallback을 통한 리렌더링 최소화

## 보안 고려사항

### API 인증
- JWT 토큰 기반 인증
- API 키 관리

### 데이터 보호
- 학생 개인정보 암호화
- HTTPS 통신 강제

### CORS 설정
```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://moodle.kaist.ac.kr"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

## 문제 해결

### API 연결 실패
1. Backend 서버가 실행 중인지 확인
2. 방화벽 설정 확인
3. CORS 설정 확인

### 세션이 생성되지 않음
1. 데이터베이스 연결 확인
2. API 로그 확인
3. 학생 ID 형식 확인

### 루틴 모달이 표시되지 않음
1. 브라우저 콘솔 에러 확인
2. API 응답 확인
3. React 컴포넌트 마운트 확인

## 향후 개선 사항

- [ ] AI 기반 집중도 예측
- [ ] 더 다양한 정신정렬 루틴 추가
- [ ] 실시간 대시보드 (WebSocket)
- [ ] 모바일 앱 지원
- [ ] 다국어 지원 확대
- [ ] Canvas, Blackboard 등 타 LMS 연동

## 라이선스

GNU GPL v3 or later

## 문의

- GitHub Issues: https://github.com/alt42standalone/issues
- Email: support@alt42.com
