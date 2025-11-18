# LMS 오답 예측 시스템

AI 기반 오답 예측 팝업을 제공하는 독립형 웹 애플리케이션입니다. 학생이 틀린 답을 제출하기 전에 AI가 오답 가능성을 예측하고, 잠재적 오류 원인과 힌트를 제공하여 학습을 돕습니다.

## 주요 기능

### 1. **실시간 오답 예측**
- Claude AI를 활용한 학생 답안 분석
- 오답 가능성 및 신뢰도 예측
- 오답 유형 분류 (통분 오류, 계산 실수, 약분 누락 등)

### 2. **지능형 팝업 시스템**
- 오답 가능성이 높을 때만 팝업 표시
- 친근하고 격려하는 톤의 피드백
- 구체적인 답이 아닌 생각의 방향 제시

### 3. **학습 데이터 수집**
- 학생 답안 및 시도 기록
- AI 예측 결과 저장
- 예측 정확도 추적

## 기술 스택

### Backend
- **FastAPI** (Python 3.11+) - 고성능 웹 API 프레임워크
- **SQLAlchemy** - ORM 및 데이터베이스 관리
- **Anthropic Claude API** - AI 기반 오답 예측
- **SQLite** - 로컬 데이터베이스

### Frontend
- **React 18** - 사용자 인터페이스
- **TypeScript** - 타입 안전성
- **Vite** - 빌드 도구
- **Material-UI (MUI)** - UI 컴포넌트 라이브러리
- **Axios** - HTTP 클라이언트

## 설치 및 실행

### 사전 요구사항

- Python 3.11 이상
- Node.js 20 이상
- Anthropic API 키 ([발급받기](https://console.anthropic.com/))

### 1. 환경 설정

```bash
# .env 파일 생성
cp .env.example .env

# .env 파일에 API 키 설정
# ANTHROPIC_API_KEY=your_api_key_here
```

### 2. 개발 서버 실행 (권장)

```bash
# 자동 설치 및 실행 스크립트
./run-dev.sh
```

스크립트가 자동으로:
- 백엔드 의존성 설치 및 서버 시작 (포트 8000)
- 프론트엔드 의존성 설치 및 서버 시작 (포트 5173)

### 3. 수동 실행

#### 백엔드

```bash
cd backend

# 가상환경 생성 및 활성화
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 의존성 설치
pip install -r requirements.txt

# 환경 변수 로드
export ANTHROPIC_API_KEY=your_api_key_here

# 서버 실행
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

#### 프론트엔드

```bash
cd frontend

# 의존성 설치
npm install

# 개발 서버 실행
npm run dev
```

### 4. Docker 실행

```bash
# .env 파일 설정 후
docker-compose up --build
```

## 접속 URL

- **프론트엔드**: http://localhost:5173
- **백엔드 API**: http://localhost:8000
- **API 문서**: http://localhost:8000/docs

## 프로젝트 구조

```
alt42standalone_v1.0/
├── backend/                    # FastAPI 백엔드
│   ├── app/
│   │   ├── main.py            # API 엔드포인트
│   │   ├── models.py          # 데이터베이스 모델
│   │   ├── schemas.py         # Pydantic 스키마
│   │   ├── database.py        # 데이터베이스 설정
│   │   └── services/
│   │       └── ai_service.py  # Claude AI 연동
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/                   # React 프론트엔드
│   ├── src/
│   │   ├── App.tsx            # 메인 앱
│   │   ├── main.tsx           # 엔트리포인트
│   │   ├── components/
│   │   │   ├── ProblemSolver.tsx              # 문제 풀이 UI
│   │   │   └── WrongAnswerPredictionModal.tsx # 오답 예측 팝업
│   │   ├── services/
│   │   │   └── api.ts         # API 클라이언트
│   │   └── types/
│   │       └── index.ts       # TypeScript 타입
│   ├── package.json
│   ├── vite.config.ts
│   └── Dockerfile
├── docker-compose.yml
├── run-dev.sh                  # 개발 서버 실행 스크립트
└── README.md
```

## API 엔드포인트

### 문제 관리
- `GET /api/problems` - 문제 목록 조회
- `GET /api/problems/{id}` - 특정 문제 조회
- `POST /api/problems` - 새 문제 생성

### 답안 제출 및 예측
- `POST /api/predict` - 오답 예측 (제출 전)
- `POST /api/submit` - 최종 답안 제출

### 통계
- `GET /api/stats` - 시스템 통계

## 사용 흐름

1. **학생이 문제를 풀고 답 입력**
   - 분수 문제 (예: 1/2 + 1/3 = ?)
   - 분자/분모 입력

2. **답 제출 버튼 클릭**
   - 백엔드로 답안 전송
   - AI가 오답 가능성 분석

3. **오답 예측 팝업 표시** (조건부)
   - 오답 가능성이 높고 신뢰도 > 60%인 경우
   - 오답 유형 및 설명 표시
   - 힌트 제공

4. **학생 선택**
   - **다시 풀어보기**: 입력 필드 초기화
   - **그래도 제출하기**: 최종 제출

5. **결과 표시**
   - 정답/오답 여부
   - 정답인 경우 정답 표시

## 데이터베이스 스키마

### Problems (문제)
- `id`: 문제 ID
- `problem_type`: 문제 유형
- `question_text`: 문제 텍스트
- `correct_numerator`: 정답 분자
- `correct_denominator`: 정답 분모
- `difficulty`: 난이도

### StudentAttempts (학생 답안)
- `id`: 시도 ID
- `student_id`: 학생 ID
- `problem_id`: 문제 ID
- `answer_numerator`: 답안 분자
- `answer_denominator`: 답안 분모
- `is_correct`: 정답 여부
- `time_spent_seconds`: 소요 시간
- `attempted_at`: 시도 시각

### AnswerPredictions (예측 결과)
- `id`: 예측 ID
- `student_id`: 학생 ID
- `problem_id`: 문제 ID
- `submitted_answer`: 제출 답안
- `predicted_error_type`: 예측된 오류 유형
- `prediction_confidence`: 예측 신뢰도
- `suggestion_text`: 제안 힌트
- `shown_to_student`: 팝업 표시 여부
- `student_proceeded`: 학생이 그대로 제출했는지 여부
- `actual_result`: 실제 결과 (예측 정확도 추적용)

## 향후 개발 계획

- [ ] 다양한 문제 유형 지원 (곱셈, 나눗셈 등)
- [ ] 학생별 오답 패턴 분석
- [ ] 교사용 대시보드
- [ ] 난이도 조절 알고리즘
- [ ] 학습 진행률 추적
- [ ] 다국어 지원

## 개발자 정보

**KAIST Touch Math Academy**
AI Education System Pipeline

## 라이선스

MIT License

## 기여

이슈 및 풀 리퀘스트를 환영합니다!

## 문의

문제가 발생하거나 질문이 있으시면 이슈를 등록해주세요.
