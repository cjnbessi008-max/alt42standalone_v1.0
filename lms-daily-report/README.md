# LMS 일일 사고 흐름 리포트 시스템

LMS(Learning Management System)와 연동하여 하루 동안 발생한 학습 활동, 평가, 오류 등의 사고를 자동으로 수집하고 일일 리포트를 생성하는 독립형 웹 애플리케이션입니다.

## 주요 기능

- **실시간 사고 트래킹**: 학습 활동, 평가, 시스템 오류 등 다양한 사고 유형 추적
- **자동 일일 리포트 생성**: 매일 자정 자동으로 전날 데이터 분석 및 리포트 생성
- **대시보드**: 실시간 통계 및 트렌드 시각화
- **상세 분석**: 사고 유형별, 심각도별, 학생별, 과정별 통계
- **필터링 및 검색**: 다양한 조건으로 사고 조회

## 기술 스택

### 백엔드
- **Python 3.11** + **FastAPI**: 고성능 REST API
- **PostgreSQL 15**: 관계형 데이터베이스
- **SQLAlchemy**: ORM
- **APScheduler**: 스케줄링 (매일 자정 리포트 자동 생성)

### 프론트엔드
- **React 18** + **TypeScript**: UI 프레임워크
- **Material-UI (MUI)**: UI 컴포넌트 라이브러리
- **Recharts**: 차트 시각화
- **Axios**: HTTP 클라이언트
- **Vite**: 빌드 도구

### 인프라
- **Docker** + **Docker Compose**: 컨테이너화 및 오케스트레이션

## 시스템 구조

```
lms-daily-report/
├── backend/                # FastAPI 백엔드
│   ├── app/
│   │   ├── main.py        # 메인 애플리케이션
│   │   ├── models.py      # 데이터베이스 모델
│   │   ├── schemas.py     # Pydantic 스키마
│   │   ├── database.py    # DB 연결
│   │   ├── api/           # API 엔드포인트
│   │   │   ├── incidents.py
│   │   │   └── reports.py
│   │   └── services/      # 비즈니스 로직
│   │       └── report_generator.py
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/              # React 프론트엔드
│   ├── src/
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   ├── types.ts
│   │   ├── components/    # UI 컴포넌트
│   │   │   ├── Dashboard.tsx
│   │   │   ├── ReportsList.tsx
│   │   │   ├── ReportDetail.tsx
│   │   │   └── IncidentsList.tsx
│   │   └── services/      # API 클라이언트
│   │       └── api.ts
│   ├── package.json
│   └── Dockerfile
├── docker-compose.yml     # Docker 구성
└── README.md
```

## 설치 및 실행

### 사전 요구사항
- Docker 및 Docker Compose 설치

### 1. 프로젝트 클론 및 이동
```bash
cd lms-daily-report
```

### 2. Docker Compose로 실행
```bash
docker-compose up --build
```

### 3. 접속
- **프론트엔드**: http://localhost:3000
- **백엔드 API 문서**: http://localhost:8000/docs
- **백엔드 헬스 체크**: http://localhost:8000/health

## API 엔드포인트

### 사고 관리
- `POST /api/students` - 학생 생성
- `GET /api/students` - 학생 목록
- `POST /api/courses` - 과정 생성
- `GET /api/courses` - 과정 목록
- `POST /api/incidents` - 사고 생성
- `GET /api/incidents` - 사고 목록 (필터링 지원)
- `GET /api/incidents/stats/summary` - 사고 통계

### 리포트
- `POST /api/reports/generate` - 리포트 생성
- `GET /api/reports` - 리포트 목록
- `GET /api/reports/{id}` - 리포트 상세
- `GET /api/reports/by-date/{date}` - 날짜별 리포트
- `GET /api/reports/latest/summary` - 최신 리포트 요약

### 대시보드
- `GET /api/dashboard/overview` - 대시보드 개요
- `GET /api/dashboard/trends` - 트렌드 데이터

## 데이터 모델

### Incident (사고)
- **type**: 사고 유형
  - `learning_activity`: 학습 활동
  - `assessment`: 평가/퀴즈
  - `system_error`: 시스템 오류
  - `login`: 로그인/로그아웃
  - `content_access`: 콘텐츠 접근
  - `submission`: 과제 제출
  - `discussion`: 토론 참여

- **severity**: 심각도
  - `info`: 정보
  - `warning`: 경고
  - `error`: 오류
  - `critical`: 치명적

### DailyReport (일일 리포트)
- 날짜별 집계 데이터
- 사고 유형별/심각도별 통계
- 학생 활동 분석
- 과정별 통계
- 시간대별 분포

## 테스트 데이터 생성

백엔드 컨테이너에서 Python으로 테스트 데이터를 생성할 수 있습니다:

```bash
# 백엔드 컨테이너 접속
docker exec -it lms-backend bash

# Python 실행
python
```

```python
import requests
from datetime import datetime, timedelta
import random

API_URL = "http://localhost:8000/api"

# 학생 생성
students = []
for i in range(1, 11):
    student = {
        "name": f"학생{i}",
        "email": f"student{i}@example.com",
        "student_id": f"S{i:04d}"
    }
    response = requests.post(f"{API_URL}/students", json=student)
    students.append(response.json())

# 과정 생성
courses = []
for i in range(1, 4):
    course = {
        "name": f"과정{i}",
        "code": f"COURSE{i:03d}",
        "description": f"테스트 과정 {i}"
    }
    response = requests.post(f"{API_URL}/courses", json=course)
    courses.append(response.json())

# 사고 생성
incident_types = ["learning_activity", "assessment", "system_error", "login", "submission"]
severities = ["info", "warning", "error"]

incidents = []
for day in range(7):  # 최근 7일
    date = datetime.now() - timedelta(days=day)

    for _ in range(random.randint(20, 50)):
        incident = {
            "type": random.choice(incident_types),
            "severity": random.choice(severities),
            "title": f"테스트 사고 {random.randint(1000, 9999)}",
            "description": "자동 생성된 테스트 데이터",
            "student_id": random.choice(students)["id"],
            "course_id": random.choice(courses)["id"],
            "metadata": {"test": True}
        }
        incidents.append(incident)

# 일괄 생성
response = requests.post(f"{API_URL}/incidents/batch", json=incidents)
print(f"생성된 사고 수: {response.json()['created']}")

# 리포트 생성
for day in range(7):
    date = (datetime.now() - timedelta(days=day+1)).strftime("%Y-%m-%d")
    response = requests.post(f"{API_URL}/reports/generate", params={"report_date": date})
    print(f"{date} 리포트 생성 완료")
```

## 스케줄러

백엔드 애플리케이션은 APScheduler를 사용하여 **매일 자정(00:00)**에 자동으로 전날 데이터의 일일 리포트를 생성합니다.

수동으로 리포트를 생성하려면:
```bash
curl -X POST "http://localhost:8000/api/reports/generate"
```

## 개발 모드

### 백엔드 개발
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### 프론트엔드 개발
```bash
cd frontend
npm install
npm run dev
```

## 환경 변수

### 백엔드
- `DATABASE_URL`: PostgreSQL 연결 문자열 (기본값: `postgresql://lmsuser:lmspass@db:5432/lmsdb`)

### 프론트엔드
- `VITE_API_URL`: 백엔드 API URL (기본값: `http://localhost:8000`)

## 트러블슈팅

### 포트 충돌
이미 사용 중인 포트가 있다면 `docker-compose.yml`에서 포트 매핑을 변경하세요.

### 데이터베이스 초기화
데이터를 모두 삭제하고 재시작:
```bash
docker-compose down -v
docker-compose up --build
```

### 로그 확인
```bash
# 전체 로그
docker-compose logs -f

# 특정 서비스 로그
docker-compose logs -f backend
docker-compose logs -f frontend
```

## 라이선스

MIT License

## 기여

이슈 및 풀 리퀘스트를 환영합니다!
