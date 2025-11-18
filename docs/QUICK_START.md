# Quick Start Guide

## 5분 안에 시작하기

### Option 1: Docker Compose (가장 빠름)

```bash
# 1. 저장소 클론
git clone <repository-url>
cd alt42standalone_v1.0

# 2. Docker Compose 실행
docker-compose up -d

# 3. 데이터베이스 초기화
docker-compose exec backend npm run migrate
docker-compose exec backend npm run seed

# 4. 브라우저에서 접속
# http://localhost:3000
```

완료! 이제 감정 기록을 시작할 수 있습니다.

---

### Option 2: 로컬 개발 환경

#### 1단계: 데이터베이스 준비

PostgreSQL과 Redis가 설치되어 있어야 합니다.

```bash
# PostgreSQL 데이터베이스 생성
createdb emotion_tracking

# 또는 psql로:
psql -U postgres
CREATE DATABASE emotion_tracking;
\q
```

#### 2단계: Backend 설정

```bash
cd backend

# 의존성 설치
npm install

# 환경 변수 복사 및 편집
cp .env.example .env

# .env 파일 편집 (데이터베이스 정보 입력)
# DB_HOST=localhost
# DB_PORT=5432
# DB_NAME=emotion_tracking
# DB_USER=postgres
# DB_PASSWORD=your-password

# 데이터베이스 마이그레이션
npm run migrate

# 샘플 데이터 추가
npm run seed

# 서버 실행
npm run dev
```

Backend가 http://localhost:4000 에서 실행됩니다.

#### 3단계: Frontend 설정

새 터미널을 열고:

```bash
cd frontend

# 의존성 설치
npm install

# 환경 변수 설정
cp .env.example .env

# 개발 서버 실행
npm run dev
```

Frontend가 http://localhost:3000 에서 실행됩니다.

---

## 첫 감정 기록하기

1. 브라우저에서 http://localhost:3000 접속
2. "학습 시작" 버튼 클릭
3. 감정 선택 (😊 😎 😐 😕 😣)
4. 강도 조절 (1-5)
5. "감정 기록하기" 버튼 클릭

축하합니다! 첫 감정 기록을 완료했습니다.

---

## API 테스트

### cURL로 테스트

```bash
# Health Check
curl http://localhost:4000/api/v1/health

# 학습 세션 시작
curl -X POST http://localhost:4000/api/v1/sessions/start \
  -H "Content-Type: application/json" \
  -d '{
    "student_id": "demo-student-id",
    "course_id": "MATH101",
    "course_name": "미적분학 기초",
    "activity_type": "lecture"
  }'

# 감정 기록
curl -X POST http://localhost:4000/api/v1/emotions \
  -H "Content-Type: application/json" \
  -d '{
    "student_id": "demo-student-id",
    "emotion_type": "happy",
    "intensity": 4,
    "note": "수업이 재미있어요!"
  }'
```

### Postman Collection

Postman 컬렉션은 `docs/postman_collection.json`에서 확인할 수 있습니다.

---

## 일일 요약 생성 테스트

```bash
# 수동으로 어제의 요약 생성
curl -X POST http://localhost:4000/api/v1/summaries/trigger-yesterday
```

---

## 다음 단계

1. [API 문서](./API_DOCUMENTATION.md) 읽기
2. [시스템 설계 문서](../EMOTION_TRACKING_DESIGN.md) 확인
3. LMS 연동 설정하기
4. 프로덕션 배포 준비

---

## 문제 해결

### "Cannot connect to database"
```bash
# PostgreSQL이 실행 중인지 확인
pg_isready

# Docker를 사용하는 경우
docker-compose ps postgres
docker-compose logs postgres
```

### "Redis connection failed"
```bash
# Redis가 실행 중인지 확인
redis-cli ping

# Docker를 사용하는 경우
docker-compose ps redis
```

### "Port already in use"
다른 포트를 사용하도록 `.env` 파일을 수정하세요:
```
# Backend
PORT=4001

# Frontend (vite.config.ts에서 수정)
server: {
  port: 3001
}
```

---

## 도움이 필요하세요?

- [README.md](../README.md) - 전체 문서
- [API Documentation](./API_DOCUMENTATION.md) - API 상세 정보
- [Design Document](../EMOTION_TRACKING_DESIGN.md) - 시스템 설계
- GitHub Issues - 버그 리포트 및 기능 요청
