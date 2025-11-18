# Moodle LMS 상관관계 분석 시스템

독립형 웹 애플리케이션으로 Moodle LMS와 연동하여 학생의 **정답률**과 **사고 강도(추론 밀도)** 간의 상관관계를 분석하는 시스템입니다.

## 주요 기능

### 1. Moodle LMS 연동
- Moodle Web Services API를 통한 데이터 동기화
- 코스, 학생, 퀴즈, 시험 결과 자동 수집
- 실시간 데이터 업데이트

### 2. 추론 밀도(사고 강도) 측정
학생의 문제 풀이 과정을 다음 5가지 요소로 분석:
- **시간 밀도** (30%): 문제당 소요 시간의 정규화 값
- **시도 강도** (25%): 정답까지의 시도 횟수
- **인지 부하** (20%): 힌트 요청, 재시도 패턴
- **복잡도 계수** (15%): 문제 난이도 레벨
- **해결 경로** (10%): 문제 해결 단계 수

### 3. 통계 분석
- **Pearson 상관계수**: 선형 관계 분석
- **Spearman 상관계수**: 단조 관계 분석
- **Kendall 타우**: 순위 기반 분석
- **선형 회귀**: 예측 모델링
- p-value, 신뢰구간, 효과 크기 자동 계산

### 4. 시각화 대시보드
- 산점도와 추세선
- 실시간 통계 요약
- 학생별/코스별 분석 결과
- PDF 보고서 생성

## 기술 스택

### Backend
- **Python 3.11** + **FastAPI**
- **MySQL 5.7**
- **SQLAlchemy 2.0** (ORM)
- **scipy, numpy, pandas** (통계 분석)

### Frontend
- **React 18** + **TypeScript**
- **Material-UI (MUI)**
- **Recharts** (시각화)
- **React Query** (상태 관리)

### Infrastructure
- **Docker** + **Docker Compose**
- **Nginx** (리버스 프록시)
- **Uvicorn** (ASGI 서버)

## 시스템 요구사항

- Docker 20.10+
- Docker Compose 2.0+
- Moodle 3.7+ (Web Services 활성화 필요)

## 설치 및 실행

### 1. 저장소 클론
```bash
git clone <repository-url>
cd alt42standalone_v1.0
```

### 2. 환경 변수 설정
```bash
cp .env.example .env
```

`.env` 파일을 편집하여 다음 정보를 입력:
- `MOODLE_BASE_URL`: Moodle 인스턴스 URL
- `MOODLE_API_TOKEN`: Moodle Web Services 토큰
- `SECRET_KEY`: 애플리케이션 시크릿 키 (최소 32자)
- `JWT_SECRET_KEY`: JWT 토큰 시크릿 키 (최소 32자)

### 3. Docker Compose로 실행
```bash
docker-compose up -d
```

### 4. 접속
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API 문서**: http://localhost:8000/docs

## Moodle 설정

### Web Services 활성화

1. Moodle 관리자 계정으로 로그인
2. **사이트 관리 > 플러그인 > 웹 서비스 > 개요**로 이동
3. 다음 항목 활성화:
   - ✅ 웹 서비스 활성화
   - ✅ REST 프로토콜 활성화

### API 토큰 생성

1. **사이트 관리 > 사용자 > 권한 > 역할 정의**
2. 새로운 역할 생성 또는 기존 역할에 다음 권한 부여:
   - `webservice/rest:use`
   - `moodle/course:view`
   - `moodle/user:viewdetails`
   - `mod/quiz:view`
   - `mod/quiz:reviewmyattempts`

3. **사이트 관리 > 플러그인 > 웹 서비스 > 외부 서비스**
4. 새 서비스 생성하고 필요한 함수 추가:
   - `core_webservice_get_site_info`
   - `core_course_get_courses`
   - `core_enrol_get_enrolled_users`
   - `mod_quiz_get_quizzes_by_courses`
   - `mod_quiz_get_user_attempts`
   - `mod_quiz_get_attempt_review`

5. **사이트 관리 > 플러그인 > 웹 서비스 > 토큰 관리**
6. 사용자를 위한 토큰 생성 및 복사

## 개발 환경 설정

### Backend 개발
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# .env 파일 편집
uvicorn app.main:app --reload
```

### Frontend 개발
```bash
cd frontend
npm install
npm run dev
```

## API 엔드포인트

### Moodle 연동
- `POST /api/v1/moodle/connect` - Moodle 연결 테스트
- `GET /api/v1/moodle/courses` - 코스 목록 조회
- `GET /api/v1/moodle/courses/{course_id}/students` - 학생 목록
- `POST /api/v1/moodle/sync` - 데이터 동기화

### 추론 밀도 분석
- `POST /api/v1/reasoning/calculate/quiz-attempt/{attempt_id}` - 퀴즈 시도 분석
- `GET /api/v1/reasoning/student/{student_id}` - 학생 메트릭 조회
- `GET /api/v1/reasoning/quiz/{quiz_id}` - 퀴즈 메트릭 조회

### 상관관계 분석
- `POST /api/v1/correlation/analyze` - 상관관계 분석 실행
- `GET /api/v1/correlation/results/{analysis_id}` - 분석 결과 조회
- `GET /api/v1/correlation/visualize/{analysis_id}` - 시각화 데이터
- `GET /api/v1/correlation/list` - 분석 목록

## 데이터베이스 스키마

주요 테이블:
- `students` - 학생 정보
- `courses` - 코스 정보
- `quizzes` - 퀴즈/시험 정보
- `quiz_attempts` - 퀴즈 시도 기록
- `question_attempts` - 문제별 시도 기록
- `reasoning_density_scores` - 추론 밀도 점수
- `accuracy_rates` - 정답률 데이터
- `correlation_analyses` - 상관관계 분석 결과
- `correlation_data_points` - 분석 데이터 포인트

## 사용 방법

### 1. Moodle 연동
1. 대시보드에서 "Moodle 연동" 메뉴 클릭
2. "Moodle에 연결" 버튼 클릭
3. 코스 목록 확인 후 동기화

### 2. 추론 밀도 계산
- 퀴즈 시도 데이터가 동기화되면 자동으로 계산
- API를 통해 수동으로 계산 트리거 가능

### 3. 상관관계 분석
1. "상관관계 분석" 메뉴 클릭
2. 분석 이름과 유형 선택
3. "분석 시작" 버튼 클릭
4. 결과 및 시각화 확인

## 문제 해결

### Moodle 연결 실패
- Moodle URL이 올바른지 확인
- API 토큰이 유효한지 확인
- Moodle에서 Web Services가 활성화되어 있는지 확인
- 방화벽 설정 확인

### 데이터베이스 연결 오류
- MySQL 컨테이너가 실행 중인지 확인: `docker-compose ps`
- 환경 변수가 올바르게 설정되었는지 확인
- 로그 확인: `docker-compose logs backend`

### 분석 결과가 없음
- Moodle 데이터가 동기화되었는지 확인
- 최소 3개 이상의 데이터 포인트가 필요
- 추론 밀도 계산이 완료되었는지 확인

## 아키텍처

상세한 아키텍처 문서는 [ARCHITECTURE.md](ARCHITECTURE.md)를 참조하세요.

## 라이선스

[라이선스 정보 추가]

## 기여

[기여 가이드라인 추가]

## 지원

문제가 있거나 기능 요청이 있으시면 GitHub Issues를 통해 문의해주세요.
