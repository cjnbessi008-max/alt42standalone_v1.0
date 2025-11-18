# AI Education System Pipeline - LMS Integration

## 🎓 프로젝트 개요 (Project Overview)

KAIST Touch Math Academy를 위한 AI 기반 교육 시스템 파이프라인입니다. 교사가 자연어로 요청하면 완전한 교육 모듈(데이터베이스, UI, 로직)을 자동으로 생성합니다.

An AI-driven education system pipeline for KAIST Touch Math Academy. Teachers can request in natural language, and the system automatically generates complete educational modules (database, UI, logic).

## ✨ 새로운 기능: LMS 랭킹 및 성취 그래프 시스템

이번 업데이트에서 **LMS 통합을 위한 랭킹 및 성취 그래프 시스템**이 추가되었습니다!

This update adds a **Ranking & Achievement Graph System for LMS Integration**!

### 주요 기능 (Key Features)

#### 🏆 랭킹 시스템 (Ranking System)
- ✅ 전체 리더보드 (Global leaderboard)
- ✅ 학년별 순위 (Grade-level rankings)
- ✅ 모듈별 순위 (Module-specific rankings)
- ✅ 실시간 순위 업데이트 (Real-time rank updates)

#### 🎖️ 성취 시스템 (Achievement System)
- ✅ 5단계 티어 시스템 (5-tier system: Bronze → Diamond)
- ✅ 8개 카테고리 (8 categories: completion, mastery, streak, speed, etc.)
- ✅ 자동 성취 감지 (Automatic achievement detection)
- ✅ 진행률 추적 (Progress tracking)

#### 📊 분석 그래프 (Analytics Graphs)
- ✅ 정확도 추세 (Accuracy trends)
- ✅ 문제 해결 통계 (Problems solved statistics)
- ✅ 포인트 획득 이력 (Points earned history)
- ✅ 학습 시간 분석 (Study time analysis)

#### 🎁 포인트 및 보상 (Points & Rewards)
- ✅ 포인트 시스템 (Point system)
- ✅ 보상 카탈로그 (Rewards catalog)
- ✅ 거래 내역 추적 (Transaction history)

## 📁 프로젝트 구조 (Project Structure)

```
alt42standalone_v1.0/
├── backend/
│   └── api/
│       └── ranking_achievement_api.py    # FastAPI endpoints
├── frontend/
│   └── src/
│       ├── components/
│       │   ├── ranking/
│       │   │   └── Leaderboard.tsx       # Leaderboard component
│       │   ├── achievements/
│       │   │   └── AchievementBoard.tsx  # Achievement component
│       │   └── analytics/
│       │       └── PerformanceGraphs.tsx # Analytics graphs
│       └── pages/
│           └── StudentDashboard.tsx       # Integrated dashboard
├── database/
│   └── schema/
│       └── ranking_achievement_schema.sql # Database schema
├── docs/
│   └── LMS_RANKING_ACHIEVEMENT_SYSTEM.md # Detailed documentation
└── tasks/
    └── 0001-prd-ai-education-pipeline.md  # Product requirements
```

## 🚀 빠른 시작 (Quick Start)

### 1️⃣ 데이터베이스 설정

```bash
# PostgreSQL에 스키마 적용
psql -U your_user -d your_database -f database/schema/ranking_achievement_schema.sql
```

### 2️⃣ 백엔드 실행

```bash
cd backend
pip install fastapi uvicorn asyncpg pydantic
uvicorn main:app --reload --port 8000
```

### 3️⃣ 프론트엔드 실행

```bash
cd frontend
npm install
npm run dev
```

### 4️⃣ 대시보드 접속

```
http://localhost:3000/dashboard
```

## 📖 문서 (Documentation)

상세한 문서는 다음 파일을 참조하세요:

- **완전한 가이드**: [docs/LMS_RANKING_ACHIEVEMENT_SYSTEM.md](./docs/LMS_RANKING_ACHIEVEMENT_SYSTEM.md)
- **PRD**: [tasks/0001-prd-ai-education-pipeline.md](./tasks/0001-prd-ai-education-pipeline.md)

### 주요 문서 내용
- ✅ 시스템 아키텍처
- ✅ 데이터베이스 스키마 상세
- ✅ API 엔드포인트 목록
- ✅ 컴포넌트 사용법
- ✅ 설치 및 설정 가이드
- ✅ 사용 예시
- ✅ 확장 가이드

## 🎯 사용 예시 (Usage Examples)

### 학생 대시보드

```tsx
import { StudentDashboard } from '@/pages/StudentDashboard';

function App() {
  return <StudentDashboard studentId="student-uuid-123" />;
}
```

### 커스텀 리더보드

```tsx
import { Leaderboard } from '@/components/ranking/Leaderboard';

<Leaderboard
  scope="grade"
  scopeId="3"
  currentStudentId="student-uuid"
  limit={50}
/>
```

### 성과 그래프

```tsx
import { PerformanceGraphs } from '@/components/analytics/PerformanceGraphs';

<PerformanceGraphs
  studentId="student-uuid"
  defaultPeriod="weekly"
  showMetrics={['accuracy_trend', 'problems_solved_trend']}
/>
```

## 🛠️ 기술 스택 (Tech Stack)

### Backend
- **FastAPI** - Modern, fast web framework
- **Python 3.11+** - Programming language
- **PostgreSQL** - Relational database
- **asyncpg** - Async PostgreSQL driver

### Frontend
- **React 18** - UI framework
- **TypeScript** - Type-safe JavaScript
- **Material-UI** - Component library
- **Recharts** - Chart library

### Database
- **PostgreSQL 15+** - Primary database
- **JSONB** - Flexible data storage
- **Views & Functions** - Complex queries

## 📊 API 엔드포인트 (API Endpoints)

### Leaderboards
```
GET /api/v1/leaderboard/global
GET /api/v1/leaderboard/grade/{grade_level}
GET /api/v1/leaderboard/module/{module_id}
```

### Achievements
```
GET /api/v1/achievements
GET /api/v1/students/{id}/achievements
GET /api/v1/students/{id}/achievements/progress
```

### Analytics
```
GET /api/v1/students/{id}/performance-graphs
GET /api/v1/students/{id}/dashboard
```

### Points & Rewards
```
GET /api/v1/students/{id}/points/history
GET /api/v1/students/{id}/rewards
```

## 🎨 UI 컴포넌트 (UI Components)

### 1. Leaderboard Component
- 전체/학년별/모듈별 순위 표시
- 현재 학생 하이라이트
- 실시간 업데이트
- 반응형 디자인

### 2. Achievement Board
- 획득한 성취 표시
- 진행 중인 성취 추적
- 티어별 분류 (Bronze → Diamond)
- 진행률 시각화

### 3. Performance Graphs
- 정확도 추세 그래프
- 문제 해결 통계
- 포인트 획득 이력
- 기간별 필터링 (일/주/월)

### 4. Student Dashboard
- 모든 컴포넌트 통합
- 빠른 통계 카드
- 순위 정보 배너
- 뷰 전환 기능

## 🔧 환경 변수 (Environment Variables)

```bash
# Backend
DATABASE_URL=postgresql://user:password@localhost:5432/dbname
API_HOST=0.0.0.0
API_PORT=8000

# Frontend
REACT_APP_API_URL=http://localhost:8000
```

## 📈 데이터베이스 스키마 (Database Schema)

### 핵심 테이블 (9개)
1. `achievements` - 성취 정의
2. `student_achievements` - 학생별 획득 성취
3. `achievement_progress` - 성취 진행률
4. `student_rankings` - 전체 순위
5. `module_rankings` - 모듈별 순위
6. `daily_activity_log` - 일일 활동 로그
7. `learning_analytics` - 학습 분석 데이터
8. `point_transactions` - 포인트 거래
9. `rewards` - 보상 카탈로그

### 자동화 기능
- ✅ 순위 자동 계산 (`update_student_ranking()`)
- ✅ 성취 자동 감지 (`check_achievements()`)
- ✅ 트리거를 통한 자동 업데이트
- ✅ 뷰를 통한 복잡한 쿼리 단순화

## 🎓 샘플 데이터 (Sample Data)

데이터베이스 스키마에는 8개의 샘플 성취와 5개의 보상이 포함되어 있습니다:

### 샘플 성취
- **First Steps** (Bronze) - 첫 모듈 완료
- **Five Star Student** (Silver) - 5개 모듈 완료
- **Perfect Score** (Gold) - 100점 달성
- **Week Warrior** (Gold) - 7일 연속 로그인
- **Math Master** (Diamond) - 50개 모듈 90%+ 정확도로 완료

### 샘플 보상
- Golden Star Badge (50 포인트)
- Dark Mode Theme (100 포인트)
- Math Wizard Avatar (150 포인트)
- Genius Title (200 포인트)
- Certificate of Excellence (300 포인트)

## 🤝 기여 방법 (Contributing)

1. 이슈 생성 (Create an issue)
2. 브랜치 생성 (`git checkout -b feature/AmazingFeature`)
3. 변경사항 커밋 (`git commit -m 'Add some AmazingFeature'`)
4. 브랜치에 푸시 (`git push origin feature/AmazingFeature`)
5. Pull Request 생성

## 🐛 버그 리포트 (Bug Reports)

버그를 발견하셨나요? GitHub Issues에 리포트해주세요!

## 📝 라이센스 (License)

이 프로젝트는 KAIST Touch Math Academy의 소유입니다.

## 📞 연락처 (Contact)

- **기술 지원**: [개발팀 이메일]
- **교육 관련**: [교육팀 이메일]

## 🎉 감사의 말 (Acknowledgments)

- KAIST Touch Math Academy
- Claude AI (Anthropic)
- 모든 기여자들

---

**버전**: 1.0.0
**최종 업데이트**: 2025-11-18
**상태**: ✅ 랭킹 및 성취 시스템 구현 완료

---

## 📸 스크린샷 (Screenshots)

### 학생 대시보드
- 전체 통계 카드
- 순위 정보 배너
- 성과 그래프
- 성취 보드
- 리더보드

### 리더보드
- 전체 순위 탭
- 학년별 순위 탭
- 모듈별 순위 탭
- 현재 학생 하이라이트

### 성취 보드
- 획득한 성취 그리드
- 진행 중인 성취 그리드
- 티어별 분류
- 진행률 바

### 성과 그래프
- 정확도 추세 (Area Chart)
- 문제 해결 (Bar Chart)
- 포인트 획득 (Line Chart)
- 기간별 필터링

---

**Made with ❤️ by Claude AI**
