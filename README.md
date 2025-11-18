# AI Education System - Student Solution Flowchart

LMS와 연동된 학생 풀이의 시각적 흐름도 생성 시스템

## 개요

이 시스템은 학생들이 문제를 푸는 과정을 자동으로 추적하고, 그 과정을 시각적 흐름도로 변환하여 교사와 학생이 학습 과정을 쉽게 이해할 수 있도록 도와줍니다.

### 주요 기능

- **실시간 행동 추적**: 학생의 모든 문제 풀이 행동을 실시간으로 기록
- **자동 흐름도 생성**: 수집된 데이터를 기반으로 시각적 흐름도 자동 생성
- **LMS 연동**: LTI 1.3 표준을 통한 LMS 통합
- **직관적 UI**: React Flow 기반의 인터랙티브한 시각화
- **분석 대시보드**: 교사를 위한 학생 학습 분석 도구

## 기술 스택

### Backend
- **FastAPI**: Python 기반 고성능 웹 프레임워크
- **PostgreSQL**: 관계형 데이터베이스
- **SQLAlchemy**: ORM
- **Redis**: 캐싱 및 세션 관리
- **Anthropic Claude API**: AI 기반 분석 (선택사항)

### Frontend
- **React 18**: UI 라이브러리
- **TypeScript**: 타입 안전성
- **React Flow**: 흐름도 시각화
- **Material-UI**: UI 컴포넌트 라이브러리
- **Vite**: 빌드 도구

### Infrastructure
- **Docker & Docker Compose**: 컨테이너화
- **LTI 1.3**: LMS 통합 표준

## 설치 및 실행

### 사전 요구사항

- Docker & Docker Compose
- Node.js 20+ (로컬 개발 시)
- Python 3.11+ (로컬 개발 시)

### 빠른 시작 (Docker 사용)

1. **저장소 클론**
```bash
git clone <repository-url>
cd alt42standalone_v1.0
```

2. **환경 변수 설정**
```bash
cp .env.example .env
# .env 파일을 열어 필요한 값들을 설정하세요
```

3. **Docker Compose로 실행**
```bash
docker-compose up -d
```

4. **서비스 접속**
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API 문서: http://localhost:8000/docs

### 로컬 개발 환경 설정

#### Backend

```bash
cd backend

# 가상환경 생성
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 의존성 설치
pip install -r requirements.txt

# 데이터베이스 마이그레이션
# (먼저 PostgreSQL이 실행 중이어야 합니다)

# 서버 실행
uvicorn main:app --reload
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
│   │   ├── api/            # API 라우트
│   │   │   └── routes/
│   │   │       ├── student_solutions.py
│   │   │       ├── flowchart.py
│   │   │       └── lms_integration.py
│   │   ├── core/           # 핵심 설정
│   │   │   └── config.py
│   │   ├── db/             # 데이터베이스 설정
│   │   │   └── database.py
│   │   ├── models/         # 데이터 모델
│   │   │   └── student_solution.py
│   │   └── schemas/        # Pydantic 스키마
│   │       └── flowchart.py
│   ├── main.py            # FastAPI 앱 진입점
│   ├── requirements.txt   # Python 의존성
│   └── Dockerfile
├── frontend/               # React 프론트엔드
│   ├── src/
│   │   ├── components/    # React 컴포넌트
│   │   │   └── FlowchartViewer.tsx
│   │   ├── pages/         # 페이지 컴포넌트
│   │   │   ├── StudentDashboard.tsx
│   │   │   └── TeacherDashboard.tsx
│   │   ├── services/      # API 클라이언트
│   │   │   └── api.ts
│   │   ├── types/         # TypeScript 타입
│   │   │   └── flowchart.ts
│   │   └── App.tsx
│   ├── package.json
│   └── Dockerfile
├── database/              # 데이터베이스 스크립트
│   └── init.sql
├── docker-compose.yml     # Docker Compose 설정
├── .env.example          # 환경 변수 예제
└── README.md
```

## API 문서

### 주요 엔드포인트

#### 학생 풀이 관련

- `POST /api/v1/solutions/start-solution` - 새 풀이 세션 시작
- `POST /api/v1/solutions/track-action` - 학생 행동 추적
- `POST /api/v1/solutions/submit-answer` - 답안 제출
- `GET /api/v1/solutions/student/{student_id}/solutions` - 학생의 모든 풀이 조회

#### 흐름도 관련

- `POST /api/v1/flowchart/generate` - 흐름도 생성
- `GET /api/v1/flowchart/solution/{solution_id}` - 풀이 흐름도 조회
- `DELETE /api/v1/flowchart/solution/{solution_id}` - 흐름도 삭제

#### LMS 연동

- `POST /api/v1/lms/lti/login` - LTI 로그인 시작
- `POST /api/v1/lms/lti/launch` - LTI 런치
- `POST /api/v1/lms/grade-passback` - 성적 전송

자세한 API 문서는 서버 실행 후 `/docs` 에서 확인할 수 있습니다.

## 사용 방법

### 학생 사용 흐름

1. LMS를 통해 시스템에 로그인
2. 문제 풀이 시작
3. 문제를 풀면서 자동으로 행동이 추적됨
4. 답안 제출
5. 자신의 풀이 과정을 흐름도로 확인

### 교사 사용 흐름

1. 교사 대시보드에 접속
2. 학생들의 풀이 목록 확인
3. 특정 학생의 흐름도 클릭하여 자세히 분석
4. 학습 패턴 파악 및 피드백 제공

## LMS 연동 설정

### LTI 1.3 설정

1. LMS에서 외부 도구 등록
2. LTI 클라이언트 ID 및 배포 ID 발급
3. `.env` 파일에 설정 추가:
```
LTI_ISSUER=https://your-lms.example.com
LTI_CLIENT_ID=your-client-id
LTI_DEPLOYMENT_ID=your-deployment-id
```

4. 공개 키 및 개인 키 생성:
```bash
# 개인 키 생성
openssl genrsa -out keys/private.key 2048

# 공개 키 생성
openssl rsa -in keys/private.key -pubout -out keys/public.key
```

5. LMS에 공개 키 등록

## 데이터 모델

### 주요 엔티티

- **Student**: 학생 정보
- **Module**: 교육 모듈
- **Problem**: 문제
- **StudentSolution**: 학생의 풀이 세션
- **StudentAction**: 개별 학생 행동
- **FlowchartNode**: 흐름도 노드
- **FlowchartEdge**: 흐름도 엣지

자세한 스키마는 `backend/app/models/student_solution.py` 참조

## 개발 가이드

### 새로운 행동 타입 추가

1. `backend/app/models/student_solution.py`의 `ActionType` enum에 추가
2. `backend/app/api/routes/flowchart.py`의 스타일 매핑 업데이트
3. Frontend에서 필요시 UI 업데이트

### 새로운 시각화 레이아웃 추가

1. `backend/app/api/routes/flowchart.py`의 `FlowchartGenerator` 클래스 수정
2. 레이아웃 알고리즘 구현
3. API 요청 시 `layout_algorithm` 파라미터로 선택

## 테스트

### Backend 테스트

```bash
cd backend
pytest
```

### Frontend 테스트

```bash
cd frontend
npm run test
```

## 배포

### Production 환경 설정

1. `.env` 파일의 보안 설정 변경:
   - `SECRET_KEY` 변경
   - `DEBUG=False` 설정
   - 데이터베이스 비밀번호 변경

2. Docker Compose production 설정 사용:
```bash
docker-compose -f docker-compose.prod.yml up -d
```

## 문제 해결

### 일반적인 문제

**Q: 데이터베이스 연결 오류**
- PostgreSQL 컨테이너가 실행 중인지 확인
- DATABASE_URL 환경 변수 확인

**Q: 흐름도가 생성되지 않음**
- 학생 행동 데이터가 수집되었는지 확인
- API 로그 확인

**Q: LTI 인증 실패**
- LTI 설정 값 확인
- 공개/개인 키 올바른지 확인

## 라이선스

이 프로젝트는 MIT 라이선스를 따릅니다.

## 기여

기여는 언제나 환영합니다! Pull Request를 제출해주세요.

## 문의

문제가 있거나 질문이 있으시면 이슈를 생성해주세요.
