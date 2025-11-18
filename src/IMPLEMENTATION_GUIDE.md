# LMS 읽기 시간 추적 및 이해도 요약 기능 - 구현 가이드

## 개요

이 기능은 LMS와 연동하여 학생이 문제를 읽는 시간을 추적하고, 오래 걸릴 경우 AI 기반 이해도 요약을 제공합니다.

## 주요 기능

### 1. 읽기 시간 자동 추적
- 학생이 문제를 읽는 시간을 실시간으로 추적
- 읽기 속도 (WPM) 자동 계산
- 재읽기 행동 감지
- 활성/비활성 시간 구분

### 2. AI 기반 이해도 요약
- Claude API를 사용한 개인화된 요약 생성
- 학생의 강점과 약점 분석
- 구체적인 학습 팁 제공
- 연령에 맞는 피드백

### 3. 실시간 개입 알림
- 도움이 필요한 학생 자동 감지
- 교사에게 즉각적인 알림
- 권장 조치 사항 제시

### 4. LMS 연동
- 학생 데이터 동기화
- 분석 결과 내보내기
- 다양한 LMS 지원 (Moodle, Canvas, KAIST 자체)

## 시스템 아키텍처

```
┌─────────────┐      ┌─────────────┐      ┌──────────────┐
│  Frontend   │─────▶│   Backend   │─────▶│  PostgreSQL  │
│  (React)    │      │  (FastAPI)  │      │   Database   │
└─────────────┘      └─────────────┘      └──────────────┘
                            │
                            ▼
                     ┌─────────────┐
                     │  Claude API │
                     │  (Anthropic)│
                     └─────────────┘
```

## 설치 및 설정

### 사전 요구사항

- Python 3.11+
- Node.js 18+
- PostgreSQL 15+
- Anthropic API 키

### 1. 데이터베이스 설정

```bash
# PostgreSQL 데이터베이스 생성
createdb alt42_db

# 스키마 적용
psql -d alt42_db -f src/database/schema.sql
```

### 2. 백엔드 설정

```bash
cd src/backend

# 가상환경 생성
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 의존성 설치
pip install fastapi uvicorn sqlalchemy psycopg2-binary anthropic python-dotenv

# 환경 변수 설정
cat > .env << EOF
DATABASE_URL=postgresql://user:password@localhost:5432/alt42_db
ANTHROPIC_API_KEY=your_api_key_here
EOF

# 서버 실행
python main.py
# API는 http://localhost:8000 에서 실행됩니다
```

### 3. 프론트엔드 설정

```bash
cd src/frontend

# 의존성 설치
npm install react react-dom @mui/material @emotion/react @emotion/styled axios

# 환경 변수 설정
cat > .env << EOF
REACT_APP_API_URL=http://localhost:8000
EOF

# 개발 서버 실행
npm start
```

## 사용 방법

### 학생 화면

#### 1. 읽기 추적 컴포넌트 사용

```tsx
import { ReadingProgressTracker } from './components/ReadingProgressTracker';

function ProblemPage() {
  return (
    <ReadingProgressTracker
      studentId="student_123"
      problemId="problem_456"
      moduleId="module_789"
      problemText="문제 텍스트..."
      gradeLevel={5}
      showRealTimeFeedback={true}
      onReadingComplete={(data) => {
        console.log('읽기 완료:', data);
      }}
    />
  );
}
```

#### 2. 이해도 피드백 표시

```tsx
import { ComprehensionFeedback } from './components/ComprehensionFeedback';

function StudentDashboard() {
  return (
    <ComprehensionFeedback
      studentId="student_123"
      moduleId="module_789"
      autoLoad={true}
      showDetailedFeedback={true}
    />
  );
}
```

### 교사 화면

#### 학급 대시보드 사용

```tsx
import { TeacherDashboard } from './components/TeacherDashboard';

function TeacherPage() {
  return (
    <TeacherDashboard
      moduleId="module_789"
      teacherId="teacher_001"
    />
  );
}
```

## API 엔드포인트

### 읽기 분석 기록

```http
POST /api/reading-analytics
Content-Type: application/json

{
  "student_id": "student_123",
  "problem_id": "problem_456",
  "module_id": "module_789",
  "reading_start_time": "2025-01-15T10:00:00Z",
  "reading_end_time": "2025-01-15T10:05:00Z",
  "reading_time_seconds": 300,
  "problem_word_count": 150,
  "first_attempt_correct": true,
  "total_attempts": 1,
  "grade_level": 5
}
```

**응답:**
```json
{
  "id": 1,
  "student_id": "student_123",
  "comprehension_score": 85.5,
  "reading_speed_wpm": 120.0,
  "intervention_flag": "none",
  "reading_difficulty_match": "appropriate"
}
```

### AI 이해도 요약 생성

```http
POST /api/comprehension-summary/generate
Content-Type: application/json

{
  "student_id": "student_123",
  "module_id": "module_789",
  "summary_period": "weekly",
  "period_start": "2025-01-08T00:00:00Z",
  "period_end": "2025-01-15T23:59:59Z"
}
```

**응답:**
```json
{
  "id": 1,
  "avg_comprehension_score": 78.3,
  "avg_reading_speed_wpm": 115.5,
  "ai_summary": "이번 주 학습을 잘 해왔어요...",
  "student_message": "잘하고 있어요! 계속 이렇게...",
  "student_tips": "- 문제를 두 번 읽어보세요\n- 중요한 단어에 밑줄을 그어보세요",
  "teacher_action_needed": false
}
```

### 개입 필요 학생 조회

```http
GET /api/reading-analytics/interventions?module_id=module_789&days=7
```

**응답:**
```json
[
  {
    "student_id": "student_456",
    "intervention_flag": "immediate",
    "comprehension_score": 35.2,
    "message": "학생이 심각한 어려움을 겪고 있습니다",
    "suggested_actions": ["1:1 상담 진행", "문제 난이도 조정"]
  }
]
```

### 학급 개요

```http
GET /api/class-overview/module_789
```

**응답:**
```json
{
  "module_id": "module_789",
  "total_students": 25,
  "avg_comprehension": 73.5,
  "avg_reading_speed": 125.3,
  "students_needing_help": 3,
  "first_attempt_success_rate": 68.5
}
```

## 이해도 점수 계산 알고리즘

이해도 점수는 다음 3가지 요소의 가중 평균으로 계산됩니다:

```
comprehension_score = 0.3 × reading_accuracy +
                      0.4 × speed_efficiency +
                      0.3 × first_attempt_success
```

### 1. Reading Accuracy (읽기 정확도)
- 첫 시도 정답: 100점
- 추가 시도마다 10점씩 감점 (최소 0점)

### 2. Speed Efficiency (속도 효율성)
- (실제 WPM / 기준 WPM) × 100
- 최대 100점

### 3. First Attempt Success (첫 시도 성공)
- 첫 시도 정답: 100점
- 그 외: 0점

## 개입 임계값

### 즉각 개입 (Immediate)
- 이해도 점수 < 40
- 읽기 속도 > 기준의 3배 (너무 빠름)
- 읽기 속도 < 기준의 0.5배 (너무 느림)
- 최근 3문제 연속 점수 < 40

### 모니터링 (Monitor)
- 이해도 점수 40-60
- 점수 하락 추세

### 정상 (None)
- 이해도 점수 >= 60
- 안정적인 성과

## 학년별 읽기 속도 기준 (한국어)

| 학년 | 목표 WPM | 최소 WPM | 최대 WPM |
|------|----------|----------|----------|
| 3-4  | 100-110  | 80       | 140      |
| 5-6  | 130-140  | 110      | 180      |
| 7-8  | 160-170  | 140      | 210      |

## 보안 고려사항

### 1. 데이터 보호
- 학생 개인정보는 암호화하여 저장
- HTTPS를 통한 통신만 허용
- API 키는 환경 변수로 관리

### 2. 접근 제어
- 학생은 자신의 데이터만 조회 가능
- 교사는 담당 학급 데이터만 조회 가능
- 관리자는 전체 데이터 접근 가능

### 3. 데이터 보존
- 원시 데이터: 6개월 보관 후 아카이브
- 요약 데이터: 영구 보관
- 학생 탈퇴 시 모든 데이터 삭제

## 성능 최적화

### 1. 데이터베이스
- 자주 조회되는 컬럼에 인덱스 생성
- 요약 데이터는 사전 계산하여 캐시
- 파티셔닝으로 대용량 데이터 처리

### 2. API
- Redis를 사용한 응답 캐싱
- 요약은 매일 밤 배치로 생성
- 페이지네이션으로 대량 데이터 처리

### 3. 프론트엔드
- React.memo로 불필요한 리렌더링 방지
- Lazy loading으로 초기 로딩 속도 개선
- 웹워커로 무거운 계산 백그라운드 처리

## 문제 해결

### Claude API 오류
```
Error: Claude API not configured
```
**해결:** `.env` 파일에 `ANTHROPIC_API_KEY` 설정

### 데이터베이스 연결 오류
```
Error: Connection refused
```
**해결:** PostgreSQL이 실행 중인지 확인, `DATABASE_URL` 설정 확인

### CORS 오류
```
Access-Control-Allow-Origin error
```
**해결:** 백엔드 `main.py`의 CORS 설정에 프론트엔드 URL 추가

## 다음 단계

1. **실시간 알림**: WebSocket을 사용한 실시간 교사 알림
2. **머신러닝 모델**: 더 정교한 이해도 예측 모델
3. **다국어 지원**: 영어, 중국어 등 추가 언어 지원
4. **모바일 앱**: React Native로 모바일 앱 개발

## 라이선스

MIT License

## 문의

- 이메일: support@kaist.ac.kr
- 이슈: GitHub Issues

---

**마지막 업데이트**: 2025-01-18
**버전**: 1.0.0
