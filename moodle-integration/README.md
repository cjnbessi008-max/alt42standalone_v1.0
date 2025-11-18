# Moodle LMS 학습 분석 시스템

## 개요
Moodle 3.7 LMS와 연동하여 학생들의 추론(reasoning)과 계산(calculation) 능력을 분석하는 AI 기반 시스템

## 시스템 구성

### 기술 스택
- **LMS**: Moodle 3.7
- **Database**: MySQL 5.7
- **Backend**: Python 3.11+ (FastAPI)
- **AI Engine**: Anthropic Claude API
- **Frontend**: React 18+ TypeScript
- **Cache**: Redis 7+

### 주요 기능

#### 1. Moodle 데이터 통합
- Moodle MySQL 데이터베이스 직접 연동
- Moodle REST API 활용 (보조)
- 실시간 학생 활동 데이터 수집

#### 2. 문제 유형 분류
문제를 두 가지 카테고리로 자동 분류:
- **추론(Reasoning)**: 논리적 사고, 패턴 인식, 문제 해결 전략
- **계산(Calculation)**: 수치 계산, 공식 적용, 알고리즘 실행

#### 3. 성과 분석
- 학생별 추론/계산 능력 점수 산출
- 강점/약점 영역 식별
- 학습 패턴 분석
- 개인화된 학습 추천

#### 4. 시각화 대시보드
- 개인별 능력 프로필
- 클래스 전체 통계
- 시계열 성과 추이
- 비교 분석 차트

## 디렉토리 구조

```
moodle-integration/
├── backend/
│   ├── connectors/           # Moodle 연동 모듈
│   │   ├── moodle_db.py     # MySQL 직접 연결
│   │   └── moodle_api.py    # REST API 클라이언트
│   ├── classifiers/          # AI 기반 분류기
│   │   └── question_classifier.py
│   ├── analyzers/            # 성과 분석 엔진
│   │   └── performance_analyzer.py
│   ├── models/               # 데이터 모델
│   │   └── schemas.py
│   ├── api/                  # FastAPI 엔드포인트
│   │   └── routes.py
│   └── main.py
├── frontend/
│   ├── src/
│   │   ├── components/       # React 컴포넌트
│   │   ├── services/         # API 클라이언트
│   │   └── pages/            # 페이지
│   └── package.json
├── config/
│   ├── moodle.config.json   # Moodle 연결 설정
│   └── analysis.config.json # 분석 파라미터
├── docker-compose.yml
├── requirements.txt
└── README.md
```

## 분석 방법론

### 문제 유형 분류 기준

#### 추론(Reasoning) 문제 특징:
- "왜", "어떻게" 설명 요구
- 패턴 파악 및 일반화
- 다단계 논리 전개
- 개념적 이해 평가
- 예: "왜 이 공식이 성립하는가?", "패턴을 찾아 다음 항을 예측하시오"

#### 계산(Calculation) 문제 특징:
- 명확한 수치 답
- 공식/알고리즘 적용
- 단계적 계산 수행
- 정확성 중심
- 예: "3x + 5 = 20, x를 구하시오", "삼각형의 넓이를 계산하시오"

### 성과 지표

```python
# 학생별 능력 점수 계산
reasoning_score = (추론 문제 정답수 / 추론 문제 총수) * 100
calculation_score = (계산 문제 정답수 / 계산 문제 총수) * 100

# 강점 영역 판정
strength = "reasoning" if reasoning_score > calculation_score + 10 else \
           "calculation" if calculation_score > reasoning_score + 10 else \
           "balanced"

# 세부 분석
response_time_analysis = 문제당 평균 응답 시간
attempt_pattern = 시도 횟수 및 오답 패턴
difficulty_sensitivity = 난이도별 정답률 변화
```

## 설치 및 실행

### 사전 요구사항
- Python 3.11+
- Node.js 18+
- Redis 7+
- Moodle 3.7 접근 권한
- Anthropic API 키

### 백엔드 설정
```bash
cd backend
pip install -r requirements.txt
cp config/moodle.config.example.json config/moodle.config.json
# moodle.config.json 편집 (DB 연결 정보)
python main.py
```

### 프론트엔드 설정
```bash
cd frontend
npm install
npm run dev
```

### Docker 실행
```bash
docker-compose up -d
```

## API 엔드포인트

### 데이터 수집
- `POST /api/moodle/sync` - Moodle 데이터 동기화
- `GET /api/moodle/courses` - 코스 목록 조회
- `GET /api/moodle/students/{course_id}` - 학생 목록

### 분석
- `POST /api/analyze/classify-questions` - 문제 유형 자동 분류
- `GET /api/analyze/student/{student_id}` - 학생 성과 분석
- `GET /api/analyze/course/{course_id}` - 코스 전체 분석

### 리포트
- `GET /api/reports/individual/{student_id}` - 개인 리포트
- `GET /api/reports/class/{course_id}` - 클래스 리포트
- `GET /api/reports/comparison` - 비교 분석

## 보안 고려사항
- Moodle DB 읽기 전용 계정 사용
- API 키 환경변수 관리
- HTTPS 통신 필수
- 학생 개인정보 암호화
- GDPR/개인정보보호법 준수

## 라이선스
MIT
