# 설치 및 실행 가이드

## 📋 목차

1. [시스템 요구사항](#시스템-요구사항)
2. [설치 방법](#설치-방법)
3. [환경 설정](#환경-설정)
4. [실행 방법](#실행-방법)
5. [문제 해결](#문제-해결)

## 시스템 요구사항

### 필수 소프트웨어

- **Docker**: 20.10 이상
- **Docker Compose**: 2.0 이상
- **Git**: 최신 버전

### 권장 사양

- **CPU**: 2코어 이상
- **RAM**: 4GB 이상
- **디스크**: 10GB 여유 공간

### Anthropic API Key

Claude AI를 사용하기 위해 API 키가 필요합니다.

1. https://console.anthropic.com/ 접속
2. 계정 생성 및 로그인
3. API Keys 섹션에서 새 키 생성
4. 생성된 키 복사 (sk-ant-로 시작)

## 설치 방법

### 1. Docker 설치

#### macOS
```bash
# Homebrew 사용
brew install --cask docker
```

#### Ubuntu/Debian
```bash
sudo apt-get update
sudo apt-get install docker.io docker-compose
sudo systemctl start docker
sudo systemctl enable docker
```

#### Windows
1. [Docker Desktop for Windows](https://www.docker.com/products/docker-desktop/) 다운로드
2. 설치 프로그램 실행
3. WSL 2 활성화

### 2. 프로젝트 클론

```bash
git clone <repository-url>
cd alt42standalone_v1.0
```

## 환경 설정

### 1. 환경 변수 파일 생성

```bash
cp .env.example .env
```

### 2. `.env` 파일 편집

```bash
nano .env  # 또는 vim, code 등 원하는 에디터 사용
```

**필수 설정:**
```env
# Anthropic API Key (필수!)
ANTHROPIC_API_KEY=sk-ant-your-actual-api-key-here

# 나머지는 기본값 사용 가능
DATABASE_URL=postgresql://aiuser:aipassword@postgres:5432/ai_education_db
```

### 3. 설정 확인

```bash
# .env 파일이 올바르게 생성되었는지 확인
cat .env | grep ANTHROPIC_API_KEY
```

## 실행 방법

### Option 1: Docker Compose (권장)

**모든 서비스 한 번에 시작:**

```bash
docker-compose up -d
```

이 명령어는 다음을 수행합니다:
- PostgreSQL 데이터베이스 컨테이너 시작
- Backend API 서버 시작 (Python FastAPI)
- Frontend 개발 서버 시작 (React + Vite)

**서비스 상태 확인:**

```bash
docker-compose ps
```

모든 서비스가 `Up` 상태여야 합니다:
```
NAME                      STATUS
ai_education_backend      Up
ai_education_db           Up (healthy)
ai_education_frontend     Up
```

**로그 확인:**

```bash
# 모든 서비스 로그
docker-compose logs -f

# 특정 서비스만
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres
```

**서비스 중지:**

```bash
docker-compose down
```

**완전 삭제 (데이터 포함):**

```bash
docker-compose down -v
```

### Option 2: 개별 로컬 실행

#### Backend 실행

```bash
cd backend

# 가상환경 생성 및 활성화
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 의존성 설치
pip install -r requirements.txt

# PostgreSQL 별도 실행 필요
# docker run --name postgres -e POSTGRES_PASSWORD=aipassword -e POSTGRES_USER=aiuser -e POSTGRES_DB=ai_education_db -p 5432:5432 -d postgres:15

# 서버 시작
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

#### Frontend 실행

```bash
cd frontend

# 의존성 설치
npm install

# 개발 서버 시작
npm run dev
```

## 접속 확인

### 1. Frontend 접속

브라우저에서 http://localhost:3000 열기

**확인 사항:**
- 페이지가 정상적으로 로드되는가?
- "AI 교육 시스템" 헤더가 보이는가?
- "분수의 덧셈" 문제가 표시되는가?

### 2. Backend API 문서

브라우저에서 http://localhost:8000/docs 열기

**확인 사항:**
- Swagger UI가 표시되는가?
- `/api/v1/question-suggestions/generate` 엔드포인트가 보이는가?

### 3. Health Check

```bash
curl http://localhost:8000/health
```

**예상 응답:**
```json
{
  "status": "healthy",
  "database": "connected"
}
```

## 기능 테스트

### 1. 질문 생성 테스트

1. Frontend (http://localhost:3000) 접속
2. "질문 제안 받기" 버튼 클릭
3. 3-5초 후 3개의 질문이 표시되는지 확인

### 2. API 직접 테스트

```bash
curl -X POST http://localhost:8000/api/v1/question-suggestions/generate \
  -H "Content-Type: application/json" \
  -d '{
    "student_id": "550e8400-e29b-41d4-a716-446655440001",
    "problem_id": "550e8400-e29b-41d4-a716-446655440000"
  }'
```

## 문제 해결

### 문제 1: Docker 컨테이너가 시작되지 않음

**증상:**
```
ERROR: Cannot start service backend: ...
```

**해결 방법:**
```bash
# 1. 기존 컨테이너 정리
docker-compose down -v

# 2. 이미지 재빌드
docker-compose build --no-cache

# 3. 다시 시작
docker-compose up -d
```

### 문제 2: API Key 오류

**증상:**
```
ValueError: ANTHROPIC_API_KEY environment variable is not set
```

**해결 방법:**
1. `.env` 파일에 API 키가 올바르게 설정되었는지 확인
2. 키가 `sk-ant-`로 시작하는지 확인
3. 따옴표 없이 입력했는지 확인
4. 컨테이너 재시작: `docker-compose restart backend`

### 문제 3: 데이터베이스 연결 실패

**증상:**
```
asyncpg.exceptions.InvalidCatalogNameError: database "ai_education_db" does not exist
```

**해결 방법:**
```bash
# 데이터베이스 볼륨 삭제 후 재생성
docker-compose down -v
docker-compose up -d postgres
# postgres가 healthy 상태가 될 때까지 대기
docker-compose up -d
```

### 문제 4: 포트 충돌

**증상:**
```
ERROR: for backend  Cannot start service backend: Ports are not available
```

**해결 방법:**
```bash
# 사용 중인 포트 확인
lsof -i :8000
lsof -i :3000
lsof -i :5432

# 프로세스 종료 또는 docker-compose.yml에서 포트 변경
```

### 문제 5: Frontend에서 API 호출 실패

**증상:**
- 브라우저 콘솔에 CORS 에러
- Network error

**해결 방법:**
1. Backend가 실행 중인지 확인: `docker-compose ps`
2. Backend 로그 확인: `docker-compose logs backend`
3. CORS 설정 확인: `.env` 파일의 `CORS_ORIGINS`

## 개발 환경 설정

### VS Code 추천 확장

**Backend (Python):**
- Python
- Pylance
- Python Docstring Generator

**Frontend (React):**
- ES7+ React/Redux/React-Native snippets
- TypeScript Vue Plugin (Volar)
- Tailwind CSS IntelliSense (선택사항)

### 데이터베이스 GUI 도구

**추천:**
- [pgAdmin](https://www.pgadmin.org/)
- [DBeaver](https://dbeaver.io/)
- [TablePlus](https://tableplus.com/)

**연결 정보:**
- Host: localhost
- Port: 5432
- Database: ai_education_db
- Username: aiuser
- Password: aipassword

## 성능 최적화

### Backend

1. **API 응답 시간 줄이기:**
   - Claude API 호출 캐싱
   - 데이터베이스 쿼리 최적화
   - 인덱스 추가

2. **동시 요청 처리:**
   - Uvicorn workers 증가
   ```bash
   uvicorn app.main:app --workers 4
   ```

### Frontend

1. **빌드 최적화:**
   ```bash
   npm run build
   ```

2. **프로덕션 서버:**
   ```bash
   npm install -g serve
   serve -s dist -l 3000
   ```

## 배포 가이드

### Production 환경 변수

```env
DEBUG=False
CORS_ORIGINS=https://yourdomain.com
```

### Docker Production Build

```bash
docker-compose -f docker-compose.prod.yml up -d
```

## 추가 리소스

- [FastAPI 문서](https://fastapi.tiangolo.com/)
- [React 문서](https://react.dev/)
- [Anthropic API 문서](https://docs.anthropic.com/)
- [PostgreSQL 문서](https://www.postgresql.org/docs/)

## 지원

문제가 해결되지 않으면:
1. GitHub Issues에 문제 등록
2. 로그 파일 첨부
3. 실행 환경 정보 제공 (OS, Docker 버전 등)
