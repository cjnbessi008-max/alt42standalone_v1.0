# LMS 문제 읽기·풀이 단계 자동 분리 시스템

독립형 웹 애플리케이션으로 학습 문제를 **읽기 단계**와 **풀이 단계**로 자동 분리하여 학생들의 학습 효과를 극대화하는 시스템입니다.

## 주요 기능

### 🎯 2단계 학습 프로세스
1. **읽기 단계 (Reading Stage)**
   - 문제 텍스트 및 시각 자료 표시
   - 최소 5초 읽기 시간 강제
   - "이해했어요" 확인 버튼
   - 읽기 시간 자동 측정

2. **풀이 단계 (Solving Stage)**
   - 읽기 완료 후에만 접근 가능
   - 객관식/주관식 답안 입력
   - 실시간 정답 확인
   - 시도 횟수 및 풀이 시간 추적

### 📊 진행 상황 추적
- 학생별 문제 진행 상태 관리
- 단계별 소요 시간 측정
- 시도 횟수 및 정답률 기록
- 학습 이력 데이터베이스 저장

### 🔐 인증 및 권한 관리
- JWT 기반 사용자 인증
- 학생/교사 역할 구분
- 교사: 문제 생성/수정/삭제
- 학생: 문제 풀이 및 진행 추적

## 기술 스택

### Backend
- **FastAPI** - Python 웹 프레임워크
- **SQLAlchemy** - ORM
- **PostgreSQL** - 데이터베이스
- **JWT** - 인증
- **Pydantic** - 데이터 검증

### Frontend
- **React 18** - UI 라이브러리
- **TypeScript** - 타입 안정성
- **Vite** - 빌드 도구
- **Zustand** - 상태 관리
- **Tailwind CSS** - 스타일링
- **Axios** - HTTP 클라이언트

### DevOps
- **Docker & Docker Compose** - 컨테이너화
- **PostgreSQL 15** - 데이터베이스

## 시작하기

### 사전 요구사항
- Docker Desktop 설치
- Git

### 설치 및 실행

1. **저장소 클론**
```bash
git clone <repository-url>
cd alt42standalone_v1.0
```

2. **환경 변수 설정**
```bash
# Backend 환경 변수
cp backend/.env.example backend/.env

# Frontend 환경 변수
cp frontend/.env.example frontend/.env
```

3. **Docker Compose로 실행**
```bash
docker-compose up -d
```

4. **데이터베이스 초기화 및 샘플 데이터 생성**
```bash
docker exec -it lms_backend python seed_data.py
```

5. **애플리케이션 접속**
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

### 데모 계정

**학생 계정**
- Username: `student`
- Password: `password123`

**교사 계정**
- Username: `teacher`
- Password: `password123`

## 프로젝트 구조

```
alt42standalone_v1.0/
├── backend/                 # FastAPI 백엔드
│   ├── app/
│   │   ├── models/         # SQLAlchemy 모델
│   │   ├── routes/         # API 엔드포인트
│   │   ├── schemas/        # Pydantic 스키마
│   │   ├── core/           # 설정 및 보안
│   │   ├── db/             # 데이터베이스 설정
│   │   └── main.py         # FastAPI 앱
│   ├── seed_data.py        # 샘플 데이터 생성
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/               # React 프론트엔드
│   ├── src/
│   │   ├── components/     # React 컴포넌트
│   │   │   ├── ReadingStage.tsx
│   │   │   └── SolvingStage.tsx
│   │   ├── pages/          # 페이지 컴포넌트
│   │   │   ├── LoginPage.tsx
│   │   │   ├── ProblemsListPage.tsx
│   │   │   └── ProblemPage.tsx
│   │   ├── services/       # API 서비스
│   │   ├── stores/         # Zustand 스토어
│   │   ├── types/          # TypeScript 타입
│   │   └── styles/         # CSS 스타일
│   ├── package.json
│   └── Dockerfile
└── docker-compose.yml      # Docker 구성
```

## API 엔드포인트

### 인증 (Authentication)
- `POST /api/auth/register` - 사용자 등록
- `POST /api/auth/login` - 로그인
- `GET /api/auth/me` - 현재 사용자 정보

### 문제 (Problems)
- `GET /api/problems/` - 문제 목록 조회
- `GET /api/problems/{id}` - 문제 상세 조회
- `GET /api/problems/{id}/reading` - 읽기 단계 내용
- `GET /api/problems/{id}/solving` - 풀이 단계 내용
- `POST /api/problems/` - 문제 생성 (교사 전용)
- `PUT /api/problems/{id}` - 문제 수정 (교사 전용)
- `DELETE /api/problems/{id}` - 문제 삭제 (교사 전용)

### 진행 상황 (Progress)
- `POST /api/progress/{problem_id}/start` - 문제 시작
- `POST /api/progress/{problem_id}/confirm-reading` - 읽기 완료 확인
- `POST /api/progress/{problem_id}/start-solving` - 풀이 단계 시작
- `POST /api/progress/{problem_id}/submit-answer` - 답안 제출
- `GET /api/progress/{problem_id}` - 특정 문제 진행 상황
- `GET /api/progress/` - 전체 진행 상황

## 데이터베이스 스키마

### 주요 테이블

**users** - 사용자 정보
- id, email, username, hashed_password
- role (student/teacher/admin)
- grade_level

**problems** - 문제 정보
- id, title, problem_type, difficulty_level
- subject, grade_level
- reading_content, reading_visual_url
- question_text, correct_answer, answer_options
- explanation, tags

**student_progress** - 학생 진행 상황
- id, student_id, problem_id
- current_stage (reading/solving/completed)
- reading_completed, solving_completed
- reading_duration_seconds, solving_duration_seconds
- reading_confirmed

**student_attempts** - 학생 시도 기록
- id, student_id, problem_id, progress_id
- attempt_number, submitted_answer, is_correct
- time_spent_seconds

## 주요 기능 설명

### 읽기 단계 (Reading Stage)
1. 문제를 시작하면 자동으로 읽기 단계로 진입
2. 문제 설명, 시각 자료, 관련 개념 표시
3. 최소 5초 이상 읽기 시간 필요
4. "이해했어요" 버튼 클릭으로 다음 단계 진행

### 풀이 단계 (Solving Stage)
1. 읽기 단계 완료 후에만 접근 가능
2. 문제 유형에 따른 답안 입력 UI
   - 객관식: 라디오 버튼
   - 주관식: 텍스트 입력
3. 답안 제출 시 즉시 정답 확인
4. 오답 시 재시도 가능, 시도 횟수 기록
5. 정답 시 설명 표시 및 완료 처리

### 진행 상황 추적
- 각 단계별 시작/완료 시간 기록
- 소요 시간 자동 계산
- 시도 횟수 및 정답 여부 저장
- 학습 이력 데이터 분석 가능

## 개발 모드

### Backend 개발
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Frontend 개발
```bash
cd frontend
npm install
npm run dev
```

## 프로덕션 배포

### 환경 변수 설정
1. `backend/.env`에서 SECRET_KEY 변경
2. `backend/.env`에서 DATABASE_URL 설정
3. CORS 설정 업데이트

### 빌드 및 배포
```bash
# 프로덕션 빌드
docker-compose -f docker-compose.prod.yml up -d
```

## 라이선스

MIT License

## 기여

이슈 및 Pull Request 환영합니다.

## 문의

문제나 질문이 있으시면 GitHub Issues를 통해 문의해주세요.
