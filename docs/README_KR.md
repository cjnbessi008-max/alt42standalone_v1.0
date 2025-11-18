# AI 사고 루틴 엔진 for Moodle LMS

**지능형 학습 최적화 시스템** - 최상위권 학생의 학습 패턴을 분석하여 개인화된 사고 루틴을 생성합니다.

## 🎯 개요

이 시스템은 **Moodle 3.7 LMS** (MySQL 5.7, PHP 7.1.9)와 연동하여:

1. **추출**: Moodle에서 포괄적인 학습 행동 데이터 추출
2. **분석**: 최상위권 학생의 루틴 분석 및 성공 패턴 식별
3. **모델링**: AI(Claude by Anthropic)를 사용한 최적 사고 루틴 모델링
4. **생성**: 각 학생을 위한 개인화된 추천사항 생성

### 주요 기능

- ✅ **최상위권 분석**: 상위 10% 학생들의 패턴 식별
- ✅ **AI 기반 추천**: Claude AI를 활용한 맞춤형 학습 루틴 생성
- ✅ **성능 격차 분석**: 개별 학생과 최상위권 학생 비교
- ✅ **사고 루틴 생성**: 체계화된 학습 방법론 제공
- ✅ **실시간 분석**: RESTful API를 통한 모든 프론트엔드 연동
- ✅ **Moodle 플러그인**: 네이티브 Moodle 연동

## 🏗️ 아키텍처

```
┌─────────────────────────────────────────────────────────────┐
│                프론트엔드 (React/Vue 등)                      │
└────────────────────────┬────────────────────────────────────┘
                         │ REST API
┌────────────────────────┴────────────────────────────────────┐
│         사고 루틴 엔진 (FastAPI)                              │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  분석       │  │  AI 서비스   │  │    캐시      │      │
│  │  서비스     │  │   (Claude)   │  │   (Redis)    │      │
│  └─────────────┘  └──────────────┘  └──────────────┘      │
└────────────────────────┬────────────────────────────────────┘
                         │
         ┌───────────────┴──────────────┐
         │                              │
┌────────┴────────┐          ┌──────────┴─────────┐
│  Moodle MySQL   │          │   PostgreSQL       │
│  (읽기 전용)     │          │   (분석 DB)        │
└─────────────────┘          └────────────────────┘
```

## 📦 구성 요소

### 1. Moodle 연동 플러그인 (`moodle-integration/`)
- **위치**: `local/thinkroutine/`
- **유형**: Moodle local 플러그인
- **기능**:
  - 데이터 추출을 위한 웹 서비스 API
  - 학생 활동 분석
  - 코스 분석 엔드포인트

### 2. 사고 루틴 엔진 (`thinking-routine-engine/`)
- **프레임워크**: FastAPI (Python 3.11+)
- **기능**:
  - Moodle 데이터베이스에서 데이터 추출
  - 최상위권 패턴 분석
  - AI 기반 루틴 생성
  - 개인화된 추천

### 3. AI 서비스
- **제공자**: Anthropic Claude
- **모델**: Claude 3 Sonnet
- **목적**:
  - 패턴 식별
  - 추천사항 생성
  - 사고 루틴 생성

## 🚀 빠른 시작

### 전제 조건

- Docker & Docker Compose
- Moodle 3.7+ (MySQL 5.7 포함)
- Anthropic API 키

### 설치

1. **저장소 클론**
```bash
git clone <repository-url>
cd alt42standalone_v1.0
```

2. **환경 변수 설정**
```bash
cd thinking-routine-engine
cp .env.example .env
# .env 파일 편집
```

3. **Moodle 플러그인 설치**
```bash
# Moodle 설치 경로에 플러그인 복사
cp -r moodle-integration/local/thinkroutine /path/to/moodle/local/

# Moodle 관리자 페이지에서 플러그인 설치
# 사이트 관리 > 알림
```

4. **Docker로 서비스 시작**
```bash
cd ..
docker-compose up -d
```

5. **설치 확인**
```bash
curl http://localhost:8000/health
```

## 📚 API 문서

### 기본 URL
```
http://localhost:8000/api/v1
```

### 엔드포인트

#### 1. 학생 분석
```http
GET /students/{user_id}/analysis?course_id={course_id}&lookback_days=90
```

**응답:**
```json
{
  "userid": 123,
  "total_sessions": 45,
  "avg_session_duration": 52.3,
  "total_time_spent": 38.5,
  "completion_rate": 87.5,
  "avg_grade": 85.2,
  "peak_performance_time": "afternoon",
  "learning_velocity": 1.2
}
```

#### 2. 코스 분석
```http
GET /courses/{course_id}/analytics?top_percentile=10.0
```

#### 3. 개인화 추천
```http
GET /students/{user_id}/courses/{course_id}/recommendations
```

**응답 예시:**
```json
{
  "userid": 123,
  "courseid": 5,
  "current_performance_percentile": 45.8,
  "recommendations": [
    {
      "category": "시간 관리",
      "title": "학습 세션 시간 늘리기",
      "description": "...",
      "priority": "high",
      "expected_impact": 8.5
    }
  ],
  "thinking_routine": {
    "morning_routine": "...",
    "study_approach": "...",
    "problem_solving_steps": "...",
    "review_schedule": "..."
  },
  "gap_analysis": [...]
}
```

## 🧠 작동 원리

### 1. 데이터 추출
- Moodle 데이터베이스 연결 (읽기 전용)
- 사용자 로그, 퀴즈 시도, 성적, 포럼 게시물 추출
- 학습 세션 식별 (활동 패턴)

### 2. 최상위권 분석
- 성적 기준 상위 10% 학생 식별
- 학습 패턴 분석:
  - 세션 시간 및 빈도
  - 시간대별 선호도
  - 완료율
  - 학습 속도 (개선율)

### 3. AI 패턴 인식
- 집계된 데이터를 Claude AI에 전송
- 비자명한 성공 패턴 식별
- 증거 기반 추천사항 생성

### 4. 개인화 루틴 생성
- 학생과 최상위권 비교
- 성능 격차 식별
- 맞춤형 사고 루틴 생성:
  - 오전 준비 단계
  - 학습 접근 방법론
  - 문제 해결 프레임워크
  - 간격 반복 일정

## 📊 데이터 모델

### 학생 활동 지표
- **세션**: 학습 세션 횟수 및 시간
- **시간 패턴**: 아침/오후/저녁/밤 분포
- **참여도**: 포럼 게시물, 리소스 조회, 활동 완료
- **성과**: 퀴즈 성적, 전체 성적, 학습 속도

### 최상위권 패턴
- **학습 시간**: 최적 세션 길이
- **빈도**: 주당 세션 수
- **타이밍**: 최고 성과 시간대
- **행동**: 공통 성공 패턴

### 사고 루틴
- **아침 루틴**: 학습 전 준비 단계
- **학습 접근법**: 증거 기반 학습 전략
- **문제 해결**: 체계적인 도전 접근 방식
- **복습 일정**: 간격 반복 타이밍

## 🔧 설정

### 환경 변수

| 변수 | 설명 | 기본값 |
|------|------|--------|
| `MOODLE_DB_HOST` | Moodle MySQL 호스트 | localhost |
| `MOODLE_DB_PORT` | MySQL 포트 | 3306 |
| `MOODLE_DB_NAME` | Moodle 데이터베이스 이름 | moodle |
| `MOODLE_DB_USER` | 데이터베이스 사용자 | moodle |
| `MOODLE_DB_PASSWORD` | 데이터베이스 비밀번호 | - |
| `ANTHROPIC_API_KEY` | Claude API 키 | - |
| `TOP_PERFORMER_PERCENTILE` | 분석할 상위 % | 10.0 |
| `SESSION_GAP_MINUTES` | 세션 간격 임계값 | 30 |
| `ANALYSIS_LOOKBACK_DAYS` | 분석 기간 | 90 |

## 🔐 보안

- **읽기 전용 데이터베이스 접근**: Moodle DB 사용자는 SELECT 권한만 보유
- **API 인증**: 프로덕션에서 JWT 또는 OAuth2 구현
- **데이터 프라이버시**: Moodle 데이터베이스 외부에 개인정보 미저장
- **속도 제한**: API 남용 방지
- **CORS**: `.env`에서 허용된 원본 설정

## 🧪 테스트

### 단위 테스트
```bash
cd thinking-routine-engine
pytest tests/
```

### API 테스트
```bash
pytest tests/api/
```

## 📈 성능 최적화

- **캐싱**: Redis가 자주 액세스하는 분석 결과 캐시
- **데이터베이스 인덱싱**: Moodle 테이블이 적절하게 인덱싱되었는지 확인
- **비동기 처리**: 무거운 계산을 위한 백그라운드 작업
- **AI 비용 최적화**: 토큰 사용을 최소화하기 위한 프롬프트 엔지니어링

## 🛠️ 문제 해결

### 일반적인 문제

**1. Moodle 데이터베이스 연결 불가**
- `.env`에서 MySQL 자격 증명 확인
- 네트워크 연결 확인
- MySQL 사용자에게 필요한 권한이 있는지 확인

**2. AI 서비스 오류**
- `ANTHROPIC_API_KEY`가 올바르게 설정되었는지 확인
- API 속도 제한 및 사용량 확인
- `thinking-routine-api` 컨테이너의 오류 로그 검토

**3. 최상위권을 찾을 수 없음**
- 코스에 충분한 학생 활동이 있는지 확인
- `TOP_PERFORMER_PERCENTILE` 설정 확인
- Moodle에 성적 데이터가 존재하는지 확인

## 📝 개발

### 프로젝트 구조
```
alt42standalone_v1.0/
├── moodle-integration/          # Moodle 플러그인
│   └── local/thinkroutine/
├── thinking-routine-engine/     # Python API
│   ├── main.py
│   ├── config.py
│   ├── models/
│   └── services/
├── docker/
├── docker-compose.yml
└── README.md
```

## 📄 라이선스

[귀하의 라이선스]

## 🙏 감사의 말

- **Moodle 커뮤니티**: 훌륭한 LMS 플랫폼
- **Anthropic**: Claude AI API
- **KAIST 터치 수학 아카데미**: 원래 사용 사례 영감

---

**최적 학습을 위해 ❤️로 제작**
