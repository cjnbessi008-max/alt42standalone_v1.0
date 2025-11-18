# Implementation Details (구현 세부사항)

## Learning Stress Indicator System

이 문서는 학습 스트레스 지표 시스템의 구현 세부사항을 설명합니다.

## 📂 Project Structure (프로젝트 구조)

```
alt42standalone_v1.0/
├── backend/                    # FastAPI 백엔드
│   ├── app/
│   │   ├── __init__.py        # 패키지 초기화
│   │   ├── main.py            # FastAPI 애플리케이션
│   │   ├── models.py          # Pydantic 데이터 모델
│   │   ├── stress_calculator.py  # 스트레스 계산 로직
│   │   └── database.py        # 인메모리 데이터베이스
│   ├── requirements.txt       # Python 의존성
│   ├── schema.sql            # PostgreSQL 스키마
│   └── Dockerfile            # Docker 이미지 설정
├── frontend/                  # React 프론트엔드
│   ├── src/
│   │   ├── components/       # React 컴포넌트
│   │   │   ├── StressIndicatorCard.tsx
│   │   │   ├── StressIndicatorCard.css
│   │   │   ├── StressDashboard.tsx
│   │   │   └── StressDashboard.css
│   │   ├── types.ts          # TypeScript 타입 정의
│   │   ├── api.ts            # API 클라이언트
│   │   ├── App.tsx           # 메인 앱 컴포넌트
│   │   ├── App.css           # 메인 스타일
│   │   └── index.tsx         # 진입점
│   ├── public/
│   │   └── index.html        # HTML 템플릿
│   ├── package.json          # Node.js 의존성
│   └── Dockerfile            # Docker 이미지 설정
├── tasks/
│   └── 0001-prd-ai-education-pipeline.md  # PRD 문서
├── docker-compose.yml        # Docker Compose 설정
├── .gitignore               # Git 무시 파일
├── README.md                # 사용자 문서
└── IMPLEMENTATION.md        # 구현 세부사항 (이 문서)
```

## 🧮 Stress Calculation Algorithm (스트레스 계산 알고리즘)

### 계산 공식

```
stress_score = (error_score × 0.35) +
               (time_score × 0.25) +
               (retry_score × 0.20) +
               (response_score × 0.20)
```

### 1. Error Rate Score (오답률 점수)

```python
error_rate = 1.0 - (problems_correct / problems_attempted)
error_score = error_rate × 100
```

**범위**: 0-100
- 0점: 모든 문제 정답
- 100점: 모든 문제 오답

### 2. Time Spent Score (학습 시간 점수)

```python
if time_spent_minutes <= 30:
    score = (time_spent_minutes / 30) × 30
elif time_spent_minutes <= 60:
    score = 30 + ((time_spent_minutes - 30) / 30) × 40
else:
    score = min(70 + ((time_spent_minutes - 60) / 60) × 30, 100)
```

**구간별 점수**:
- 0-30분: 0-30점 (선형 증가)
- 30-60분: 30-70점 (선형 증가)
- 60분 이상: 70-100점 (최대 100점)

### 3. Retry Count Score (재시도 점수)

```python
retry_ratio = retry_count / problems_attempted
retry_score = min(retry_ratio / 2.0 × 100, 100)
```

**기준**:
- 문제당 평균 2회 재시도 = 높은 스트레스 (100점)
- 재시도 없음 = 낮은 스트레스 (0점)

### 4. Response Trend Score (응답 추세 점수)

```python
normalized_trend = (1 - response_time_trend) / 2.0
response_score = normalized_trend × 100
```

**범위**:
- response_time_trend = -1 (매우 느려짐) → 100점
- response_time_trend = 0 (변화없음) → 50점
- response_time_trend = 1 (빨라짐) → 0점

## 🎯 Stress Level Classification (스트레스 레벨 분류)

```python
if stress_score >= 60.0:
    stress_level = "HIGH"
elif stress_score >= 35.0:
    stress_level = "MEDIUM"
else:
    stress_level = "LOW"
```

### Recommendations Logic (권장사항 로직)

```python
# HIGH 레벨
if error_score > 60:
    "오답률이 높습니다. 개념 복습이 필요할 수 있습니다."
if time_score > 60:
    "장시간 학습 중입니다. 휴식을 권장합니다."
if retry_score > 60:
    "재시도가 많습니다. 교사의 도움이 필요할 수 있습니다."
if response_score > 60:
    "응답 시간이 느려지고 있습니다. 피로도가 증가하는 것으로 보입니다."

# MEDIUM 레벨
"적절한 수준의 도전과 노력이 이루어지고 있습니다."
if time_score > 50:
    "적절한 휴식 시간을 가지세요."
if error_score > 50:
    "어려운 부분은 다시 한번 복습해보세요."

# LOW 레벨
"원활하게 학습이 진행되고 있습니다."
if error_score < 20 and time_score < 40:
    "훌륭합니다! 다음 단계로 진행할 준비가 되었습니다."
```

## 🗄️ Database Schema (데이터베이스 스키마)

### Core Tables (핵심 테이블)

#### students
```sql
id              UUID PRIMARY KEY
student_id      VARCHAR(100) UNIQUE NOT NULL
name            VARCHAR(200) NOT NULL
grade_level     VARCHAR(50)
created_at      TIMESTAMP DEFAULT NOW()
updated_at      TIMESTAMP DEFAULT NOW()
```

#### modules
```sql
id              UUID PRIMARY KEY
module_id       VARCHAR(100) UNIQUE NOT NULL
name            VARCHAR(200) NOT NULL
subject         VARCHAR(100) NOT NULL
grade_level     VARCHAR(50)
description     TEXT
created_at      TIMESTAMP DEFAULT NOW()
updated_at      TIMESTAMP DEFAULT NOW()
```

#### learning_activities
```sql
id                      UUID PRIMARY KEY
student_id              VARCHAR(100) FK → students.student_id
module_id               VARCHAR(100) FK → modules.module_id
session_id              VARCHAR(200) NOT NULL
time_spent_minutes      DECIMAL(10,2) CHECK (>= 0)
problems_attempted      INTEGER CHECK (>= 0)
problems_correct        INTEGER CHECK (>= 0)
retry_count            INTEGER CHECK (>= 0)
average_response_time   DECIMAL(10,2) CHECK (>= 0)
response_time_trend     DECIMAL(3,2) CHECK (>= -1 AND <= 1)
timestamp              TIMESTAMP DEFAULT NOW()
```

#### stress_indicators
```sql
id              UUID PRIMARY KEY
student_id      VARCHAR(100) FK → students.student_id
module_id       VARCHAR(100) FK → modules.module_id
session_id      VARCHAR(200) NOT NULL
stress_level    VARCHAR(20) CHECK IN ('LOW', 'MEDIUM', 'HIGH')
stress_score    DECIMAL(5,2) CHECK (>= 0 AND <= 100)
factors         JSONB NOT NULL
recommendations TEXT[]
timestamp       TIMESTAMP DEFAULT NOW()
```

### Indexes (인덱스)

```sql
-- 성능 최적화를 위한 인덱스
CREATE INDEX idx_learning_activities_student ON learning_activities(student_id);
CREATE INDEX idx_learning_activities_module ON learning_activities(module_id);
CREATE INDEX idx_learning_activities_timestamp ON learning_activities(timestamp);

CREATE INDEX idx_stress_indicators_student ON stress_indicators(student_id);
CREATE INDEX idx_stress_indicators_module ON stress_indicators(module_id);
CREATE INDEX idx_stress_indicators_level ON stress_indicators(stress_level);
CREATE INDEX idx_stress_indicators_timestamp ON stress_indicators(timestamp);
```

### Views (뷰)

#### stress_metrics_by_module
```sql
SELECT
    module_id,
    COUNT(DISTINCT student_id) as total_students,
    COUNT(CASE WHEN stress_level = 'LOW' THEN 1 END) as low_stress_count,
    COUNT(CASE WHEN stress_level = 'MEDIUM' THEN 1 END) as medium_stress_count,
    COUNT(CASE WHEN stress_level = 'HIGH' THEN 1 END) as high_stress_count,
    AVG(stress_score) as average_stress_score,
    MAX(timestamp) as last_updated
FROM stress_indicators
GROUP BY module_id;
```

## 🔌 API Implementation (API 구현)

### Endpoint Details (엔드포인트 상세)

#### POST /api/stress/calculate

**Request**:
```json
{
  "student_id": "string",
  "module_id": "string",
  "session_id": "string",
  "time_spent_minutes": 15.5,
  "problems_attempted": 10,
  "problems_correct": 8,
  "retry_count": 2,
  "average_response_time": 30.0,
  "response_time_trend": 0.1
}
```

**Response** (200 OK):
```json
{
  "student_id": "string",
  "module_id": "string",
  "session_id": "string",
  "stress_level": "MEDIUM",
  "stress_score": 45.23,
  "factors": {
    "error_rate": {
      "score": 20.0,
      "weight": 0.35,
      "value": 20.0,
      "unit": "percent"
    },
    "time_spent": { ... },
    "retry_count": { ... },
    "response_trend": { ... }
  },
  "timestamp": "2024-11-18T10:30:00",
  "recommendations": [
    "적절한 수준의 도전과 노력이 이루어지고 있습니다."
  ]
}
```

**Error Responses**:
- 422 Unprocessable Entity: 잘못된 입력 데이터
- 500 Internal Server Error: 계산 오류

#### GET /api/stress/metrics

**Query Parameters**:
- `module_id` (optional): 특정 모듈로 필터링
- `start_date` (optional): 시작 날짜
- `end_date` (optional): 종료 날짜

**Response** (200 OK):
```json
{
  "total_students": 25,
  "low_stress_count": 15,
  "medium_stress_count": 7,
  "high_stress_count": 3,
  "average_stress_score": 42.5,
  "timestamp": "2024-11-18T10:30:00"
}
```

## 🎨 Frontend Components (프론트엔드 컴포넌트)

### StressIndicatorCard

**Props**:
```typescript
interface StressIndicatorCardProps {
  indicator: StressIndicator;
}
```

**Features**:
- 스트레스 레벨 배지 (색상 코딩)
- 점수 표시 (0-100)
- 4가지 요인 막대 그래프
- 권장사항 목록
- 반응형 디자인

**Color Scheme**:
- LOW: #4CAF50 (녹색)
- MEDIUM: #FF9800 (주황색)
- HIGH: #F44336 (빨간색)

### StressDashboard

**Props**:
```typescript
interface StressDashboardProps {
  moduleId?: string;
}
```

**Features**:
- 총 학생 수 카드
- 평균 스트레스 점수 카드
- 레벨별 분포 차트
- 높은 스트레스 경고 박스
- 자동 새로고침 버튼

## 🔄 Data Flow (데이터 흐름)

### 1. 학습 활동 → 스트레스 지표

```
User Input (Learning Activity)
    ↓
Frontend API Client (api.ts)
    ↓
Backend API Endpoint (/api/stress/calculate)
    ↓
StressCalculator.calculate_stress()
    ├─ calculate_error_rate_score()
    ├─ calculate_time_spent_score()
    ├─ calculate_retry_score()
    └─ calculate_response_trend_score()
    ↓
Weighted Average Calculation
    ↓
Stress Level Classification
    ↓
Recommendations Generation
    ↓
Database Save
    ↓
Return StressIndicator
    ↓
Frontend Display (StressIndicatorCard)
```

### 2. 통계 조회

```
User Request (Get Metrics)
    ↓
Frontend API Client
    ↓
Backend API Endpoint (/api/stress/metrics)
    ↓
Database Query (with filters)
    ↓
Metrics Calculation
    ├─ Count by stress_level
    ├─ Average stress_score
    └─ Count unique students
    ↓
Return StressMetrics
    ↓
Frontend Display (StressDashboard)
```

## 🧪 Testing Strategy (테스트 전략)

### Backend Tests

```python
# test_stress_calculator.py
def test_calculate_error_rate_score():
    activity = LearningActivity(
        problems_attempted=10,
        problems_correct=8,
        # ... other fields
    )
    score = StressCalculator.calculate_error_rate_score(activity)
    assert score == 20.0  # 20% error rate

def test_stress_level_classification():
    # Test LOW
    assert classify(score=30) == StressLevel.LOW
    # Test MEDIUM
    assert classify(score=50) == StressLevel.MEDIUM
    # Test HIGH
    assert classify(score=70) == StressLevel.HIGH
```

### Frontend Tests

```typescript
// StressIndicatorCard.test.tsx
describe('StressIndicatorCard', () => {
  it('displays correct stress level color', () => {
    const indicator = { stress_level: 'HIGH', ... };
    render(<StressIndicatorCard indicator={indicator} />);
    expect(screen.getByRole('badge')).toHaveStyle({
      backgroundColor: '#F44336'
    });
  });
});
```

## 🚀 Deployment (배포)

### Docker Compose 배포

```bash
# 전체 스택 실행
docker-compose up -d

# 로그 확인
docker-compose logs -f

# 중지
docker-compose down
```

### 개별 서비스 배포

```bash
# Backend만 실행
docker-compose up -d db backend

# Frontend만 실행
docker-compose up -d frontend
```

## 📊 Performance Considerations (성능 고려사항)

### Backend Optimization

1. **인메모리 캐싱**: 자주 조회되는 지표는 메모리에 캐시
2. **인덱스 활용**: 타임스탬프, student_id, module_id에 인덱스
3. **배치 처리**: 여러 학생의 지표를 한 번에 계산

### Frontend Optimization

1. **코드 스플리팅**: React.lazy()로 컴포넌트 지연 로딩
2. **메모이제이션**: React.memo()로 불필요한 리렌더링 방지
3. **가상화**: 큰 목록은 react-window로 가상화

## 🔐 Security Best Practices (보안 모범 사례)

1. **입력 검증**: Pydantic으로 모든 입력 검증
2. **SQL 인젝션 방지**: 파라미터화된 쿼리 사용
3. **CORS 설정**: 프로덕션에서는 특정 도메인만 허용
4. **환경 변수**: 민감한 정보는 .env 파일로 관리
5. **HTTPS**: 프로덕션에서는 반드시 HTTPS 사용

## 📈 Monitoring & Logging (모니터링 및 로깅)

### 로그 레벨

- **DEBUG**: 상세한 디버깅 정보
- **INFO**: 일반적인 정보 (API 호출, 계산 완료)
- **WARNING**: 경고 (높은 스트레스 감지)
- **ERROR**: 오류 (계산 실패, DB 오류)

### 메트릭 추적

- API 응답 시간
- 스트레스 계산 처리량
- 데이터베이스 쿼리 시간
- 에러 발생률

## 🔮 Future Enhancements (향후 개선사항)

1. **실시간 모니터링**: WebSocket으로 실시간 스트레스 업데이트
2. **예측 모델**: ML 기반 스트레스 예측
3. **개인화**: 학생별 맞춤형 임계값
4. **알림 시스템**: 높은 스트레스 감지 시 교사에게 알림
5. **리포트 생성**: PDF 리포트 자동 생성

---

**Last Updated**: 2024-11-18
**Version**: 1.0.0
