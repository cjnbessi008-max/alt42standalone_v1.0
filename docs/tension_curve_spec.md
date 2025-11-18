# 텐션 곡선 기능 명세서
# Tension Curve Feature Specification

## 개요 (Overview)

정답률 기반 텐션 곡선 시스템은 학생의 학습 과정에서 발생하는 인지적 부하와 학습 어려움을 실시간으로 측정하고 시각화하는 기능입니다. LMS와 연동하여 교사와 학생 모두에게 학습 진행 상황에 대한 인사이트를 제공합니다.

The tension curve system measures and visualizes cognitive load and learning difficulties in real-time based on student answer accuracy. It integrates with LMS platforms to provide insights to both teachers and students.

---

## 목차 (Table of Contents)

1. [핵심 개념](#핵심-개념)
2. [시스템 아키텍처](#시스템-아키텍처)
3. [데이터 모델](#데이터-모델)
4. [API 엔드포인트](#api-엔드포인트)
5. [프론트엔드 컴포넌트](#프론트엔드-컴포넌트)
6. [LMS 연동](#lms-연동)
7. [텐션 점수 계산 알고리즘](#텐션-점수-계산-알고리즘)
8. [학습 단계 분류](#학습-단계-분류)
9. [사용 예시](#사용-예시)
10. [배포 가이드](#배포-가이드)

---

## 핵심 개념

### 텐션 점수 (Tension Score)

**정의**: 학습자가 현재 경험하고 있는 인지적 부하와 학습 어려움을 0-100 척도로 나타낸 수치

**분류**:
- **0-30**: 낮은 텐션 (편안한 학습 상태)
- **30-60**: 적정 텐션 (최적 도전 수준)
- **60-100**: 높은 텐션 (어려움, 개입 필요)

### 학습 단계 (Learning Phase)

1. **Early (초기)**: 학습 시작 단계 (시도 횟수 < 5)
2. **Growth (성장)**: 적극적인 학습 진행 중
3. **Plateau (정체)**: 진전이 정체된 상태
4. **Mastery (숙달)**: 높은 정확도, 낮은 텐션
5. **Struggling (어려움)**: 낮은 정확도, 높은 텐션

---

## 시스템 아키텍처

```
┌─────────────────────────────────────────────────────────┐
│                   Frontend (React)                      │
│  TensionCurveVisualization.tsx                         │
│  tensionCurveApi.ts (API Client)                       │
└──────────────────┬──────────────────────────────────────┘
                   │ REST API
┌──────────────────▼──────────────────────────────────────┐
│              Backend API (FastAPI)                      │
│  tension_curve.py (Endpoints)                          │
│  tension_calculator.py (Logic)                         │
└──────────────┬────────────────────┬─────────────────────┘
               │                    │
┌──────────────▼────────┐  ┌───────▼──────────────────────┐
│   PostgreSQL          │  │  LMS Integration             │
│   Database            │  │  lms_connector.py            │
│   (schema.sql)        │  │  (Canvas, Moodle, etc.)     │
└───────────────────────┘  └──────────────────────────────┘
```

---

## 데이터 모델

### 주요 테이블

#### 1. `student_progress`
학생의 전체적인 학습 진행 상황을 추적

```sql
CREATE TABLE student_progress (
    id UUID PRIMARY KEY,
    student_id UUID NOT NULL,
    module_id UUID NOT NULL,

    -- 기본 지표
    total_attempts INTEGER DEFAULT 0,
    correct_answers INTEGER DEFAULT 0,
    accuracy_rate DECIMAL(5,2) DEFAULT 0.00,

    -- 텐션 지표
    tension_score DECIMAL(5,2),
    learning_curve_phase VARCHAR(50),
    tension_history JSONB,

    -- 난이도 추적
    current_difficulty_level INTEGER DEFAULT 1,
    difficulty_trajectory JSONB,

    UNIQUE(student_id, module_id)
);
```

#### 2. `tension_curve_snapshots`
시간별 텐션 데이터 포인트 저장

```sql
CREATE TABLE tension_curve_snapshots (
    id UUID PRIMARY KEY,
    student_id UUID NOT NULL,
    module_id UUID NOT NULL,

    snapshot_time TIMESTAMP DEFAULT NOW(),
    accuracy_rate DECIMAL(5,2),
    tension_score DECIMAL(5,2),
    difficulty_level INTEGER,

    -- 예측 및 권장사항
    predicted_next_tension DECIMAL(5,2),
    recommended_action VARCHAR(100)
);
```

#### 3. `class_analytics`
반 전체의 집계 데이터

```sql
CREATE TABLE class_analytics (
    id UUID PRIMARY KEY,
    module_id UUID NOT NULL,
    teacher_id UUID NOT NULL,

    total_students INTEGER,
    average_accuracy DECIMAL(5,2),
    average_tension_score DECIMAL(5,2),

    accuracy_distribution JSONB,
    tension_distribution JSONB,

    snapshot_date DATE DEFAULT CURRENT_DATE
);
```

---

## API 엔드포인트

### 학생 레벨 API

#### GET `/api/tension-curve/student/{student_id}/module/{module_id}`
학생의 텐션 곡선 데이터 조회

**Query Parameters**:
- `time_range_days`: 조회 기간 (기본값: 30일)
- `include_predictions`: 예측 포함 여부
- `include_recommendations`: 권장사항 포함 여부

**Response**:
```json
{
  "success": true,
  "data": {
    "student_id": "uuid",
    "module_id": "uuid",
    "current_metrics": {
      "accuracy_rate": 78.5,
      "tension_score": 42.3,
      "learning_curve_phase": "growth",
      "total_attempts": 50
    },
    "snapshots": [...],
    "average_tension": 45.2,
    "max_tension": 72.1,
    "min_tension": 28.3,
    "tension_volatility": 12.5
  }
}
```

#### POST `/api/tension-curve/record-attempt`
학생 답변 기록 및 텐션 업데이트

**Request Body**:
```json
{
  "student_id": "uuid",
  "problem_id": "uuid",
  "module_id": "uuid",
  "answer": {},
  "is_correct": true,
  "time_spent_seconds": 45
}
```

### 반 레벨 API

#### GET `/api/tension-curve/module/{module_id}/class-analytics`
반 전체 텐션 분석

**Response**:
```json
{
  "module_id": "uuid",
  "total_students": 30,
  "active_students": 28,
  "average_accuracy": 75.5,
  "average_tension_score": 42.3,
  "accuracy_distribution": {
    "0-20": 2,
    "20-40": 3,
    "40-60": 8,
    "60-80": 12,
    "80-100": 5
  },
  "tension_distribution": {
    "0-30": 10,
    "30-60": 15,
    "60-100": 5
  }
}
```

#### GET `/api/tension-curve/module/{module_id}/tension-distribution`
반의 텐션 점수 분포

### 분석 API

#### GET `/api/tension-curve/student/{student_id}/module/{module_id}/recommendations`
개인화된 학습 권장사항

**Response**:
```json
{
  "success": true,
  "recommended_action": "reduce_difficulty",
  "recommendations": [
    {
      "type": "content",
      "priority": "high",
      "message": "이전 개념을 복습하세요"
    }
  ],
  "predicted_completion_days": 7
}
```

---

## 프론트엔드 컴포넌트

### TensionCurveVisualization

메인 시각화 컴포넌트

**사용 예시**:
```tsx
import TensionCurveVisualization from './components/TensionCurve/TensionCurveVisualization';

<TensionCurveVisualization
  studentId="student-uuid"
  moduleId="module-uuid"
  timeRangeDays={30}
  showPredictions={false}
  showRecommendations={true}
  onDataLoad={(data) => console.log(data)}
/>
```

**Features**:
- 시간별 텐션 곡선 그래프
- 정답률 추이 차트
- 난이도 vs 성과 분석
- 종합 분석 뷰
- 실시간 통계 및 권장사항

### React Hook: useTensionCurve

데이터 페칭을 위한 커스텀 훅

```tsx
import { useTensionCurve } from './api/tensionCurveApi';

const { data, loading, error, refresh } = useTensionCurve({
  studentId: 'uuid',
  moduleId: 'uuid',
  timeRangeDays: 30,
  autoRefresh: true,
  refreshInterval: 60000 // 1분마다 새로고침
});
```

---

## LMS 연동

### 지원 플랫폼

- Canvas LMS
- Moodle
- Blackboard
- Google Classroom
- Brightspace
- Generic LTI 1.1/1.3

### 연동 기능

#### 1. 성적 동기화
```python
from lms_integration.api.lms_connector import LMSConnector, LMSType

connector = LMSConnector(
    lms_type=LMSType.CANVAS,
    base_url="https://canvas.institution.edu",
    api_key="your-api-key"
)

# 성적 동기화
grades = [
    {"student_id": "123", "score": 85.5, "comment": "Great work!"},
    {"student_id": "124", "score": 72.0}
]

result = connector.sync_grades(
    course_id="course-123",
    assignment_id="assign-456",
    grades=grades
)
```

#### 2. 텐션 곡선 데이터 내보내기
```python
# 텐션 데이터를 LMS 주석으로 동기화
tension_data = [
    {
        "student_id": "123",
        "tension_score": 42.3,
        "learning_phase": "growth",
        "accuracy_rate": 78.5
    }
]

result = connector.sync_tension_curves(
    course_id="course-123",
    tension_data=tension_data
)
```

#### 3. 수강생 명단 가져오기
```python
roster = connector.get_course_roster(course_id="course-123")
print(roster['students'])
```

### LTI 통합

#### LTI 1.3 Launch Flow
1. LMS에서 과제/활동 생성
2. LTI launch URL 설정: `https://your-app.com/lti/launch`
3. Consumer key 및 shared secret 설정
4. 학생이 링크 클릭 시 자동 인증 및 데이터 동기화

---

## 텐션 점수 계산 알고리즘

### 계산 공식

```python
tension_score = (
    accuracy_factor * 0.4 +
    difficulty_factor * 0.3 +
    consistency_factor * 0.2 +
    time_factor * 0.1
)
```

### 요소 설명

#### 1. Accuracy Factor (40% 가중치)
```python
accuracy_factor = 100 - accuracy_rate
```
- 정답률이 낮을수록 텐션 증가

#### 2. Difficulty Factor (30% 가중치)
```python
difficulty_factor = (difficulty_level / 10) * 30
```
- 난이도가 높을수록 텐션 증가 가능성

#### 3. Consistency Factor (20% 가중치)
```python
consistency_factor = min(consecutive_incorrect * 5, 30)
```
- 연속 오답이 많을수록 텐션 증가

#### 4. Time Factor (10% 가중치)
```python
if average_time_ratio > 1.5:
    time_factor = 20
elif average_time_ratio > 1.2:
    time_factor = 10
else:
    time_factor = 0
```
- 예상 시간보다 오래 걸릴수록 텐션 증가

---

## 학습 단계 분류

### 분류 로직

```python
def determine_learning_phase(accuracy_rate, total_attempts, tension_score):
    if total_attempts < 5:
        return "early"
    elif accuracy_rate >= 85 and tension_score < 30:
        return "mastery"
    elif accuracy_rate < 50 and tension_score > 60:
        return "struggling"
    elif 50 <= accuracy_rate <= 70 and total_attempts > 20:
        return "plateau"
    else:
        return "growth"
```

### 권장 조치

| 단계 | 텐션 범위 | 권장 조치 |
|------|----------|----------|
| Early | N/A | 모니터링 |
| Growth | 30-60 | 현재 진행 유지 |
| Plateau | 40-60 | 다양성 도입, 새로운 접근 |
| Mastery | 0-30 | 난이도 증가 |
| Struggling | 60-100 | 난이도 감소, 힌트 제공 |

---

## 사용 예시

### 시나리오 1: 교사 대시보드

```tsx
// 반 전체 텐션 분포 확인
const TeacherDashboard = ({ moduleId }) => {
  const [analytics, setAnalytics] = useState(null);

  useEffect(() => {
    tensionCurveAPI.getClassTensionAnalytics(moduleId)
      .then(data => setAnalytics(data));
  }, [moduleId]);

  return (
    <div>
      <h2>반 전체 분석</h2>
      <p>평균 텐션: {analytics?.average_tension_score}</p>
      <p>도움이 필요한 학생: {analytics?.tension_distribution['60-100']}</p>

      {/* 텐션 분포 차트 */}
      <TensionDistributionChart data={analytics?.tension_distribution} />
    </div>
  );
};
```

### 시나리오 2: 학생 개인 뷰

```tsx
// 개인 학습 진행 상황 및 권장사항
const StudentProgress = ({ studentId, moduleId }) => {
  const { data, loading, error } = useTensionCurve({
    studentId,
    moduleId,
    timeRangeDays: 30
  });

  if (loading) return <Spinner />;
  if (error) return <Error message={error} />;

  return (
    <div>
      <h2>내 학습 진행 상황</h2>

      {/* 텐션 곡선 시각화 */}
      <TensionCurveVisualization
        studentId={studentId}
        moduleId={moduleId}
      />

      {/* 권장사항 */}
      {data.current_metrics.tension_score > 60 && (
        <Alert severity="warning">
          현재 학습 난이도가 높습니다. 이전 내용을 복습해보세요.
        </Alert>
      )}
    </div>
  );
};
```

### 시나리오 3: 실시간 답변 기록

```tsx
// 학생이 문제를 풀 때마다 텐션 업데이트
const handleSubmitAnswer = async (problemId, answer, isCorrect, timeSpent) => {
  await tensionCurveAPI.recordStudentAttempt({
    student_id: currentStudentId,
    problem_id: problemId,
    module_id: currentModuleId,
    answer: answer,
    is_correct: isCorrect,
    time_spent_seconds: timeSpent
  });

  // 텐션 데이터 새로고침
  refreshTensionData();
};
```

---

## 배포 가이드

### 1. 데이터베이스 설정

```bash
# PostgreSQL 데이터베이스 생성
createdb education_system

# 스키마 적용
psql education_system < backend/database/schema.sql
```

### 2. 백엔드 서버 시작

```bash
cd backend
pip install -r requirements.txt

# 환경 변수 설정
export DATABASE_URL="postgresql://user:password@localhost/education_system"
export SECRET_KEY="your-secret-key"

# FastAPI 서버 실행
uvicorn api.main:app --host 0.0.0.0 --port 8000 --reload
```

### 3. 프론트엔드 빌드

```bash
cd frontend
npm install

# 환경 변수 설정 (.env)
REACT_APP_API_BASE_URL=http://localhost:8000

# 개발 서버 실행
npm start

# 프로덕션 빌드
npm run build
```

### 4. LMS 연동 설정

```python
# config.py
LMS_INTEGRATIONS = {
    "canvas": {
        "base_url": "https://canvas.institution.edu",
        "api_key": os.getenv("CANVAS_API_KEY"),
    },
    "moodle": {
        "base_url": "https://moodle.institution.edu",
        "api_key": os.getenv("MOODLE_TOKEN"),
    }
}
```

---

## 성능 최적화

### 데이터베이스 인덱스
```sql
CREATE INDEX idx_student_progress_tension ON student_progress(tension_score);
CREATE INDEX idx_tension_snapshots_time ON tension_curve_snapshots(snapshot_time);
CREATE INDEX idx_student_attempts_timestamp ON student_attempts(attempted_at);
```

### 캐싱 전략
- Redis를 사용하여 최근 조회한 텐션 곡선 데이터 캐싱
- 캐시 TTL: 5분
- 새로운 답변 기록 시 캐시 무효화

### 비동기 처리
- 텐션 스냅샷 생성을 백그라운드 작업으로 처리
- LMS 동기화를 비동기 큐 (Celery)로 처리

---

## 보안 고려사항

### 1. 인증 및 권한
- JWT 토큰 기반 인증
- 학생은 자신의 데이터만 조회 가능
- 교사는 담당 반 학생의 데이터 조회 가능

### 2. 데이터 프라이버시
- 개인 식별 정보 암호화
- GDPR 준수: 데이터 삭제 요청 지원

### 3. API 보안
- Rate limiting: 사용자당 100 req/hour
- CORS 설정
- SQL injection 방지 (파라미터화된 쿼리)

---

## 문제 해결 (Troubleshooting)

### 텐션 점수가 업데이트되지 않음
1. 데이터베이스 트리거 확인: `trigger_update_student_progress`
2. 학생 답변이 정상적으로 기록되었는지 확인
3. 로그 확인: `/var/log/education-system/api.log`

### LMS 연동 실패
1. API 키 유효성 확인
2. LMS URL 접근 가능 여부 확인
3. 네트워크 방화벽 설정 확인

### 그래프가 표시되지 않음
1. API 응답에 `tension_history` 데이터가 있는지 확인
2. 브라우저 콘솔에서 JavaScript 오류 확인
3. Recharts 라이브러리 버전 호환성 확인

---

## 향후 개발 계획

### Phase 1 (완료)
- ✅ 기본 텐션 점수 계산
- ✅ 데이터베이스 스키마
- ✅ REST API 엔드포인트
- ✅ React 시각화 컴포넌트
- ✅ LMS 연동 프레임워크

### Phase 2 (계획 중)
- 🔄 AI 기반 예측 모델
- 🔄 실시간 알림 시스템
- 🔄 A/B 테스팅 프레임워크
- 🔄 모바일 앱 지원

### Phase 3 (장기)
- ⏳ 감정 인식 통합
- ⏳ 협업 학습 분석
- ⏳ 게이미피케이션 요소

---

## 라이선스 및 기여

이 프로젝트는 KAIST Touch Math Academy를 위해 개발되었습니다.

**Maintainers**: AI Education System Team
**Last Updated**: 2025-11-18

---

## 참고 자료

1. [FastAPI Documentation](https://fastapi.tiangolo.com/)
2. [React Recharts](https://recharts.org/)
3. [LTI 1.3 Specification](https://www.imsglobal.org/spec/lti/v1p3/)
4. [PostgreSQL Triggers](https://www.postgresql.org/docs/current/sql-createtrigger.html)
