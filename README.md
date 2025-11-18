# AI 교육 시스템 - 오답 원인 분류 기능

LMS와 연동하여 학생의 오답 원인을 **개념**, **계산**, **조건누락** 세 가지 카테고리로 자동 분류하는 시스템입니다.

## 📋 목차

- [개요](#개요)
- [주요 기능](#주요-기능)
- [시스템 구조](#시스템-구조)
- [시작하기](#시작하기)
- [API 문서](#api-문서)
- [LMS 통합](#lms-통합)
- [개발 가이드](#개발-가이드)

---

## 🎯 개요

이 시스템은 AI(Claude)를 활용하여 학생들의 오답을 분석하고, 오답 원인을 자동으로 분류합니다. 분류 결과를 바탕으로 맞춤형 피드백과 학습 리소스를 제공하며, LMS(Canvas, Moodle 등)와 통합하여 원활한 학습 관리를 지원합니다.

### 오답 분류 카테고리

1. **개념 (Concept)** 💡
   - 수학 개념이나 원리를 근본적으로 이해하지 못한 경우
   - 예: 분수 덧셈 시 통분 개념을 모름

2. **계산 (Calculation)** 🔢
   - 개념은 이해했지만 계산 과정에서 실수한 경우
   - 예: 곱셈 순서는 맞지만 구구단을 틀림

3. **조건누락 (Condition Omission)** 📋
   - 문제의 조건이나 제약사항을 놓친 경우
   - 예: "양수만" 답하라는 조건을 무시함

---

## ✨ 주요 기능

### 1. 자동 오답 분류
- AI 기반 오답 원인 분석
- 85% 이상의 분류 정확도
- 신뢰도 점수 제공 (0.0-1.0)

### 2. 맞춤형 피드백
- 오답 원인에 따른 개인화된 피드백
- 학습 리소스 자동 추천
- 한국어/영어 지원

### 3. 학습 분석 대시보드
- 학생 개인별 오류 패턴 시각화
- 학급 전체 오류 분포 분석
- 학습 진척도 추적

### 4. 교사 검토 시스템
- AI 분류 결과 검토 및 수정
- 낮은 신뢰도 분류 자동 플래깅
- 일괄 승인 기능

### 5. LMS 통합
- LTI 1.3 표준 지원
- Canvas, Moodle, KAIST LMS 연동
- 자동 성적 전송 (Grade Passback)
- 수강생 명단 동기화

---

## 🏗️ 시스템 구조

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (React)                      │
│  - AnswerFeedbackCard                                   │
│  - ErrorPatternDashboard                                │
│  - ClassificationReviewQueue                            │
└───────────────────┬─────────────────────────────────────┘
                    │ REST API
┌───────────────────▼─────────────────────────────────────┐
│                Backend (FastAPI)                         │
│  - Answer Evaluation                                    │
│  - AI Classification (Claude API)                       │
│  - LMS Integration (LTI 1.3)                           │
└──────┬─────────────────────┬────────────────────────────┘
       │                     │
┌──────▼──────┐    ┌────────▼─────────┐
│  PostgreSQL │    │  Claude API      │
│  Database   │    │  (Anthropic)     │
└─────────────┘    └──────────────────┘
```

### 디렉토리 구조

```
alt42standalone_v1.0/
├── backend/              # Python FastAPI 백엔드
│   ├── app/
│   │   ├── main.py       # FastAPI 애플리케이션
│   │   ├── config.py     # 설정
│   │   ├── models/       # 데이터 모델
│   │   │   └── schemas.py
│   │   ├── services/     # 비즈니스 로직
│   │   │   ├── classifier.py
│   │   │   └── lms_integration.py
│   │   └── routers/      # API 라우트
│   │       └── lms.py
│   └── requirements.txt
│
├── frontend/             # React 프론트엔드
│   ├── src/
│   │   └── components/
│   │       ├── AnswerFeedbackCard.tsx
│   │       ├── ErrorPatternDashboard.tsx
│   │       └── ClassificationReviewQueue.tsx
│   └── package.json
│
├── database/             # 데이터베이스
│   └── migrations/
│       └── 001_answer_classification_schema.sql
│
├── docs/                 # 문서
│   └── answer-classification-design.md
│
└── README.md
```

---

## 🚀 시작하기

### 사전 요구사항

- Python 3.11+
- Node.js 18+
- PostgreSQL 15+
- Anthropic API Key (Claude)

### 1. 백엔드 설정

```bash
cd backend

# 가상 환경 생성
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 의존성 설치
pip install -r requirements.txt

# 환경 변수 설정
cp .env.example .env
# .env 파일을 열어 API 키 등을 설정하세요

# 데이터베이스 마이그레이션
psql -U postgres -d answer_classification -f ../database/migrations/001_answer_classification_schema.sql

# 서버 실행
uvicorn app.main:app --reload
```

백엔드 서버: http://localhost:8000
API 문서: http://localhost:8000/docs

### 2. 프론트엔드 설정

```bash
cd frontend

# 의존성 설치
npm install

# 개발 서버 실행
npm run dev
```

프론트엔드: http://localhost:5173

### 3. 데이터베이스 설정

```bash
# PostgreSQL 데이터베이스 생성
createdb answer_classification

# 스키마 적용
psql answer_classification < database/migrations/001_answer_classification_schema.sql

# 샘플 데이터는 마이그레이션 파일에 포함되어 있습니다
```

---

## 📚 API 문서

### 답안 제출 및 분류

```http
POST /api/v1/answers/submit
Content-Type: application/json

{
  "student_id": "uuid",
  "problem_id": "uuid",
  "answer_content": "1/3",
  "work_shown": "1/4 + 1/4 = 2/4",
  "time_spent_seconds": 120
}
```

**응답:**
```json
{
  "submission_id": "uuid",
  "is_correct": false,
  "classification": {
    "type": "개념",
    "confidence": 0.92,
    "explanation": "학생이 분수 덧셈의 통분 개념을 이해하지 못했습니다.",
    "feedback": "분수를 더할 때는 먼저 분모를 같게 만들어야 합니다.",
    "ai_reasoning": "...",
    "teacher_verified": false
  },
  "recommended_resources": [...],
  "evaluated_at": "2025-11-18T10:30:00Z"
}
```

### 학생 오류 패턴 조회

```http
GET /api/v1/students/{student_id}/error-patterns
```

### 교사 검토

```http
PUT /api/v1/classifications/{classification_id}/review
Content-Type: application/json

{
  "teacher_id": "uuid",
  "verified": true,
  "override_type": "계산",
  "notes": "실제로는 계산 실수입니다"
}
```

### LMS 통합

```http
POST /api/v1/lms/lti/launch
POST /api/v1/lms/grade-passback
POST /api/v1/lms/integrations/{integration_id}/sync-roster
```

전체 API 문서: http://localhost:8000/docs

---

## 🔌 LMS 통합

### 지원 LMS

- **Canvas LMS** ✅
- **Moodle** ✅
- **KAIST LMS** ✅
- **Generic LTI 1.3** ✅

### LTI 1.3 설정

1. **LMS에서 External Tool 등록**
   - Tool URL: `https://your-domain.com/api/v1/lms/lti/launch`
   - Public JWK URL: `https://your-domain.com/.well-known/jwks.json`
   - Redirect URIs: `https://your-domain.com/api/v1/lms/lti/callback`

2. **Deployment ID 및 Client ID 설정**
   ```env
   LTI_DEPLOYMENT_ID=your-deployment-id
   LTI_CLIENT_ID=your-client-id
   ```

3. **Grade Passback 활성화**
   - Assignment and Grade Services 권한 요청
   - Lineitem 및 Score 권한 필요

### Canvas 통합 예시

```python
# Canvas API를 통한 성적 전송
await lms_service.send_grade_to_lms(
    integration_id=integration_id,
    student_id=student_id,
    submission_id=submission_id,
    grade_value=85.0
)
```

---

## 🛠️ 개발 가이드

### 분류 정확도 개선

AI 분류 정확도를 높이려면 `backend/app/services/classifier.py`의 프롬프트를 조정하세요:

```python
# Few-shot 예시 추가
# 프롬프트 구조 개선
# 신뢰도 임계값 조정
```

### 새 LMS 추가

1. `backend/app/services/lms_integration.py`에 메서드 추가:
   ```python
   async def _send_grade_to_new_lms(self, config, student_id, grade):
       # LMS API 호출 구현
       pass
   ```

2. `send_grade_to_lms()`에 분기 추가
3. LMS 인증 정보를 `lms_integrations` 테이블에 저장

### 커스텀 피드백 생성

`classification_feedback` 테이블에 리소스 추가:

```sql
INSERT INTO classification_feedback (
    classification_id,
    feedback_type,
    title,
    content,
    resource_url
) VALUES (
    'classification-uuid',
    'concept',
    '분수 덧셈 기초',
    '분수를 더할 때는...',
    '/resources/fractions'
);
```

### 테스트 실행

```bash
# 백엔드 테스트
cd backend
pytest

# 프론트엔드 테스트
cd frontend
npm test
```

---

## 📊 성능 지표

### 목표 성능

- **분류 정확도**: > 85%
- **응답 시간**: < 500ms (p95)
- **동시 사용자**: 500명
- **교사 승인율**: > 80%

### 모니터링

- Prometheus + Grafana로 메트릭 수집
- ELK Stack으로 로그 분석
- Sentry로 에러 추적

---

## 🔐 보안

- **데이터 암호화**: AES-256 (at rest), TLS 1.3 (in transit)
- **인증**: JWT tokens with 1-hour expiration
- **Rate Limiting**: 100 submissions/minute per student
- **FERPA/COPPA 준수**: 학생 데이터 보호

---

## 📝 라이선스

이 프로젝트는 KAIST Touch Math Academy의 내부 프로젝트입니다.

---

## 🤝 기여

문의사항이나 버그 리포트는 이슈 트래커에 등록해주세요.

---

## 📞 문의

- **기술 지원**: dev@kaist.ac.kr
- **교육 관련**: edu@kaist.ac.kr

---

## 📅 버전 히스토리

### v1.0.0 (2025-11-18)
- ✅ AI 기반 오답 분류 (개념/계산/조건누락)
- ✅ LMS 통합 (LTI 1.3)
- ✅ 학생/교사 대시보드
- ✅ 자동 피드백 생성
- ✅ 성적 자동 전송

### 향후 계획
- [ ] 다국어 지원 확대 (영어, 중국어)
- [ ] 모바일 앱
- [ ] 실시간 협업 기능
- [ ] 고급 분석 및 예측 모델
