# 워밍업 문제 추천 시스템

LMS와 연동하여 동일 유형의 쉬운 워밍업 문제를 즉시 추천하는 웹 애플리케이션입니다.

## 🎯 주요 기능

- **즉시 추천**: 현재 문제와 동일 유형의 쉬운 워밍업 문제 1개를 즉시 추천
- **LMS 연동**: Moodle, Canvas 등 주요 LMS 플랫폼과 연동
- **자동 채점**: 학생의 답안을 자동으로 채점하고 해설 제공
- **진도 동기화**: 풀이 결과를 LMS에 자동으로 동기화
- **맞춤 추천**: 학생의 이력과 난이도를 고려한 지능형 추천

## 📁 프로젝트 구조

```
alt42standalone_v1.0/
├── backend/                    # FastAPI 백엔드 서버
│   ├── src/
│   │   ├── models/            # 데이터 모델
│   │   │   └── problem.py     # 문제 데이터 모델
│   │   ├── services/          # 비즈니스 로직
│   │   │   ├── warmup_recommender.py  # 추천 엔진
│   │   │   ├── problem_repository.py  # 문제 저장소
│   │   │   └── lms_integration.py     # LMS 연동
│   │   ├── routes/            # API 라우터
│   │   │   └── warmup.py      # 워밍업 API 엔드포인트
│   │   └── main.py            # FastAPI 앱
│   ├── requirements.txt       # Python 의존성
│   └── .env.example          # 환경 변수 예시
│
├── frontend/                  # React 프론트엔드
│   ├── src/
│   │   ├── components/       # React 컴포넌트
│   │   │   ├── WarmupProblemRecommender.tsx
│   │   │   └── WarmupProblemRecommender.css
│   │   ├── services/         # API 클라이언트
│   │   │   └── api.ts
│   │   ├── types/            # TypeScript 타입
│   │   │   └── problem.ts
│   │   ├── App.tsx           # 메인 앱
│   │   └── index.tsx         # 진입점
│   ├── public/
│   │   └── index.html
│   ├── package.json          # npm 의존성
│   ├── tsconfig.json         # TypeScript 설정
│   └── .env.example         # 환경 변수 예시
│
└── tasks/                    # 프로젝트 문서
    └── 0001-prd-ai-education-pipeline.md
```

## 🚀 빠른 시작

### 사전 요구사항

- Python 3.11+
- Node.js 18+
- npm 또는 yarn

### 백엔드 설정 및 실행

```bash
# 백엔드 디렉토리로 이동
cd backend

# Python 가상환경 생성 (선택사항)
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 의존성 설치
pip install -r requirements.txt

# 환경 변수 설정
cp .env.example .env
# .env 파일을 편집하여 LMS 설정 입력

# 서버 실행
python -m src.main

# 또는 uvicorn으로 실행
uvicorn src.main:app --reload --host 0.0.0.0 --port 8000
```

백엔드 서버가 `http://localhost:8000`에서 실행됩니다.

- API 문서: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

### 프론트엔드 설정 및 실행

```bash
# 프론트엔드 디렉토리로 이동
cd frontend

# 의존성 설치
npm install

# 환경 변수 설정
cp .env.example .env
# .env 파일을 편집하여 API 서버 주소 설정

# 개발 서버 실행
npm start
```

프론트엔드 앱이 `http://localhost:3000`에서 실행됩니다.

## 📚 API 엔드포인트

### 1. 워밍업 문제 추천

**POST** `/api/warmup/recommend`

동일 유형의 쉬운 워밍업 문제를 즉시 추천합니다.

**요청 본문:**
```json
{
  "student_id": "student_123",
  "current_problem_id": "prob_001",
  "problem_type": "calculation",
  "subject": "math",
  "grade_level": 3
}
```

**응답:**
```json
{
  "recommended_problem": {
    "id": "prob_002",
    "title": "분수의 기초",
    "content": "1/3 + 1/3 = ?",
    "problem_type": "calculation",
    "subject": "math",
    "difficulty": "easy",
    "grade_level": 3,
    "tags": ["분수", "덧셈", "워밍업"],
    "estimated_time_minutes": 2,
    "correct_answer": "2/3",
    "explanation": "같은 분모를 가진 분수는 분자만 더합니다."
  },
  "reason": "동일 유형(분수 덧셈)의 더 쉬운 문제로 워밍업에 적합합니다.",
  "confidence_score": 0.92
}
```

### 2. 답안 제출

**POST** `/api/warmup/submit`

문제 풀이 결과를 제출하고 채점합니다.

**쿼리 파라미터:**
- `student_id`: 학생 ID
- `problem_id`: 문제 ID
- `answer`: 학생의 답안
- `time_spent_seconds`: 소요 시간(초)

**응답:**
```json
{
  "attempt_id": "attempt_1",
  "is_correct": true,
  "correct_answer": "2/3",
  "explanation": "같은 분모를 가진 분수는 분자만 더합니다.",
  "lms_synced": true,
  "message": "정답입니다! 🎉"
}
```

### 3. 학생 이력 조회

**GET** `/api/warmup/student/{student_id}/history`

학생의 워밍업 문제 풀이 이력을 조회합니다.

### 4. 문제 목록

**GET** `/api/warmup/problems`

워밍업 문제 목록을 조회합니다.

**쿼리 파라미터:**
- `difficulty`: 난이도 필터 (선택)
- `subject`: 과목 필터 (선택)

### 5. 문제 상세

**GET** `/api/warmup/problems/{problem_id}`

특정 문제의 상세 정보를 조회합니다.

## 🔌 LMS 연동

### 지원하는 LMS

- **Moodle**: Moodle Web Services API 사용
- **Canvas**: Canvas LMS REST API 사용

### Moodle 연동 설정

1. Moodle 관리자 페이지에서 Web Services 활성화
2. API 토큰 생성
3. `.env` 파일에 설정 추가:

```bash
LMS_TYPE=moodle
LMS_BASE_URL=https://your-moodle-site.com
LMS_API_TOKEN=your_api_token_here
```

### Canvas 연동 설정

1. Canvas 계정 설정에서 Access Token 생성
2. `.env` 파일에 설정 추가:

```bash
LMS_TYPE=canvas
LMS_BASE_URL=https://your-canvas-site.com
LMS_API_TOKEN=your_access_token_here
```

## 🧠 추천 알고리즘

워밍업 문제 추천 엔진은 다음과 같은 전략을 사용합니다:

1. **동일 유형 선택**: 현재 문제와 같은 유형(problem_type), 과목(subject), 학년(grade_level)의 문제 검색
2. **난이도 조정**: `very_easy` 또는 `easy` 난이도만 선택
3. **시간 제약**: 예상 소요 시간 5분 이하
4. **이력 고려**: 학생이 이미 맞힌 문제는 제외
5. **최적 선택**: 가장 쉬운 난이도 중 시간이 짧은 문제 우선
6. **다양성 확보**: 상위 후보 중 무작위 선택

### 신뢰도 점수 계산

추천 신뢰도는 다음 요소를 고려하여 0-1 사이의 점수로 계산됩니다:

- **문제 유형 일치도**: 30%
- **난이도 적합성**: 15%
- **학생 이력 매칭**: 학생의 유사 문제 성공률 고려

## 📊 데이터 모델

### Problem (문제)

```python
{
  "id": str,                        # 문제 고유 ID
  "title": str,                     # 문제 제목
  "content": str,                   # 문제 내용
  "problem_type": ProblemType,      # 문제 유형
  "subject": Subject,               # 과목
  "difficulty": DifficultyLevel,    # 난이도
  "grade_level": int,               # 학년 (1-12)
  "tags": List[str],                # 태그
  "estimated_time_minutes": int,    # 예상 소요 시간
  "correct_answer": str,            # 정답
  "explanation": str                # 해설
}
```

### 샘플 데이터

백엔드는 10개의 샘플 워밍업 문제를 포함하고 있습니다:

- 분수 덧셈 (3문제)
- 곱셈 구구단 (2문제)
- 나눗셈 (2문제)
- 객관식 (2문제)
- 참/거짓 (1문제)

## 🎨 프론트엔드 특징

### React + TypeScript

- 타입 안전성을 위한 TypeScript 사용
- 함수형 컴포넌트와 Hooks 패턴

### UI/UX 특징

- 직관적이고 깔끔한 디자인
- 실시간 피드백 (정답/오답 표시)
- 로딩 스피너 및 에러 처리
- 반응형 디자인 (모바일 지원)
- 애니메이션 효과

### 주요 컴포넌트

- **WarmupProblemRecommender**: 메인 워밍업 문제 추천 컴포넌트
  - 문제 추천 요청
  - 문제 표시
  - 답안 입력 및 제출
  - 결과 피드백
  - 다음 문제 요청

## 🧪 테스트

### 백엔드 테스트

```bash
# 백엔드 디렉토리에서
pytest tests/

# 커버리지 포함
pytest --cov=src tests/
```

### 프론트엔드 테스트

```bash
# 프론트엔드 디렉토리에서
npm test
```

### API 테스트

1. 백엔드 서버 실행
2. http://localhost:8000/docs 접속
3. Swagger UI에서 직접 API 테스트

## 🔒 보안 고려사항

- **API 인증**: JWT 토큰 기반 인증 구현 예정
- **CORS**: 허용된 도메인만 접근 가능
- **입력 검증**: Pydantic을 통한 데이터 검증
- **민감 정보**: 환경 변수로 관리 (.env 파일)

## 📈 향후 계획

- [ ] PostgreSQL 데이터베이스 연동
- [ ] JWT 인증 시스템 구현
- [ ] 관리자 대시보드 추가
- [ ] 문제 생성/편집 기능
- [ ] AI 기반 난이도 자동 조정
- [ ] 학습 분석 리포트
- [ ] 더 많은 LMS 플랫폼 지원 (Blackboard, Sakai 등)
- [ ] 문제 유형 확장
- [ ] 다국어 지원

## 🤝 기여

기여는 언제나 환영합니다! 다음 단계를 따라주세요:

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 라이선스

이 프로젝트는 KAIST Touch Math Academy의 AI Education System Pipeline의 일부입니다.

## 📞 문의

질문이나 제안사항이 있으시면 이슈를 생성해주세요.

---

**Made with ❤️ for KAIST Touch Math Academy**
