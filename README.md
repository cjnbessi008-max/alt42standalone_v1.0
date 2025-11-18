# 메타인지 성장 포인트 자동 추출 시스템

## 개요
학생의 학습 활동을 자동으로 추적하고, AI를 활용하여 메타인지 성장 포인트를 추출하는 독립형 웹 애플리케이션입니다.

## 주요 기능

### 1. 학습 활동 자동 추적
- 문제 풀이 시간 및 패턴 기록
- 정답/오답 분석
- 힌트 사용 및 재시도 횟수 추적
- 자기 평가 데이터 수집

### 2. 메타인지 분석
- **문제 해결 효율성**: 시간 단축 및 정확도 향상 추적
- **자기 조절 능력**: 힌트 의존도 감소 패턴 분석
- **실수에서의 학습**: 오답 후 개선 추이 측정
- **학습 전략 발전**: 학습 패턴 변화 감지
- **자기 인식 정확도**: 자기평가와 실제 성과 비교

### 3. 일일 성장 포인트 추출
- Claude AI 기반 개인화된 인사이트 생성
- 구체적인 성장 영역 및 개선 사항 제시
- 학습 조언 및 격려 메시지 제공

### 4. 시각화 대시보드
- **학생용**: 자신의 성장 추이 및 오늘의 성장 포인트
- **교사용**: 전체 학생 분석 및 개별 학생 상세 리포트

## 기술 스택

### Backend
- Python 3.11+
- FastAPI
- SQLAlchemy (ORM)
- PostgreSQL
- Anthropic Claude API

### Frontend
- React 18+
- TypeScript
- Vite
- Tailwind CSS
- Recharts (데이터 시각화)

## 프로젝트 구조

```
/
├── backend/
│   ├── app/
│   │   ├── main.py                 # FastAPI 애플리케이션 진입점
│   │   ├── config.py               # 설정 및 환경 변수
│   │   ├── database.py             # 데이터베이스 연결
│   │   ├── models/                 # SQLAlchemy 모델
│   │   │   ├── student.py
│   │   │   ├── learning_activity.py
│   │   │   └── growth_insight.py
│   │   ├── schemas/                # Pydantic 스키마
│   │   │   ├── student.py
│   │   │   ├── activity.py
│   │   │   └── insight.py
│   │   ├── routers/                # API 라우터
│   │   │   ├── students.py
│   │   │   ├── activities.py
│   │   │   └── insights.py
│   │   └── services/               # 비즈니스 로직
│   │       ├── metacognition_analyzer.py
│   │       └── claude_service.py
│   ├── requirements.txt
│   ├── Dockerfile
│   └── alembic/                    # DB 마이그레이션
├── frontend/
│   ├── src/
│   │   ├── components/             # 재사용 가능한 컴포넌트
│   │   │   ├── Dashboard.tsx
│   │   │   ├── GrowthPointCard.tsx
│   │   │   └── ActivityChart.tsx
│   │   ├── pages/                  # 페이지 컴포넌트
│   │   │   ├── StudentDashboard.tsx
│   │   │   └── TeacherDashboard.tsx
│   │   ├── services/               # API 클라이언트
│   │   │   └── api.ts
│   │   ├── types/                  # TypeScript 타입 정의
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   ├── vite.config.ts
│   └── tailwind.config.js
├── docker-compose.yml
└── README.md
```

## 메타인지 성장 포인트 예시

### 자기 조절 능력
> "오늘 어려운 문제를 만났을 때, 이전보다 40% 적게 힌트를 요청했습니다. 스스로 문제를 해결하려는 시도가 증가했어요!"

### 학습 효율성
> "같은 유형의 문제를 푸는 시간이 지난주 대비 25% 단축되었습니다. 문제 패턴을 빠르게 파악하는 능력이 향상되었어요!"

### 실수에서의 학습
> "오늘 틀렸던 문제를 다시 시도했을 때 90% 정확도로 해결했습니다. 자신의 실수를 분석하고 개선하는 능력이 탁월해요!"

### 자기 인식
> "자기 평가 점수와 실제 성과가 85% 일치합니다. 자신의 학습 상태를 정확하게 파악하고 있어요!"

## 설치 및 실행

### 사전 요구사항
- Docker & Docker Compose
- Node.js 18+
- Python 3.11+

### 환경 변수 설정
```bash
# .env 파일 생성
ANTHROPIC_API_KEY=your_claude_api_key
DATABASE_URL=postgresql://user:password@localhost:5432/metacognition
```

### Docker로 실행
```bash
docker-compose up -d
```

### 로컬 개발

#### Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

#### Frontend
```bash
cd frontend
npm install
npm run dev
```

## API 엔드포인트

### 학습 활동
- `POST /api/activities` - 학습 활동 기록
- `GET /api/activities/{student_id}` - 학생별 활동 조회

### 성장 포인트
- `GET /api/insights/daily/{student_id}` - 오늘의 성장 포인트
- `GET /api/insights/weekly/{student_id}` - 주간 성장 리포트

### 학생 관리
- `POST /api/students` - 학생 등록
- `GET /api/students/{id}` - 학생 정보 조회

## 라이센스
MIT License
