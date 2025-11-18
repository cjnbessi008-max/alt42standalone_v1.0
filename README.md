# LMS Bottleneck Detection System

실시간으로 학습자가 어려움을 겪는 문제 유형을 감지하고 즉각적인 피드백을 제공하는 LMS 연동 웹 애플리케이션입니다.

## 주요 기능

### 1. 실시간 병목 지점 감지
- 학습자가 어떤 문제 유형에서 가장 어려움을 겪는지 자동 분석
- 문제 해결 시간, 정답률, 시도 횟수 등을 종합적으로 고려
- 실시간으로 병목 지점을 감지하고 알림 제공

### 2. 개인화된 학습 분석
- 학습자별 취약 개념 파악
- 문제 유형별 성과 추적
- 학습 패턴 시각화

### 3. 즉각적인 피드백
- 병목 지점 발견 시 즉시 알림
- 추천 학습 경로 제시
- 선생님/학습자 대시보드

## 시스템 아키텍처

```
┌─────────────────────────────────────────────────────────┐
│                  React Frontend                          │
│  - Real-time Dashboard                                   │
│  - Performance Visualization                             │
│  - Bottleneck Alerts                                     │
└──────────────────┬──────────────────────────────────────┘
                   │ REST API / WebSocket
┌──────────────────▼──────────────────────────────────────┐
│              FastAPI Backend                             │
│  - Bottleneck Detection Algorithm                        │
│  - Performance Analytics                                 │
│  - Real-time Event Processing                            │
└──────────────────┬──────────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────────┐
│              PostgreSQL Database                         │
│  - Student Data                                          │
│  - Problem Types                                         │
│  - Attempt History                                       │
│  - Performance Metrics                                   │
└──────────────────────────────────────────────────────────┘
```

## 기술 스택

### Backend
- **Framework**: FastAPI (Python 3.11+)
- **Database**: PostgreSQL 15+
- **Real-time**: WebSocket
- **ORM**: SQLAlchemy

### Frontend
- **Framework**: React 18+ with TypeScript
- **State Management**: React Query + Context API
- **UI Library**: Material-UI (MUI)
- **Charts**: Recharts
- **Real-time**: Socket.io-client

### DevOps
- **Containerization**: Docker & Docker Compose
- **CI/CD**: GitHub Actions

## 병목 지점 감지 알고리즘

시스템은 다음 지표를 분석하여 병목 지점을 감지합니다:

1. **정답률 (Accuracy Rate)**
   - 문제 유형별 정답률이 60% 미만인 경우

2. **평균 해결 시간 (Avg. Solving Time)**
   - 예상 시간 대비 150% 이상 소요되는 경우

3. **시도 횟수 (Attempt Count)**
   - 평균 3회 이상 재시도하는 경우

4. **포기율 (Abandonment Rate)**
   - 문제를 완료하지 않고 포기하는 비율이 30% 이상인 경우

5. **종합 난이도 점수 (Difficulty Score)**
   - 위 지표들을 가중치 합산하여 계산
   - 70점 이상일 때 병목 지점으로 판단

## 빠른 시작

### Prerequisites
- Docker & Docker Compose
- Node.js 18+ (로컬 개발 시)
- Python 3.11+ (로컬 개발 시)

### Installation

```bash
# 1. Clone repository
git clone <repository-url>
cd alt42standalone_v1.0

# 2. Start with Docker Compose
docker-compose up -d

# 3. Access the application
# Frontend: http://localhost:3000
# Backend API: http://localhost:8000
# API Docs: http://localhost:8000/docs
```

### Local Development

#### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

#### Frontend
```bash
cd frontend
npm install
npm start
```

## API 엔드포인트

### Student Performance
- `POST /api/attempts` - 문제 시도 기록
- `GET /api/students/{student_id}/performance` - 학생 성과 조회
- `GET /api/students/{student_id}/bottlenecks` - 병목 지점 조회

### Problem Types
- `GET /api/problem-types` - 문제 유형 목록
- `GET /api/problem-types/{type_id}/analytics` - 유형별 분석

### Real-time
- `WS /ws/bottlenecks/{student_id}` - 실시간 병목 지점 알림

## 데이터베이스 스키마

### 주요 테이블
- `students` - 학생 정보
- `problem_types` - 문제 유형 (분수, 소수, 방정식 등)
- `problems` - 개별 문제
- `student_attempts` - 학생의 문제 시도 기록
- `bottleneck_detections` - 감지된 병목 지점 기록

## 프로젝트 구조

```
.
├── backend/
│   ├── app/
│   │   ├── main.py                 # FastAPI 애플리케이션
│   │   ├── database.py             # DB 연결 설정
│   │   ├── models/                 # SQLAlchemy 모델
│   │   ├── api/                    # API 라우터
│   │   └── services/               # 비즈니스 로직
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── components/             # React 컴포넌트
│   │   ├── services/               # API 클라이언트
│   │   └── types/                  # TypeScript 타입
│   ├── package.json
│   └── Dockerfile
├── database/
│   └── schema.sql                  # DB 스키마
├── docker-compose.yml
└── README.md
```

## 개발 로드맵

- [x] 프로젝트 설정 및 구조 생성
- [x] 데이터베이스 스키마 설계
- [x] 병목 지점 감지 알고리즘 구현
- [x] REST API 개발
- [x] React 프론트엔드 개발
- [x] 실시간 알림 시스템
- [ ] 사용자 인증 (KAIST SSO 연동)
- [ ] 고급 분석 기능
- [ ] 모바일 반응형 최적화

## License

MIT License

## Contact

KAIST Touch Math Academy
