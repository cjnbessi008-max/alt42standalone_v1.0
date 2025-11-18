# ALT42 빠른 시작 가이드

## 개요

ALT42는 AI 기반 논리적 추론 반박 시스템입니다. 학생들이 제출한 논증을 분석하여 논리적 오류를 찾아내고, 반박 논리를 제시하며, 올바른 추론 방법을 가이드합니다.

## 시스템 요구사항

- Docker & Docker Compose (권장)
- 또는 수동 설치:
  - Node.js 18+
  - Python 3.11+
  - PostgreSQL 15+
  - Redis 7+

## Claude API 키 발급

1. [Anthropic Console](https://console.anthropic.com/) 접속
2. API Keys 메뉴에서 새 API 키 생성
3. API 키 복사 (나중에 사용)

## Docker를 사용한 설치 (권장)

### 1. 환경 변수 설정

```bash
cp .env.example .env
```

`.env` 파일을 편집하여 Claude API 키 입력:

```bash
CLAUDE_API_KEY=your_claude_api_key_here
JWT_SECRET=your_secure_random_string_here
```

### 2. Docker Compose로 실행

```bash
docker-compose up -d
```

### 3. 데이터베이스 초기화 확인

```bash
docker-compose logs postgres
```

"Seed data inserted successfully!" 메시지가 보이면 성공

### 4. 서비스 접속

- **Frontend**: http://localhost:3000
- **API Gateway**: http://localhost:8000
- **AI Service**: http://localhost:8001
- **AI Service Docs**: http://localhost:8001/docs

### 5. 로그인

데모 계정으로 로그인:
- **이메일**: student1@alt42.edu
- **비밀번호**: password123

## 수동 설치

### 1. 데이터베이스 설정

```bash
# PostgreSQL 데이터베이스 생성
createdb alt42_reasoning

# 스키마 및 시드 데이터 적용
psql -d alt42_reasoning -f database/schema.sql
psql -d alt42_reasoning -f database/seed.sql
```

### 2. Redis 시작

```bash
redis-server
```

### 3. 백엔드 API Gateway 실행

```bash
cd backend/api-gateway
npm install
cp ../../.env.example ../../.env
# .env 파일 편집 (Claude API 키 등)
npm run dev
```

### 4. AI Service 실행

새 터미널에서:

```bash
cd backend/ai-service
pip install -r requirements.txt
# .env 파일이 루트에 있어야 함
python -m uvicorn app.main:app --reload --port 8001
```

### 5. Frontend 실행

새 터미널에서:

```bash
cd frontend
npm install
npm run dev
```

## 사용 방법

### 1. 회원가입 또는 로그인

- 데모 계정 사용 또는 새 계정 생성
- 로그인하면 대시보드로 이동

### 2. 첫 번째 논증 제출

1. 대시보드에서 "새로운 논증 제출하기" 버튼 클릭
2. 논증 내용 입력 (최소 50자)
3. 제목, 주제, 과목 선택 (선택사항)
4. 제출

### 3. 분석 결과 확인

- 제출 후 AI가 자동으로 분석 시작
- 상태가 "analyzing" → "completed"로 변경
- 결과를 클릭하여 상세 분석 확인:
  - 발견된 논리적 오류
  - 반박 논리
  - 올바른 추론 방법
  - 학습 질문

### 4. 진행도 추적

- 대시보드에서 학습 통계 확인
- 숙련도 레벨 및 연속 기록 확인
- 리더보드에서 다른 학생들과 비교

## 주요 기능

### 논리적 오류 감지

시스템이 자동으로 감지하는 오류 유형:

- **Ad Hominem**: 사람 공격
- **Straw Man**: 허수아비 논증
- **False Dichotomy**: 흑백논리
- **Hasty Generalization**: 성급한 일반화
- **Post Hoc**: 인과관계 오류
- **Cherry Picking**: 선별적 증거 사용
- 기타 16가지 이상의 논리적 오류

### AI 분석 내용

1. **논리 구조 분석**: 전제와 결론 파악
2. **전제 검증**: 각 전제의 타당성 평가
3. **결론 평가**: 결론이 전제에서 논리적으로 도출되는지 확인
4. **오류 식별**: 구체적인 논리적 오류 위치와 설명
5. **개선 방안**: 올바른 추론 방법 제시
6. **학습 질문**: 비판적 사고를 촉진하는 질문

## 문제 해결

### Docker 관련

```bash
# 컨테이너 재시작
docker-compose restart

# 로그 확인
docker-compose logs -f

# 모든 것 다시 시작
docker-compose down
docker-compose up -d
```

### 데이터베이스 연결 오류

```bash
# PostgreSQL이 실행 중인지 확인
docker-compose ps postgres

# 데이터베이스 로그 확인
docker-compose logs postgres
```

### Claude API 오류

- `.env` 파일에 올바른 API 키가 있는지 확인
- API 사용량 한도 확인
- 서비스 재시작

### Frontend 연결 오류

- API Gateway가 실행 중인지 확인 (http://localhost:8000/health)
- CORS 설정 확인
- 브라우저 콘솔에서 에러 메시지 확인

## API 문서

### REST API

- **Swagger UI**: http://localhost:8001/docs
- **ReDoc**: http://localhost:8001/redoc

### 주요 엔드포인트

```
POST   /api/auth/register      - 회원가입
POST   /api/auth/login         - 로그인
GET    /api/auth/profile       - 프로필 조회
POST   /api/arguments          - 논증 제출
GET    /api/arguments          - 논증 목록
GET    /api/arguments/:id      - 논증 상세
GET    /api/progress           - 진행도 조회
GET    /api/progress/stats     - 상세 통계
```

## 개발 모드

### Hot Reload

모든 서비스가 개발 모드에서 hot reload를 지원합니다:

- **Frontend**: Vite가 자동으로 변경사항 반영
- **API Gateway**: nodemon이 파일 변경 감지
- **AI Service**: uvicorn의 --reload 옵션

### 디버깅

```bash
# 백엔드 로그
docker-compose logs -f api-gateway
docker-compose logs -f ai-service

# 프론트엔드 로그
# 브라우저 개발자 도구 콘솔 확인
```

## 프로덕션 배포

### 환경 변수 설정

프로덕션 환경에서 반드시 변경해야 할 항목:

```bash
NODE_ENV=production
PYTHON_ENV=production
JWT_SECRET=<강력한_랜덤_문자열>
DATABASE_PASSWORD=<강력한_비밀번호>
CLAUDE_API_KEY=<실제_API_키>
```

### Docker Compose Production

```bash
docker-compose -f docker-compose.prod.yml up -d
```

### 보안 체크리스트

- [ ] 모든 기본 비밀번호 변경
- [ ] JWT_SECRET을 강력한 랜덤 문자열로 변경
- [ ] CORS origins 설정을 실제 도메인으로 제한
- [ ] HTTPS 설정
- [ ] Rate limiting 설정 확인
- [ ] 데이터베이스 백업 설정
- [ ] 로그 모니터링 설정

## 추가 리소스

- [전체 문서](../README.md)
- [API 문서](http://localhost:8001/docs)
- [아키텍처 가이드](./ARCHITECTURE.md)
- [기여 가이드](./CONTRIBUTING.md)

## 지원

문제가 발생하면 GitHub Issues에 등록해주세요.
