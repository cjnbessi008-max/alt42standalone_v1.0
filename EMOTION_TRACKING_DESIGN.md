# LMS 연동 일일 학습 감정 기록 시스템 설계

## 개요
LMS(Learning Management System)와 연동하여 학생들의 일일 학습 감정을 자동으로 기록하고 추적하는 시스템

## 주요 기능

### 1. LMS 연동
- **지원 LMS**: Canvas, Moodle, Google Classroom, KAIST LMS
- **연동 방식**: OAuth 2.0, LTI (Learning Tools Interoperability) 1.3
- **데이터 동기화**:
  - 학생 정보 (이름, ID, 과목)
  - 학습 활동 (로그인, 과제 제출, 강의 수강)
  - 성적 및 진도

### 2. 감정 기록 시스템
- **감정 유형**:
  - 행복 (Happy) 😊
  - 보통 (Neutral) 😐
  - 혼란 (Confused) 😕
  - 좌절 (Frustrated) 😣
  - 자신감 (Confident) 😎

- **기록 시점**:
  - 학습 세션 시작 시
  - 학습 세션 종료 시
  - 과제 제출 후
  - 선택적 중간 체크인

### 3. 자동 일일 기록 생성
- **생성 시간**: 매일 자정 (00:00 KST)
- **생성 내용**:
  - 일일 감정 요약
  - 학습 시간 통계
  - 감정 변화 패턴
  - 주간/월간 트렌드

### 4. 분석 및 시각화
- 감정 타임라인
- 학습 성과와 감정 상관관계
- 교사용 대시보드
- 학생용 자기 성찰 리포트

## 기술 스택

### Backend
- **언어**: TypeScript
- **프레임워크**: Node.js + Express
- **데이터베이스**: PostgreSQL 15+
- **캐시**: Redis
- **작업 큐**: Bull (Redis 기반)
- **인증**: Passport.js (OAuth 2.0)

### Frontend
- **프레임워크**: React 18 + TypeScript
- **상태 관리**: Zustand
- **UI 라이브러리**: Material-UI (MUI)
- **차트**: Recharts
- **라우팅**: React Router v6

### DevOps
- Docker + Docker Compose
- GitHub Actions (CI/CD)

## 데이터 모델

### 1. students (학생)
```sql
CREATE TABLE students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lms_id VARCHAR(255) UNIQUE NOT NULL,
  lms_type VARCHAR(50) NOT NULL, -- 'canvas', 'moodle', 'google_classroom', 'kaist'
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  grade_level INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### 2. learning_sessions (학습 세션)
```sql
CREATE TABLE learning_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id),
  course_id VARCHAR(255),
  course_name VARCHAR(255),
  started_at TIMESTAMP NOT NULL,
  ended_at TIMESTAMP,
  duration_minutes INTEGER,
  activity_type VARCHAR(100), -- 'lecture', 'assignment', 'quiz', 'reading'
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 3. emotion_records (감정 기록)
```sql
CREATE TABLE emotion_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id),
  session_id UUID REFERENCES learning_sessions(id),
  emotion_type VARCHAR(50) NOT NULL, -- 'happy', 'neutral', 'confused', 'frustrated', 'confident'
  intensity INTEGER CHECK (intensity BETWEEN 1 AND 5), -- 1: 약함, 5: 강함
  note TEXT, -- 학생의 추가 코멘트
  context JSONB, -- 감정 발생 컨텍스트 (활동 내용, 문제 난이도 등)
  recorded_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 4. daily_emotion_summaries (일일 감정 요약)
```sql
CREATE TABLE daily_emotion_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id),
  summary_date DATE NOT NULL,
  total_learning_minutes INTEGER,
  session_count INTEGER,
  emotion_distribution JSONB, -- {"happy": 5, "neutral": 3, "confused": 2, ...}
  dominant_emotion VARCHAR(50),
  average_intensity DECIMAL(3,2),
  emotion_trend VARCHAR(50), -- 'improving', 'stable', 'declining'
  notes TEXT,
  generated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(student_id, summary_date)
);
```

### 5. lms_integrations (LMS 연동 설정)
```sql
CREATE TABLE lms_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_name VARCHAR(255) NOT NULL,
  lms_type VARCHAR(50) NOT NULL,
  lms_url VARCHAR(500) NOT NULL,
  client_id VARCHAR(255),
  client_secret_encrypted TEXT,
  access_token_encrypted TEXT,
  refresh_token_encrypted TEXT,
  token_expires_at TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE,
  config JSONB, -- LMS별 추가 설정
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

## API 엔드포인트

### LMS 연동
- `POST /api/lms/connect` - LMS 연동 시작
- `GET /api/lms/callback` - OAuth 콜백
- `POST /api/lms/sync` - 학생 데이터 동기화
- `GET /api/lms/status` - 연동 상태 확인

### 학습 세션
- `POST /api/sessions/start` - 세션 시작
- `PUT /api/sessions/:id/end` - 세션 종료
- `GET /api/sessions/student/:studentId` - 학생 세션 조회

### 감정 기록
- `POST /api/emotions` - 감정 기록 생성
- `GET /api/emotions/student/:studentId` - 학생 감정 기록 조회
- `GET /api/emotions/session/:sessionId` - 세션별 감정 조회
- `PUT /api/emotions/:id` - 감정 기록 수정

### 일일 요약
- `GET /api/summaries/student/:studentId` - 학생 일일 요약 조회
- `GET /api/summaries/date/:date` - 특정 날짜 요약 조회
- `POST /api/summaries/generate` - 수동 요약 생성 (관리자용)

### 분석 및 리포트
- `GET /api/analytics/student/:studentId/trends` - 감정 트렌드
- `GET /api/analytics/student/:studentId/correlation` - 감정-성과 상관관계
- `GET /api/analytics/class/:classId/overview` - 클래스 전체 개요

## 자동화 작업

### 1. 일일 요약 생성 (Cron Job)
- **스케줄**: 매일 00:00 KST
- **작업**: 전날의 모든 학생 감정 데이터를 집계하여 요약 생성
- **구현**: Bull Queue + Cron

### 2. LMS 데이터 동기화
- **스케줄**: 매 시간 정각
- **작업**: LMS에서 새로운 학습 활동 가져오기

### 3. 알림 발송
- **트리거**: 특정 감정 패턴 감지 (예: 연속 3일 'frustrated')
- **수신자**: 교사, 학생
- **채널**: 이메일, 웹 알림

## 보안 고려사항

1. **데이터 암호화**:
   - LMS 토큰 AES-256 암호화
   - 전송 중 TLS 1.3

2. **접근 제어**:
   - 학생은 자신의 데이터만 조회
   - 교사는 담당 학생만 조회
   - 관리자는 전체 조회

3. **개인정보 보호**:
   - PIPA (개인정보보호법) 준수
   - 데이터 최소화 원칙
   - 익명화된 분석 데이터

## 배포 구조

```
┌─────────────────┐
│   React App     │ (Port 3000)
│  (Frontend)     │
└────────┬────────┘
         │
┌────────▼────────┐
│  Express API    │ (Port 4000)
│  (Backend)      │
└────┬───────┬────┘
     │       │
┌────▼───┐ ┌▼──────┐
│ Redis  │ │ Bull  │
│ Cache  │ │ Queue │
└────────┘ └───────┘
     │
┌────▼──────────┐
│  PostgreSQL   │
│  (Database)   │
└───────────────┘
     │
┌────▼──────────┐
│  LMS APIs     │
│ Canvas/Moodle │
└───────────────┘
```

## 다음 단계

1. ✅ 설계 문서 작성
2. 프로젝트 구조 생성
3. 데이터베이스 스키마 구현
4. Backend API 구현
5. LMS 연동 서비스 구현
6. Frontend 구현
7. 자동화 작업 구현
8. 테스트 및 배포
