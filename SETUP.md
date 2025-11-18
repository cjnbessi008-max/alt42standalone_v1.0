# 설치 및 실행 가이드

## 필수 요구사항

- Docker & Docker Compose
- Node.js 18+ (로컬 개발 시)
- Python 3.11+ (로컬 개발 시)
- Anthropic API Key

## 빠른 시작 (Docker 사용)

### 1. 환경 변수 설정

```bash
cp .env.example .env
```

`.env` 파일을 열고 실제 Anthropic API 키를 입력하세요:

```bash
ANTHROPIC_API_KEY=your_actual_api_key_here
```

### 2. Docker Compose로 실행

```bash
docker-compose up -d
```

### 3. 애플리케이션 접속

- **프론트엔드**: http://localhost:5173
- **백엔드 API**: http://localhost:8000
- **API 문서**: http://localhost:8000/docs

### 4. 데이터베이스 초기화

처음 실행 시 데이터베이스 테이블이 자동으로 생성됩니다.

### 5. 샘플 데이터 생성 (선택사항)

```bash
# Backend 컨테이너에 접속
docker exec -it metacognition-backend bash

# Python 인터프리터 실행
python

# 샘플 학생 및 활동 생성
from app.database import SessionLocal
from app.models import Student, LearningActivity, ProblemAttempt
from datetime import datetime, timedelta
import uuid

db = SessionLocal()

# 학생 생성
student = Student(
    id=str(uuid.uuid4()),
    name="김학생",
    grade_level="6학년",
    is_teacher=False
)
db.add(student)
db.commit()

# 학습 활동 생성
activity = LearningActivity(
    id=str(uuid.uuid4()),
    student_id=student.id,
    session_start=datetime.utcnow() - timedelta(hours=2),
    session_end=datetime.utcnow() - timedelta(hours=1),
    duration_minutes=60,
    subject="mathematics",
    topic="분수의 덧셈",
    total_problems=10,
    correct_answers=8,
    incorrect_answers=2,
    hints_used=3,
    self_confidence_before=3,
    self_confidence_after=4
)
db.add(activity)
db.commit()

# 문제 시도 추가
for i in range(10):
    attempt = ProblemAttempt(
        id=str(uuid.uuid4()),
        activity_id=activity.id,
        problem_id=f"prob_{i+1}",
        problem_type="fraction_addition",
        difficulty_level=2,
        attempt_number=1,
        time_spent_seconds=180 + i * 20,
        is_correct=i < 8,
        hints_requested=1 if i >= 8 else 0,
        gave_up=False
    )
    db.add(attempt)

db.commit()
print(f"학생 ID: {student.id}")
db.close()
exit()
```

### 6. 메타인지 성장 포인트 생성

프론트엔드에서 학생 대시보드를 열면 자동으로 AI 분석이 시작됩니다.
또는 API를 직접 호출할 수 있습니다:

```bash
curl http://localhost:8000/api/insights/daily/{student_id}
```

## 로컬 개발 설정

### Backend

```bash
cd backend

# 가상환경 생성
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 의존성 설치
pip install -r requirements.txt

# 환경 변수 설정
cp .env.example .env
# .env 파일 수정

# PostgreSQL 실행 (Docker)
docker run -d \
  --name metacognition-postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=metacognition \
  -p 5432:5432 \
  postgres:15-alpine

# 서버 실행
uvicorn app.main:app --reload
```

### Frontend

```bash
cd frontend

# 의존성 설치
npm install

# 개발 서버 실행
npm run dev
```

## API 사용 예시

### 학생 생성

```bash
curl -X POST http://localhost:8000/api/students \
  -H "Content-Type: application/json" \
  -d '{
    "name": "이학생",
    "email": "student@example.com",
    "grade_level": "5학년",
    "is_teacher": false
  }'
```

### 학습 활동 기록

```bash
curl -X POST http://localhost:8000/api/activities \
  -H "Content-Type: application/json" \
  -d '{
    "student_id": "{student_id}",
    "subject": "mathematics",
    "topic": "곱셈 구구단",
    "self_confidence_before": 3
  }'
```

### 문제 시도 기록

```bash
curl -X POST http://localhost:8000/api/activities/{activity_id}/attempts \
  -H "Content-Type: application/json" \
  -d '{
    "problem_id": "mult_01",
    "difficulty_level": 2,
    "time_spent_seconds": 45,
    "is_correct": true,
    "hints_requested": 0
  }'
```

### 일일 성장 포인트 조회

```bash
curl http://localhost:8000/api/insights/daily/{student_id}
```

## 문제 해결

### 데이터베이스 연결 오류

```bash
# PostgreSQL 컨테이너 상태 확인
docker ps | grep postgres

# 로그 확인
docker logs metacognition-db

# 컨테이너 재시작
docker-compose restart postgres
```

### Claude API 오류

- API 키가 올바른지 확인
- 월간 사용량 제한 확인
- 네트워크 연결 확인

### 프론트엔드 빌드 오류

```bash
cd frontend
rm -rf node_modules
npm install
npm run dev
```

## 프로덕션 배포

### 환경 변수 설정

프로덕션 환경에서는 다음 설정을 변경하세요:

```bash
# backend/.env
DEBUG=False
SECRET_KEY=your_strong_secret_key_here
DATABASE_URL=postgresql://user:password@production-db:5432/metacognition
CORS_ORIGINS=https://yourdomain.com

# frontend/.env
VITE_API_BASE_URL=https://api.yourdomain.com
```

### Docker Compose (프로덕션)

```bash
docker-compose -f docker-compose.prod.yml up -d
```

### HTTPS 설정

Nginx 또는 Caddy를 사용하여 리버스 프록시 및 SSL 설정을 권장합니다.

## 라이센스

MIT License
