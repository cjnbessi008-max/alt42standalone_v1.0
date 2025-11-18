# LMS Wrong Answer Analysis System - Architecture

## 시스템 개요

학생이 스스로 확신했던 문제 중 틀린 문제만 골라서 분석하는 독립형 웹 애플리케이션

### 핵심 가치 제안
- **메타인지 분석**: 학생이 "안다고 생각했지만 틀린" 문제 식별
- **학습 효율성**: 진짜 약점에 집중하여 학습 시간 최적화
- **교사 인사이트**: 학급 전체의 오개념(misconception) 패턴 파악

## 시스템 아키텍처

```
┌─────────────────────────────────────────────────────────────────┐
│                     Frontend (React + TypeScript)                │
│  ┌──────────────────┬──────────────────┬────────────────────┐  │
│  │ Teacher Dashboard│ Student Dashboard│ Analytics View     │  │
│  │ - Class Analysis │ - Self-reflection│ - Charts & Graphs  │  │
│  │ - Student Reports│ - Recommendations│ - Export Reports   │  │
│  └──────────────────┴──────────────────┴────────────────────┘  │
└────────────────────────────┬────────────────────────────────────┘
                             │ REST API / WebSocket
┌────────────────────────────▼────────────────────────────────────┐
│                   API Gateway (Node.js + Express)                │
│  ┌───────────────┬────────────────────┬──────────────────────┐ │
│  │ Authentication│ Moodle Integration │ Data Sync Service    │ │
│  │ (JWT + OAuth) │ (REST API Client)  │ (Scheduled Jobs)     │ │
│  └───────────────┴────────────────────┴──────────────────────┘ │
└──────────┬──────────────────────┬──────────────────────────────┘
           │                      │
┌──────────▼──────────┐  ┌────────▼──────────────────────────────┐
│ Analysis Engine     │  │     PostgreSQL Database               │
│ (Python + FastAPI)  │  │  ┌─────────────────────────────────┐ │
│ ┌─────────────────┐ │  │  │ - users (synced from Moodle)    │ │
│ │ Confidence      │ │  │  │ - quizzes                       │ │
│ │ Wrong Answer    │ │  │  │ - quiz_attempts                 │ │
│ │ Pattern Analyzer│ │  │  │ - confidence_ratings            │ │
│ │ AI Insights     │ │  │  │ - analysis_results              │ │
│ └─────────────────┘ │  │  │ - learning_recommendations      │ │
└─────────────────────┘  │  └─────────────────────────────────┘ │
                         └───────────────────────────────────────┘
                                        │
┌───────────────────────────────────────▼─────────────────────────┐
│                   External: Moodle 3.7 LMS                       │
│  - REST API (Moodle Web Services)                               │
│  - Quiz Data (questions, attempts, grades)                      │
│  - User Data (students, teachers, courses)                      │
└──────────────────────────────────────────────────────────────────┘
```

## 기술 스택

### Frontend
- **Framework**: React 18+ with TypeScript
- **State Management**: Zustand (lightweight, simple)
- **UI Library**: Material-UI (MUI) v5
- **Charts**: Recharts + D3.js
- **Forms**: React Hook Form + Zod validation
- **API Client**: Axios with React Query

### Backend - API Gateway
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Authentication**: Passport.js (JWT + OAuth2)
- **Moodle Client**: Axios with custom Moodle API wrapper
- **Task Scheduling**: node-cron

### Backend - Analysis Engine
- **Runtime**: Python 3.11+
- **Framework**: FastAPI
- **Data Analysis**: pandas, numpy
- **AI/ML**: Claude API (Anthropic) for insights
- **Statistics**: scipy, scikit-learn

### Database
- **Primary DB**: PostgreSQL 15+
- **Caching**: Redis 7+ (optional, for performance)
- **ORM**:
  - Node.js: Prisma
  - Python: SQLAlchemy

### DevOps
- **Containerization**: Docker + Docker Compose
- **Reverse Proxy**: Nginx
- **Environment**: dotenv for configuration

## 데이터 모델

### Core Entities

#### 1. User (Moodle 동기화)
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    moodle_user_id INTEGER UNIQUE NOT NULL,
    username VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    role VARCHAR(50) CHECK (role IN ('student', 'teacher', 'admin')),
    synced_at TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW()
);
```

#### 2. Course (Moodle 동기화)
```sql
CREATE TABLE courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    moodle_course_id INTEGER UNIQUE NOT NULL,
    full_name VARCHAR(500),
    short_name VARCHAR(255),
    teacher_id UUID REFERENCES users(id),
    synced_at TIMESTAMP DEFAULT NOW()
);
```

#### 3. Quiz (Moodle 동기화)
```sql
CREATE TABLE quizzes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    moodle_quiz_id INTEGER UNIQUE NOT NULL,
    course_id UUID REFERENCES courses(id),
    name VARCHAR(500),
    time_limit INTEGER, -- seconds
    questions_count INTEGER,
    synced_at TIMESTAMP DEFAULT NOW()
);
```

#### 4. Question (Moodle 동기화)
```sql
CREATE TABLE questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    moodle_question_id INTEGER UNIQUE NOT NULL,
    quiz_id UUID REFERENCES quizzes(id),
    question_text TEXT,
    question_type VARCHAR(50), -- multichoice, truefalse, shortanswer, essay
    correct_answer TEXT,
    concept_tag VARCHAR(255), -- 예: "fractions_addition", "algebra_linear_equations"
    difficulty_level INTEGER CHECK (difficulty_level BETWEEN 1 AND 5),
    synced_at TIMESTAMP DEFAULT NOW()
);
```

#### 5. Quiz Attempt (Moodle 동기화 + 확신도 추가)
```sql
CREATE TABLE quiz_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    moodle_attempt_id INTEGER UNIQUE NOT NULL,
    quiz_id UUID REFERENCES quizzes(id),
    user_id UUID REFERENCES users(id),
    state VARCHAR(50), -- 'inprogress', 'finished', 'abandoned'
    time_start TIMESTAMP,
    time_finish TIMESTAMP,
    grade DECIMAL(5, 2),
    synced_at TIMESTAMP DEFAULT NOW()
);
```

#### 6. Question Attempt (핵심 데이터)
```sql
CREATE TABLE question_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    moodle_attempt_id INTEGER,
    quiz_attempt_id UUID REFERENCES quiz_attempts(id),
    question_id UUID REFERENCES questions(id),
    user_id UUID REFERENCES users(id),

    -- 답안 정보
    student_answer TEXT,
    is_correct BOOLEAN NOT NULL,
    max_mark DECIMAL(5, 2),
    mark DECIMAL(5, 2),

    -- 확신도 (1-5 척도: 1=전혀 확신 없음, 5=매우 확신함)
    confidence_level INTEGER CHECK (confidence_level BETWEEN 1 AND 5),
    confidence_collected_at TIMESTAMP,

    -- 시간 메타데이터
    time_spent_seconds INTEGER,
    attempt_number INTEGER DEFAULT 1,

    created_at TIMESTAMP DEFAULT NOW(),

    UNIQUE(quiz_attempt_id, question_id)
);

-- 인덱스
CREATE INDEX idx_question_attempts_user ON question_attempts(user_id);
CREATE INDEX idx_question_attempts_question ON question_attempts(question_id);
CREATE INDEX idx_question_attempts_confidence ON question_attempts(confidence_level, is_correct);
```

#### 7. Confidence Wrong Answer (분석 결과)
```sql
CREATE TABLE confidence_wrong_answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_attempt_id UUID REFERENCES question_attempts(id),
    user_id UUID REFERENCES users(id),
    question_id UUID REFERENCES questions(id),

    -- 분석 메타데이터
    confidence_level INTEGER NOT NULL,
    concept_tag VARCHAR(255),
    misconception_type VARCHAR(255), -- 오개념 유형

    -- AI 분석 결과
    ai_analysis JSONB, -- Claude API 분석 결과
    recommended_resources TEXT[], -- 추천 학습 자료
    similar_questions UUID[], -- 유사 문제 ID 배열

    analyzed_at TIMESTAMP DEFAULT NOW(),

    UNIQUE(question_attempt_id)
);
```

#### 8. Learning Recommendation (학습 추천)
```sql
CREATE TABLE learning_recommendations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    concept_tag VARCHAR(255),

    -- 추천 정보
    priority_level INTEGER CHECK (priority_level BETWEEN 1 AND 5),
    recommendation_type VARCHAR(50), -- 'review', 'practice', 'conceptual_help'
    description TEXT,
    resources JSONB, -- 링크, 동영상, 연습 문제 등

    -- 상태 추적
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'in_progress', 'completed', 'dismissed'
    completed_at TIMESTAMP,

    created_at TIMESTAMP DEFAULT NOW()
);
```

## 확신도 수집 전략

### Option 1: Moodle JavaScript Injection (빠른 구현)
- Moodle 퀴즈 페이지에 JavaScript 삽입
- 각 문제 제출 시 확신도 슬라이더 표시
- 데이터를 독립형 앱 API로 전송

### Option 2: Moodle Custom Plugin (권장, 안정적)
- Moodle 퀴즈 behavior plugin 개발 (PHP)
- 네이티브 통합, 데이터 일관성 보장
- 구현 시간: 2-3일

### Option 3: 독립 확신도 수집 인터페이스
- 퀴즈 완료 후 별도 페이지에서 회고적 확신도 수집
- 구현 간단하지만 정확도 낮을 수 있음

**선택**: Option 2 (Moodle Plugin) + 독립형 앱으로 데이터 분석

## API 엔드포인트 설계

### Authentication
```
POST   /api/auth/login              - Moodle OAuth2 로그인
POST   /api/auth/token/refresh      - JWT 토큰 갱신
GET    /api/auth/user               - 현재 사용자 정보
```

### Moodle Sync
```
POST   /api/sync/courses            - 코스 데이터 동기화
POST   /api/sync/quizzes/:courseId  - 특정 코스의 퀴즈 동기화
POST   /api/sync/attempts/:quizId   - 퀴즈 시도 데이터 동기화
GET    /api/sync/status             - 동기화 상태 확인
```

### Confidence Rating
```
POST   /api/confidence/rate         - 확신도 평가 제출
GET    /api/confidence/missing      - 확신도 미수집 문제 목록
```

### Analysis
```
GET    /api/analysis/student/:userId            - 학생별 확신 오답 분석
GET    /api/analysis/class/:courseId            - 학급 전체 분석
GET    /api/analysis/question/:questionId       - 문제별 확신도 분포
GET    /api/analysis/concepts/:userId           - 개념별 취약점
POST   /api/analysis/generate/:userId           - AI 분석 실행
```

### Recommendations
```
GET    /api/recommendations/:userId             - 학습 추천 목록
PUT    /api/recommendations/:id/status          - 추천 상태 업데이트
POST   /api/recommendations/generate/:userId    - 추천 생성
```

### Reports
```
GET    /api/reports/student/:userId/export      - 학생 리포트 PDF
GET    /api/reports/class/:courseId/export      - 학급 리포트 PDF
```

## Moodle REST API 통합

### 필요한 Moodle Web Services

```javascript
// 활성화 필요한 Moodle Web Service Functions
const REQUIRED_MOODLE_FUNCTIONS = [
  // 코스 관련
  'core_course_get_courses',
  'core_enrol_get_enrolled_users',

  // 퀴즈 관련
  'mod_quiz_get_quizzes_by_courses',
  'mod_quiz_get_quiz_access_information',
  'mod_quiz_get_attempt_data',
  'mod_quiz_get_user_attempts',

  // 문제 관련
  'core_question_get_random_question_summaries',

  // 사용자 관련
  'core_user_get_users',
  'core_user_get_users_by_field',
];
```

### 인증 플로우

1. 교사/관리자가 Moodle API 토큰 생성
2. 독립형 앱에 토큰 입력 (초기 설정)
3. 앱이 Moodle REST API로 데이터 가져오기
4. JWT로 앱 내부 인증 관리

## 분석 알고리즘

### 1. Confident Wrong Answer 식별
```python
def identify_confident_wrong_answers(user_id: str, confidence_threshold: int = 4):
    """
    확신도가 높은데 틀린 문제 식별

    Args:
        user_id: 학생 ID
        confidence_threshold: 확신도 임계값 (기본 4점 이상)

    Returns:
        List of question attempts with high confidence but wrong answers
    """
    return QuestionAttempt.query.filter(
        QuestionAttempt.user_id == user_id,
        QuestionAttempt.is_correct == False,
        QuestionAttempt.confidence_level >= confidence_threshold
    ).all()
```

### 2. 개념별 취약점 분석
```python
def analyze_concept_weaknesses(user_id: str):
    """
    개념별 확신 오답률 계산

    Returns:
        {
            'fractions_addition': {
                'total_attempts': 10,
                'confident_wrong': 3,
                'confident_wrong_rate': 0.3,
                'misconception_pattern': '분모를 더하는 오류'
            },
            ...
        }
    """
```

### 3. AI 기반 오개념 분석
```python
async def analyze_misconception_with_ai(question_attempt_id: str):
    """
    Claude API를 사용하여 오개념 분석

    Prompt:
    - 문제 내용
    - 정답
    - 학생 답안
    - 확신도

    AI 분석 결과:
    - 오개념 유형 식별
    - 원인 분석
    - 학습 전략 제안
    """
```

## UI/UX 설계

### Teacher Dashboard
1. **Overview**
   - 학급 전체 확신 오답률 추이
   - 개념별 히트맵
   - 주의가 필요한 학생 목록

2. **Student Detail**
   - 개인별 확신 오답 문제 목록
   - 개념별 취약점 차트
   - AI 분석 결과 요약

3. **Question Analysis**
   - 문제별 확신도 분포
   - 오답 패턴 분석
   - 유사 문제 추천

### Student Dashboard
1. **Self-Reflection**
   - "내가 확신했지만 틀린 문제들"
   - 개념별 나의 약점
   - 학습 추천

2. **Progress Tracking**
   - 확신도 정확성 추이 (메타인지 개선)
   - 복습 완료 상태

## 보안 고려사항

1. **Moodle API 토큰 보안**
   - 환경 변수에 저장
   - 데이터베이스에 암호화 저장 (AES-256)
   - 권한 최소화 (read-only 권장)

2. **사용자 인증**
   - JWT with short expiration (1시간)
   - Refresh token rotation
   - Role-based access control

3. **데이터 프라이버시**
   - 학생 데이터 익명화 옵션
   - GDPR/PIPA 준수
   - 데이터 보관 기간 설정

## 배포 전략

### Development
```bash
docker-compose -f docker-compose.dev.yml up
```

### Production
```bash
docker-compose -f docker-compose.prod.yml up -d
```

### Environment Variables
```env
# Moodle Configuration
MOODLE_URL=https://your-moodle.example.com
MOODLE_TOKEN=your_moodle_webservice_token

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/lms_analysis

# JWT Secret
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRATION=1h

# Claude API (for AI analysis)
CLAUDE_API_KEY=your_anthropic_api_key

# App Config
NODE_ENV=production
PORT=3000
```

## 성능 최적화

1. **데이터 동기화**
   - 증분 동기화 (마지막 동기화 이후 변경분만)
   - 배치 처리 (대량 데이터 효율적 처리)
   - 비동기 작업 큐

2. **분석 캐싱**
   - 분석 결과 Redis 캐싱
   - 데이터 변경 시 캐시 무효화

3. **프론트엔드**
   - React Query로 데이터 캐싱
   - 무한 스크롤 (대량 데이터)
   - 코드 스플리팅

## 향후 확장 계획

1. **Phase 2: 고급 분석**
   - 학습 스타일 분석
   - 예측 모델 (어떤 문제를 틀릴 가능성이 높은지)
   - 또래 비교 분석

2. **Phase 3: 다중 LMS 지원**
   - Canvas LMS
   - Blackboard
   - Google Classroom

3. **Phase 4: 모바일 앱**
   - React Native 앱
   - 푸시 알림 (복습 리마인더)

## 라이선스 및 기여

- **라이선스**: MIT
- **기여 가이드**: CONTRIBUTING.md 참조
