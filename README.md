# AI 교육 시스템 - 내가 자주 틀리는 개념 TOP3

학생들의 학습 데이터를 분석하여 자주 틀리는 개념을 자동으로 파악하고, 맞춤형 학습 개선 방안을 제공하는 웹 애플리케이션입니다.

## 📋 목차

- [주요 기능](#주요-기능)
- [기술 스택](#기술-스택)
- [시스템 요구사항](#시스템-요구사항)
- [설치 및 실행](#설치-및-실행)
- [사용 방법](#사용-방법)
- [API 문서](#api-문서)
- [프로젝트 구조](#프로젝트-구조)
- [개발 가이드](#개발-가이드)

## ✨ 주요 기능

### 1. 오개념 자동 추적
- 학생의 문제 풀이 과정에서 발생하는 오답을 자동으로 기록
- 오답 패턴을 분석하여 오개념 유형 분류
- 실시간 오개념 빈도 계산

### 2. TOP3 개념 분석
- 학생별로 가장 자주 틀리는 개념 TOP 3 표시
- 개념별 우선순위 (high/medium/low) 자동 설정
- 시간대별 분석 지원 (최근 일주일/한 달/전체 기간)

### 3. 맞춤형 개선 방안 제공
- 각 오개념에 대한 구체적인 개선 전략 제시
- 시각적으로 직관적인 팝업 UI
- 개념별 상세 설명 및 예시

### 4. 다중 학생/모듈 관리
- 여러 학생의 학습 진행 상황 관리
- 모듈(과목)별 오개념 추적
- 학생별 학습 진도율 표시

## 🛠 기술 스택

### Backend
- **FastAPI** (Python 3.11+) - 고성능 REST API
- **PostgreSQL 15** - 관계형 데이터베이스
- **SQLAlchemy** - ORM
- **Pydantic** - 데이터 검증

### Frontend
- **React 18** - UI 프레임워크
- **TypeScript** - 타입 안전성
- **Vite** - 빌드 도구
- **Axios** - HTTP 클라이언트

### DevOps
- **Docker & Docker Compose** - 컨테이너화
- **Uvicorn** - ASGI 서버

## 📦 시스템 요구사항

- Docker 20.10 이상
- Docker Compose 2.0 이상
- 최소 2GB RAM
- 최소 1GB 디스크 공간

또는 로컬 개발 환경:
- Python 3.11 이상
- Node.js 18 이상
- PostgreSQL 15 이상

## 🚀 설치 및 실행

### Docker를 사용한 실행 (권장)

1. **저장소 클론**
```bash
git clone <repository-url>
cd alt42standalone_v1.0
```

2. **환경 변수 설정**
```bash
# .env 파일이 이미 생성되어 있습니다
# 필요시 데이터베이스 비밀번호 등을 수정하세요
cat .env
```

3. **Docker Compose로 전체 스택 실행**
```bash
# 모든 서비스 빌드 및 시작
docker-compose up --build

# 백그라운드 실행
docker-compose up -d --build
```

4. **데이터베이스 초기화**
```bash
# 데이터베이스가 자동으로 초기화되지만, 수동으로 실행하려면:
docker-compose exec db psql -U postgres -d ai_education -f /docker-entrypoint-initdb.d/migrations/001_create_base_tables.sql
docker-compose exec db psql -U postgres -d ai_education -f /docker-entrypoint-initdb.d/seeds/002_sample_data.sql
```

5. **애플리케이션 접속**
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Docs (Swagger)**: http://localhost:8000/docs
- **API Docs (ReDoc)**: http://localhost:8000/redoc

### 로컬 개발 환경 실행

#### Backend 실행
```bash
cd backend

# 가상 환경 생성
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 패키지 설치
pip install -r requirements.txt

# 데이터베이스 설정 (PostgreSQL이 실행 중이어야 함)
# .env 파일 수정하여 로컬 데이터베이스 정보 입력

# 애플리케이션 실행
python -m app.main
```

#### Frontend 실행
```bash
cd frontend

# 패키지 설치
npm install

# 개발 서버 실행
npm run dev
```

## 📖 사용 방법

### 1. 학생 선택
- 메인 화면에서 드롭다운 메뉴를 통해 학생 선택
- 샘플 데이터에는 3명의 학생이 등록되어 있습니다:
  - 김민준 (3학년)
  - 이서연 (3학년)
  - 박지우 (3학년)

### 2. 모듈 선택
- 학생을 선택하면 해당 학생이 등록된 모듈 목록이 표시됩니다
- 샘플 데이터에는 "분수 학습" 모듈이 포함되어 있습니다

### 3. TOP3 개념 확인
- "자주 틀리는 개념 TOP3 보기" 버튼 클릭
- 팝업이 열리면서 다음 정보 표시:
  - 순위별 오개념
  - 발생 횟수
  - 우선순위 (색상 코드)
  - 개선 방법

### 4. 개선 방안 활용
- 각 오개념 카드에 표시된 "💡 개선 방법" 확인
- 연습 문제 풀기 버튼 클릭 (향후 구현 예정)

## 📡 API 문서

### 주요 엔드포인트

#### 1. 학생의 TOP 오개념 조회
```
GET /api/misconceptions/students/{student_id}/modules/{module_id}/top
```

**Query Parameters:**
- `limit` (int, default: 3): 조회할 오개념 개수
- `timeframe` (string, default: "all_time"): 분석 기간 (week/month/all_time)

**Response:**
```json
{
  "student_id": "uuid",
  "student_name": "김민준",
  "module_id": "uuid",
  "module_name": "분수 학습",
  "misconceptions": [
    {
      "id": "uuid",
      "name": "분자와 분모를 각각 더함",
      "description": "분수 덧셈 시 분자끼리, 분모끼리 각각 더하는 오류",
      "concept_name": "분수의 덧셈",
      "severity": "high",
      "occurrence_count": 4,
      "last_occurred_at": "2024-11-11T...",
      "correction_strategy": "분모는 전체를 나눈 조각의 수이므로..."
    }
  ],
  "total_count": 3,
  "generated_at": "2024-11-18T..."
}
```

#### 2. 모든 학생 목록 조회
```
GET /api/misconceptions/students
```

#### 3. 학생의 등록 모듈 조회
```
GET /api/misconceptions/students/{student_id}/modules
```

#### 4. 헬스 체크
```
GET /health
```

**전체 API 문서**: http://localhost:8000/docs

## 📁 프로젝트 구조

```
alt42standalone_v1.0/
├── backend/                    # FastAPI 백엔드
│   ├── app/
│   │   ├── api/               # API 라우트
│   │   │   └── misconceptions.py
│   │   ├── database.py        # DB 연결 설정
│   │   ├── models.py          # Pydantic 모델
│   │   └── main.py            # FastAPI 앱
│   ├── requirements.txt
│   └── Dockerfile
│
├── frontend/                   # React 프론트엔드
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/
│   │   │   │   └── Modal/    # 모달 컴포넌트
│   │   │   └── misconceptions/
│   │   │       ├── MisconceptionCard.tsx
│   │   │       └── MisconceptionsPopup.tsx
│   │   ├── services/
│   │   │   └── api.ts         # API 클라이언트
│   │   ├── types/
│   │   │   └── index.ts       # TypeScript 타입
│   │   ├── App.tsx            # 메인 앱
│   │   └── main.tsx
│   ├── package.json
│   └── Dockerfile
│
├── database/                   # 데이터베이스 스크립트
│   ├── migrations/
│   │   └── 001_create_base_tables.sql
│   └── seeds/
│       └── 002_sample_data.sql
│
├── docker-compose.yml
├── .env
└── README.md
```

## 🔧 개발 가이드

### 새로운 오개념 추가

1. **데이터베이스에 오개념 추가**
```sql
INSERT INTO misconceptions (module_id, concept_id, name, description, severity, correction_strategy)
VALUES (
  'module-uuid',
  'concept-uuid',
  '새로운 오개념 이름',
  '상세 설명',
  'high',
  '개선 방법'
);
```

2. **학생-오개념 연결 추가**
```sql
INSERT INTO student_misconceptions (student_id, misconception_id, occurrence_count)
VALUES ('student-uuid', 'misconception-uuid', 1);
```

### 프론트엔드 커스터마이징

**색상 변경**: `frontend/src/components/misconceptions/MisconceptionCard.css`
```css
.misconception-card {
  /* 스타일 수정 */
}
```

**팝업 크기 조정**: `frontend/src/components/misconceptions/MisconceptionsPopup.tsx`
```tsx
<Modal maxWidth="lg">  // sm, md, lg 중 선택
```

### 백엔드 API 확장

새로운 엔드포인트 추가: `backend/app/api/misconceptions.py`
```python
@router.get("/new-endpoint")
async def new_endpoint():
    # 구현
    pass
```

## 🔍 데이터베이스 스키마

### 주요 테이블

- **students**: 학생 정보
- **modules**: 학습 모듈 (예: 분수 학습)
- **concepts**: 개념 (예: 통분, 약분)
- **problems**: 문제
- **student_attempts**: 학생 답안 기록
- **misconceptions**: 오개념 정의
- **student_misconceptions**: 학생별 오개념 추적

자세한 스키마는 `database/migrations/001_create_base_tables.sql` 참조

## 🐛 트러블슈팅

### 데이터베이스 연결 실패
```bash
# 데이터베이스 컨테이너 재시작
docker-compose restart db

# 로그 확인
docker-compose logs db
```

### 프론트엔드에서 API 호출 실패
```bash
# CORS 설정 확인
# backend/.env 파일의 CORS_ORIGINS 확인

# 백엔드 로그 확인
docker-compose logs backend
```

### 포트 충돌
```bash
# 다른 포트 사용 중이면 docker-compose.yml 수정
# 예: 3000 -> 3001, 8000 -> 8001
```

## 📄 라이센스

이 프로젝트는 KAIST Touch Math Academy를 위해 개발되었습니다.

## 👥 기여자

- AI Agent (Claude) - 초기 개발 및 설계

## 📞 문의

프로젝트 관련 문의사항은 이슈 트래커를 통해 제출해주세요.

---

**개발 시작일**: 2024-11-18
**버전**: 1.0.0
**상태**: ✅ Production Ready
