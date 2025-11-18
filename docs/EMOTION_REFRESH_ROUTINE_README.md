# 1분 감정 리프레시 루틴 - 개발자 문서

**버전**: 1.0.0
**날짜**: 2025-11-18
**작성자**: AI Education System Development Team

---

## 📋 목차

1. [개요](#개요)
2. [시스템 아키텍처](#시스템-아키텍처)
3. [설치 및 설정](#설치-및-설정)
4. [백엔드 구현](#백엔드-구현)
5. [프론트엔드 구현](#프론트엔드-구현)
6. [API 레퍼런스](#api-레퍼런스)
7. [사용 예제](#사용-예제)
8. [배포 가이드](#배포-가이드)
9. [문제 해결](#문제-해결)

---

## 개요

### 기능 설명

1분 감정 리프레시 루틴은 학생들의 감정 상태를 모니터링하고, AI 기반 맞춤형 웰니스 활동을 제공하는 시스템입니다.

**핵심 기능:**
- 🎯 실시간 감정 체크인
- 🤖 Claude AI 기반 맞춤형 활동 생성
- ⏱️ 정확히 60초 리프레시 루틴
- 📊 감정 트렌드 분석
- 👨‍🏫 교사 대시보드 (집계 데이터)

### 기술 스택

**백엔드:**
- Python 3.11+
- FastAPI
- PostgreSQL 15+
- Anthropic Claude API (Sonnet 4.5)
- asyncpg

**프론트엔드:**
- React 18+
- TypeScript
- Axios
- CSS3 (Animations)

---

## 시스템 아키텍처

### 전체 구조

```
┌─────────────────────────────────────────────────────────┐
│                  Frontend (React)                       │
│                                                         │
│  EmotionCheckInWidget  →  RefreshRoutinePlayer         │
│           ↓                        ↓                    │
│     useEmotionState Hook                                │
│           ↓                                             │
│     emotionApi Service                                  │
└──────────────────┬──────────────────────────────────────┘
                   │ REST API
┌──────────────────┼──────────────────────────────────────┐
│                  │  Backend (Python FastAPI)            │
│                  ↓                                      │
│  emotion_routes.py → emotion_service.py                 │
│                   → routine_generator.py                │
│                          ↓                              │
│                   Claude API (Activity Gen)             │
│                          ↓                              │
│                   PostgreSQL Database                   │
└──────────────────────────────────────────────────────────┘
```

### 데이터 흐름

1. **체크인 흐름:**
```
Student → CheckIn Widget → API → EmotionService → Database
                                      ↓
                              Should Suggest?
                                      ↓
                           Return suggested activity
```

2. **활동 생성 흐름:**
```
Request → RoutineGenerator → Claude API → Generated Activity
              ↓                              ↓
         Cache Check                    Save to DB
              ↓                              ↓
      Use Cached (70%)                Create Session
```

3. **완료 흐름:**
```
Player → Complete Request → Update Session → Update Stats
              ↓                    ↓              ↓
        Post Emotion        Calculate      Activity
                          Improvement    Effectiveness
```

---

## 설치 및 설정

### 1. 백엔드 설정

#### 환경 변수 설정

`.env` 파일 생성:
```bash
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/kaist_academy

# Anthropic API
ANTHROPIC_API_KEY=your_api_key_here
CLAUDE_MODEL=claude-sonnet-4-5-20250929

# Server
API_PORT=8000
API_HOST=0.0.0.0

# CORS
CORS_ORIGINS=http://localhost:3000,http://localhost:5173
```

#### 데이터베이스 초기화

```bash
cd /home/user/alt42standalone_v1.0

# PostgreSQL 연결
psql -U postgres

# 데이터베이스 생성
CREATE DATABASE kaist_academy;

# 스키마 적용
\c kaist_academy
\i database/schemas/emotion_schema.sql

# 또는 마이그레이션 실행
\i database/migrations/001_create_emotion_tables.sql
```

#### Python 의존성 설치

```bash
cd backend

# 가상환경 생성
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 의존성 설치
pip install -r requirements.txt
```

`requirements.txt` 내용:
```
fastapi==0.104.1
uvicorn[standard]==0.24.0
asyncpg==0.29.0
anthropic==0.7.0
pydantic==2.5.0
python-dotenv==1.0.0
```

#### 서버 실행

```bash
cd backend/src
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### 2. 프론트엔드 설정

#### 의존성 설치

```bash
cd frontend

# NPM 의존성 설치
npm install
```

`package.json`에 다음 추가:
```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "axios": "^1.6.0",
    "typescript": "^5.2.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@types/node": "^20.0.0"
  }
}
```

#### 환경 변수 설정

`.env` 파일 생성:
```
REACT_APP_API_BASE_URL=http://localhost:8000
```

#### 개발 서버 실행

```bash
npm start
# 또는
npm run dev
```

---

## 백엔드 구현

### 주요 파일 구조

```
backend/
├── src/
│   ├── models/
│   │   └── emotion.py          # Pydantic 모델
│   ├── services/
│   │   ├── emotion_service.py  # 감정 비즈니스 로직
│   │   └── routine_generator.py # AI 활동 생성
│   ├── routes/
│   │   └── emotion_routes.py   # FastAPI 라우트
│   ├── prompts/
│   │   └── emotion_refresh_prompts.py # Claude 프롬프트
│   └── main.py                 # FastAPI 앱
├── requirements.txt
└── .env
```

### 핵심 서비스 사용법

#### EmotionService

```python
from services.emotion_service import EmotionService

# 초기화
service = EmotionService(db_pool)

# 체크인 생성
response = await service.create_check_in(
    EmotionCheckInRequest(
        student_id=student_id,
        emotion_type=EmotionType.STRESSED,
        emotion_score=7
    )
)

# 학생 히스토리 조회
history = await service.get_student_history(
    student_id=student_id,
    days=7
)

# 모듈 분석 조회 (교사)
analytics = await service.get_module_analytics(
    module_id=module_id,
    date=datetime.now()
)
```

#### RoutineGeneratorService

```python
from services.routine_generator import RoutineGeneratorService

# 초기화
generator = RoutineGeneratorService(
    db_pool=db_pool,
    anthropic_api_key=api_key
)

# 활동 생성
activity_response = await generator.generate_activity(
    GenerateActivityRequest(
        student_id=student_id,
        emotion_type=EmotionType.STRESSED,
        emotion_score=7,
        grade_level=5
    )
)

# 세션 완료
complete_response = await generator.complete_session(
    CompleteSessionRequest(
        session_id=session_id,
        post_emotion_type=EmotionType.FOCUSED,
        post_emotion_score=4,
        completed=True,
        student_rating=StudentRating.THUMBS_UP
    )
)
```

---

## 프론트엔드 구현

### 주요 파일 구조

```
frontend/src/
├── components/
│   └── EmotionRefresh/
│       ├── EmotionCheckInWidget.tsx
│       ├── EmotionCheckInWidget.css
│       ├── RefreshRoutinePlayer.tsx
│       ├── RefreshRoutinePlayer.css
│       └── index.ts
├── hooks/
│   └── useEmotionState.ts
├── services/
│   └── emotionApi.ts
└── types/
    └── emotion.ts
```

### 컴포넌트 사용법

#### EmotionCheckInWidget

```tsx
import { EmotionCheckInWidget } from './components/EmotionRefresh';

function App() {
  return (
    <div>
      <EmotionCheckInWidget
        studentId="123e4567-e89b-12d3-a456-426614174000"
        moduleId="module-uuid"
        sessionDurationMinutes={25}
        onCheckInComplete={(response) => {
          console.log('Check-in complete:', response);
        }}
        onActivitySuggested={(activityId, response) => {
          console.log('Activity suggested:', activityId);
          // 활동 플레이어 열기
        }}
      />
    </div>
  );
}
```

#### RefreshRoutinePlayer

```tsx
import { RefreshRoutinePlayer } from './components/EmotionRefresh';
import { useEmotionState } from './hooks/useEmotionState';

function ActivityExample() {
  const { generateActivity } = useEmotionState();
  const [activityData, setActivityData] = useState(null);

  const handleGenerateActivity = async () => {
    const response = await generateActivity({
      student_id: studentId,
      emotion_type: 'stressed',
      emotion_score: 7,
      grade_level: 5,
    });
    setActivityData(response);
  };

  return (
    <>
      {activityData && (
        <RefreshRoutinePlayer
          activity={activityData.activity}
          sessionId={activityData.session_id}
          studentId={studentId}
          preEmotionType="stressed"
          preEmotionScore={7}
          onComplete={(response) => {
            console.log('Session complete:', response);
            // 개선 점수 표시, 배지 등
          }}
          onClose={() => setActivityData(null)}
        />
      )}
    </>
  );
}
```

#### useEmotionState Hook

```tsx
import { useEmotionState } from './hooks/useEmotionState';

function EmotionExample() {
  const {
    currentEmotion,
    currentScore,
    loading,
    error,
    checkIn,
    generateActivity,
    completeSession,
  } = useEmotionState();

  const handleCheckIn = async () => {
    try {
      const response = await checkIn({
        student_id: 'uuid',
        emotion_type: 'stressed',
        emotion_score: 7,
      });
      console.log('Check-in successful:', response);
    } catch (err) {
      console.error('Check-in failed:', err);
    }
  };

  return (
    <div>
      {loading && <p>로딩 중...</p>}
      {error && <p>오류: {error}</p>}
      {currentEmotion && (
        <p>현재 감정: {currentEmotion} ({currentScore}/10)</p>
      )}
    </div>
  );
}
```

---

## API 레퍼런스

### 감정 체크인

#### POST `/api/emotions/check-in`

학생의 감정 상태를 기록합니다.

**Request Body:**
```json
{
  "student_id": "uuid",
  "module_id": "uuid",
  "emotion_type": "stressed",
  "emotion_score": 7,
  "context_note": "수학 문제가 너무 어려워요",
  "session_duration_minutes": 25
}
```

**Response:**
```json
{
  "check_in_id": "uuid",
  "suggested_activity_id": "uuid",
  "message": "잠깐 쉬면서 기분을 전환해볼까요?",
  "timestamp": "2025-11-18T10:30:00Z"
}
```

### 활동 생성

#### POST `/api/refresh/generate`

맞춤형 리프레시 활동을 생성합니다.

**Request Body:**
```json
{
  "student_id": "uuid",
  "emotion_type": "stressed",
  "emotion_score": 7,
  "grade_level": 5,
  "preferences": {
    "preferred_activities": ["breathing", "mindfulness"],
    "avoid_activities": []
  }
}
```

**Response:**
```json
{
  "activity_id": "uuid",
  "session_id": "uuid",
  "activity": {
    "title": "차분한 호흡",
    "description": "4-7-8 호흡법으로 마음을 안정시켜요",
    "activity_type": "breathing",
    "steps": [
      {
        "time_seconds": 0,
        "instruction": "편안하게 앉으세요",
        "duration_seconds": 5,
        "visual_cue": "relax"
      }
    ],
    "total_duration": 60,
    "expected_outcome": "마음이 차분해질 거예요",
    "encouragement": "잘했어요! 🌟"
  }
}
```

### 세션 완료

#### POST `/api/refresh/complete`

리프레시 세션을 완료하고 결과를 기록합니다.

**Request Body:**
```json
{
  "session_id": "uuid",
  "post_emotion_type": "focused",
  "post_emotion_score": 4,
  "completed": true,
  "student_rating": 1,
  "actual_duration_seconds": 62
}
```

**Response:**
```json
{
  "session_id": "uuid",
  "improvement_score": 3.0,
  "message": "좋아요! 기분이 많이 나아졌네요 😊",
  "badges": ["first_refresh", "stress_buster"]
}
```

### 학생 히스토리

#### GET `/api/emotions/student/{student_id}?days=7`

학생의 감정 히스토리를 조회합니다.

**Response:**
```json
{
  "student_id": "uuid",
  "date_range": {
    "start": "2025-11-11",
    "end": "2025-11-18"
  },
  "emotion_trend": [
    {
      "date": "2025-11-18",
      "avg_score": 5.8,
      "check_ins": 4
    }
  ],
  "most_common_emotion": "focused",
  "total_refresh_sessions": 12,
  "avg_improvement": 2.8,
  "total_check_ins": 23
}
```

### 모듈 분석 (교사)

#### GET `/api/emotions/analytics/{module_id}?date=2025-11-18`

모듈의 집계된 감정 분석을 조회합니다.

**Response:**
```json
{
  "module_id": "uuid",
  "date": "2025-11-18",
  "total_students": 25,
  "total_check_ins": 47,
  "avg_emotion_score": 5.8,
  "emotion_distribution": {
    "happy": 12,
    "stressed": 8,
    "tired": 10
  },
  "refresh_participation_rate": 0.68,
  "avg_improvement_score": 2.3
}
```

---

## 사용 예제

### 완전한 워크플로우 예제

```tsx
import React, { useState } from 'react';
import { EmotionCheckInWidget, RefreshRoutinePlayer } from './components/EmotionRefresh';
import { useEmotionState } from './hooks/useEmotionState';

function StudentLearningModule({ studentId, moduleId }) {
  const [showActivity, setShowActivity] = useState(false);
  const [activityData, setActivityData] = useState(null);

  const {
    generateActivity,
    completeSession,
  } = useEmotionState();

  // 체크인 완료 핸들러
  const handleCheckInComplete = async (response) => {
    console.log('Check-in complete:', response.message);

    // 활동이 제안된 경우
    if (response.suggested_activity_id) {
      // 활동 생성
      const activityResponse = await generateActivity({
        student_id: studentId,
        emotion_type: response.emotion_type,
        emotion_score: response.emotion_score,
        grade_level: 5,
      });

      setActivityData(activityResponse);
      setShowActivity(true);
    }
  };

  // 활동 완료 핸들러
  const handleActivityComplete = (response) => {
    console.log('Activity complete!');
    console.log('Improvement:', response.improvement_score);
    console.log('Badges:', response.badges);

    // 메시지 표시
    alert(response.message);

    // 활동 플레이어 닫기
    setShowActivity(false);
    setActivityData(null);
  };

  return (
    <div className="learning-module">
      {/* 학습 콘텐츠 */}
      <div className="module-content">
        <h1>수학 문제 풀기</h1>
        {/* ... */}
      </div>

      {/* 감정 체크인 위젯 */}
      <EmotionCheckInWidget
        studentId={studentId}
        moduleId={moduleId}
        onCheckInComplete={handleCheckInComplete}
      />

      {/* 리프레시 활동 플레이어 */}
      {showActivity && activityData && (
        <RefreshRoutinePlayer
          activity={activityData.activity}
          sessionId={activityData.session_id}
          studentId={studentId}
          preEmotionType={activityData.pre_emotion_type}
          preEmotionScore={activityData.pre_emotion_score}
          onComplete={handleActivityComplete}
          onClose={() => setShowActivity(false)}
        />
      )}
    </div>
  );
}
```

---

## 배포 가이드

### Docker 배포

`Dockerfile` (백엔드):
```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY src/ ./src/

EXPOSE 8000

CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

`docker-compose.yml`:
```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: kaist_academy
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./database/schemas:/docker-entrypoint-initdb.d

  backend:
    build: ./backend
    ports:
      - "8000:8000"
    environment:
      DATABASE_URL: postgresql://postgres:${DB_PASSWORD}@postgres:5432/kaist_academy
      ANTHROPIC_API_KEY: ${ANTHROPIC_API_KEY}
    depends_on:
      - postgres

  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    environment:
      REACT_APP_API_BASE_URL: http://backend:8000

volumes:
  postgres_data:
```

### 프로덕션 배포 체크리스트

- [ ] 환경 변수 설정 (API 키, DB 비밀번호 등)
- [ ] CORS 설정 확인
- [ ] 데이터베이스 마이그레이션 실행
- [ ] SSL/TLS 인증서 설정
- [ ] 로그 수집 설정 (Sentry, CloudWatch 등)
- [ ] 모니터링 설정 (Prometheus, Grafana)
- [ ] 백업 자동화
- [ ] 로드 밸런싱 설정

---

## 문제 해결

### 자주 발생하는 문제

#### 1. Claude API 응답 느림

**증상**: 활동 생성이 3초 이상 걸림

**해결책**:
- 캐싱 비율 증가 (70% → 85%)
- 프리페칭: 자주 사용되는 활동 미리 생성
- 타임아웃 설정: 5초 후 기본 활동 반환

#### 2. 데이터베이스 연결 오류

**증상**: `asyncpg.exceptions.ConnectionError`

**해결책**:
```python
# 연결 풀 설정 확인
db_pool = await asyncpg.create_pool(
    DATABASE_URL,
    min_size=10,
    max_size=20,
    command_timeout=60
)
```

#### 3. 프론트엔드 CORS 오류

**증상**: `Access-Control-Allow-Origin` 오류

**해결책**:
```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

#### 4. 타이머 정확도 문제

**증상**: 60초 루틴이 59초 또는 61초에 종료

**해결책**:
- `setInterval` 대신 `requestAnimationFrame` 사용
- 시작 시간 기준으로 경과 시간 계산
- 드리프트 보정 추가

---

## 추가 리소스

- [FastAPI 공식 문서](https://fastapi.tiangolo.com/)
- [Anthropic Claude API 문서](https://docs.anthropic.com/)
- [React 공식 문서](https://react.dev/)
- [PRD 문서](../tasks/0002-prd-emotion-refresh-routine.md)

---

## 라이선스

이 프로젝트는 KAIST Touch Math Academy의 일부입니다.

---

**문의**: AI Education System Development Team
