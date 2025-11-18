# Implementation Guide - Math Calculation Error Detection System

## 개요

이 문서는 LMS와 연동하여 계산 실수를 자동 감지하는 독립형 웹앱의 구현 세부사항을 설명합니다.

## 시스템 아키텍처

### 전체 구조

```
┌─────────────────────────────────────────────────────────┐
│              Frontend (React + TypeScript)              │
│  - 문제 풀이 인터페이스                                    │
│  - 진도 추적 및 분석                                       │
│  - 실시간 피드백 표시                                      │
└────────────────────┬────────────────────────────────────┘
                     │ REST API
┌────────────────────▼────────────────────────────────────┐
│          Backend API (Node.js + Express)                │
│  - 문제 관리                                              │
│  - 답안 검증 (Rule-based)                                 │
│  - AI 피드백 생성 (Claude API)                            │
│  - 진도 및 통계 관리                                       │
└────────────┬───────────────────┬────────────────────────┘
             │                   │
┌────────────▼─────┐   ┌────────▼──────────┐
│   PostgreSQL     │   │   Claude AI API   │
│  - 문제 데이터      │   │  - 오류 분석        │
│  - 학생 진도       │   │  - 피드백 생성       │
│  - 오류 패턴       │   └───────────────────┘
└──────────────────┘
```

## 핵심 기능

### 1. 계산 실수 자동 감지

#### 다층 검증 시스템

**1단계: 형식 검증**
- 분수 형식 유효성 확인
- 분모가 0이 아닌지 확인
- 숫자 타입 및 정수 확인

**2단계: 규칙 기반 검증** (`backend/src/services/validationService.ts`)
```typescript
- 정답 여부 확인 (정확한 일치)
- 등가 확인 (간단히 되지 않은 정답)
- 오류 유형 식별:
  * arithmetic_error: 계산 실수
  * conceptual_error: 개념 오류
  * simplification_error: 간단히 하기 오류
  * format_error: 형식 오류
```

**3단계: AI 피드백 생성** (`backend/src/services/aiService.ts`)
- Claude API를 사용한 상세 오류 분석
- 단계별 풀이 제공
- 맞춤형 힌트 생성
- 일반적인 오개념 식별

#### 오류 유형별 감지 로직

```typescript
// 개념 오류 예시: 분자와 분모를 각각 더함
if (operation === 'add') {
  if (studentAnswer.numerator === numerator1 + numerator2 &&
      studentAnswer.denominator === denominator1 + denominator2) {
    return 'conceptual_error';
  }
}

// 계산 실수: 작은 차이
if (numeratorDiff <= 10 && denominatorDiff <= 10) {
  return 'arithmetic_error';
}
```

### 2. 실시간 피드백 시스템

#### 학생에게 제공되는 정보
1. **즉각적인 정오답 판정**
2. **오류 분석**
   - 실수한 부분 설명
   - 왜 틀렸는지 이유
   - 개선을 위한 힌트
3. **단계별 풀이** (선택적으로 표시)
4. **시각화된 정답**

#### AI 캐싱 시스템
- 동일한 오류 패턴에 대한 피드백 재사용
- API 비용 절감 (최대 30일 캐싱)
- 사용 횟수 추적

### 3. 진도 추적 및 분석

#### 자동 추적 항목
- 문제 유형별 정답률
- 평균 풀이 시간
- 오류 패턴 분석
- 난이도별 성취도

#### 데이터베이스 트리거
```sql
-- 제출 시 자동으로 진도 업데이트
CREATE TRIGGER update_progress_on_submission
  AFTER INSERT ON submissions
  FOR EACH ROW EXECUTE FUNCTION update_student_progress();

-- 오류 발생 시 패턴 추적
CREATE TRIGGER track_error_pattern
  AFTER INSERT ON submissions
  FOR EACH ROW WHEN (NEW.is_correct = false)
  EXECUTE FUNCTION update_error_pattern();
```

### 4. 분석 대시보드

#### 제공 메트릭
1. **전체 성적 요약**
   - 시도한 문제 수
   - 전체 정답률
   - 평균 풀이 시간
   - 활동 일수

2. **문제 유형별 진도**
   - 유형별 정답률 (시각화)
   - 현재 난이도
   - 시도 횟수 및 정답 수

3. **오류 분석**
   - 오류 유형별 발생 빈도
   - 차트 (막대 그래프, 파이 차트)
   - 개선 권장사항

## 데이터베이스 스키마

### 주요 테이블

**problems** - 수학 문제
```sql
- id, type, difficulty
- problem_data (JSONB): 문제 정보
- correct_answer (JSONB): 정답
- visual_type: 시각화 방식
```

**submissions** - 학생 답안
```sql
- student_id, problem_id
- student_answer (JSONB)
- is_correct, is_equivalent
- error_type, error_analysis (JSONB)
- time_spent_seconds
```

**student_progress** - 진도 추적
```sql
- student_id, problem_type
- total_attempts, correct_attempts
- accuracy_percentage (자동 계산)
- average_time_seconds
```

**error_patterns** - 오류 패턴
```sql
- student_id, problem_type, error_type
- occurrences, first_seen, last_seen
- is_resolved
```

## API 엔드포인트

### 문제 관련
```
GET    /api/v1/problems              # 문제 목록
GET    /api/v1/problems/random       # 랜덤 문제
GET    /api/v1/problems/:id          # 특정 문제
POST   /api/v1/problems/:id/submit   # 답안 제출
```

### 학생 진도
```
GET    /api/v1/students/:id/progress       # 진도 조회
GET    /api/v1/students/:id/errors         # 오류 패턴
GET    /api/v1/students/:id/error-stats    # 오류 통계
GET    /api/v1/students/:id/summary        # 성적 요약
```

## 프론트엔드 구조

### 주요 컴포넌트

**ProblemDisplay** - 문제 표시
- 분수 시각화 (피자, 막대, 원)
- 연산 기호 표시
- 난이도 표시

**FractionInput** - 답안 입력
- 분자/분모 입력 필드
- 실시간 유효성 검증
- 오류 메시지 표시

**FeedbackDisplay** - 피드백 표시
- 정오답 알림
- AI 생성 오류 분석
- 단계별 풀이 (접기/펴기)
- 정답 시각화

### 페이지

**PracticePage** (`/practice`)
- 문제 풀이 인터페이스
- 난이도 및 유형 선택
- 실시간 검증 및 피드백

**ProgressPage** (`/progress`)
- 전체 성적 요약
- 문제 유형별 진도
- 오류 패턴 목록

**DashboardPage** (`/dashboard`)
- 오류 통계 차트
- 오류 유형별 분석
- 개선 권장사항

## 설치 및 실행

### 1. 환경 설정

**Backend** (`.env`)
```bash
DB_HOST=localhost
DB_PORT=5432
DB_NAME=math_error_detection
DB_USER=postgres
DB_PASSWORD=your_password

ANTHROPIC_API_KEY=your_api_key  # Claude AI
JWT_SECRET=your_secret
```

**Frontend** (`.env`)
```bash
VITE_API_URL=http://localhost:3001/api/v1
```

### 2. 데이터베이스 초기화

```bash
# PostgreSQL 시작
psql -U postgres

# 데이터베이스 생성 및 스키마 적용
createdb math_error_detection
psql math_error_detection < database/migrations/001_initial_schema.sql
```

### 3. 백엔드 실행

```bash
cd backend
npm install
npm run dev  # http://localhost:3001
```

### 4. 프론트엔드 실행

```bash
cd frontend
npm install
npm run dev  # http://localhost:3000
```

### 5. Docker Compose (권장)

```bash
docker-compose up
```

## 향후 개선 사항

### 단기 (1-2개월)
1. **인증 시스템**
   - 학생/교사 로그인
   - JWT 기반 인증
   - 역할 기반 권한 관리

2. **문제 생성 도구**
   - 교사용 문제 생성 인터페이스
   - 다양한 문제 유형 추가
   - 자동 문제 생성 (AI)

3. **개선된 시각화**
   - 인터랙티브 분수 조작
   - 애니메이션 효과
   - 다양한 시각화 옵션

### 중기 (3-6개월)
1. **LMS 연동**
   - LTI 표준 지원
   - Canvas, Moodle 연동
   - 성적 동기화

2. **고급 분석**
   - 학습 패턴 분석
   - 예측 모델 (성취도 예측)
   - 개인화된 학습 경로

3. **다중 주제 지원**
   - 정수 연산
   - 소수 연산
   - 방정식
   - 기하학

### 장기 (6개월 이상)
1. **적응형 학습**
   - 난이도 자동 조정
   - 개인별 맞춤 문제
   - AI 튜터 기능

2. **협업 기능**
   - 교사 간 문제 공유
   - 학생 그룹 활동
   - 실시간 토론

3. **모바일 앱**
   - iOS/Android 네이티브 앱
   - 오프라인 모드
   - 푸시 알림

## 성능 최적화

### 현재 구현
- AI 피드백 캐싱 (30일)
- 데이터베이스 인덱싱
- API 레이트 리미팅

### 추가 필요
- Redis 캐싱 레이어
- CDN 적용
- 이미지 최적화
- 코드 스플리팅

## 보안 고려사항

1. **입력 검증**
   - 모든 사용자 입력 검증
   - SQL 인젝션 방지 (Parameterized queries)
   - XSS 방지 (Output encoding)

2. **인증/인가**
   - JWT 토큰 사용
   - HTTPS 강제
   - CORS 설정

3. **데이터 보호**
   - 민감정보 암호화
   - 개인정보 최소화
   - GDPR/FERPA 준수

## 모니터링 및 로깅

### 현재 구현
- Winston 로거
- 에러 추적
- API 요청 로깅

### 추가 권장
- Prometheus + Grafana
- Sentry (에러 추적)
- ELK Stack (로그 분석)

## 문의 및 지원

프로젝트 관련 문의: KAIST Touch Math Academy

## 라이선스

MIT License
