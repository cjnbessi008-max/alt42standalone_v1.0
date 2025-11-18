# LMS 랭킹 및 성취 그래프 시스템
# LMS Ranking & Achievement Graph System

## 📋 목차 (Table of Contents)

1. [개요 (Overview)](#개요-overview)
2. [시스템 아키텍처 (System Architecture)](#시스템-아키텍처-system-architecture)
3. [데이터베이스 스키마 (Database Schema)](#데이터베이스-스키마-database-schema)
4. [백엔드 API (Backend API)](#백엔드-api-backend-api)
5. [프론트엔드 컴포넌트 (Frontend Components)](#프론트엔드-컴포넌트-frontend-components)
6. [설치 및 설정 (Installation & Setup)](#설치-및-설정-installation--setup)
7. [사용 예시 (Usage Examples)](#사용-예시-usage-examples)
8. [확장 가능성 (Extensibility)](#확장-가능성-extensibility)

---

## 개요 (Overview)

### 목적 (Purpose)

AI Education System Pipeline의 LMS 통합을 위한 랭킹 및 성취 그래프 시스템입니다. 학생들의 학습 진행 상황을 추적하고, 성취를 시각화하며, 경쟁적인 학습 환경을 제공합니다.

This is a ranking and achievement graph system for LMS integration with the AI Education System Pipeline. It tracks student learning progress, visualizes achievements, and provides a competitive learning environment.

### 주요 기능 (Key Features)

1. **랭킹 시스템 (Ranking System)**
   - 전체 순위 (Global leaderboard)
   - 학년별 순위 (Grade-level leaderboard)
   - 모듈별 순위 (Module-specific leaderboard)
   - 실시간 순위 업데이트 (Real-time rank updates)

2. **성취 시스템 (Achievement System)**
   - 다양한 카테고리의 성취 (Multiple achievement categories)
   - 티어 시스템 (Bronze, Silver, Gold, Platinum, Diamond)
   - 진행률 추적 (Progress tracking)
   - 자동 성취 감지 (Automatic achievement detection)

3. **분석 그래프 (Analytics Graphs)**
   - 정확도 추세 (Accuracy trends)
   - 문제 해결 통계 (Problems solved statistics)
   - 포인트 획득 이력 (Points earned history)
   - 학습 시간 분석 (Study time analysis)

4. **포인트 및 보상 (Points & Rewards)**
   - 포인트 시스템 (Point system)
   - 보상 카탈로그 (Rewards catalog)
   - 거래 내역 (Transaction history)

---

## 시스템 아키텍처 (System Architecture)

### 전체 구조 (Overall Structure)

```
┌─────────────────────────────────────────────────────────────┐
│                  Frontend (React + TypeScript)               │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐        │
│  │ Leaderboard  │ │ Achievement  │ │ Performance  │        │
│  │  Component   │ │    Board     │ │    Graphs    │        │
│  └──────────────┘ └──────────────┘ └──────────────┘        │
└──────────────────────────┬──────────────────────────────────┘
                           │ REST API
┌──────────────────────────▼──────────────────────────────────┐
│                  Backend (FastAPI + Python)                  │
│  ┌────────────────────────────────────────────────────┐     │
│  │         Ranking & Achievement API                  │     │
│  │  - GET /leaderboard/*                              │     │
│  │  - GET /students/{id}/achievements                 │     │
│  │  - GET /students/{id}/performance-graphs           │     │
│  │  - GET /students/{id}/dashboard                    │     │
│  └────────────────────────────────────────────────────┘     │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│                  Database (PostgreSQL)                       │
│  ┌────────────────────────────────────────────────────┐     │
│  │ Tables:                                            │     │
│  │ - achievements, student_achievements               │     │
│  │ - student_rankings, module_rankings                │     │
│  │ - daily_activity_log, learning_analytics           │     │
│  │ - point_transactions, rewards                      │     │
│  └────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

### 데이터 흐름 (Data Flow)

1. **학생 활동 발생 (Student Activity Occurs)**
   - 문제 해결, 모듈 완료 등 (Problem solving, module completion, etc.)

2. **데이터 수집 (Data Collection)**
   - `daily_activity_log` 테이블에 활동 기록
   - `point_transactions` 테이블에 포인트 거래 기록

3. **순위 계산 (Ranking Calculation)**
   - `update_student_ranking()` 함수 실행
   - `student_rankings`, `module_rankings` 업데이트

4. **성취 확인 (Achievement Check)**
   - `check_achievements()` 함수 실행
   - 조건 충족 시 `student_achievements` 테이블에 추가

5. **분석 데이터 생성 (Analytics Generation)**
   - `learning_analytics` 테이블에 시계열 데이터 저장

6. **프론트엔드 표시 (Frontend Display)**
   - API를 통해 데이터 조회
   - 그래프 및 UI 컴포넌트로 시각화

---

## 데이터베이스 스키마 (Database Schema)

### 핵심 테이블 (Core Tables)

#### 1. achievements (성취 정의)

```sql
CREATE TABLE achievements (
    id UUID PRIMARY KEY,
    name VARCHAR(255),               -- English name
    name_ko VARCHAR(255),             -- Korean name
    description TEXT,
    description_ko TEXT,
    category VARCHAR(50),             -- completion, mastery, streak, speed, etc.
    icon_url VARCHAR(500),
    badge_color VARCHAR(7),           -- Hex color
    points INTEGER,                   -- Points awarded
    criteria JSONB,                   -- Achievement criteria
    tier VARCHAR(20),                 -- bronze, silver, gold, platinum, diamond
    is_active BOOLEAN,
    display_order INTEGER
);
```

#### 2. student_rankings (학생 순위)

```sql
CREATE TABLE student_rankings (
    id UUID PRIMARY KEY,
    student_id UUID REFERENCES students(id),
    total_points INTEGER,
    modules_completed INTEGER,
    problems_solved INTEGER,
    accuracy_percentage DECIMAL(5,2),
    current_streak_days INTEGER,
    longest_streak_days INTEGER,
    global_rank INTEGER,
    grade_rank INTEGER,
    last_activity_at TIMESTAMP
);
```

#### 3. daily_activity_log (일일 활동 로그)

```sql
CREATE TABLE daily_activity_log (
    id UUID PRIMARY KEY,
    student_id UUID REFERENCES students(id),
    activity_date DATE,
    modules_accessed INTEGER,
    problems_attempted INTEGER,
    problems_correct INTEGER,
    time_spent_minutes INTEGER,
    points_earned INTEGER,
    achievements_earned INTEGER
);
```

### 전체 스키마 파일

전체 데이터베이스 스키마는 다음 파일을 참조하세요:
- **파일**: `database/schema/ranking_achievement_schema.sql`
- **내용**:
  - 9개의 핵심 테이블
  - 인덱스 및 뷰
  - 자동 업데이트 함수
  - 트리거
  - 샘플 데이터

---

## 백엔드 API (Backend API)

### API 엔드포인트 목록

#### 리더보드 (Leaderboard)

| 메소드 | 엔드포인트 | 설명 | 파라미터 |
|--------|-----------|------|---------|
| GET | `/api/v1/leaderboard/global` | 전체 리더보드 | limit, offset |
| GET | `/api/v1/leaderboard/grade/{grade_level}` | 학년별 리더보드 | limit, offset |
| GET | `/api/v1/leaderboard/module/{module_id}` | 모듈별 리더보드 | limit |
| GET | `/api/v1/students/{student_id}/ranking` | 학생 순위 조회 | - |

#### 성취 (Achievements)

| 메소드 | 엔드포인트 | 설명 | 파라미터 |
|--------|-----------|------|---------|
| GET | `/api/v1/achievements` | 전체 성취 목록 | category, tier, is_active |
| GET | `/api/v1/students/{student_id}/achievements` | 학생의 획득 성취 | - |
| GET | `/api/v1/students/{student_id}/achievements/progress` | 성취 진행률 | - |

#### 분석 그래프 (Analytics)

| 메소드 | 엔드포인트 | 설명 | 파라미터 |
|--------|-----------|------|---------|
| GET | `/api/v1/students/{student_id}/performance-graphs` | 성과 그래프 데이터 | period, metrics |
| GET | `/api/v1/students/{student_id}/dashboard` | 통합 대시보드 데이터 | - |

#### 포인트 및 보상 (Points & Rewards)

| 메소드 | 엔드포인트 | 설명 | 파라미터 |
|--------|-----------|------|---------|
| GET | `/api/v1/students/{student_id}/points/history` | 포인트 거래 내역 | limit, transaction_type |
| GET | `/api/v1/students/{student_id}/rewards` | 보상 목록 | reward_type |

### API 사용 예시

#### 전체 리더보드 조회

```bash
GET /api/v1/leaderboard/global?limit=50&offset=0
```

**응답 (Response)**:
```json
{
  "leaderboard_type": "global",
  "updated_at": "2025-11-18T10:30:00Z",
  "rankings": [
    {
      "student_id": "uuid-1",
      "student_name": "홍길동",
      "grade_level": "3",
      "global_rank": 1,
      "total_points": 1500,
      "modules_completed": 25,
      "problems_solved": 350,
      "accuracy_percentage": 92.5,
      "current_streak_days": 7,
      "achievements_earned": 15
    }
  ]
}
```

#### 학생 대시보드 조회

```bash
GET /api/v1/students/{student_id}/dashboard
```

**응답**:
```json
{
  "student_id": "uuid-1",
  "student_name": "홍길동",
  "overall_stats": {
    "total_points": 1500,
    "modules_completed": 25,
    "problems_solved": 350,
    "accuracy_percentage": 92.5,
    "current_streak_days": 7,
    "longest_streak_days": 14
  },
  "recent_achievements": [...],
  "ranking_info": {...},
  "performance_graphs": [...],
  "current_goals": [...]
}
```

---

## 프론트엔드 컴포넌트 (Frontend Components)

### 컴포넌트 구조

```
frontend/src/
├── components/
│   ├── ranking/
│   │   └── Leaderboard.tsx          # 리더보드 컴포넌트
│   ├── achievements/
│   │   └── AchievementBoard.tsx     # 성취 보드 컴포넌트
│   └── analytics/
│       └── PerformanceGraphs.tsx    # 성과 그래프 컴포넌트
└── pages/
    └── StudentDashboard.tsx          # 통합 대시보드 페이지
```

### 1. Leaderboard 컴포넌트

**기능**:
- 전체/학년별/모듈별 리더보드 표시
- 실시간 순위 업데이트
- 현재 학생 하이라이트
- 정렬 및 필터링

**사용법**:
```tsx
import { Leaderboard } from '@/components/ranking/Leaderboard';

<Leaderboard
  currentStudentId="student-uuid"
  scope="global"
  limit={50}
/>
```

**주요 Props**:
- `currentStudentId`: 현재 학생 ID (하이라이트용)
- `scope`: 리더보드 범위 ('global' | 'grade' | 'module')
- `scopeId`: 학년 또는 모듈 ID (scope가 'grade' 또는 'module'일 때)
- `limit`: 표시할 학생 수

### 2. AchievementBoard 컴포넌트

**기능**:
- 획득한 성취 표시
- 진행 중인 성취 추적
- 티어별 분류
- 성취 상세 정보

**사용법**:
```tsx
import { AchievementBoard } from '@/components/achievements/AchievementBoard';

<AchievementBoard studentId="student-uuid" />
```

### 3. PerformanceGraphs 컴포넌트

**기능**:
- 정확도 추세 그래프
- 문제 해결 통계 그래프
- 포인트 획득 그래프
- 기간별 필터링 (일별/주별/월별)

**사용법**:
```tsx
import { PerformanceGraphs } from '@/components/analytics/PerformanceGraphs';

<PerformanceGraphs
  studentId="student-uuid"
  defaultPeriod="weekly"
  showMetrics={['accuracy_trend', 'problems_solved_trend', 'points_earned']}
/>
```

**주요 Props**:
- `studentId`: 학생 ID
- `defaultPeriod`: 기본 기간 ('daily' | 'weekly' | 'monthly' | 'all_time')
- `showMetrics`: 표시할 메트릭 배열

### 4. StudentDashboard 페이지

**기능**:
- 모든 컴포넌트 통합
- 빠른 통계 카드
- 뷰 전환 (전체/분석/성취/리더보드)
- 반응형 레이아웃

**사용법**:
```tsx
import { StudentDashboard } from '@/pages/StudentDashboard';

<StudentDashboard studentId="student-uuid" />
```

---

## 설치 및 설정 (Installation & Setup)

### 1. 데이터베이스 설정

```bash
# PostgreSQL 데이터베이스에 스키마 적용
psql -U your_user -d your_database -f database/schema/ranking_achievement_schema.sql
```

### 2. 백엔드 설정

```bash
# 의존성 설치
cd backend
pip install -r requirements.txt

# 환경 변수 설정
export DATABASE_URL="postgresql://user:password@localhost:5432/dbname"

# 서버 실행
uvicorn main:app --reload --port 8000
```

**requirements.txt** (필요한 패키지):
```
fastapi>=0.104.0
uvicorn>=0.24.0
asyncpg>=0.29.0
pydantic>=2.4.0
```

### 3. 프론트엔드 설정

```bash
# 의존성 설치
cd frontend
npm install

# 개발 서버 실행
npm run dev
```

**package.json** (필요한 패키지):
```json
{
  "dependencies": {
    "react": "^18.2.0",
    "@mui/material": "^5.14.0",
    "@mui/icons-material": "^5.14.0",
    "recharts": "^2.10.0",
    "axios": "^1.6.0"
  }
}
```

### 4. API 라우트 등록

백엔드 `main.py`에 API 라우터 등록:

```python
from fastapi import FastAPI
from backend.api.ranking_achievement_api import router as ranking_router

app = FastAPI()

# 라우터 등록
app.include_router(ranking_router)
```

---

## 사용 예시 (Usage Examples)

### 예시 1: 학생 대시보드 페이지

```tsx
import React from 'react';
import { StudentDashboard } from '@/pages/StudentDashboard';

function App() {
  const currentStudentId = "12345-uuid";

  return (
    <div className="App">
      <StudentDashboard studentId={currentStudentId} />
    </div>
  );
}
```

### 예시 2: 커스텀 리더보드

```tsx
import { Leaderboard } from '@/components/ranking/Leaderboard';

function MyLeaderboard() {
  return (
    <div>
      <h1>우리 반 순위</h1>
      <Leaderboard
        scope="grade"
        scopeId="3"
        limit={30}
        currentStudentId="student-uuid"
      />
    </div>
  );
}
```

### 예시 3: 성취 진행률 확인

```tsx
import { AchievementBoard } from '@/components/achievements/AchievementBoard';

function MyAchievements() {
  return (
    <div>
      <h1>나의 성취</h1>
      <AchievementBoard studentId="student-uuid" />
    </div>
  );
}
```

### 예시 4: 백엔드에서 순위 업데이트

```python
from backend.api.ranking_achievement_api import get_db

async def update_student_after_activity(student_id: str):
    """학생 활동 후 순위 및 성취 업데이트"""
    db = await get_db()

    # 순위 업데이트
    await db.execute("SELECT update_student_ranking($1)", student_id)

    # 성취 확인
    new_achievements = await db.fetch(
        "SELECT * FROM check_achievements($1)",
        student_id
    )

    return {
        "status": "success",
        "new_achievements": new_achievements
    }
```

---

## 확장 가능성 (Extensibility)

### 새로운 성취 추가

```sql
INSERT INTO achievements (
    name, name_ko, description, description_ko,
    category, points, criteria, tier
) VALUES (
    'Problem Solver 100',
    '문제 해결사 100',
    'Solve 100 problems correctly',
    '100개의 문제를 정확하게 해결하기',
    'mastery',
    100,
    '{"problems_correct": 100}',
    'gold'
);
```

### 새로운 메트릭 추가

1. **데이터베이스**: `learning_analytics` 테이블에 새로운 메트릭 데이터 추가
2. **백엔드**: `_generate_graph_data()` 함수에 새 메트릭 핸들러 추가
3. **프론트엔드**: 새 차트 컴포넌트 생성 및 `renderGraph()` 업데이트

### 커스텀 리더보드 생성

```python
@router.get("/leaderboard/custom/{criteria}")
async def get_custom_leaderboard(
    criteria: str,  # e.g., "highest_accuracy", "most_active"
    limit: int = 50,
    db = Depends(get_db)
):
    """커스텀 기준으로 리더보드 생성"""
    # 구현...
```

### 실시간 업데이트 (WebSocket)

```python
from fastapi import WebSocket

@app.websocket("/ws/leaderboard")
async def leaderboard_websocket(websocket: WebSocket):
    await websocket.accept()
    while True:
        # 실시간 순위 데이터 전송
        data = await get_latest_rankings()
        await websocket.send_json(data)
        await asyncio.sleep(5)  # 5초마다 업데이트
```

---

## 모범 사례 (Best Practices)

### 1. 성능 최적화

- **인덱스 사용**: 자주 조회되는 컬럼에 인덱스 생성
- **캐싱**: Redis를 사용한 리더보드 캐싱
- **배치 업데이트**: 순위 계산을 정기적으로 배치 처리

```python
# 캐싱 예시
@lru_cache(maxsize=128, ttl=300)  # 5분 캐시
async def get_cached_leaderboard(scope: str):
    return await fetch_leaderboard(scope)
```

### 2. 보안

- **입력 검증**: 모든 사용자 입력 검증
- **권한 확인**: 학생은 자신의 데이터만 접근 가능
- **SQL 인젝션 방지**: 파라미터화된 쿼리 사용

```python
# 권한 확인 예시
async def verify_student_access(requesting_student_id: str, target_student_id: str):
    if requesting_student_id != target_student_id:
        raise HTTPException(status_code=403, detail="Access denied")
```

### 3. 확장성

- **데이터베이스 파티셔닝**: 대용량 데이터를 위한 테이블 파티셔닝
- **읽기 복제본**: 읽기 전용 복제본으로 부하 분산
- **마이크로서비스**: 랭킹/성취 시스템을 별도 서비스로 분리

---

## 트러블슈팅 (Troubleshooting)

### 문제: 순위가 업데이트되지 않음

**해결책**:
```sql
-- 수동으로 순위 재계산
SELECT update_student_ranking('student-uuid');

-- 또는 모든 학생 순위 재계산
SELECT student_id FROM students;
-- 각 student_id에 대해 update_student_ranking() 실행
```

### 문제: 성취가 자동으로 부여되지 않음

**해결책**:
```sql
-- 성취 기준 확인
SELECT id, name, criteria FROM achievements WHERE is_active = true;

-- 수동으로 성취 확인
SELECT * FROM check_achievements('student-uuid');
```

### 문제: 그래프 데이터가 표시되지 않음

**해결책**:
1. `daily_activity_log` 테이블에 데이터가 있는지 확인
2. 기간(period) 파라미터가 올바른지 확인
3. 브라우저 콘솔에서 API 응답 확인

---

## 라이센스 및 기여 (License & Contributing)

### 라이센스
이 프로젝트는 KAIST Touch Math Academy의 AI Education System Pipeline의 일부입니다.

### 기여 방법
1. 이슈 생성 (GitHub Issues)
2. 풀 리퀘스트 제출
3. 코드 리뷰 및 승인 대기

---

## 연락처 (Contact)

문의사항이 있으시면 다음으로 연락해주세요:
- **기술 지원**: [개발팀 이메일]
- **교육 관련**: [교육팀 이메일]
- **버그 리포트**: GitHub Issues

---

**문서 버전**: 1.0.0
**최종 업데이트**: 2025-11-18
**작성자**: AI Agent (Claude)
