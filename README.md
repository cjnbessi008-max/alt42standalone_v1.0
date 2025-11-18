# LMS Practice Integration System

독립형 웹 애플리케이션으로, Moodle LMS와 연동하여 학생들이 문제를 다양한 방식으로 풀도록 유도하는 AI 기반 학습 시스템입니다.

## 🎯 핵심 기능

### 1. AI 기반 대안 풀이 생성
- Claude AI를 활용하여 동일한 문제에 대한 다양한 해결 전략 자동 생성
- 대수적, 그래프적, 수치적, 시각적 등 다양한 접근 방식 제공
- 학생의 수준과 약점에 맞춘 맞춤형 전략 생성

### 2. 지능형 추천 시스템
- 학생의 학습 패턴 분석
- 취약한 문제 해결 전략 식별
- 개인화된 연습 문제 및 풀이 방법 추천

### 3. Moodle LMS 통합
- Moodle Web Services API를 통한 양방향 동기화
- 문제 및 퀴즈 자동 가져오기
- 성적 및 학습 진도 Moodle로 전송

### 4. 학습 진도 추적
- 전략별 숙련도 추적
- 실시간 학습 분석 및 인사이트
- 상세한 통계 및 대시보드

## 🏗️ 시스템 아키텍처

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (React)                        │
│  - Practice Interface  - Progress Dashboard                 │
│  - Alternative Solutions View  - Analytics                  │
└──────────────────────────┬──────────────────────────────────┘
                           │ REST API
┌──────────────────────────┴──────────────────────────────────┐
│                Backend (Python FastAPI)                      │
│  - Moodle Integration  - AI Solution Generator              │
│  - Recommendation Engine  - Progress Tracker                │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────┴──────────────────────────────────┐
│              PostgreSQL + Redis                             │
│  - Problems  - Strategies  - Attempts  - Progress           │
└─────────────────────────────────────────────────────────────┘
                           │
┌──────────────────────────┴──────────────────────────────────┐
│              Moodle LMS (External)                          │
│  - Web Services API  - Quiz/Questions  - Users              │
└─────────────────────────────────────────────────────────────┘
```

## 📋 요구사항

### 시스템 요구사항
- Docker & Docker Compose
- Python 3.11+
- Node.js 18+
- PostgreSQL 15+
- Redis 7+

### 외부 서비스
- Anthropic API 키 (Claude AI)
- Moodle LMS 3.7+ 인스턴스 (Web Services 활성화 필요)

## 🚀 빠른 시작

### 1. 저장소 클론

```bash
git clone <repository-url>
cd alt42standalone_v1.0
```

### 2. 환경 변수 설정

```bash
cp .env.example .env
```

`.env` 파일을 편집하여 다음 설정:

```env
# Anthropic API 키 (필수)
ANTHROPIC_API_KEY=your_anthropic_api_key_here

# Moodle 설정 (선택)
MOODLE_URL=https://your-moodle-site.com
MOODLE_TOKEN=your_moodle_webservice_token_here

# 데이터베이스 (Docker 사용 시 기본값 유지)
DATABASE_URL=postgresql+asyncpg://postgres:postgres@postgres:5432/lms_practice

# 보안 (프로덕션 환경에서는 반드시 변경)
SECRET_KEY=CHANGE_THIS_TO_A_LONG_RANDOM_STRING
```

### 3. Docker로 실행

```bash
# 모든 서비스 시작
docker-compose up -d

# 로그 확인
docker-compose logs -f

# 서비스 중지
docker-compose down
```

### 4. 접속

- **API 문서**: http://localhost:8000/docs
- **Frontend**: http://localhost:3000
- **Health Check**: http://localhost:8000/health

## 🛠️ 수동 설치 (Docker 없이)

### Backend 설정

```bash
cd backend

# 가상 환경 생성
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 의존성 설치
pip install -r requirements.txt

# 데이터베이스 마이그레이션
alembic upgrade head

# 서버 실행
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend 설정 (향후 구현)

```bash
cd frontend

# 의존성 설치
npm install

# 개발 서버 실행
npm start
```

## 📚 API 사용 예제

### 1. 문제 생성

```bash
curl -X POST "http://localhost:8000/api/v1/problems" \
  -H "Content-Type: application/json" \
  -d '{
    "problem_type": "math",
    "difficulty_level": 3,
    "original_text": "Solve: 2x + 5 = 13",
    "original_solution": "x = 4",
    "topic": "algebra"
  }'
```

### 2. AI로 대안 풀이 생성

```bash
curl -X POST "http://localhost:8000/api/v1/strategies/generate" \
  -H "Content-Type: application/json" \
  -d '{
    "problem_id": "problem-uuid-here",
    "num_strategies": 5,
    "student_mastery": "intermediate",
    "weak_strategies": ["graphical", "visual"]
  }'
```

### 3. 학생 시도 기록

```bash
curl -X POST "http://localhost:8000/api/v1/attempts" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "user-uuid-here",
    "problem_id": "problem-uuid-here",
    "strategy_id": "strategy-uuid-here",
    "student_answer": "x = 4",
    "is_correct": true,
    "time_spent_seconds": 120,
    "confidence_level": 4
  }'
```

### 4. 개인화된 추천 받기

```bash
curl -X POST "http://localhost:8000/api/v1/recommendations/generate" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "user-uuid-here",
    "problem_id": "problem-uuid-here",
    "max_recommendations": 3
  }'
```

### 5. 학습 통계 조회

```bash
curl "http://localhost:8000/api/v1/analytics/user/{user_id}/statistics?days=30"
```

## 🔧 Moodle 연동 설정

### 1. Moodle에서 Web Services 활성화

1. Moodle 관리자로 로그인
2. **사이트 관리 → 플러그인 → 웹 서비스 → 개요** 이동
3. 다음 항목 활성화:
   - "웹 서비스 활성화"
   - "REST 프로토콜 활성화"

### 2. 웹 서비스 토큰 생성

1. **사이트 관리 → 사용자 → 권한 → 토큰** 이동
2. 새 토큰 생성:
   - 사용자 선택
   - 서비스: "Moodle mobile web service" 선택
   - 토큰 복사

### 3. 시스템에 Moodle 설정

```bash
curl -X POST "http://localhost:8000/api/v1/moodle/config" \
  -H "Content-Type: application/json" \
  -d '{
    "moodle_url": "https://your-moodle-site.com",
    "api_token": "your_token_here",
    "sync_enabled": true,
    "sync_grades_back": false
  }'
```

### 4. 데이터 동기화

```bash
# 특정 코스 동기화
curl -X POST "http://localhost:8000/api/v1/moodle/sync" \
  -H "Content-Type: application/json" \
  -d '{
    "course_ids": [101, 102, 103]
  }'

# 연결 테스트
curl "http://localhost:8000/api/v1/moodle/test-connection"

# 코스 목록 조회
curl "http://localhost:8000/api/v1/moodle/courses"
```

## 🎓 사용 시나리오

### 시나리오 1: 학생이 문제 풀기

1. 학생이 문제를 선택
2. 첫 번째 풀이 방법으로 문제 해결 시도
3. 시스템이 학생의 풀이를 기록하고 분석
4. AI가 학생의 약점을 고려하여 대안 풀이 방법 추천
5. 학생이 다른 방식으로 동일한 문제 재시도
6. 학습 진도와 숙련도 자동 업데이트

### 시나리오 2: 교사가 문제 관리

1. Moodle에서 퀴즈 및 문제 생성
2. 시스템이 자동으로 문제 동기화
3. AI가 각 문제에 대한 다양한 풀이 전략 생성
4. 교사가 생성된 전략 검토 및 수정
5. 학생들에게 배포

### 시나리오 3: 학습 분석

1. 교사가 학생별 진도 확인
2. 시스템이 전략별 숙련도 분석 제공
3. 취약한 영역 자동 식별
4. 맞춤형 연습 문제 자동 추천

## 📊 데이터베이스 스키마

주요 테이블:

- **users**: 학생/교사 정보 (Moodle 동기화)
- **problems**: 문제 (Moodle 퀴즈 또는 AI 생성)
- **solution_strategies**: 문제별 대안 풀이 전략
- **student_attempts**: 학생 시도 기록
- **strategy_mastery**: 전략별 숙련도 추적
- **recommendations**: AI 기반 개인화 추천
- **practice_sessions**: 연습 세션 추적
- **moodle_config**: Moodle 연동 설정

상세 스키마는 `docs/lms-practice-integration-design.md` 참조

## 🔐 보안 고려사항

- ✅ 환경 변수로 민감 정보 관리
- ✅ JWT 토큰 기반 인증
- ✅ SQL 인젝션 방지 (파라미터화된 쿼리)
- ✅ XSS 방지 (입력 검증 및 이스케이핑)
- ✅ CORS 설정
- ✅ Rate limiting
- ⚠️ HTTPS 사용 권장 (프로덕션)
- ⚠️ 정기적인 보안 업데이트

## 🧪 테스트

```bash
cd backend

# 전체 테스트 실행
pytest

# 커버리지 포함
pytest --cov=app --cov-report=html

# 특정 테스트만 실행
pytest tests/test_recommendation_engine.py
```

## 📈 성능 최적화

- Redis 캐싱으로 API 응답 속도 향상
- 데이터베이스 인덱싱으로 조회 성능 개선
- 비동기 처리 (AsyncIO + SQLAlchemy)
- Claude API 호출 최적화 (배치 처리)

## 🐛 문제 해결

### PostgreSQL 연결 오류

```bash
# PostgreSQL 서비스 확인
docker-compose ps postgres

# 로그 확인
docker-compose logs postgres

# 데이터베이스 재시작
docker-compose restart postgres
```

### Moodle API 오류

```bash
# 연결 테스트
curl "http://localhost:8000/api/v1/moodle/test-connection"

# Moodle 설정 확인
curl "http://localhost:8000/api/v1/moodle/config"
```

### Claude API 오류

- API 키 확인: `.env` 파일의 `ANTHROPIC_API_KEY`
- API 할당량 확인: Anthropic 콘솔
- 요청 로그 확인: `docker-compose logs backend`

## 📝 개발 로드맵

### Phase 1: MVP (현재)
- ✅ 백엔드 API 구현
- ✅ Moodle 연동
- ✅ AI 풀이 생성
- ✅ 추천 시스템
- ⏳ 프론트엔드 UI

### Phase 2: 고도화
- ⏳ 실시간 협업 기능
- ⏳ 모바일 앱
- ⏳ 고급 분석 대시보드
- ⏳ 게이미피케이션

### Phase 3: 확장
- ⏳ 다중 LMS 지원 (Canvas, Blackboard)
- ⏳ 다국어 지원
- ⏳ 교사 대시보드
- ⏳ 자동 문제 생성

## 🤝 기여

기여를 환영합니다! Pull Request를 보내주세요.

## 📄 라이선스

이 프로젝트는 [MIT License](LICENSE) 하에 배포됩니다.

## 📞 지원

- 문제 리포트: GitHub Issues
- 문의: [이메일 주소]
- 문서: `docs/` 디렉토리

## 🙏 감사의 말

- Anthropic Claude API
- FastAPI 팀
- Moodle 커뮤니티
- 모든 기여자들

---

**Made with ❤️ for better education**
