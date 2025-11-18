# 성장로그 시스템 - LMS 연동

오답을 '실패'가 아닌 '성장 기회'로 기록하는 학습 관리 시스템

## 🌱 개요

이 시스템은 학생들의 학습 과정을 **성장 중심**으로 기록하고 분석합니다. 전통적인 정답/오답 평가 대신, 학생이 문제를 해결하는 과정에서 보여주는 노력, 개선, 성장을 추적하고 격려합니다.

### 주요 특징

- ✅ **성장 중심 피드백**: AI가 학생의 시도를 분석하여 긍정적이고 건설적인 피드백 생성
- 📊 **다차원 평가**: 정답률뿐만 아니라 노력, 개선, 전략 변화 등을 종합적으로 평가
- 🔗 **LMS 연동**: Canvas, Moodle 등 주요 LMS와 실시간 동기화
- 🏆 **성장 마일스톤**: 학생의 주요 성장 순간을 자동으로 감지하고 축하
- 📈 **학습 분석**: 학생별, 모듈별 성장 패턴 분석 및 시각화

---

## 🏗️ 시스템 아키텍처

```
┌─────────────────────────────────────────────────────────┐
│                  웹 애플리케이션 (React)                  │
│              학생 UI | 교사 대시보드                      │
└────────────────────────┬────────────────────────────────┘
                         │ REST API
┌────────────────────────▼────────────────────────────────┐
│              FastAPI 백엔드 서버                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │ 성장로그 API │ LMS 연동 API │ 분석 API           │  │
│  └──────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────┐  │
│  │ Growth Log Service │ LMS Service │ AI Service    │  │
│  └──────────────────────────────────────────────────┘  │
└─────────┬───────────────────┬─────────────────┬────────┘
          │                   │                 │
┌─────────▼──────┐  ┌─────────▼────────┐ ┌─────▼────────┐
│  PostgreSQL    │  │  Claude API      │ │  Canvas/     │
│  (성장로그 DB)  │  │  (AI 피드백)     │ │  Moodle LMS  │
└────────────────┘  └──────────────────┘ └──────────────┘
```

---

## 📦 설치 및 설정

### 사전 요구사항

- Python 3.11 이상
- PostgreSQL 15 이상
- Redis (선택, 캐싱 및 작업 큐용)
- Node.js 18 이상 (프론트엔드용)

### 1. 저장소 클론

```bash
git clone https://github.com/your-org/alt42standalone_v1.0.git
cd alt42standalone_v1.0
```

### 2. Python 가상환경 생성 및 의존성 설치

```bash
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

pip install -r requirements.txt
```

### 3. 환경 변수 설정

`.env` 파일 생성:

```bash
cp .env.example .env
```

`.env` 파일 편집:

```env
# Database
DATABASE_URL=postgresql+asyncpg://user:password@localhost:5432/growth_log_db

# AI Service
ANTHROPIC_API_KEY=sk-ant-...

# Security
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# LMS Integration
# Canvas
CANVAS_INSTANCE_URL=https://canvas.your-institution.edu
CANVAS_API_TOKEN=your-canvas-api-token

# Moodle
MOODLE_INSTANCE_URL=https://moodle.your-institution.edu
MOODLE_WS_TOKEN=your-moodle-ws-token

# Redis (optional)
REDIS_URL=redis://localhost:6379/0
```

### 4. 데이터베이스 설정

```bash
# PostgreSQL 데이터베이스 생성
createdb growth_log_db

# 마이그레이션 실행
psql -d growth_log_db -f database/migrations/001_growth_log_schema.sql
```

### 5. 서버 실행

```bash
# 개발 서버
uvicorn src.main:app --reload --port 8000

# 프로덕션 서버
uvicorn src.main:app --host 0.0.0.0 --port 8000 --workers 4
```

서버가 실행되면 http://localhost:8000 에서 접속 가능합니다.

API 문서는 http://localhost:8000/docs 에서 확인할 수 있습니다.

---

## 🚀 사용 가이드

### 1. 성장로그 생성

학생이 문제에 답변하면 성장로그가 자동으로 생성됩니다.

```python
# POST /api/v1/growth-logs
{
  "student_id": "uuid",
  "module_id": "uuid",
  "problem_id": "uuid",
  "student_answer": {"numerator": 3, "denominator": 5},
  "expected_answer": {"numerator": 3, "denominator": 4},
  "is_correct": false,
  "time_spent_seconds": 120,
  "hints_used": 1
}

# Response
{
  "id": "uuid",
  "growth_category": "concept_exploration",
  "growth_score": 65.5,
  "effort_score": 80.0,
  "ai_feedback": "좋은 시도였어요! 분자는 정확히 이해하셨네요.
                  통분 과정을 한 번 더 연습해보면 완벽할 것 같아요.",
  "next_steps": {
    "immediate_actions": [
      {"action": "review_concept", "description": "통분 개념 복습"}
    ]
  }
}
```

### 2. LMS 연동 설정

Canvas LMS와 연동하는 예시:

```python
# POST /api/v1/lms/integrations
{
  "lms_provider": "canvas",
  "lms_instance_url": "https://canvas.kaist.ac.kr",
  "auth_type": "api_key",
  "auth_credentials": {
    "api_token": "your-canvas-api-token"
  },
  "module_id": "uuid",
  "lms_course_id": "12345",
  "lms_assignment_id": "67890",
  "sync_frequency": "real_time"
}
```

### 3. 성장 분석 조회

```python
# GET /api/v1/growth-logs/student/{student_id}/analytics
{
  "overall_growth_score": 82.3,
  "growth_trajectory": "upward",
  "strengths": ["persistent_learning", "self_correction"],
  "growth_areas": ["concept_mastery in fractions"],
  "milestones_achieved": 5,
  "learning_pattern": "steady_progress"
}
```

---

## 📊 데이터 모델

### 성장로그 (growth_logs)

학생의 각 시도를 성장 관점에서 기록:

- **growth_category**: 성장 유형 (첫 성공, 끈기있는 학습, 개념 탐구 등)
- **growth_score**: 전체 성장 점수 (0-100)
- **effort_score**: 노력 점수
- **progress_score**: 진척도 점수
- **ai_feedback**: AI가 생성한 성장 중심 피드백
- **next_steps**: 다음 학습 단계 추천

### 학습 세션 (learning_sessions)

학생의 학습 세션을 그룹화:

- **session_growth_score**: 세션 전체 성장 점수
- **engagement_level**: 참여 수준 (high/medium/low)
- **learning_pattern**: 학습 패턴 (steady_progress, breakthrough, struggling)
- **breakthrough_moments**: 돌파구를 찾은 순간들

### 성장 마일스톤 (growth_milestones)

주요 성장 순간 기록:

- **milestone_type**: 마일스톤 유형 (개념 숙달, 끈기, 창의적 접근 등)
- **celebration_message**: 축하 메시지
- **badge_earned**: 획득 배지

---

## 🔗 LMS 연동

### 지원 플랫폼

- ✅ Canvas LMS
- ✅ Moodle
- 🚧 Google Classroom (개발 중)
- 🚧 Blackboard (개발 중)

### 동기화 방식

1. **실시간 동기화**: 성장로그 생성 즉시 LMS에 반영
2. **배치 동기화**: 정해진 시간에 일괄 동기화
3. **수동 동기화**: API 호출로 필요할 때 동기화

### Canvas 연동 설정

1. Canvas 관리자 페이지에서 API 토큰 생성
2. 코스 ID 및 과제 ID 확인
3. 시스템에 LMS 연동 설정 등록
4. 연결 테스트

```bash
# 연결 테스트
POST /api/v1/lms/integrations/{integration_id}/test
```

---

## 🤖 AI 피드백 생성

### 피드백 원칙

1. **긍정적 인정**: 학생의 시도를 먼저 인정
2. **성장 관찰**: 이전 대비 개선점 강조
3. **학습 기회**: 오답도 배움의 기회로 재정의
4. **구체적 제안**: 다음 단계 명확히 제시
5. **동기부여**: 계속 도전하도록 격려

### 피드백 예시

**오답 시 피드백 (기존 방식 ❌)**
```
틀렸습니다. 정답은 3/4입니다.
```

**성장로그 피드백 (새로운 방식 ✅)**
```
🌱 성장 기록

좋은 시도였어요! 분수를 더하는 과정에서 분자를 더하는 것은
정확히 이해하셨네요.

📊 이번 시도에서 배운 점:
- 분수 덧셈 시 통분이 필요하다는 것을 발견했어요
- 이전 시도보다 30% 빠르게 문제를 해결했어요

🎯 다음 단계:
- 통분 개념을 시각적으로 한 번 더 살펴보면 좋을 것 같아요
- 피자 모델을 이용해 1/2 + 1/4가 어떻게 되는지 직접 조작해보세요

💪 성장 점수: +15 (끈기 있는 학습)
```

---

## 📈 성장 지표 계산

### Growth Score (성장 점수)

```python
growth_score = base_score + attempt_bonus + improvement_bonus

# base_score
- 정답: 50점
- 오답: 20점 (시도 자체에 점수 부여)

# attempt_bonus
- 첫 시도 성공: +30점
- 여러 시도 끝 성공: +10~25점

# improvement_bonus
- 각 개선 사항당: +10점
```

### Effort Score (노력 점수)

```python
effort_score = 50 (기본) + time_bonus + resource_bonus + retry_bonus

# time_bonus: 60초 이상 투자 시 +20점
# resource_bonus: 학습 자료 활용 시 +15점
# retry_bonus: 재시도당 +5점 (최대 +15점)
```

### Progress Score (진척도 점수)

```python
# 정답: 100점
# 오답: 30점 + 개선 사항당 +10점
```

---

## 🔐 보안

- LMS 인증 정보는 AES-256으로 암호화 저장
- API 요청은 JWT 토큰 기반 인증
- HTTPS 필수 (프로덕션 환경)
- RBAC (역할 기반 접근 제어)
- 학생 개인정보 보호 (GDPR/PIPA 준수)

---

## 🧪 테스트

```bash
# 전체 테스트 실행
pytest

# 커버리지 포함
pytest --cov=src --cov-report=html

# 특정 테스트만 실행
pytest tests/test_growth_log_service.py
```

---

## 📝 API 문서

서버 실행 후 다음 URL에서 대화형 API 문서를 확인할 수 있습니다:

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

---

## 🤝 기여

기여는 언제나 환영합니다!

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 라이선스

This project is licensed under the MIT License.

---

## 📞 문의

프로젝트 관련 문의: [contact@example.com]

이슈 및 버그 리포트: [GitHub Issues](https://github.com/your-org/alt42standalone_v1.0/issues)

---

## 🗺️ 로드맵

### Phase 1 (현재) ✅
- [x] 성장로그 데이터베이스 스키마
- [x] Growth Log API
- [x] LMS 연동 (Canvas, Moodle)
- [x] AI 피드백 생성

### Phase 2 (진행 중) 🚧
- [ ] 프론트엔드 대시보드
- [ ] 실시간 동기화
- [ ] 고급 분석 기능
- [ ] 학부모 리포트

### Phase 3 (계획) 📅
- [ ] Google Classroom 연동
- [ ] 모바일 앱
- [ ] 다국어 지원
- [ ] 게이미피케이션

---

## 🙏 감사의 말

이 프로젝트는 **성장 마인드셋(Growth Mindset)** 철학을 기반으로 합니다.
Carol Dweck 교수의 연구에 영감을 받아, 학생들이 실패를 두려워하지 않고
도전하는 문화를 만들고자 합니다.

모든 학생은 성장할 수 있습니다. 🌱
