# ALT42 교육 시스템 - Transform Vector 모듈

벡터 변환(회전/신장) 애니메이션 학습 모듈입니다. LMS와 연동하여 문제 정보를 받아 동작하며, 가상 스마트폰 화면에 표시할 수 있습니다.

## 🎯 주요 기능

- **벡터 변환 애니메이션**: 회전(rotation) 및 신장(scaling) 변환을 부드러운 애니메이션으로 표시
- **가상 스마트폰 디스플레이**: 우측 하단에 실제 스마트폰처럼 보이는 UI로 앱 표시
- **LMS 연동 준비**: PostgreSQL 데이터베이스를 통한 문제 관리
- **실시간 피드백**: 학생 답안 제출 및 정답 확인
- **난이도 조절**: 5단계 난이도별 문제 제공

## 🏗️ 기술 스택

### Frontend
- **React 18+** with TypeScript
- **Material-UI (MUI)** - UI 컴포넌트
- **Framer Motion** - 애니메이션
- **Axios** - API 통신
- **Vite** - 빌드 도구

### Backend
- **Python 3.11+**
- **FastAPI** - RESTful API 프레임워크
- **SQLAlchemy** - ORM
- **PostgreSQL 15+** - 데이터베이스
- **Pydantic** - 데이터 검증

## 📁 프로젝트 구조

```
alt42standalone_v1.0/
├── frontend/                   # React 프론트엔드
│   ├── src/
│   │   ├── components/
│   │   │   ├── TransformVector/  # 벡터 변환 컴포넌트
│   │   │   │   ├── TransformVector.tsx
│   │   │   │   └── VectorCanvas.tsx
│   │   │   └── VirtualPhone/     # 가상 스마트폰 디스플레이
│   │   │       └── VirtualPhone.tsx
│   │   ├── services/
│   │   │   └── api.ts           # API 서비스
│   │   ├── types/
│   │   │   └── vector.ts        # TypeScript 타입 정의
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   └── vite.config.ts
├── backend/                    # Python/FastAPI 백엔드
│   ├── app/
│   │   ├── models/             # SQLAlchemy 모델
│   │   │   └── vector_problem.py
│   │   ├── schemas/            # Pydantic 스키마
│   │   │   └── vector_problem.py
│   │   ├── routes/             # API 라우트
│   │   │   └── vector_problems.py
│   │   ├── database.py         # 데이터베이스 설정
│   │   └── main.py             # FastAPI 앱
│   └── requirements.txt
├── database/
│   └── init.sql                # 데이터베이스 초기화 SQL
├── docker-compose.yml
└── README.md
```

## 🚀 시작하기

### 필수 요구사항

- **Node.js** 18+ 및 npm
- **Python** 3.11+
- **PostgreSQL** 15+
- **Docker & Docker Compose** (선택사항, 추천)

### 1. Docker Compose로 실행 (추천)

```bash
# 모든 서비스 시작 (PostgreSQL, Backend, Frontend)
docker-compose up -d

# 로그 확인
docker-compose logs -f

# 서비스 중지
docker-compose down
```

서비스 접속:
- **프론트엔드**: http://localhost:3000
- **백엔드 API**: http://localhost:8000
- **API 문서**: http://localhost:8000/docs

### 2. 수동 설치 및 실행

#### 2.1 데이터베이스 설정

```bash
# PostgreSQL 설치 및 시작
# Ubuntu/Debian
sudo apt-get install postgresql postgresql-contrib
sudo systemctl start postgresql

# macOS
brew install postgresql@15
brew services start postgresql@15

# 데이터베이스 생성
sudo -u postgres psql
CREATE DATABASE alt42_education;
CREATE USER alt42user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE alt42_education TO alt42user;
\q

# 스키마 초기화
psql -U alt42user -d alt42_education -f database/init.sql
```

#### 2.2 백엔드 설정

```bash
cd backend

# 가상환경 생성 및 활성화
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 의존성 설치
pip install -r requirements.txt

# 환경 변수 설정
cp .env.example .env
# .env 파일을 열어서 데이터베이스 연결 정보 수정

# 서버 실행
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

#### 2.3 프론트엔드 설정

```bash
cd frontend

# 의존성 설치
npm install

# 환경 변수 설정
cp .env.example .env

# 개발 서버 실행
npm run dev
```

## 🎮 사용 방법

### 1. 데스크톱 모드
- 좌측 패널에서 난이도 선택
- "새 문제 불러오기" 클릭하여 문제 로드
- 우측 캔버스에서 "애니메이션 시작" 버튼 클릭
- 변환된 벡터 좌표 예측하여 입력
- "답안 제출" 버튼으로 정답 확인

### 2. 스마트폰 모드
- 상단 툴바에서 "스마트폰" 토글 버튼 클릭
- 우측 하단에 가상 스마트폰 화면 표시
- 동일한 기능을 스마트폰 UI로 사용

## 📊 데이터베이스 스키마

### 주요 테이블

#### `vector_problems`
벡터 변환 문제 정보
- `problem_type`: 'rotation', 'scaling', 'combined'
- `initial_x`, `initial_y`: 초기 벡터
- `rotation_angle`: 회전 각도 (도)
- `scale_x`, `scale_y`: 신장 비율
- `expected_x`, `expected_y`: 예상 결과 벡터
- `difficulty_level`: 난이도 (1-5)
- `animation_duration`: 애니메이션 시간 (ms)

#### `student_attempts`
학생 답안 기록
- `student_id`: 학생 ID
- `problem_id`: 문제 ID
- `answer_x`, `answer_y`: 학생 답안
- `is_correct`: 정답 여부
- `time_spent_seconds`: 소요 시간

## 🔌 API 엔드포인트

### 문제 관리
- `GET /api/vector-problems/` - 모든 문제 조회
- `GET /api/vector-problems/{id}` - 특정 문제 조회
- `GET /api/vector-problems/random/{difficulty}` - 난이도별 랜덤 문제

### 답안 제출
- `POST /api/vector-problems/attempts` - 학생 답안 제출

### 모듈 정보
- `GET /api/vector-problems/modules` - 모듈 목록

자세한 API 문서: http://localhost:8000/docs

## 🎨 커스터마이징

### 벡터 캔버스 설정
`frontend/src/components/TransformVector/VectorCanvas.tsx`:
- `CANVAS_SIZE`: 캔버스 크기
- `SCALE_FACTOR`: 벡터 스케일
- `ARROW_HEAD_SIZE`: 화살표 크기

### 가상 스마트폰 디자인
`frontend/src/components/VirtualPhone/VirtualPhone.tsx`:
- 스마트폰 크기 및 스타일 수정
- 위치 조정 (`position` prop)

## 🔧 개발 도구

### 코드 포맷팅
```bash
# Frontend
cd frontend
npm run lint

# Backend
cd backend
black app/
isort app/
```

### 타입 체크
```bash
cd frontend
npx tsc --noEmit
```

## 📝 향후 개발 계획

- [ ] Moodle LTI 연동
- [ ] 실시간 협업 기능
- [ ] 3D 벡터 변환 지원
- [ ] 모바일 네이티브 앱
- [ ] 게임화 요소 추가
- [ ] AI 기반 힌트 시스템

## 🤝 기여

이슈 및 PR을 환영합니다!

## 📄 라이선스

이 프로젝트는 MIT 라이선스를 따릅니다.

## 👥 개발팀

KAIST Touch Math Academy - AI Education System Pipeline

---

**문의사항이 있으시면 이슈를 등록해주세요!**
