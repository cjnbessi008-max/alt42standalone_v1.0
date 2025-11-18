# LMS Hint System (학습 힌트 시스템)

AI 기반 학습 힌트 시스템 - 답이 아닌 **사고 방향**을 제시합니다.

## 개요

이 시스템은 LMS와 연동하여 학생들에게 문제의 답을 직접 알려주지 않고, 스스로 생각하고 문제를 해결할 수 있도록 **점진적인 힌트**를 제공합니다. Socratic method(소크라테스식 문답법)에 기반하여, 학생의 사고 과정을 안내합니다.

## 주요 기능

### 🎯 핵심 원칙
- ✅ **답을 직접 제공하지 않음**: 절대로 정답을 알려주지 않습니다
- ✅ **사고 방향 안내**: 문제 해결을 위한 생각의 방향을 제시합니다
- ✅ **점진적 힌트**: 5단계의 점진적인 힌트를 제공합니다
- ✅ **맥락 기반**: 학생이 작성한 풀이를 분석하여 적절한 힌트를 생성합니다

### 💡 힌트 단계
1. **단계 1** (가장 미묘): 관련 개념 상기, 질문 제시
2. **단계 2**: 문제 유형 식별
3. **단계 3**: 일반적인 전략 제안
4. **단계 4**: 구체적인 단계 제시 (방법은 알려주지 않음)
5. **단계 5** (가장 직접적): 유사한 예제 제공 (여전히 답은 제공하지 않음)

### 🔗 LMS 연동
- LTI 1.3 표준 지원
- 학생 정보 자동 동기화
- 성적 자동 동기화
- 학습 진도 추적

## 기술 스택

### Backend
- **FastAPI**: Python 웹 프레임워크
- **Claude API**: AI 힌트 생성 (Anthropic)
- **PostgreSQL**: 데이터베이스
- **Redis**: 캐싱

### Frontend
- **React 18**: UI 프레임워크
- **TypeScript**: 타입 안전성
- **Tailwind CSS**: 스타일링
- **Vite**: 빌드 도구

### Infrastructure
- **Docker**: 컨테이너화
- **Docker Compose**: 오케스트레이션

## 프로젝트 구조

```
alt42standalone_v1.0/
├── backend/              # FastAPI 백엔드
│   ├── app/
│   │   ├── api/         # API 엔드포인트
│   │   ├── core/        # 설정
│   │   ├── models/      # 데이터 모델
│   │   └── services/    # 비즈니스 로직
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/            # React 프론트엔드
│   ├── src/
│   │   ├── components/  # React 컴포넌트
│   │   ├── services/    # API 클라이언트
│   │   └── types/       # TypeScript 타입
│   ├── package.json
│   └── Dockerfile
├── database/            # 데이터베이스 스키마
│   └── schema.sql
├── docker-compose.yml   # Docker 설정
└── README.md
```

## 시작하기

### 필수 조건
- Docker & Docker Compose
- Anthropic API Key ([발급받기](https://console.anthropic.com/))

### 설치 및 실행

1. **저장소 클론**
```bash
git clone <repository-url>
cd alt42standalone_v1.0
```

2. **환경 변수 설정**
```bash
cp .env.example .env
# .env 파일을 편집하여 ANTHROPIC_API_KEY 등을 설정
```

3. **Docker Compose로 실행**
```bash
docker-compose up -d
```

4. **서비스 접속**
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Documentation: http://localhost:8000/docs

### 개발 모드 실행

**Backend 개발 서버**
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

**Frontend 개발 서버**
```bash
cd frontend
npm install
npm run dev
```

## API 엔드포인트

### 힌트 생성
```http
POST /api/hints/generate
Content-Type: application/json

{
  "student_id": "student_123",
  "problem_id": "problem_456",
  "problem_description": "문제 설명",
  "student_work": "학생이 작성한 풀이",
  "hint_level": 1,
  "subject": "mathematics",
  "grade_level": "5학년"
}
```

### LMS 연동
```http
POST /api/lms/lti/login       # LTI 로그인
POST /api/lms/lti/launch      # LTI 런치
GET /api/lms/student/{id}/progress  # 학생 진도
POST /api/lms/grade/submit    # 성적 제출
```

## 데이터베이스 스키마

주요 테이블:
- `students`: 학생 정보
- `courses`: 과정 정보
- `problems`: 문제
- `student_attempts`: 학생 시도
- `hints`: 생성된 힌트
- `student_progress`: 학습 진도
- `lms_grade_sync`: LMS 성적 동기화

자세한 스키마는 `database/schema.sql` 참조

## 환경 변수

```env
# 필수
ANTHROPIC_API_KEY=your_api_key_here
SECRET_KEY=your_secret_key_here

# 데이터베이스
DATABASE_URL=postgresql://user:password@localhost:5432/hint_system

# Redis
REDIS_URL=redis://localhost:6379/0

# 힌트 설정
MAX_HINT_STEPS=5
HINT_MODEL=claude-3-5-sonnet-20241022
HINT_TEMPERATURE=0.7
MAX_TOKENS=500
```

## 사용 예시

### 학생 화면
1. 문제를 읽고 풀이를 작성합니다
2. 막히는 경우 "힌트 받기" 버튼을 클릭합니다
3. AI가 생성한 사고방향 힌트를 확인합니다
4. 단계별로 추가 힌트를 요청할 수 있습니다
5. 문제를 해결한 후 답안을 제출합니다

### 힌트 예시

**문제**: 1/4 + 1/3 = ?

**단계 1 힌트**:
> "분수를 더할 때 가장 먼저 확인해야 할 것은 무엇일까요? 두 분수의 분모를 살펴보세요."

**단계 2 힌트**:
> "이것은 분모가 다른 분수의 덧셈 문제입니다. 분모가 다를 때는 어떻게 해야 할까요?"

**단계 3 힌트**:
> "통분을 해야 합니다. 4와 3의 공통된 배수를 찾아보세요."

## 배포

### Production 배포

1. **환경 변수 설정** (production 값으로)
2. **Docker 이미지 빌드**
```bash
docker-compose -f docker-compose.yml build
```
3. **서비스 시작**
```bash
docker-compose up -d
```

### 모니터링
- Backend 로그: `docker-compose logs backend`
- Frontend 로그: `docker-compose logs frontend`
- 전체 로그: `docker-compose logs -f`

## 개발 가이드

### 새로운 힌트 타입 추가

1. `backend/app/models/__init__.py`에서 `HintType` enum 수정
2. `backend/app/services/hint_service.py`에서 분류 로직 업데이트
3. 프론트엔드 타입 정의 업데이트

### API 엔드포인트 추가

1. `backend/app/api/` 디렉토리에 라우터 생성
2. `backend/app/main.py`에서 라우터 등록
3. 프론트엔드 서비스 클라이언트 업데이트

## 테스트

```bash
# Backend 테스트
cd backend
pytest

# Frontend 테스트
cd frontend
npm test
```

## 라이선스

[라이선스 정보를 여기에 추가]

## 기여

기여는 환영합니다! Pull Request를 보내주세요.

## 문의

문제가 있거나 질문이 있으시면 Issue를 생성해주세요.

---

**Made with ❤️ for better learning**
