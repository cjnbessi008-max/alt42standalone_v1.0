# 학생 속도 비교 시스템 (Student Speed Comparison System)

LMS 웹앱과 연동하여 학생의 현재 학습 속도를 반 평균 속도와 비교하는 종합 분석 시스템입니다.

## 📋 목차

- [개요](#개요)
- [주요 기능](#주요-기능)
- [시스템 아키텍처](#시스템-아키텍처)
- [설치 방법](#설치-방법)
- [사용 방법](#사용-방법)
- [API 문서](#api-문서)
- [컴포넌트 문서](#컴포넌트-문서)
- [LMS 연동](#lms-연동)

---

## 🎯 개요

이 시스템은 KAIST Touch Math Academy의 AI Education System Pipeline 프로젝트의 일부로, 학생들의 학습 속도를 추적하고 분석하여 개인화된 피드백을 제공합니다.

### 핵심 가치

- **실시간 속도 분석**: 학생의 문제 해결 속도를 실시간으로 추적
- **비교 분석**: 반 평균 속도와 비교하여 상대적 위치 파악
- **시각화**: 직관적인 차트와 그래프로 학습 추이 표시
- **개인화 추천**: AI 기반 학습 개선 제안 제공
- **LMS 연동**: 기존 학습 관리 시스템과 원활한 데이터 동기화

---

## ✨ 주요 기능

### 1. 속도 비교 카드 (Speed Comparison Card)
- 학생의 평균 문제 해결 속도
- 반 평균 속도와의 비교
- 정확도 및 백분위 순위
- 시각적 비교 바
- 개인화된 학습 추천

### 2. 속도 추이 차트 (Speed Trend Chart)
- 시간에 따른 학습 속도 변화 추적
- 학생 속도 vs 반 평균 속도 비교
- 개선도 분석 (% 빨라짐/느려짐)
- 선택 가능한 기간 (7일, 30일, 90일)

### 3. 반 리더보드 (Cohort Leaderboard)
- 반 내 순위 표시 (익명화 옵션)
- 다양한 정렬 기준 (종합, 속도, 정확도)
- 상위 학생 강조 (메달 아이콘)
- 현재 학생 하이라이트

### 4. 학생 대시보드 (Student Dashboard)
- 모든 기능 통합
- 탭 기반 네비게이션
- 반응형 디자인 (모바일, 태블릿, 데스크톱)
- 실시간 데이터 갱신

### 5. LMS 연동
- 학생 명단 동기화
- 성적 내보내기
- 진도 데이터 동기화
- 다중 LMS 지원 (KAIST LMS, Canvas)

---

## 🏗️ 시스템 아키텍처

```
┌─────────────────────────────────────────────────────────┐
│                   Frontend (React + TypeScript)          │
│  ┌──────────────────────────────────────────────────┐  │
│  │  StudentDashboard                                │  │
│  │    ├─ SpeedComparisonCard                        │  │
│  │    ├─ SpeedTrendChart                            │  │
│  │    └─ CohortLeaderboard                          │  │
│  └──────────────────────────────────────────────────┘  │
└───────────────────────┬─────────────────────────────────┘
                        │ REST API
┌───────────────────────▼─────────────────────────────────┐
│              Backend API (FastAPI + Python)             │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Speed Comparison Routes                         │  │
│  │    ├─ /api/speed-comparison/attempts             │  │
│  │    ├─ /api/speed-comparison/students/.../comparison│
│  │    ├─ /api/speed-comparison/cohorts/.../leaderboard│
│  │    └─ /api/speed-comparison/lms/sync             │  │
│  └──────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────┐  │
│  │  LMS Integration Layer                           │  │
│  │    ├─ KAISTLMSIntegration                        │  │
│  │    └─ CanvasLMSIntegration                       │  │
│  └──────────────────────────────────────────────────┘  │
└───────────────────────┬─────────────────────────────────┘
                        │
┌───────────────────────▼─────────────────────────────────┐
│                   PostgreSQL Database                    │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Tables:                                         │  │
│  │    ├─ student_attempts                           │  │
│  │    ├─ student_performance_metrics                │  │
│  │    ├─ comparison_cohorts                         │  │
│  │    ├─ cohort_memberships                         │  │
│  │    ├─ cohort_statistics                          │  │
│  │    ├─ speed_comparison_history                   │  │
│  │    └─ lms_sync_log                               │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

---

## 🚀 설치 방법

### 사전 요구사항

- Python 3.11+
- Node.js 16+
- PostgreSQL 15+
- npm or yarn

### 백엔드 설정

```bash
# 1. 프로젝트 디렉토리로 이동
cd /home/user/alt42standalone_v1.0

# 2. Python 가상환경 생성 및 활성화
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 3. 필요한 패키지 설치
pip install fastapi uvicorn asyncpg pydantic python-dotenv

# 4. 환경 변수 설정
cat > .env << EOF
DATABASE_URL=postgresql://user:password@localhost:5432/kaist_education
API_BASE_URL=http://localhost:8000
KAIST_LMS_API_KEY=your-api-key
KAIST_LMS_URL=https://lms.kaist.ac.kr/api
EOF

# 5. 데이터베이스 스키마 생성
psql -U your_user -d kaist_education -f backend/database/speed_tracking_schema.sql
```

### 프론트엔드 설정

```bash
# 1. frontend 디렉토리로 이동
cd frontend

# 2. 의존성 설치
npm install
# 또는
yarn install

# 3. 필요한 패키지 추가
npm install axios react react-dom

# 4. TypeScript 설정 (필요시)
npm install --save-dev @types/react @types/react-dom typescript

# 5. 환경 변수 설정
cat > .env.local << EOF
REACT_APP_API_BASE_URL=http://localhost:8000
EOF
```

---

## 📖 사용 방법

### 백엔드 서버 실행

```bash
# 프로젝트 루트에서
cd backend
uvicorn api.main:app --reload --host 0.0.0.0 --port 8000
```

### 프론트엔드 개발 서버 실행

```bash
# frontend 디렉토리에서
npm start
# 또는
yarn start
```

### 학생 대시보드 사용 예시

```tsx
import React from 'react';
import { StudentDashboard } from './components/StudentDashboard';

function App() {
  return (
    <StudentDashboard
      studentId="student-uuid"
      moduleId="module-uuid"
      cohortId="cohort-uuid"
      moduleName="3학년 분수 학습"
      showLeaderboard={true}
      showTrends={true}
    />
  );
}

export default App;
```

### API 직접 호출 예시

```typescript
import { speedComparisonApi } from './services/speedComparisonApi';

// 속도 비교 데이터 가져오기
const comparison = await speedComparisonApi.getSpeedComparison(
  'student-uuid',
  'module-uuid',
  {
    cohortId: 'cohort-uuid',
    includeTrends: true,
    trendDays: 30,
  }
);

console.log(comparison);
```

---

## 📚 API 문서

### 주요 엔드포인트

#### 1. 학생 시도 기록
```http
POST /api/speed-comparison/attempts
Content-Type: application/json

{
  "student_id": "uuid",
  "module_id": "uuid",
  "problem_id": "uuid",
  "answer_data": {},
  "is_correct": true,
  "time_spent_seconds": 45,
  "hints_used": 1
}
```

#### 2. 속도 비교 조회
```http
GET /api/speed-comparison/students/{student_id}/modules/{module_id}/comparison
    ?cohort_id=uuid
    &include_trends=true
    &trend_days=30

Response:
{
  "comparison": {
    "student_avg_time_seconds": 45.5,
    "cohort_avg_time_seconds": 52.3,
    "student_percentile": 75.0,
    "speed_vs_average_ratio": 0.87
  },
  "trends": [...],
  "recommendations": [...]
}
```

#### 3. 리더보드 조회
```http
GET /api/speed-comparison/cohorts/{cohort_id}/leaderboard
    ?module_id=uuid
    &limit=10
    &sort_by=overall
    &anonymize=true

Response:
{
  "leaderboard": [
    {
      "student_id": "uuid",
      "student_name": "Student 1",
      "average_time_per_problem_seconds": 42.5,
      "accuracy_percentage": 95.0,
      "percentile_rank": 90.0
    },
    ...
  ]
}
```

#### 4. LMS 동기화
```http
POST /api/speed-comparison/lms/sync
Content-Type: application/json

{
  "sync_type": "student_roster",
  "lms_provider": "kaist",
  "module_id": "uuid"
}

Response:
{
  "sync_id": "uuid",
  "sync_status": "success",
  "records_synced": 25,
  "records_failed": 0
}
```

전체 API 문서: `http://localhost:8000/docs` (Swagger UI)

---

## 🧩 컴포넌트 문서

### SpeedComparisonCard

학생의 속도를 시각적으로 표시하고 반 평균과 비교합니다.

**Props:**
```typescript
interface SpeedComparisonCardProps {
  studentId: string;          // 학생 UUID
  moduleId: string;           // 모듈 UUID
  cohortId?: string;          // 반 UUID (옵션)
  showRecommendations?: boolean; // 추천사항 표시 여부
}
```

**사용 예시:**
```tsx
<SpeedComparisonCard
  studentId="student-123"
  moduleId="module-456"
  cohortId="cohort-789"
  showRecommendations={true}
/>
```

### SpeedTrendChart

시간에 따른 학습 속도 변화를 선 그래프로 표시합니다.

**Props:**
```typescript
interface SpeedTrendChartProps {
  studentId: string;
  moduleId: string;
  cohortId?: string;
  trendDays?: number;        // 추세 기간 (기본: 30일)
}
```

**사용 예시:**
```tsx
<SpeedTrendChart
  studentId="student-123"
  moduleId="module-456"
  trendDays={90}
/>
```

### CohortLeaderboard

반 내 학생들의 순위를 표시합니다.

**Props:**
```typescript
interface CohortLeaderboardProps {
  cohortId: string;
  moduleId: string;
  limit?: number;              // 표시할 학생 수 (기본: 10)
  sortBy?: 'speed' | 'accuracy' | 'overall';
  anonymize?: boolean;         // 익명화 여부 (기본: true)
  showCurrentStudent?: boolean;
  currentStudentId?: string;
}
```

**사용 예시:**
```tsx
<CohortLeaderboard
  cohortId="cohort-789"
  moduleId="module-456"
  limit={20}
  sortBy="overall"
  anonymize={true}
  currentStudentId="student-123"
/>
```

---

## 🔗 LMS 연동

### KAIST LMS 연동 설정

```python
from backend.integrations.lms_integration import LMSIntegrationFactory

# LMS 설정
config = {
    'provider': 'kaist',
    'api_base_url': 'https://lms.kaist.ac.kr/api',
    'api_key': 'your-api-key',
    'timeout': 30
}

# 연동 인스턴스 생성
lms = LMSIntegrationFactory.create('kaist', config)

# 학생 명단 동기화
roster = await lms.sync_student_roster(module_id)

# 성적 내보내기
grades = await lms.export_grades(module_id, student_ids)

# 진도 동기화
progress = await lms.sync_progress(module_id)
```

### 새로운 LMS 추가하기

```python
from backend.integrations.lms_integration import LMSIntegrationBase, LMSIntegrationFactory

class CustomLMSIntegration(LMSIntegrationBase):
    def __init__(self, config):
        super().__init__(config)
        # 초기화 코드

    async def sync_student_roster(self, module_id):
        # 구현
        pass

    async def export_grades(self, module_id, student_ids):
        # 구현
        pass

    async def sync_progress(self, module_id, student_ids=None):
        # 구현
        pass

# Factory에 등록
LMSIntegrationFactory.register_integration('custom', CustomLMSIntegration)
```

---

## 📊 데이터베이스 스키마

### 주요 테이블

#### student_attempts
학생의 모든 문제 시도를 기록합니다.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| student_id | UUID | 학생 ID |
| module_id | UUID | 모듈 ID |
| problem_id | UUID | 문제 ID |
| time_spent_seconds | INTEGER | 소요 시간 (초) |
| is_correct | BOOLEAN | 정답 여부 |
| attempted_at | TIMESTAMP | 시도 시각 |

#### student_performance_metrics
학생별 집계된 성과 지표입니다.

| Column | Type | Description |
|--------|------|-------------|
| student_id | UUID | 학생 ID |
| module_id | UUID | 모듈 ID |
| average_time_per_problem_seconds | DECIMAL | 평균 속도 |
| accuracy_percentage | DECIMAL | 정확도 |
| percentile_rank | DECIMAL | 백분위 순위 |
| speed_vs_average_ratio | DECIMAL | 평균 대비 속도 비율 |

#### cohort_statistics
반별 통계 데이터입니다.

| Column | Type | Description |
|--------|------|-------------|
| cohort_id | UUID | 반 ID |
| module_id | UUID | 모듈 ID |
| avg_time_per_problem_seconds | DECIMAL | 반 평균 속도 |
| median_time_per_problem_seconds | DECIMAL | 반 중간값 속도 |
| active_student_count | INTEGER | 활성 학생 수 |

---

## 🎨 디자인 시스템

### 색상 팔레트

- **Primary**: `#667eea` (보라)
- **Secondary**: `#764ba2` (진보라)
- **Success**: `#4CAF50` (녹색)
- **Warning**: `#FFC107` (노란색)
- **Error**: `#d32f2f` (빨간색)
- **Info**: `#2196F3` (파란색)

### 타이포그래피

- **제목**: 20-32px, font-weight: 600-700
- **본문**: 14-16px, font-weight: 400-500
- **캡션**: 11-13px, font-weight: 400

### 간격

- **소**: 8px
- **중**: 16px
- **대**: 24px
- **특대**: 32px

---

## 🧪 테스트

### 백엔드 테스트

```bash
# 단위 테스트
pytest backend/tests/

# 특정 테스트 실행
pytest backend/tests/test_speed_comparison.py -v

# 커버리지 확인
pytest --cov=backend --cov-report=html
```

### 프론트엔드 테스트

```bash
# Jest 테스트 실행
npm test

# 커버리지 확인
npm test -- --coverage
```

---

## 🔧 트러블슈팅

### 일반적인 문제

#### 1. 데이터베이스 연결 오류
```
Error: Could not connect to database
```
**해결 방법**: `.env` 파일의 `DATABASE_URL` 확인

#### 2. API 호출 실패
```
Error: 404 Not Found
```
**해결 방법**: 백엔드 서버가 실행 중인지 확인

#### 3. CORS 오류
```
Error: CORS policy blocked
```
**해결 방법**: 백엔드 CORS 설정 확인

---

## 📈 성능 최적화

### 백엔드 최적화

1. **데이터베이스 인덱스**: 모든 외래 키와 자주 조회되는 컬럼에 인덱스 추가
2. **캐싱**: Redis를 사용한 통계 데이터 캐싱
3. **배치 처리**: 대량 데이터 처리 시 배치 작업 사용

### 프론트엔드 최적화

1. **코드 스플리팅**: React.lazy를 사용한 지연 로딩
2. **메모이제이션**: React.memo, useMemo 활용
3. **이미지 최적화**: WebP 포맷 사용, lazy loading

---

## 🤝 기여 방법

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 라이선스

This project is part of KAIST Touch Math Academy's AI Education System Pipeline.

---

## 👥 개발팀

- **Backend Development**: FastAPI, PostgreSQL
- **Frontend Development**: React, TypeScript
- **LMS Integration**: KAIST LMS, Canvas LMS
- **Database Design**: PostgreSQL Schema

---

## 📞 문의

프로젝트에 대한 문의사항이나 버그 리포트는 이슈 트래커를 통해 제출해주세요.

---

## 🗺️ 로드맵

### v1.0 (현재)
- ✅ 속도 비교 기본 기능
- ✅ 대시보드 UI
- ✅ LMS 연동 기본 구조

### v1.1 (계획 중)
- 📋 실시간 알림
- 📋 학부모 대시보드
- 📋 AI 기반 학습 경로 추천

### v2.0 (미래)
- 📋 모바일 앱
- 📋 다국어 지원 확장
- 📋 고급 분석 기능

---

**마지막 업데이트**: 2025-11-18
