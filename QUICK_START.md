# 빠른 시작 가이드

이 문서는 3초 도형 요약 앱을 가장 빠르게 실행하는 방법을 안내합니다.

## 🚀 Docker로 5분 안에 시작하기 (권장)

### 1단계: Docker 설치 확인

```bash
docker --version
docker-compose --version
```

Docker가 없다면 [Docker 공식 사이트](https://www.docker.com/get-started)에서 설치하세요.

### 2단계: 프로젝트 클론

```bash
git clone <repository-url>
cd alt42standalone_v1.0
```

### 3단계: 실행!

```bash
docker-compose up -d
```

### 4단계: 접속

브라우저에서 http://localhost:3000 을 열면 완료!

### 5단계: 중지

```bash
docker-compose down
```

---

## 💻 로컬 개발 환경 (개발자용)

### 필수 요구사항
- Node.js 18+
- PostgreSQL 15+
- npm

### 1단계: 데이터베이스 준비

```bash
# PostgreSQL 실행 확인
psql --version

# 데이터베이스 생성
createdb shape_summary

# 스키마 초기화
psql -d shape_summary -f backend/src/db/schema.sql
```

### 2단계: Backend 실행

```bash
cd backend
npm install
cp .env.example .env
# .env 파일을 필요에 따라 수정
npm run dev
```

Backend는 http://localhost:5000 에서 실행됩니다.

### 3단계: Frontend 실행 (새 터미널)

```bash
cd frontend
npm install
npm run dev
```

Frontend는 http://localhost:3000 에서 실행됩니다.

---

## 📱 사용 방법

1. **문제 선택**: 좌측 패널에서 도형 문제를 클릭
2. **애니메이션 보기**: 우측 하단 스마트폰 화면에서 3초 애니메이션 자동 재생
3. **다시 보기**: 스마트폰 화면 하단의 "다시 보기" 버튼 클릭

---

## 🔧 문제 해결

### Backend가 시작되지 않음

```bash
# PostgreSQL 실행 확인
sudo service postgresql status

# 데이터베이스가 존재하는지 확인
psql -l | grep shape_summary
```

### Frontend가 Backend에 연결되지 않음

```bash
# Backend 상태 확인
curl http://localhost:5000/health

# 응답이 없다면 Backend를 다시 시작
cd backend && npm run dev
```

### Docker 컨테이너가 시작되지 않음

```bash
# 로그 확인
docker-compose logs

# 특정 서비스 로그
docker-compose logs postgres
docker-compose logs backend

# 컨테이너 재시작
docker-compose restart
```

---

## 📊 테스트 데이터

데이터베이스에 이미 8개의 샘플 문제가 포함되어 있습니다:

- 원 문제 2개
- 삼각형 문제 2개
- 사각형 문제 3개
- 복합 도형 1개

### 새 문제 추가하기

```bash
curl -X POST http://localhost:5000/api/problems \
  -H "Content-Type: application/json" \
  -d '{
    "title": "정삼각형 넓이",
    "shapeType": "triangle",
    "summary": "한 변이 6cm인 정삼각형",
    "difficulty": "medium",
    "base": 6,
    "height": 5.2,
    "unit": "cm",
    "answer": 15.6
  }'
```

---

## 🌐 API 테스트

### Health Check

```bash
curl http://localhost:5000/health
```

### 모든 문제 조회

```bash
curl http://localhost:5000/api/problems
```

### 원 문제만 조회

```bash
curl http://localhost:5000/api/problems?shape_type=circle
```

### 랜덤 문제

```bash
curl http://localhost:5000/api/problems/random
```

---

## 📝 다음 단계

- [README.md](./README.md) - 전체 문서
- [API 문서](./README.md#api-엔드포인트) - 상세 API 가이드
- [개발 가이드](./README.md#개발-가이드) - 기능 추가 방법

---

**문제가 있나요?** GitHub Issues에 문의하세요!
