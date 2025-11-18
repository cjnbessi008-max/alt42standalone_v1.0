# LMS Solution Comparison System

AI 기반 학습 관리 시스템 (Learning Management System) - 모범 풀이와 학생 풀이를 비교하는 독립형 웹앱

## 주요 기능

### 학생용
- 문제 탐색 및 풀이 제출
- AI 기반 모범 풀이 비교
- 상세한 피드백 및 개선 제안
- 유사도 점수 분석
- 제출한 풀이 이력 관리

### 교사용
- 문제 생성 및 관리
- 모범 풀이 작성
- 난이도 및 유형 설정
- 학생 풀이 모니터링

### AI 비교 기능
- **Claude AI** 활용 풀이 분석
- 유사도 점수 (0-100%)
- 강점 및 개선점 피드백
- 접근 방법, 정확성, 완성도 분석
- 시각적 차이점 비교 (Diff Viewer)

## 기술 스택

### Backend
- **FastAPI**: 고성능 Python 웹 프레임워크
- **PostgreSQL**: 관계형 데이터베이스
- **SQLAlchemy**: ORM
- **Anthropic Claude**: AI 풀이 비교
- **JWT**: 인증 및 인가

### Frontend
- **React 18**: UI 프레임워크
- **TypeScript**: 타입 안전성
- **Vite**: 빌드 도구
- **Tailwind CSS**: 스타일링
- **React Router**: 라우팅
- **Zustand**: 상태 관리

## 빠른 시작

### 1. 저장소 클론

```bash
git clone <repository-url>
cd alt42standalone_v1.0
```

### 2. 환경 변수 설정

```bash
cp .env.example .env
```

`.env` 파일을 편집하여 다음을 설정:
- `ANTHROPIC_API_KEY`: Anthropic API 키 (https://console.anthropic.com 에서 발급)
- `SECRET_KEY`: JWT 비밀 키 (생성: `openssl rand -hex 32`)

### 3. Docker Compose로 실행

```bash
docker-compose up -d
```

서비스가 시작되면:
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- API 문서: http://localhost:8000/docs

### 4. 수동 설치 (로컬 개발)

#### Backend

```bash
cd backend

# Python 가상환경 생성 및 활성화
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 의존성 설치
pip install -r requirements.txt

# PostgreSQL 실행 (Docker)
docker run -d \
  --name lms_postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=lms_db \
  -p 5432:5432 \
  postgres:15

# 환경 변수 설정
cp .env.example .env
# .env 파일 편집

# 서버 실행
uvicorn app.main:app --reload
```

#### Frontend

```bash
cd frontend

# 의존성 설치
npm install

# 개발 서버 실행
npm run dev
```

## 프로젝트 구조

```
alt42standalone_v1.0/
├── backend/                 # FastAPI 백엔드
│   ├── app/
│   │   ├── models/         # 데이터베이스 모델
│   │   ├── schemas/        # Pydantic 스키마
│   │   ├── routes/         # API 엔드포인트
│   │   ├── services/       # 비즈니스 로직
│   │   ├── config.py       # 설정
│   │   ├── database.py     # DB 연결
│   │   └── main.py         # FastAPI 앱
│   ├── requirements.txt
│   ├── Dockerfile
│   └── README.md
├── frontend/               # React 프론트엔드
│   ├── src/
│   │   ├── components/    # 재사용 컴포넌트
│   │   ├── pages/         # 페이지 컴포넌트
│   │   ├── services/      # API 클라이언트
│   │   ├── types/         # TypeScript 타입
│   │   ├── styles/        # 스타일
│   │   ├── App.tsx        # 메인 앱
│   │   └── main.tsx       # 진입점
│   ├── package.json
│   ├── Dockerfile
│   └── README.md
├── docker-compose.yml      # Docker Compose 설정
├── .env.example           # 환경 변수 예제
└── README.md              # 이 파일
```

## 사용 방법

### 1. 회원가입

- http://localhost:5173/register 접속
- 사용자명, 이메일, 비밀번호 입력
- 역할 선택 (학생 / 교사)

### 2. 로그인

- http://localhost:5173/login 접속
- 사용자명과 비밀번호로 로그인

### 3. 학생 - 문제 풀기

1. **문제 목록** 페이지에서 문제 선택
2. 문제 설명 확인
3. 풀이 작성 및 설명 입력 (선택)
4. 제출 버튼 클릭
5. 자동으로 비교 페이지로 이동

### 4. 학생 - 풀이 비교

1. **비교하기** 버튼 클릭
2. AI가 모범 풀이와 비교 분석
3. 결과 확인:
   - 유사도 점수
   - AI 피드백
   - 잘한 점 / 개선할 점
   - 상세 분석 (접근, 정확성, 완성도)
   - 시각적 차이점 (Diff Viewer)

### 5. 교사 - 문제 생성

1. **문제 관리** > **새 문제 만들기**
2. 문제 정보 입력:
   - 제목
   - 설명 (Markdown 지원)
   - 유형 (수학/코딩/서술형)
   - 난이도 (쉬움/보통/어려움)
   - 배점
   - 시간 제한 (선택)
3. 모범 풀이 입력 (선택):
   - 모범 풀이 내용
   - 풀이 설명
4. **문제 생성** 버튼 클릭

### 6. 교사 - 문제 관리

- **문제 관리** 페이지에서:
  - 모든 문제 조회
  - 문제 수정
  - 문제 삭제

## API 문서

백엔드 실행 후 다음 URL에서 API 문서 확인:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

### 주요 엔드포인트

#### 인증
- `POST /auth/register` - 회원가입
- `POST /auth/login` - 로그인
- `GET /auth/me` - 현재 사용자 정보

#### 문제
- `GET /problems` - 문제 목록
- `POST /problems` - 문제 생성 (교사 전용)
- `GET /problems/{id}` - 문제 조회
- `PUT /problems/{id}` - 문제 수정
- `DELETE /problems/{id}` - 문제 삭제

#### 풀이
- `POST /solutions` - 풀이 제출
- `GET /solutions/problem/{problem_id}` - 문제별 풀이 목록
- `GET /solutions/my/all` - 내 풀이 목록

#### 비교
- `POST /comparisons` - AI 풀이 비교
- `GET /comparisons/solution/{solution_id}` - 풀이별 비교 목록

## 데이터베이스 스키마

### Users
- 사용자 정보 및 역할 (학생/교사/관리자)
- 인증 정보

### Problems
- 문제 정보
- 난이도, 유형, 배점
- 교사별 문제 관리

### Solutions
- 학생 풀이
- 모범 풀이 (reference)
- 풀이 설명

### Comparisons
- AI 비교 결과
- 유사도 점수
- 피드백 및 분석

## 개발

### Backend 테스트

```bash
cd backend
pytest
```

### Frontend 빌드

```bash
cd frontend
npm run build
```

### 데이터베이스 마이그레이션

현재는 SQLAlchemy의 `create_all()`을 사용하여 자동 생성.

프로덕션에서는 Alembic을 사용한 마이그레이션 권장:

```bash
cd backend
alembic init alembic
alembic revision --autogenerate -m "Initial migration"
alembic upgrade head
```

## 배포

### Docker를 사용한 프로덕션 배포

1. 환경 변수 설정
2. Docker Compose 실행:

```bash
docker-compose -f docker-compose.prod.yml up -d
```

### 수동 배포

#### Backend

```bash
cd backend
pip install -r requirements.txt
gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

#### Frontend

```bash
cd frontend
npm run build
# dist/ 폴더를 Nginx 등의 웹 서버에서 서빙
```

## 보안 고려사항

- JWT 토큰 기반 인증
- 비밀번호 해싱 (bcrypt)
- CORS 설정
- SQL Injection 방지 (SQLAlchemy ORM)
- 역할 기반 접근 제어 (RBAC)

프로덕션 배포 시:
- HTTPS 사용
- 강력한 SECRET_KEY 설정
- 데이터베이스 접근 제한
- API 속도 제한 (Rate Limiting)
- 입력 검증 강화

## 문제 해결

### 백엔드가 시작되지 않음

- PostgreSQL 실행 확인: `docker ps`
- 환경 변수 확인: `.env` 파일 존재 및 내용 확인
- 포트 충돌 확인: 8000 포트 사용 여부

### 프론트엔드가 백엔드와 통신하지 못함

- 백엔드 실행 확인: http://localhost:8000/health
- CORS 설정 확인: `backend/app/config.py`
- 프록시 설정 확인: `frontend/vite.config.ts`

### AI 비교가 작동하지 않음

- `ANTHROPIC_API_KEY` 설정 확인
- API 키 유효성 확인
- 크레딧 잔액 확인

## 라이선스

MIT License

## 기여

Pull Request 환영합니다!

## 문의

프로젝트 관련 문의는 Issue를 통해 남겨주세요.
