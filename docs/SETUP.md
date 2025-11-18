# 설치 및 실행 가이드

## 사전 요구사항

- Docker & Docker Compose
- Claude API Key (Anthropic)

## 빠른 시작

### 1. 환경 설정

```bash
# 저장소 클론 (이미 있으면 생략)
cd alt42standalone_v1.0

# 환경 변수 파일 생성
cp .env.example .env
```

### 2. .env 파일 수정

`.env` 파일을 열어 다음 값을 설정하세요:

```bash
# Claude API Key (필수)
CLAUDE_API_KEY=sk-ant-your-actual-api-key-here

# Secret Key (프로덕션에서는 랜덤 문자열로 변경)
SECRET_KEY=your-super-secret-key-change-in-production

# 자동 생성 설정 (선택)
ENABLE_AUTO_GENERATION=true
CARD_GENERATION_TIME=07:00:00
```

### 3. Docker로 실행

```bash
# 전체 스택 빌드 및 실행
docker-compose up -d

# 로그 확인
docker-compose logs -f

# 특정 서비스 로그만 보기
docker-compose logs -f backend
```

### 4. 접속

- **프론트엔드**: http://localhost:3000
- **백엔드 API**: http://localhost:8000
- **API 문서**: http://localhost:8000/docs

### 5. 중지 및 정리

```bash
# 중지
docker-compose stop

# 중지 및 삭제
docker-compose down

# 볼륨까지 삭제 (데이터베이스 초기화)
docker-compose down -v
```

## 로컬 개발 (Docker 없이)

### 백엔드

```bash
cd backend

# 가상환경 생성 및 활성화
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 의존성 설치
pip install -r requirements.txt

# PostgreSQL 실행 (별도로 설치 필요)
# DATABASE_URL 환경 변수 설정

# 서버 실행
uvicorn main:app --reload --port 8000
```

### 프론트엔드

```bash
cd frontend

# 의존성 설치
npm install

# 개발 서버 실행
npm run dev
```

## 초기 데이터

데이터베이스 초기화 스크립트(`database/init.sql`)에는 3명의 샘플 학생이 포함되어 있습니다:

1. 김민준 (S001)
2. 이서연 (S002)
3. 박지후 (S003)

## API 사용 예제

### 학생 목록 조회

```bash
curl http://localhost:8000/api/v1/students
```

### 오늘의 카드 조회 (자동 생성)

```bash
curl http://localhost:8000/api/v1/cards/today/{student_id}
```

### 카드 생성 (수동)

```bash
curl -X POST http://localhost:8000/api/v1/cards/generate \
  -H "Content-Type: application/json" \
  -d '{"student_id": "your-student-id-here"}'
```

## 트러블슈팅

### 데이터베이스 연결 오류

```bash
# PostgreSQL 컨테이너 상태 확인
docker-compose ps postgres

# 데이터베이스 재시작
docker-compose restart postgres
```

### Claude API 오류

- `.env` 파일에서 `CLAUDE_API_KEY`가 올바른지 확인
- API 키가 유효하고 사용 가능한지 확인
- 백엔드 로그에서 자세한 오류 확인: `docker-compose logs backend`

### 프론트엔드가 백엔드에 연결되지 않을 때

- 백엔드가 실행 중인지 확인: http://localhost:8000/health
- CORS 설정 확인
- 브라우저 콘솔에서 네트워크 오류 확인

## 프로덕션 배포

프로덕션 환경에서는:

1. `.env` 파일의 `DEBUG=false` 설정
2. `SECRET_KEY`를 강력한 랜덤 문자열로 변경
3. HTTPS 설정
4. 데이터베이스 백업 설정
5. 로그 모니터링 설정

```bash
# 프로덕션 빌드 (프론트엔드)
cd frontend
npm run build

# 프로덕션 Docker 이미지 빌드
docker-compose -f docker-compose.prod.yml up -d
```
