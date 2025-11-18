# Color Partition - AI Education System

> 수학 함수의 구간별 성질을 색깔 층으로 시각화하는 교육용 웹 애플리케이션

## 프로젝트 개요

**Color Partition**은 수학 교육을 위한 AI 기반 시스템의 핵심 기능으로, 함수의 증가/감소, 오목/볼록, 양수/음수 구간을 색깔로 구분하여 시각화합니다.

### 주요 기능

- 📊 **함수 구간 분석**: 1차·2차 도함수를 이용한 자동 구간 분석
- 🎨 **색깔 레이어**: 구간별 성질을 직관적인 색깔로 표시
- 📱 **가상 스마트폰 화면**: 우측 하단 스마트폰 프레임에서 미리보기
- 🔗 **LMS 연동 준비**: Moodle 등 LMS와 연동 가능한 구조
- 🌐 **한/영 지원**: 한국어와 영어 동시 지원

## 기술 스택

### Backend
- **Python 3.11+** - FastAPI
- **SymPy** - 수식 미분 및 분석
- **NumPy/SciPy** - 수치 계산
- **PostgreSQL 15+** - 데이터베이스
- **Redis 7+** - 캐싱

### Frontend
- **React 18** - TypeScript
- **Vite** - 빌드 도구
- **Material-UI (MUI)** - UI 컴포넌트
- **Recharts** - 그래프 시각화
- **Axios** - HTTP 클라이언트

### DevOps
- **Docker & Docker Compose** - 컨테이너화
- **PostgreSQL** - 관계형 데이터베이스

## 시작하기

### 사전 요구사항

- Docker & Docker Compose
- Node.js 18+ (로컬 개발 시)
- Python 3.11+ (로컬 개발 시)

### Docker를 이용한 실행 (권장)

```bash
# 1. 프로젝트 클론
git clone <repository-url>
cd alt42standalone_v1.0

# 2. Docker Compose로 모든 서비스 실행
docker-compose up -d

# 3. 브라우저에서 접속
# Frontend: http://localhost:3000
# Backend API: http://localhost:8000
# API 문서: http://localhost:8000/docs
```

### 로컬 개발 환경 설정

#### Backend 실행

```bash
cd backend

# 가상 환경 생성 및 활성화
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 의존성 설치
pip install -r requirements.txt

# 서버 실행
python -m uvicorn src.main:app --reload --host 0.0.0.0 --port 8000
```

#### Frontend 실행

```bash
cd frontend

# 의존성 설치
npm install

# 개발 서버 실행
npm run dev
```

#### Database 설정

```bash
# PostgreSQL 접속
psql -U eduuser -d education_system

# 스키마 생성
\i database/schemas/function_visualizations.sql
```

## 사용 방법

### 1. 기본 사용

1. **함수 입력**: 수식을 입력합니다 (예: `x**2 - 4*x + 3`)
2. **구간 설정**: x의 최소값과 최대값을 설정합니다
3. **성질 선택**: 분석할 성질을 선택합니다 (증가/감소, 오목/볼록 등)
4. **분석하기 클릭**: 결과가 그래프와 구간 정보로 표시됩니다

### 2. 지원하는 함수 표기법

```python
# 다항식
x**2 + 2*x + 1
x**3 - 3*x**2 + 2

# 삼각함수
sin(x)
cos(2*x)
tan(x)

# 지수·로그함수
exp(x)
log(x)

# 복합 함수
x**2 * sin(x)
exp(-x**2)
```

### 3. 분석 가능한 성질

| 성질 | 설명 | 판단 기준 |
|------|------|-----------|
| **증가** (Increasing) | 함수 값이 증가하는 구간 | f'(x) > 0 |
| **감소** (Decreasing) | 함수 값이 감소하는 구간 | f'(x) < 0 |
| **아래로 볼록** (Concave Up) | 그래프가 아래로 볼록한 구간 | f''(x) > 0 |
| **위로 볼록** (Concave Down) | 그래프가 위로 볼록한 구간 | f''(x) < 0 |
| **양수** (Positive) | 함수 값이 양수인 구간 | f(x) > 0 |
| **음수** (Negative) | 함수 값이 음수인 구간 | f(x) < 0 |

### 4. 가상 스마트폰 화면

- 우측 하단에 스마트폰 프레임이 표시됩니다
- **최소화 버튼**: 스마트폰을 아이콘으로 축소
- **닫기 버튼**: 스마트폰 화면 숨기기
- LMS에서 문제를 받아 스마트폰 화면에 표시하는 용도로 설계됨

## API 문서

### 주요 엔드포인트

#### `POST /api/analyze-function`

함수를 분석하여 구간 정보를 반환합니다.

**요청 예시:**
```json
{
  "expression": "x**2 - 4*x + 3",
  "x_min": -2,
  "x_max": 6,
  "properties": ["increasing", "decreasing", "concave_up"]
}
```

**응답 예시:**
```json
{
  "expression": "x**2 - 4*x + 3",
  "intervals": [
    {
      "start": -2.0,
      "end": 2.0,
      "property": "decreasing",
      "color": "#F44336",
      "description": "감소 구간 (Decreasing)"
    },
    {
      "start": 2.0,
      "end": 6.0,
      "property": "increasing",
      "color": "#4CAF50",
      "description": "증가 구간 (Increasing)"
    }
  ],
  "plot_points": [...],
  "derivative": "2*x - 4",
  "second_derivative": "2"
}
```

전체 API 문서: `http://localhost:8000/docs`

## 프로젝트 구조

```
alt42standalone_v1.0/
├── backend/                 # Python FastAPI 백엔드
│   ├── src/
│   │   ├── main.py         # FastAPI 앱 진입점
│   │   ├── api/            # API 엔드포인트
│   │   ├── services/       # 비즈니스 로직
│   │   │   └── function_analyzer.py  # 함수 분석 서비스
│   │   └── models/         # 데이터 모델
│   ├── requirements.txt    # Python 의존성
│   └── Dockerfile
├── frontend/               # React 프론트엔드
│   ├── src/
│   │   ├── components/
│   │   │   ├── ColorPartition/      # Color Partition 컴포넌트
│   │   │   │   ├── ColorPartition.tsx
│   │   │   │   ├── ColorPartitionGraph.tsx
│   │   │   │   └── IntervalLegend.tsx
│   │   │   └── VirtualPhone/        # 가상 스마트폰 화면
│   │   │       └── VirtualPhone.tsx
│   │   ├── services/       # API 클라이언트
│   │   ├── types/          # TypeScript 타입
│   │   └── App.tsx         # 메인 앱
│   ├── package.json
│   └── Dockerfile
├── database/               # 데이터베이스
│   ├── schemas/
│   │   └── function_visualizations.sql  # DB 스키마
│   └── migrations/
├── docker-compose.yml      # Docker Compose 설정
├── tasks/                  # 프로젝트 문서
│   └── 0001-prd-ai-education-pipeline.md
└── README.md
```

## LMS 연동 (Moodle)

### 데이터베이스 스키마

`lms_integrations` 테이블을 통해 Moodle 연동을 준비했습니다:

```sql
CREATE TABLE lms_integrations (
    id UUID PRIMARY KEY,
    lms_type VARCHAR(50) DEFAULT 'moodle',
    lms_course_id VARCHAR(255),
    lms_activity_id VARCHAR(255),
    module_id UUID REFERENCES modules(id),
    configuration JSONB,
    ...
);
```

### 향후 Moodle 연동 계획

1. **LTI (Learning Tools Interoperability)** 표준 구현
2. Moodle 활동(Activity)으로 Color Partition 임베드
3. 학생 진도 및 성적 Moodle에 자동 동기화
4. Moodle 문제 은행에서 함수 문제 가져오기

## 데이터베이스 스키마

주요 테이블:

- `modules`: 교육 모듈
- `function_visualizations`: 함수 시각화 데이터
- `visualization_intervals`: 구간 정보
- `students`: 학생 정보
- `student_progress`: 학생 진도
- `teachers`: 교사 정보
- `lms_integrations`: LMS 연동 정보

자세한 스키마: `database/schemas/function_visualizations.sql`

## 개발 가이드

### 새로운 함수 성질 추가

1. `backend/src/services/function_analyzer.py`에 분석 메서드 추가
2. `frontend/src/types/index.ts`에 타입 추가
3. `ColorPartition.tsx`에 체크박스 옵션 추가

### 색상 테마 변경

`backend/src/services/function_analyzer.py`의 `COLOR_SCHEME` 수정:

```python
COLOR_SCHEME = {
    "increasing": "#4CAF50",    # 녹색
    "decreasing": "#F44336",    # 빨강
    # ...
}
```

## 테스트

### Backend 테스트

```bash
cd backend
pytest tests/
```

### Frontend 테스트

```bash
cd frontend
npm test
```

## 트러블슈팅

### 포트 충돌

기본 포트:
- Frontend: 3000
- Backend: 8000
- PostgreSQL: 5432
- Redis: 6379

포트 변경: `docker-compose.yml` 수정

### CORS 오류

`backend/src/main.py`의 CORS 설정 확인:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    ...
)
```

## 라이선스

이 프로젝트는 KAIST Touch Math Academy를 위한 교육용 시스템입니다.

## 기여

기여를 환영합니다! Pull Request를 보내주세요.

## 문의

- 기술 문의: [Development Team]
- 교육 문의: [KAIST Touch Math Academy]

---

**Made with ❤️ for Education**
