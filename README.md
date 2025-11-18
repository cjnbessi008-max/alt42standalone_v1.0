# 문제 해결 전략 시각화 웹앱

AI 기반 문제 해결 전략을 말풍선 형태로 시각화하는 독립형 웹 애플리케이션입니다.

## 🌟 주요 기능

- **AI 기반 전략 생성**: Anthropic Claude를 활용하여 문제를 분석하고 단계별 해결 전략 생성
- **말풍선 시각화**: 각 전략 단계를 직관적인 말풍선 형태로 표시
- **인터랙티브 UI**: 각 단계를 클릭하여 상세 내용 확인
- **계층 구조**: 주요 단계와 하위 단계를 트리 형태로 구조화
- **애니메이션**: 부드러운 전환 효과로 사용자 경험 향상

## 🛠 기술 스택

### 프론트엔드
- **React 18** + TypeScript
- **Vite** - 빠른 개발 환경
- **Tailwind CSS** - 유틸리티 기반 스타일링
- **Framer Motion** - 애니메이션
- **Axios** - API 통신

### 백엔드
- **FastAPI** - 고성능 Python 웹 프레임워크
- **Anthropic Claude API** - AI 전략 생성
- **Pydantic** - 데이터 검증

### 인프라
- **Docker** + Docker Compose

## 📋 사전 요구사항

- Docker & Docker Compose
- Anthropic API 키 ([여기서 발급](https://console.anthropic.com/))

또는 로컬 실행:
- Python 3.11+
- Node.js 20+
- npm

## 🚀 빠른 시작

### 1. 환경 설정

```bash
# 프로젝트 클론
cd alt42standalone_v1.0

# 환경 변수 설정
cp .env.example .env

# .env 파일을 열어 API 키 설정
# ANTHROPIC_API_KEY=your_actual_api_key
```

### 2. Docker로 실행 (권장)

```bash
# 컨테이너 빌드 및 실행
docker-compose up --build

# 백그라운드 실행
docker-compose up -d
```

접속:
- 프론트엔드: http://localhost:5173
- 백엔드 API: http://localhost:8000
- API 문서: http://localhost:8000/docs

### 3. 로컬에서 실행

#### 백엔드 실행

```bash
cd backend

# 가상환경 생성
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 의존성 설치
pip install -r requirements.txt

# 환경 변수 설정
cp .env.example .env
# .env 파일에 ANTHROPIC_API_KEY 설정

# 서버 실행
uvicorn main:app --reload --port 8000
```

#### 프론트엔드 실행

```bash
cd frontend

# 의존성 설치
npm install

# 개발 서버 실행
npm run dev
```

## 📖 사용 방법

1. **문제 입력**
   - 과목 선택 (수학, 물리, 화학 등)
   - 해결하고 싶은 문제 입력
   - "해결 전략 생성하기" 버튼 클릭

2. **전략 확인**
   - 생성된 전략이 말풍선 형태로 표시됨
   - 각 말풍선 클릭으로 상세 내용 확인
   - 화살표 아이콘으로 하위 단계 펼치기/접기

3. **데모 기능**
   - API 키 없이도 "데모 보기" 버튼으로 예제 확인 가능

## 📁 프로젝트 구조

```
alt42standalone_v1.0/
├── backend/                    # FastAPI 백엔드
│   ├── main.py                # 메인 API 엔드포인트
│   ├── models.py              # Pydantic 모델
│   ├── services/
│   │   └── strategy_generator.py  # AI 전략 생성 로직
│   ├── requirements.txt       # Python 의존성
│   └── Dockerfile
│
├── frontend/                   # React 프론트엔드
│   ├── src/
│   │   ├── components/        # React 컴포넌트
│   │   │   ├── StrategyBubble.tsx    # 말풍선 컴포넌트
│   │   │   ├── StrategyTree.tsx      # 트리 구조
│   │   │   └── ProblemInput.tsx      # 입력 폼
│   │   ├── services/
│   │   │   └── api.ts         # API 클라이언트
│   │   ├── types.ts           # TypeScript 타입
│   │   ├── App.tsx            # 메인 앱
│   │   └── main.tsx
│   ├── package.json
│   └── Dockerfile
│
├── docker-compose.yml          # Docker Compose 설정
├── .env.example               # 환경 변수 예제
└── README.md
```

## 🎨 전략 단계 타입

전략은 4가지 타입의 단계로 구성됩니다:

- 🔵 **분석 (Analysis)**: 문제 분석 단계
- 🟢 **전략 (Strategy)**: 해결 전략 수립
- 🟡 **단계 (Substep)**: 구체적 실행 단계
- 🟣 **해답 (Solution)**: 최종 답 도출

## 🔧 API 엔드포인트

### POST `/api/strategy`
문제에 대한 해결 전략 생성

**요청:**
```json
{
  "problem": "1/2 + 1/3을 계산하세요.",
  "subject": "math",
  "difficulty": "medium"
}
```

**응답:**
```json
{
  "problem": "1/2 + 1/3을 계산하세요.",
  "steps": [...],
  "total_steps": 8
}
```

### POST `/api/strategy/demo`
데모 전략 반환 (API 키 불필요)

### GET `/health`
서버 상태 확인

## 🎯 향후 개발 계획

- [ ] LMS 연동 (LTI 표준)
- [ ] 사용자 인증 및 세션 관리
- [ ] 전략 히스토리 저장 및 조회
- [ ] 다양한 시각화 모드 (플로우차트, 마인드맵)
- [ ] 전략 공유 기능
- [ ] 다국어 지원
- [ ] 모바일 최적화

## 🤝 기여

이슈와 PR을 환영합니다!

## 📝 라이선스

MIT License

## 💡 문제 해결

### API 키 관련 오류
- `.env` 파일에 올바른 `ANTHROPIC_API_KEY`가 설정되어 있는지 확인
- API 키는 `sk-ant-`로 시작해야 함
- 데모 기능을 사용하여 API 키 없이 테스트 가능

### CORS 오류
- `backend/.env`의 `CORS_ORIGINS`에 프론트엔드 URL이 포함되어 있는지 확인

### 포트 충돌
- 8000번 또는 5173번 포트가 이미 사용 중인 경우 `docker-compose.yml`에서 포트 변경

## 📧 문의

문제가 있거나 제안사항이 있으시면 이슈를 생성해주세요.
