# 학생 풀이 루틴 타임라인 (Student Solution Timeline)

독립형 웹 애플리케이션으로 학생의 문제 풀이 과정과 학습 진행 상황을 시간 순서로 시각화합니다.

A standalone web application that visualizes students' problem-solving processes and learning progress in chronological order.

![Timeline Preview](docs/timeline-preview.png)

## 📋 목차 (Table of Contents)

- [기능 (Features)](#-기능-features)
- [기술 스택 (Tech Stack)](#-기술-스택-tech-stack)
- [시작하기 (Getting Started)](#-시작하기-getting-started)
- [사용법 (Usage)](#-사용법-usage)
- [API 문서 (API Documentation)](#-api-문서-api-documentation)
- [프로젝트 구조 (Project Structure)](#-프로젝트-구조-project-structure)
- [개발 (Development)](#-개발-development)

## ✨ 기능 (Features)

### 📊 타임라인 시각화
- **시간순 이벤트 표시**: 학생의 모든 학습 활동을 시간 순서로 표시
- **문제 풀이 추적**: 각 문제의 정답/오답, 소요 시간, 힌트 사용 여부 기록
- **모듈 진행 상황**: 모듈 시작/완료 이벤트 표시

### 📈 학습 분석
- **통계 대시보드**: 총 시도 횟수, 정답률, 평균 풀이 시간 등
- **진행 차트**: 시간별 풀이 시간 추이, 누적 정답률 그래프
- **문제 유형별 분석**: 문제 유형에 따른 성과 분석

### 🎯 주요 기능
- 실시간 학습 데이터 추적
- 다중 학생 지원
- 날짜 필터링
- 모듈별 타임라인 조회
- 반응형 디자인 (모바일/태블릿/데스크톱)

## 🛠 기술 스택 (Tech Stack)

### Backend
- **FastAPI** (Python 3.11+) - 고성능 API 프레임워크
- **SQLAlchemy** - ORM (Object-Relational Mapping)
- **PostgreSQL 15** - 관계형 데이터베이스
- **Pydantic** - 데이터 검증

### Frontend
- **React 18** - UI 라이브러리
- **TypeScript** - 타입 안정성
- **Material-UI (MUI)** - UI 컴포넌트
- **Recharts** - 데이터 시각화
- **Vite** - 빌드 도구
- **Axios** - HTTP 클라이언트

### Infrastructure
- **Docker & Docker Compose** - 컨테이너화
- **Nginx** - 프로덕션 웹 서버

## 🚀 시작하기 (Getting Started)

### 사전 요구사항 (Prerequisites)

- Docker Desktop 설치 ([다운로드](https://www.docker.com/products/docker-desktop))
- Docker Compose (Docker Desktop에 포함됨)

### 설치 및 실행 (Installation & Running)

#### 방법 1: Docker Compose로 전체 실행 (개발 모드)

```bash
# 1. 저장소 클론
git clone <repository-url>
cd alt42standalone_v1.0

# 2. Docker Compose로 모든 서비스 실행
docker-compose up -d

# 3. 로그 확인
docker-compose logs -f
```

애플리케이션 접속:
- **프론트엔드**: http://localhost:3000
- **백엔드 API**: http://localhost:8000
- **API 문서**: http://localhost:8000/docs

#### 방법 2: 프로덕션 모드로 실행

```bash
# 프로덕션 프로필로 실행
docker-compose --profile production up -d

# 접속: http://localhost
```

#### 방법 3: 로컬 개발 환경

**백엔드:**
```bash
cd backend

# 가상환경 생성 및 활성화
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 의존성 설치
pip install -r requirements.txt

# 데이터베이스가 실행 중인지 확인 (Docker)
docker-compose up -d db

# 환경 변수 설정
cp .env.example .env

# 서버 실행
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**프론트엔드:**
```bash
cd frontend

# 의존성 설치
npm install

# 환경 변수 설정
cp .env.example .env

# 개발 서버 실행
npm run dev
```

### 초기 데이터 설정

Docker Compose로 실행하면 자동으로 샘플 데이터가 생성됩니다:
- 3명의 학생 (김민수, 이지은, 박서준)
- 3개의 모듈 (분수의 이해, 분수의 덧셈과 뺄셈, 분수의 곱셈)
- 24개의 문제 풀이 시도 기록

## 📖 사용법 (Usage)

### 1. 학생 선택
상단의 드롭다운에서 학생을 선택합니다.

### 2. 타임라인 확인
- **통계 카드**: 전체 학습 통계 확인
- **차트**: 시간별 추이 및 정답률 확인
- **타임라인**: 상세한 학습 기록 확인

### 3. 세부 정보 확인
각 타임라인 아이템을 클릭하여:
- 문제 제목 및 난이도
- 정답/오답 여부
- 소요 시간
- 힌트 사용 여부
- 피드백 메시지

## 📚 API 문서 (API Documentation)

### API 엔드포인트

#### 학생 목록 조회
```http
GET /api/v1/timeline/students
```

**응답:**
```json
[
  {
    "id": "student-001",
    "name": "김민수",
    "email": "minsu.kim@example.com",
    "grade_level": "3학년",
    "created_at": "2024-10-19T00:00:00Z"
  }
]
```

#### 학생 타임라인 조회
```http
GET /api/v1/timeline/students/{student_id}?start_date=2024-01-01&end_date=2024-12-31
```

**응답:**
```json
{
  "student": { ... },
  "events": [
    {
      "id": "attempt-001",
      "event_type": "attempt",
      "timestamp": "2024-10-19T10:30:00Z",
      "problem_id": "problem-001",
      "problem_title": "피자 조각 이해하기",
      "is_correct": true,
      "time_spent_seconds": 62,
      "hint_used": false
    }
  ],
  "statistics": {
    "total_attempts": 11,
    "correct_attempts": 8,
    "accuracy_rate": 72.7,
    "total_time_seconds": 1021,
    "average_time_per_attempt": 92.8
  }
}
```

#### 모듈별 타임라인 조회
```http
GET /api/v1/timeline/students/{student_id}/modules/{module_id}
```

#### 문제 풀이 시도 생성
```http
POST /api/v1/timeline/attempts
Content-Type: application/json

{
  "student_id": "student-001",
  "problem_id": "problem-001",
  "answer_data": {
    "numerator": 3,
    "denominator": 8
  },
  "time_spent_seconds": 62,
  "hint_used": false
}
```

### Swagger UI
FastAPI의 자동 생성 API 문서: http://localhost:8000/docs

## 📁 프로젝트 구조 (Project Structure)

```
alt42standalone_v1.0/
├── backend/                    # FastAPI 백엔드
│   ├── app/
│   │   ├── api/               # API 엔드포인트
│   │   │   └── timeline.py    # 타임라인 API
│   │   ├── models/            # SQLAlchemy 모델
│   │   │   └── student.py     # 데이터베이스 모델
│   │   ├── schemas/           # Pydantic 스키마
│   │   │   └── timeline.py    # 요청/응답 스키마
│   │   ├── config.py          # 설정
│   │   ├── database.py        # 데이터베이스 연결
│   │   └── main.py            # FastAPI 앱
│   ├── requirements.txt       # Python 의존성
│   └── Dockerfile
│
├── frontend/                   # React 프론트엔드
│   ├── src/
│   │   ├── components/        # React 컴포넌트
│   │   │   ├── Timeline/      # 타임라인 컴포넌트
│   │   │   │   ├── StatisticsCard.tsx
│   │   │   │   ├── TimelineChart.tsx
│   │   │   │   └── TimelineList.tsx
│   │   │   └── StudentSelector.tsx
│   │   ├── services/          # API 서비스
│   │   │   └── api.ts
│   │   ├── types/             # TypeScript 타입
│   │   │   └── timeline.ts
│   │   ├── utils/             # 유틸리티 함수
│   │   │   └── formatters.ts
│   │   ├── App.tsx            # 메인 앱 컴포넌트
│   │   └── main.tsx           # 엔트리 포인트
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── Dockerfile
│
├── database/                   # 데이터베이스 스크립트
│   ├── init.sql               # 스키마 생성
│   └── seed_data.sql          # 샘플 데이터
│
├── docker-compose.yml          # Docker Compose 설정
└── README.md                   # 이 문서
```

## 🔧 개발 (Development)

### 환경 변수

**Backend (.env):**
```env
DATABASE_URL=postgresql://timeline_user:timeline_pass@localhost:5432/timeline_db
ALLOWED_ORIGINS=["http://localhost:3000", "http://localhost:5173"]
```

**Frontend (.env):**
```env
VITE_API_BASE_URL=http://localhost:8000/api/v1
```

### 데이터베이스 스키마

주요 테이블:
- `students` - 학생 정보
- `modules` - 교육 모듈
- `problems` - 문제
- `student_progress` - 학생 진행 상황
- `student_attempts` - 문제 풀이 시도 (타임라인 핵심 데이터)

### 새로운 문제 유형 추가

1. `database/seed_data.sql`에 문제 추가
2. `frontend/src/utils/formatters.ts`의 `getProblemTypeName()`에 한글 이름 추가
3. 필요시 `answer_data` 검증 로직 추가 (backend/app/api/timeline.py)

### 테스트

```bash
# 백엔드 테스트
cd backend
pytest

# 프론트엔드 빌드 테스트
cd frontend
npm run build
```

### 서비스 중지

```bash
# 모든 서비스 중지
docker-compose down

# 데이터베이스 볼륨까지 삭제
docker-compose down -v
```

## 🤝 기여 (Contributing)

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 라이선스 (License)

This project is part of the KAIST Touch Math Academy AI Education System.

## 📧 문의 (Contact)

KAIST Touch Math Academy
- Email: support@kaist-math.edu

---

**개발 시작일**: 2025-11-18
**버전**: 1.0.0
**개발자**: AI Education Team
