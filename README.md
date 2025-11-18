# Condition Morph: 실시간 점화식 조건 변경 시스템

## 📖 개요

**Condition Morph**는 학생의 학습 상황에 따라 수학 문제의 점화식(recurrence relation) 조건을 **실시간으로 변경하고 즉시 반영**하는 적응형 학습 시스템입니다.

### 핵심 기능
- ✅ **실시간 조건 변경**: 학생 응답에 따라 문제 난이도/유형 자동 조정
- ✅ **점화식 지원**: 등차/등비수열, 피보나치, 선형 점화식 등 다양한 유형
- ✅ **Moodle 연동**: Moodle LMS 3.7 (PHP 7.1.9, MySQL 5.7)에서 문제 동기화
- ✅ **WebSocket 실시간 통신**: 즉각적인 Morphing 알림
- ✅ **모바일 UI**: 우측 하단 스마트폰 시뮬레이터

---

## 🏗️ 시스템 아키텍처

```
┌─────────────────────────────────────────────────────────┐
│              Moodle LMS (PHP 7.1.9, MySQL 5.7)          │
└───────────────────────┬─────────────────────────────────┘
                        │ REST API / MySQL Direct
┌───────────────────────▼─────────────────────────────────┐
│           Moodle Integration Service                     │
│         (Python FastAPI + pymysql)                       │
└───────────────────────┬─────────────────────────────────┘
                        │
┌───────────────────────▼─────────────────────────────────┐
│        Condition Morph Engine (FastAPI + WebSocket)     │
│  ┌─────────────────────────────────────────────────┐   │
│  │ Recurrence Parser → Morpher → Real-time Push    │   │
│  └─────────────────────────────────────────────────┘   │
└─────┬──────────────────┬──────────────────┬────────────┘
      │                  │                  │
┌─────▼──────┐   ┌───────▼───────┐   ┌─────▼──────┐
│ PostgreSQL │   │  Redis Pub/Sub │   │   React    │
│    15+     │   │     (WS msgs)  │   │  Frontend  │
└────────────┘   └────────────────┘   └────────────┘
```

---

## 🚀 빠른 시작

### 1. 사전 요구사항

- Docker & Docker Compose
- Python 3.11+
- Node.js 18+ (프론트엔드용)
- Moodle 3.7 (연동 시)

### 2. 설치

```bash
# 레포지토리 클론
git clone <repository-url>
cd alt42standalone_v1.0

# 환경 변수 설정
cp .env.example .env
# .env 파일 수정 (Moodle 정보 등)

# Docker Compose로 전체 시스템 시작
docker-compose up -d

# 로그 확인
docker-compose logs -f backend
```

### 3. 접속

- **백엔드 API**: http://localhost:8000
- **API 문서**: http://localhost:8000/docs (Swagger UI)
- **프론트엔드**: http://localhost:3000
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379

---

## 📚 API 사용 예시

### 1. 문제 생성

```bash
curl -X POST http://localhost:8000/api/problems \
  -H "Content-Type: application/json" \
  -d '{
    "name": "등차수열 문제",
    "description": "공차 3인 등차수열",
    "expression": "a_n = a_{n-1} + 3",
    "initial_conditions": {"0": "2"},
    "difficulty_level": 1
  }'
```

### 2. 답안 제출 (Morphing 트리거)

```bash
curl -X POST http://localhost:8000/api/submit \
  -H "Content-Type: application/json" \
  -d '{
    "student_id": "student-123",
    "problem_id": "<problem_id>",
    "n_value": 5,
    "answer": 17.0,
    "time_spent_seconds": 30
  }'
```

**응답 예시 (Morphing 발생 시)**:
```json
{
  "is_correct": true,
  "morphed": true,
  "new_problem": {
    "expression": "a_n = a_{n-1} + a_{n-2}",
    "difficulty_level": 3,
    "concept_tags": ["fibonacci", "second-order"]
  },
  "feedback": "정답입니다! 연속으로 잘 풀고 있네요. 조금 더 어려운 문제로 넘어가 볼까요?",
  "student_state": {
    "consecutive_correct": 3,
    "mastery_score": 0.85
  },
  "expected_value": 17.0
}
```

### 3. Moodle에서 문제 가져오기

```bash
curl -X POST http://localhost:8000/api/moodle/import \
  -H "Content-Type: application/json" \
  -d '{
    "course_id": 101,
    "category_id": 5
  }'
```

### 4. WebSocket 연결 (실시간 Morphing 알림)

```javascript
// JavaScript 클라이언트 예시
const ws = new WebSocket('ws://localhost:8000/ws/student-123');

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);

  if (data.type === 'morph_event') {
    console.log('Morphing occurred!', data);
    // UI 업데이트
  }
};

// Ping 전송 (연결 유지)
setInterval(() => {
  ws.send(JSON.stringify({ type: 'ping' }));
}, 30000);
```

---

## 🧪 테스트

```bash
# 단위 테스트
cd backend
pytest tests/test_recurrence_parser.py
pytest tests/test_morpher.py

# 통합 테스트
pytest tests/test_api.py

# E2E 테스트 (Playwright)
cd frontend
npm run test:e2e
```

---

## 📂 프로젝트 구조

```
alt42standalone_v1.0/
├── backend/
│   ├── api/
│   │   └── main.py                 # FastAPI 서버
│   ├── models/
│   │   └── recurrence.py           # 점화식 모델
│   ├── services/
│   │   ├── recurrence_parser.py    # 점화식 파서
│   │   ├── condition_morpher.py    # Morphing 엔진
│   │   └── moodle_integration.py   # Moodle 연동
│   └── tests/
├── frontend/
│   └── src/
│       ├── components/
│       │   └── SmartphoneSimulator.tsx
│       └── pages/
│           └── TeacherDashboard.tsx
├── docker/
│   ├── Dockerfile.backend
│   └── Dockerfile.frontend
├── sql/
│   └── schema.sql                  # PostgreSQL 스키마
├── docs/
│   ├── condition-morph-specification.md
│   └── architecture/
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## 🔧 Moodle 연동 설정

### 1. Moodle Web Services 활성화

1. Moodle 관리자 계정으로 로그인
2. **사이트 관리 → 고급 기능 → Web services 활성화**
3. **사이트 관리 → 플러그인 → Web services → 프로토콜 관리 → REST 프로토콜 활성화**

### 2. 토큰 생성

```bash
# Moodle 관리자 페이지에서:
# 사이트 관리 → 웹 서비스 → 토큰 관리 → 토큰 추가
#
# 권한 설정:
# - mod/quiz:view
# - mod/quiz:attempt
# - moodle/question:viewall
```

생성된 토큰을 `.env` 파일의 `MOODLE_TOKEN`에 설정합니다.

### 3. 데이터베이스 직접 연결 (옵션)

```sql
-- Moodle MySQL에서 읽기 전용 사용자 생성
CREATE USER 'condition_morph_readonly'@'%' IDENTIFIED BY 'password';
GRANT SELECT ON moodle.mdl_question TO 'condition_morph_readonly'@'%';
GRANT SELECT ON moodle.mdl_question_calculated TO 'condition_morph_readonly'@'%';
GRANT SELECT ON moodle.mdl_quiz_attempts TO 'condition_morph_readonly'@'%';
FLUSH PRIVILEGES;
```

---

## ⚙️ Morphing 규칙 커스터마이징

Morphing 규칙은 `backend/services/condition_morpher.py`의 `_initialize_default_rules()`에서 설정됩니다.

### 새 규칙 추가 예시

```python
# 10초 이내 정답 → 난이도 급상승
self.rules.append(MorphRule(
    name="Fast Correct Answer Boost",
    trigger=MorphTrigger.TIME_THRESHOLD,
    condition=lambda state: (
        state.consecutive_correct >= 1 and
        state.avg_response_time < 10
    ),
    transformation=lambda problem: self.generate_problem_at_difficulty(
        min(problem.difficulty_level + 2, 5)
    ),
    priority=0  # 최우선
))
```

---

## 🎨 모바일 UI (스마트폰 시뮬레이터)

우측 하단에 표시되는 가상 스마트폰 화면:

### 특징
- 실시간 WebSocket 연결로 Morphing 즉시 반영
- 스마트폰 프레임 디자인 (노치, 홈 버튼 포함)
- Morphing 애니메이션 효과
- 학생 상태 실시간 표시 (연속 정답, 숙련도)

### 사용 예시

```tsx
import SmartphoneSimulator from './components/SmartphoneSimulator';

function TeacherDashboard() {
  return (
    <div>
      {/* 교사 대시보드 내용 */}

      <SmartphoneSimulator
        studentId="student-123"
        position="bottom-right"
      />
    </div>
  );
}
```

---

## 📊 모니터링

### 1. 데이터베이스 통계 확인

```sql
-- 학생 성과 요약
SELECT * FROM student_performance_summary;

-- 문제별 통계
SELECT * FROM problem_statistics
ORDER BY success_rate DESC;

-- Morphing 트리거별 통계
SELECT * FROM morph_trigger_statistics;
```

### 2. Morphing 이벤트 로그

```sql
SELECT
    me.occurred_at,
    s.username,
    me.trigger_type,
    me.original_difficulty,
    me.morphed_difficulty,
    me.original_expression,
    me.morphed_expression
FROM morph_events me
JOIN students s ON me.student_id = s.id
ORDER BY me.occurred_at DESC
LIMIT 50;
```

---

## 🐛 트러블슈팅

### WebSocket 연결 실패

```bash
# CORS 설정 확인
# backend/api/main.py에서:
allow_origins=["http://localhost:3000"]  # 프론트엔드 URL 추가
```

### Moodle 연동 실패

```bash
# 토큰 유효성 확인
curl "https://lms.kaist.ac.kr/webservice/rest/server.php?wstoken=YOUR_TOKEN&wsfunction=core_webservice_get_site_info&moodlewsrestformat=json"

# 데이터베이스 연결 확인
docker-compose exec backend python -c "
from backend.services.moodle_integration import MoodleDatabaseClient, MoodleConfig
config = MoodleConfig(moodle_url='', webservice_token='', db_host='moodle_db', db_user='user', db_password='pass')
with MoodleDatabaseClient(config) as db:
    print('Connected!')
"
```

### Morphing이 발생하지 않음

```python
# 디버그 로그 활성화
# .env 파일에:
LOG_LEVEL=debug

# 학생 상태 확인
curl http://localhost:8000/api/student/student-123/state
```

---

## 📄 라이선스

이 프로젝트는 **MIT License** 하에 배포됩니다.

---

## 👥 기여

기여를 환영합니다! Pull Request를 보내주세요.

### 개발 가이드라인
1. 브랜치 생성: `git checkout -b feature/your-feature-name`
2. 변경사항 커밋: `git commit -am 'Add some feature'`
3. 푸시: `git push origin feature/your-feature-name`
4. Pull Request 생성

---

## 📧 문의

- **이메일**: support@touchmath.kaist.ac.kr
- **문서**: [docs/condition-morph-specification.md](docs/condition-morph-specification.md)
- **이슈 트래커**: GitHub Issues

---

## 🗺️ 로드맵

### Phase 1 (완료)
- ✅ 점화식 파서 구현
- ✅ Condition Morphing 엔진
- ✅ Moodle 연동
- ✅ WebSocket 실시간 통신
- ✅ REST API

### Phase 2 (진행 중)
- 🔄 React 프론트엔드 완성
- 🔄 스마트폰 시뮬레이터 UI
- 🔄 교사 대시보드

### Phase 3 (계획)
- 📅 AI 기반 문제 생성 (Claude API)
- 📅 ML 기반 예측 Morphing
- 📅 다변량 점화식 지원
- 📅 협력 학습 기능

---

## 🙏 감사의 말

이 프로젝트는 **KAIST Touch Math Academy**의 지원으로 개발되었습니다.

- **Moodle Community**: LMS 연동 참고
- **FastAPI Team**: 빠른 API 프레임워크
- **React Team**: 프론트엔드 프레임워크
