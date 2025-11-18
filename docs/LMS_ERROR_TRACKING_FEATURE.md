# LMS 연동 및 실수 재발률 자동 표시 기능

## 개요

이 기능은 학습 관리 시스템(LMS)과 연동하여 학생들의 반복적인 실수를 추적하고, 재발률이 높은 오류 포인트를 자동으로 교사에게 표시하는 시스템입니다.

### 주요 기능

- ✅ **실시간 오류 추적**: 학생들의 모든 오답과 실수를 실시간으로 기록
- ✅ **패턴 분석**: AI 기반 오류 패턴 자동 분석 및 식별
- ✅ **재발률 계산**: 오류의 재발 빈도를 자동으로 계산하여 점수화
- ✅ **자동 우선순위 지정**: 심각도와 재발률에 따라 자동 우선순위 할당
- ✅ **시각화 대시보드**: 교사용 직관적인 대시보드로 주요 오류 포인트 확인
- ✅ **LMS 통합**: Canvas, Moodle 등 주요 LMS와 양방향 데이터 동기화
- ✅ **실행 가능한 권장사항**: 각 오류 패턴에 대한 구체적인 교육적 권장사항 제공

---

## 시스템 아키텍처

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (React)                      │
│  - RecurringErrorDashboard 컴포넌트                     │
│  - 실시간 오류 시각화                                    │
│  - 교사 인터페이스                                       │
└───────────────────┬─────────────────────────────────────┘
                    │ REST API
┌───────────────────▼─────────────────────────────────────┐
│              Backend API (FastAPI)                       │
│  - Error Tracking API                                    │
│  - 오류 분석 엔드포인트                                  │
│  - 학생 위험도 평가                                      │
└─────┬─────────────────┬─────────────────┬───────────────┘
      │                 │                 │
┌─────▼─────┐  ┌────────▼────────┐  ┌────▼──────────┐
│  Error    │  │   PostgreSQL    │  │  LMS          │
│  Analyzer │  │   Database      │  │  Integration  │
│  Service  │  │   (오류 데이터)  │  │  Service      │
└───────────┘  └─────────────────┘  └───────────────┘
```

---

## 데이터베이스 스키마

### 주요 테이블

#### 1. `student_errors`
학생들의 개별 오류를 추적합니다.

```sql
CREATE TABLE student_errors (
    id UUID PRIMARY KEY,
    student_id UUID NOT NULL,
    module_id UUID NOT NULL,
    problem_id UUID,
    error_type VARCHAR(50) NOT NULL, -- conceptual, procedural, calculation, input, logical
    error_description TEXT NOT NULL,
    incorrect_answer TEXT,
    correct_answer TEXT,
    concept_id VARCHAR(100),
    severity VARCHAR(20) DEFAULT 'medium', -- low, medium, high, critical
    context JSONB DEFAULT '{}',
    occurred_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    session_id UUID,
    attempt_number INTEGER DEFAULT 1
);
```

#### 2. `error_patterns`
반복적인 오류 패턴을 식별하고 추적합니다.

```sql
CREATE TABLE error_patterns (
    id UUID PRIMARY KEY,
    pattern_name VARCHAR(255) NOT NULL,
    pattern_description TEXT,
    error_category VARCHAR(50) NOT NULL,
    concept_ids TEXT[],
    module_id UUID NOT NULL,
    occurrence_count INTEGER DEFAULT 0,
    affected_student_count INTEGER DEFAULT 0,
    recurrence_rate DECIMAL(5, 2) DEFAULT 0.00, -- 0-100%
    average_severity DECIMAL(3, 2) DEFAULT 0.00,
    first_detected TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_detected TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE,
    resolution_strategy TEXT
);
```

#### 3. `recurring_error_points`
재발률이 높은 오류 포인트를 하이라이트합니다.

```sql
CREATE TABLE recurring_error_points (
    id UUID PRIMARY KEY,
    pattern_id UUID NOT NULL,
    module_id UUID NOT NULL,
    concept_id VARCHAR(100) NOT NULL,
    error_title VARCHAR(255) NOT NULL,
    error_summary TEXT,
    recurrence_rate DECIMAL(5, 2) NOT NULL, -- 0-100%
    total_occurrences INTEGER DEFAULT 0,
    unique_students INTEGER DEFAULT 0,
    severity_score DECIMAL(5, 2) DEFAULT 0.00, -- 0-100
    priority_rank INTEGER DEFAULT 0,
    recommended_action TEXT,
    visualization_data JSONB DEFAULT '{}',
    is_highlighted BOOLEAN DEFAULT TRUE
);
```

---

## API 엔드포인트

### 1. 오류 기록

**POST** `/api/error-tracking/errors`

학생의 오류를 기록합니다.

```json
{
  "student_id": "550e8400-e29b-41d4-a716-446655440000",
  "module_id": "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
  "problem_id": "problem_123",
  "error_type": "conceptual",
  "error_description": "분수 덧셈에 대한 잘못된 이해",
  "incorrect_answer": "1/2 + 1/3 = 2/5",
  "correct_answer": "1/2 + 1/3 = 5/6",
  "concept_id": "fraction_addition",
  "severity": "high"
}
```

### 2. 재발 오류 조회

**GET** `/api/error-tracking/modules/{module_id}/recurring-errors`

모듈의 재발 오류 포인트를 조회합니다.

**Query Parameters:**
- `min_recurrence_rate`: 최소 재발률 (기본값: 30.0)
- `limit`: 최대 결과 수 (기본값: 20)
- `highlighted_only`: 하이라이트된 오류만 조회 (기본값: true)

**Response:**
```json
[
  {
    "id": "error_001",
    "module_id": "module_123",
    "concept_id": "fraction_addition",
    "error_title": "Conceptual Error in fraction_addition",
    "error_summary": "이 오류는 15명의 학생에게서 45회 발생했습니다.",
    "recurrence_rate": 75.5,
    "total_occurrences": 45,
    "unique_students": 15,
    "severity_score": 82.3,
    "priority_rank": 1,
    "recommended_action": "영향을 받은 학생들과 기본 개념을 복습하세요. 시각 자료나 대체 설명을 사용하는 것을 고려하세요."
  }
]
```

### 3. 오류 분석

**GET** `/api/error-tracking/modules/{module_id}/analytics`

모듈의 종합적인 오류 분석을 제공합니다.

**Query Parameters:**
- `period_days`: 분석 기간(일) (기본값: 30)

### 4. 학생 위험도 평가

**GET** `/api/error-tracking/students/{student_id}/risk-assessment`

학생의 오류 재발률을 기반으로 위험도를 평가합니다.

**Response:**
```json
{
  "student_id": "student_001",
  "recurrence_rate": 62.5,
  "total_errors": 18,
  "unique_error_types": 5,
  "last_error": "2025-11-18T10:30:00Z",
  "risk_level": "high"  // low, medium, high, critical
}
```

### 5. 위험군 학생 조회

**GET** `/api/error-tracking/modules/{module_id}/at-risk-students`

모듈 내 위험군 학생 목록을 조회합니다.

**Query Parameters:**
- `threshold`: 위험 임계값 (재발률, 기본값: 50.0)
- `limit`: 최대 결과 수 (기본값: 20)

---

## 프론트엔드 컴포넌트

### RecurringErrorDashboard

재발 오류 포인트를 시각화하는 React 컴포넌트입니다.

#### 사용법

```tsx
import { RecurringErrorDashboard } from './components/RecurringErrorDashboard';

function TeacherDashboard() {
  return (
    <RecurringErrorDashboard
      moduleId="module_123"
      showActions={true}
      autoRefresh={true}
      refreshInterval={60000}
    />
  );
}
```

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `moduleId` | string | required | 모듈 식별자 |
| `onRefresh` | function | undefined | 새로고침 콜백 |
| `showActions` | boolean | true | 액션 버튼 표시 여부 |
| `autoRefresh` | boolean | false | 자동 새로고침 활성화 |
| `refreshInterval` | number | 60000 | 새로고침 간격(ms) |

#### 기능

- **실시간 업데이트**: 자동 새로고침으로 최신 오류 포인트 표시
- **시각적 우선순위**: 심각도에 따라 색상으로 구분
- **상세 메트릭**: 재발률, 영향받은 학생 수, 발생 횟수 등
- **권장 조치**: 각 오류에 대한 구체적인 교육적 권장사항
- **하이라이트 토글**: 교사가 중요 오류를 직접 관리

---

## 오류 분석 알고리즘

### ErrorAnalyzer Service

오류 분석 서비스는 다음 프로세스로 작동합니다:

#### 1. 오류 그룹화

유사한 오류들을 다음 기준으로 그룹화합니다:
- 오류 타입 (conceptual, procedural, calculation, input, logical)
- 개념 ID
- 문제 ID

#### 2. 패턴 생성

각 그룹에 대해 다음을 계산합니다:
- **발생 횟수**: 총 오류 발생 수
- **영향받은 학생 수**: 고유 학생 수
- **재발률**: `(발생 횟수 / 고유 학생 수) × 10`
- **평균 심각도**: 심각도 가중치의 평균

#### 3. 재발 포인트 식별

다음 조건을 만족하는 패턴을 재발 포인트로 식별:
- 최소 발생 횟수: 3회 이상
- 최소 학생 수: 2명 이상
- 재발률 임계값: 30% 이상

#### 4. 심각도 점수 계산 (0-100)

```
심각도 점수 = (재발률 × 40%) + (평균 심각도 × 30%) +
              (학생 수 × 20%) + (빈도 × 10%)
```

#### 5. 우선순위 할당

심각도 점수와 재발률을 기준으로 자동 우선순위를 할당합니다.

---

## LMS 통합

### 지원 LMS

현재 다음 LMS 플랫폼을 지원합니다:
- ✅ Canvas LMS
- ✅ Moodle
- 🔄 Blackboard (예정)
- 🔄 Google Classroom (예정)

### LMS 연동 기능

#### 1. 학생 데이터 동기화

```python
from backend.services.lms_integration import LMSIntegrationService, LMSType, create_lms_connector

# LMS 커넥터 생성
canvas_connector = create_lms_connector(
    lms_type=LMSType.CANVAS,
    api_key="your_api_key",
    base_url="https://canvas.example.com"
)

# 통합 서비스 초기화
lms_service = LMSIntegrationService()
lms_service.register_connector("canvas", canvas_connector)

# 학생 동기화
await lms_service.sync_students(
    connector_name="canvas",
    course_id="course_123",
    module_id="module_456"
)
```

#### 2. 오류 데이터 푸시

```python
# 오류 데이터를 LMS로 전송
await lms_service.sync_error_data(
    connector_name="canvas",
    course_id="course_123",
    errors=student_errors_list
)
```

#### 3. 분석 데이터 푸시

```python
# 분석 데이터를 LMS로 전송
await lms_service.sync_analytics(
    connector_name="canvas",
    course_id="course_123",
    analytics=analytics_data
)
```

### LMS 통합 로그

모든 LMS 통합 활동은 `lms_integration_logs` 테이블에 기록됩니다:

```sql
SELECT * FROM lms_integration_logs
WHERE lms_system = 'canvas'
  AND sync_status = 'completed'
ORDER BY sync_started_at DESC;
```

---

## 설정 및 구성

### 1. 데이터베이스 마이그레이션 실행

```bash
psql -U postgres -d education_db -f backend/migrations/001_create_error_tracking_tables.sql
```

### 2. 환경 변수 설정

`.env` 파일을 생성하고 다음을 설정합니다:

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/education_db

# LMS Integration
CANVAS_API_KEY=your_canvas_api_key
CANVAS_BASE_URL=https://canvas.example.com

MOODLE_API_KEY=your_moodle_api_key
MOODLE_BASE_URL=https://moodle.example.com

# Analysis Configuration
MIN_ERROR_OCCURRENCES=3
MIN_AFFECTED_STUDENTS=2
RECURRENCE_THRESHOLD=30.0
TIME_WINDOW_DAYS=30
```

### 3. 백엔드 서버 시작

```bash
cd backend
pip install -r requirements.txt
uvicorn api.error_tracking_api:app --reload --port 8000
```

### 4. 프론트엔드 빌드

```bash
cd frontend
npm install
npm run dev
```

---

## 사용 시나리오

### 시나리오 1: 교사가 재발 오류 확인

1. 교사가 모듈 대시보드에 접속
2. `RecurringErrorDashboard` 컴포넌트가 자동으로 재발 오류 표시
3. 우선순위 순으로 정렬된 오류 카드 확인
4. 각 오류의 재발률, 영향받은 학생 수, 권장 조치 확인
5. 중요 오류를 클릭하여 상세 정보 및 시각화 데이터 확인

### 시나리오 2: 학생 오류 자동 기록

1. 학생이 문제 풀이 중 오답 제출
2. 시스템이 자동으로 오류 기록 API 호출
3. 오류 데이터가 `student_errors` 테이블에 저장
4. 백그라운드 작업이 오류 패턴 분석 시작
5. 재발률이 높으면 자동으로 `recurring_error_points`에 추가
6. 교사 대시보드에 실시간 업데이트

### 시나리오 3: LMS 데이터 동기화

1. 관리자가 LMS 통합 설정
2. 일정 주기(예: 매일 자정)로 자동 동기화 실행
3. LMS에서 학생 명단, 과제, 제출물 가져오기
4. 로컬 데이터베이스와 비교하여 변경사항 업데이트
5. 분석 결과를 LMS로 다시 전송
6. `lms_integration_logs`에 동기화 결과 기록

---

## 성능 최적화

### 1. 데이터베이스 인덱스

주요 쿼리 성능을 위해 다음 인덱스가 생성되어 있습니다:
- `student_errors`: student_id, module_id, occurred_at
- `error_patterns`: module_id, recurrence_rate
- `recurring_error_points`: module_id, priority_rank

### 2. 캐싱 전략

자주 조회되는 데이터를 Redis에 캐싱:
- 재발 오류 목록 (TTL: 5분)
- 모듈 분석 데이터 (TTL: 15분)
- 학생 위험도 평가 (TTL: 10분)

### 3. 비동기 분석

대용량 오류 데이터 분석은 Celery를 통해 비동기 처리:
```python
@celery.task
def analyze_error_patterns(module_id: str):
    # 오류 패턴 분석 로직
    pass
```

---

## 보안 고려사항

### 1. 데이터 접근 제어

- RBAC(역할 기반 접근 제어) 구현
- 교사는 자신의 모듈 데이터만 접근 가능
- 관리자만 LMS 통합 설정 가능

### 2. 데이터 암호화

- 민감한 학생 정보는 암호화 저장
- API 통신은 HTTPS 필수
- LMS API 키는 환경 변수로 관리

### 3. 개인정보 보호

- FERPA, COPPA 등 교육 데이터 보호 규정 준수
- 학생 식별 정보는 최소화하여 저장
- 데이터 보관 기간 정책 수립

---

## 모니터링 및 로깅

### 주요 메트릭

1. **오류 추적 메트릭**
   - 시간당 오류 기록 수
   - 재발 오류 식별률
   - 분석 처리 시간

2. **LMS 통합 메트릭**
   - 동기화 성공률
   - 동기화 처리 시간
   - 실패한 통합 시도

3. **시스템 성능 메트릭**
   - API 응답 시간
   - 데이터베이스 쿼리 성능
   - 메모리 사용량

### 로그 레벨

```python
import logging

logger.info("오류 기록 완료")
logger.warning("재발률이 임계값 초과")
logger.error("LMS 동기화 실패")
```

---

## 트러블슈팅

### 문제 1: 재발 오류가 표시되지 않음

**원인**: 데이터가 부족하거나 임계값 미달

**해결책**:
1. 최소 발생 횟수 확인 (기본값: 3회)
2. 재발률 임계값 확인 (기본값: 30%)
3. 오류 데이터가 올바르게 기록되는지 확인

### 문제 2: LMS 동기화 실패

**원인**: 인증 실패 또는 API 키 오류

**해결책**:
1. API 키 유효성 확인
2. LMS 베이스 URL 확인
3. `lms_integration_logs` 테이블에서 오류 상세 확인

### 문제 3: 분석 처리 지연

**원인**: 대량의 오류 데이터 처리

**해결책**:
1. Celery 워커 증설
2. 데이터베이스 인덱스 최적화
3. 분석 주기 조정

---

## 향후 개선 계획

### Phase 2 기능

1. **AI 기반 예측 분석**
   - 학생의 미래 오류 예측
   - 개인화된 학습 경로 추천

2. **실시간 알림**
   - 교사에게 실시간 오류 알림
   - 임계값 초과 시 자동 경고

3. **고급 시각화**
   - 오류 트렌드 그래프
   - 학생 비교 차트
   - 히트맵 시각화

4. **자동 개입 시스템**
   - 재발 오류 감지 시 자동으로 복습 문제 제공
   - 학생별 맞춤형 힌트 생성

### Phase 3 기능

1. **다중 LMS 지원 확대**
   - Blackboard
   - Google Classroom
   - Microsoft Teams for Education

2. **모바일 앱**
   - 교사용 모바일 대시보드
   - 푸시 알림 지원

3. **협업 기능**
   - 교사 간 오류 패턴 공유
   - 베스트 프랙티스 라이브러리

---

## 문의 및 지원

- **기술 문의**: development@kaist.edu
- **기능 요청**: [GitHub Issues](https://github.com/kaist/education-system/issues)
- **문서**: [Wiki](https://github.com/kaist/education-system/wiki)

---

## 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다.

Copyright (c) 2025 KAIST Touch Math Academy
