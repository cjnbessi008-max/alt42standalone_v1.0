# Daily Mission LMS - 오늘의 1문제 미션 시스템

LMS와 연동되는 일일 학습 미션 관리 시스템입니다. 학생들에게 매일 한 문제씩 제공하고, 연속 학습 기록(Streak)을 관리하며, 외부 LMS와 성적을 동기화할 수 있습니다.

## 🌟 주요 기능

### 학생 기능
- 📚 **오늘의 1문제**: 매일 하나의 문제를 자동으로 배정받아 풀이
- 🔥 **연속 학습 기록**: 연속으로 문제를 푼 날짜 추적 및 시각화
- 📊 **학습 통계**: 정답률, 완료한 문제 수, 소요 시간 등 통계 제공
- ⏱️ **실시간 타이머**: 문제 풀이 시간 측정
- 💬 **즉시 피드백**: 제출 즉시 정답 여부 및 해설 제공

### 교사 기능
- ✏️ **미션 생성**: 과목, 학년, 기간 등을 설정하여 미션 생성
- 👥 **학생 관리**: 미션에 학생 등록 및 관리
- 📈 **분석 대시보드**: 학생들의 완료율, 정답률, 참여도 분석
- 🎯 **문제 풀 관리**: 문제 추가, 수정, 난이도 설정

### LMS 연동
- 🔗 **자동 학생 등록**: LMS 과정의 학생을 자동으로 미션에 등록
- 📤 **성적 동기화**: 문제 완료 결과를 LMS에 자동 전송
- 👤 **사용자 동기화**: LMS 사용자 정보 연동
- 📚 **과정 연동**: LMS 과정과 미션 매핑

## 🏗️ 시스템 아키텍처

```
┌─────────────────┐
│   React Web UI  │  (학생/교사 인터페이스)
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│   FastAPI API   │  (REST API 서버)
└────────┬────────┘
         │
    ┌────┴────┐
    ↓         ↓
┌─────────┐  ┌──────────┐
│PostgreSQL│  │  LMS API │  (외부 LMS 연동)
└─────────┘  └──────────┘
```

## 📁 프로젝트 구조

```
alt42standalone_v1.0/
├── backend/                    # FastAPI 백엔드
│   ├── app/
│   │   ├── main.py            # FastAPI 애플리케이션 진입점
│   │   ├── config.py          # 설정 관리
│   │   ├── models/            # Pydantic 모델
│   │   │   └── daily_mission.py
│   │   ├── routes/            # API 라우트
│   │   │   ├── missions.py   # 미션 관련 API
│   │   │   └── lms.py         # LMS 연동 API
│   │   └── services/          # 비즈니스 로직
│   │       ├── database.py
│   │       ├── daily_mission_service.py
│   │       └── lms_integration.py
│   ├── requirements.txt       # Python 의존성
│   └── .env.example           # 환경 변수 예시
│
├── frontend/                   # React 프론트엔드
│   ├── src/
│   │   ├── components/        # React 컴포넌트
│   │   │   ├── DailyProblemCard.tsx
│   │   │   └── StreakDisplay.tsx
│   │   ├── pages/             # 페이지 컴포넌트
│   │   │   └── StudentDashboard.tsx
│   │   └── services/          # API 서비스
│   │       └── api.ts
│   ├── package.json           # Node.js 의존성
│   └── vite.config.ts         # Vite 설정
│
└── database/                   # 데이터베이스
    └── migrations/
        └── 0001_daily_missions.sql  # DB 스키마
```

## 🚀 설치 및 실행

### 1. 사전 요구사항

- Python 3.11+
- Node.js 18+
- PostgreSQL 15+
- Redis 7+ (선택사항 - 작업 큐용)

### 2. 데이터베이스 설정

```bash
# PostgreSQL 데이터베이스 생성
createdb daily_mission_db

# 스키마 마이그레이션
psql daily_mission_db < database/migrations/0001_daily_missions.sql
```

### 3. 백엔드 설정

```bash
cd backend

# 가상환경 생성 및 활성화
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 의존성 설치
pip install -r requirements.txt

# 환경 변수 설정
cp .env.example .env
# .env 파일을 편집하여 DATABASE_URL 등 설정

# 서버 실행
python -m app.main
```

백엔드 서버가 `http://localhost:8000`에서 실행됩니다.

### 4. 프론트엔드 설정

```bash
cd frontend

# 의존성 설치
npm install

# 환경 변수 설정
cp .env.example .env

# 개발 서버 실행
npm run dev
```

프론트엔드가 `http://localhost:3000`에서 실행됩니다.

## 🔧 환경 변수 설정

### Backend (.env)

```env
# 데이터베이스
DATABASE_URL=postgresql://user:password@localhost:5432/daily_mission_db

# 보안
SECRET_KEY=your-secret-key-here

# LMS 연동 (선택사항)
LMS_API_URL=https://your-lms.com/api/v1
LMS_API_KEY=your-lms-api-key
LMS_SYNC_ENABLED=true
```

### Frontend (.env)

```env
VITE_API_URL=http://localhost:8000
```

## 📊 데이터베이스 스키마

주요 테이블:
- `users`: 사용자 (학생, 교사)
- `daily_missions`: 일일 미션 정보
- `mission_problems`: 문제 풀
- `mission_enrollments`: 학생-미션 등록
- `student_mission_progress`: 학생의 문제 풀이 기록
- `student_mission_streaks`: 연속 학습 기록
- `daily_problem_assignments`: 일별 문제 배정
- `mission_notifications`: 알림

## 🔌 API 엔드포인트

### 미션 관련
- `POST /api/missions` - 미션 생성
- `GET /api/missions/{mission_id}` - 미션 조회
- `GET /api/missions/student/{student_id}` - 학생의 미션 목록
- `GET /api/missions/{mission_id}/daily-problem` - 오늘의 문제 조회
- `POST /api/missions/{mission_id}/submit` - 답안 제출
- `GET /api/missions/{mission_id}/student/{student_id}/dashboard` - 학생 대시보드
- `GET /api/missions/{mission_id}/analytics` - 미션 분석

### LMS 연동
- `GET /api/lms/status` - LMS 연결 상태
- `GET /api/lms/user/{lms_user_id}` - LMS 사용자 동기화
- `GET /api/lms/course/{lms_course_id}/students` - 과정 학생 목록

## 🎯 사용 시나리오

### 교사: 미션 생성 및 학생 등록

```python
# 1. 미션 생성 (LMS 과정 연동)
POST /api/missions
{
  "title": "수학 일일 문제",
  "description": "매일 수학 문제를 풀어봅시다",
  "subject": "mathematics",
  "grade_level": "중학교 1학년",
  "start_date": "2024-01-01",
  "lms_course_id": "course-123"  # LMS 학생 자동 등록
}
```

### 학생: 오늘의 문제 풀이

```typescript
// 1. 대시보드 조회
GET /api/missions/{mission_id}/student/{student_id}/dashboard

// 2. 답안 제출
POST /api/missions/{mission_id}/submit
{
  "problem_id": "...",
  "answer": { "selected_option": "0" },
  "time_spent_seconds": 120
}
```

## 🧪 테스트

```bash
# 백엔드 테스트
cd backend
pytest

# 프론트엔드 테스트
cd frontend
npm test
```

## 📝 추가 기능 계획

- [ ] AI 기반 문제 자동 생성 (Claude API 연동)
- [ ] 적응형 난이도 조절
- [ ] 실시간 알림 (웹소켓)
- [ ] 모바일 앱 (React Native)
- [ ] 리더보드 및 배지 시스템
- [ ] 선생님을 위한 문제 은행 공유

## 🤝 기여

이 프로젝트는 AI 교육 시스템 파이프라인의 일부입니다. 기여를 환영합니다!

## 📄 라이선스

MIT License

## 📧 문의

프로젝트 관련 문의사항은 이슈로 등록해주세요.
