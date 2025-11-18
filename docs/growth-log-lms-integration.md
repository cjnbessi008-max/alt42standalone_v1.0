# LMS 연동 및 성장로그 시스템 설계

## 1. 개요 (Overview)

### 목적
- 기존의 "실패" 중심 평가 시스템을 "성장" 중심 학습 기록 시스템으로 전환
- LMS(Learning Management System)와 연동하여 학생의 학습 과정을 종합적으로 추적
- 오답을 학습 기회로 재정의하고, 학생의 성장 과정을 가시화

### 핵심 개념 변화

| 기존 개념 | 새로운 개념 |
|---------|-----------|
| 오답 = 실패 | 오답 = 성장 기회 |
| is_correct (Boolean) | growth_indicators (다차원 측정) |
| 단순 정답/오답 기록 | 학습 과정 및 성장 패턴 분석 |
| 점수 중심 | 과정 및 성장 중심 |

---

## 2. 데이터베이스 스키마 설계

### 2.1 성장로그 테이블 (growth_logs)

```sql
-- 기존 student_attempts 테이블을 대체하는 성장로그 테이블
CREATE TABLE growth_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id),
    module_id UUID NOT NULL REFERENCES modules(id),
    problem_id UUID NOT NULL,
    session_id UUID NOT NULL,  -- 학습 세션 추적

    -- 학생 답안 정보
    student_answer JSONB NOT NULL,  -- 유연한 답안 저장
    expected_answer JSONB NOT NULL,

    -- 성장 지표 (Growth Indicators)
    is_correct BOOLEAN NOT NULL,
    attempt_number INTEGER NOT NULL DEFAULT 1,  -- 몇 번째 시도인지
    improvement_from_previous JSONB,  -- 이전 시도 대비 개선 사항

    -- 학습 과정 분석
    thinking_process JSONB,  -- 문제 해결 과정 (단계별 기록)
    time_spent_seconds INTEGER NOT NULL,
    interaction_pattern JSONB,  -- 클릭, 입력 패턴 등
    hints_used INTEGER DEFAULT 0,
    resources_accessed TEXT[],  -- 참고한 학습 자료

    -- 성장 카테고리
    growth_category VARCHAR(50) NOT NULL CHECK (
        growth_category IN (
            'first_success',        -- 첫 성공
            'persistent_learning',  -- 끈기있는 학습 (여러 시도 끝 성공)
            'concept_exploration',  -- 개념 탐구 (오답이지만 접근법 개선)
            'partial_understanding', -- 부분 이해 (일부 정답)
            'misconception_identified', -- 오개념 발견
            'strategy_refinement'   -- 전략 개선
        )
    ),

    -- 성장 점수 (Growth Score)
    growth_score DECIMAL(5,2),  -- 0-100 점수가 아닌 성장 정도
    effort_score DECIMAL(5,2),  -- 노력 점수
    progress_score DECIMAL(5,2), -- 진척도 점수

    -- 피드백 및 코멘트
    ai_feedback TEXT,  -- AI가 생성한 성장 중심 피드백
    teacher_comment TEXT,  -- 교사 코멘트
    self_reflection TEXT,  -- 학생 자기 성찰

    -- 다음 학습 추천
    next_steps JSONB,  -- 다음에 학습할 내용 추천
    recommended_resources JSONB,  -- 추천 학습 자료

    -- 메타데이터
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    synced_to_lms BOOLEAN DEFAULT FALSE,
    lms_sync_at TIMESTAMP
);

-- 인덱스 생성
CREATE INDEX idx_growth_logs_student ON growth_logs(student_id);
CREATE INDEX idx_growth_logs_module ON growth_logs(module_id);
CREATE INDEX idx_growth_logs_session ON growth_logs(session_id);
CREATE INDEX idx_growth_logs_category ON growth_logs(growth_category);
CREATE INDEX idx_growth_logs_sync ON growth_logs(synced_to_lms, lms_sync_at);
```

### 2.2 학습 세션 테이블 (learning_sessions)

```sql
-- 학습 세션을 그룹화하여 추적
CREATE TABLE learning_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id),
    module_id UUID NOT NULL REFERENCES modules(id),

    -- 세션 정보
    started_at TIMESTAMP NOT NULL DEFAULT NOW(),
    ended_at TIMESTAMP,
    total_duration_seconds INTEGER,

    -- 세션 요약
    total_attempts INTEGER DEFAULT 0,
    correct_attempts INTEGER DEFAULT 0,
    growth_moments INTEGER DEFAULT 0,  -- 성장이 관찰된 순간의 수

    -- 세션 성장 지표
    session_growth_score DECIMAL(5,2),
    engagement_level VARCHAR(20) CHECK (
        engagement_level IN ('high', 'medium', 'low')
    ),

    -- 학습 패턴
    learning_pattern VARCHAR(50),  -- e.g., 'steady_progress', 'breakthrough', 'struggling'
    breakthrough_moments JSONB,  -- 돌파구를 찾은 순간들

    -- LMS 연동
    synced_to_lms BOOLEAN DEFAULT FALSE,
    lms_session_id VARCHAR(255),

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_learning_sessions_student ON learning_sessions(student_id);
CREATE INDEX idx_learning_sessions_module ON learning_sessions(module_id);
```

### 2.3 성장 마일스톤 테이블 (growth_milestones)

```sql
-- 학생의 주요 성장 순간을 기록
CREATE TABLE growth_milestones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id),
    module_id UUID NOT NULL REFERENCES modules(id),

    -- 마일스톤 정보
    milestone_type VARCHAR(50) NOT NULL CHECK (
        milestone_type IN (
            'concept_mastery',      -- 개념 숙달
            'persistent_effort',    -- 끈기있는 노력
            'creative_approach',    -- 창의적 접근
            'error_learning',       -- 오류로부터 학습
            'helping_others',       -- 동료 도움
            'self_correction'       -- 자기 교정
        )
    ),

    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    evidence JSONB,  -- 마일스톤의 근거 (관련 growth_log 참조 등)

    -- 축하 메시지
    celebration_message TEXT,
    badge_earned VARCHAR(100),

    -- 공유 및 가시성
    is_shared_with_teacher BOOLEAN DEFAULT TRUE,
    is_shared_with_parents BOOLEAN DEFAULT FALSE,
    teacher_acknowledgment TEXT,

    achieved_at TIMESTAMP NOT NULL DEFAULT NOW(),
    synced_to_lms BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_growth_milestones_student ON growth_milestones(student_id);
CREATE INDEX idx_growth_milestones_type ON growth_milestones(milestone_type);
```

### 2.4 LMS 연동 테이블 (lms_integration)

```sql
-- LMS 연동 설정 및 매핑
CREATE TABLE lms_integration (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- LMS 정보
    lms_provider VARCHAR(50) NOT NULL,  -- e.g., 'canvas', 'moodle', 'blackboard', 'custom'
    lms_instance_url VARCHAR(500) NOT NULL,

    -- 인증 정보 (암호화 저장)
    auth_type VARCHAR(50) NOT NULL,  -- e.g., 'oauth2', 'api_key', 'lti'
    auth_credentials_encrypted TEXT NOT NULL,

    -- 매핑 설정
    module_id UUID REFERENCES modules(id),
    lms_course_id VARCHAR(255),
    lms_assignment_id VARCHAR(255),

    -- 동기화 설정
    sync_frequency VARCHAR(20) DEFAULT 'real_time',  -- 'real_time', 'hourly', 'daily'
    sync_direction VARCHAR(20) DEFAULT 'bidirectional',  -- 'push', 'pull', 'bidirectional'

    -- 필드 매핑
    field_mapping JSONB,  -- LMS 필드와 우리 시스템 필드 매핑

    -- 상태
    is_active BOOLEAN DEFAULT TRUE,
    last_sync_at TIMESTAMP,
    last_sync_status VARCHAR(20),  -- 'success', 'failed', 'partial'
    last_sync_error TEXT,

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_lms_integration_module ON lms_integration(module_id);
CREATE INDEX idx_lms_integration_active ON lms_integration(is_active);
```

### 2.5 LMS 동기화 로그 (lms_sync_log)

```sql
-- LMS 동기화 이력 추적
CREATE TABLE lms_sync_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    lms_integration_id UUID NOT NULL REFERENCES lms_integration(id),
    sync_type VARCHAR(50) NOT NULL,  -- 'growth_log', 'milestone', 'session', 'full'

    -- 동기화 상세
    records_processed INTEGER DEFAULT 0,
    records_succeeded INTEGER DEFAULT 0,
    records_failed INTEGER DEFAULT 0,

    error_details JSONB,

    started_at TIMESTAMP NOT NULL,
    completed_at TIMESTAMP,
    status VARCHAR(20) NOT NULL,  -- 'running', 'completed', 'failed'

    -- 동기화된 데이터 참조
    synced_record_ids UUID[]
);

CREATE INDEX idx_lms_sync_log_integration ON lms_sync_log(lms_integration_id);
CREATE INDEX idx_lms_sync_log_status ON lms_sync_log(status, started_at);
```

---

## 3. LMS 연동 API 설계

### 3.1 RESTful API 엔드포인트

#### 성장로그 관련

```
# 성장로그 생성
POST /api/v1/growth-logs
Content-Type: application/json

{
  "student_id": "uuid",
  "module_id": "uuid",
  "problem_id": "uuid",
  "session_id": "uuid",
  "student_answer": {...},
  "expected_answer": {...},
  "is_correct": false,
  "time_spent_seconds": 120,
  "thinking_process": {...},
  "hints_used": 2
}

Response: 201 Created
{
  "id": "uuid",
  "growth_category": "concept_exploration",
  "growth_score": 75.5,
  "ai_feedback": "훌륭한 시도입니다! 분수의 덧셈 개념은 이해하셨네요. 통분 과정을 한 번 더 연습해보면 완벽할 것 같아요.",
  "next_steps": {...},
  "created_at": "2025-11-18T10:30:00Z"
}

# 학생의 성장로그 조회
GET /api/v1/growth-logs?student_id={uuid}&module_id={uuid}&from_date={date}&to_date={date}

# 성장 분석 리포트
GET /api/v1/growth-logs/{student_id}/analytics
Response:
{
  "overall_growth_score": 82.3,
  "growth_trajectory": "upward",
  "strengths": ["persistent_learning", "self_correction"],
  "growth_areas": ["concept_mastery in fractions"],
  "milestones_achieved": 5,
  "learning_pattern": "steady_progress"
}
```

#### LMS 연동 관련

```
# LMS 연동 설정
POST /api/v1/lms/integrations
Content-Type: application/json

{
  "lms_provider": "canvas",
  "lms_instance_url": "https://canvas.kaist.ac.kr",
  "auth_type": "oauth2",
  "auth_credentials": {...},
  "module_id": "uuid",
  "lms_course_id": "12345",
  "sync_frequency": "real_time"
}

# 수동 동기화 트리거
POST /api/v1/lms/integrations/{id}/sync
{
  "sync_type": "growth_log",
  "date_range": {
    "from": "2025-11-01",
    "to": "2025-11-18"
  }
}

# 동기화 상태 조회
GET /api/v1/lms/integrations/{id}/sync-status

# 동기화 로그 조회
GET /api/v1/lms/integrations/{id}/sync-logs
```

#### 성장 마일스톤 관련

```
# 마일스톤 조회
GET /api/v1/milestones?student_id={uuid}

# 마일스톤 공유
POST /api/v1/milestones/{id}/share
{
  "share_with": ["teacher", "parents"],
  "include_in_lms": true
}
```

### 3.2 웹훅 (Webhooks)

LMS에서 이벤트 발생 시 우리 시스템에 알림

```
# LMS → Our System
POST /api/v1/webhooks/lms-events
{
  "event_type": "assignment_created",
  "lms_provider": "canvas",
  "course_id": "12345",
  "assignment_id": "67890",
  "timestamp": "2025-11-18T10:00:00Z"
}

# Our System → LMS (Growth milestone achieved)
POST {lms_webhook_url}
{
  "event_type": "growth_milestone_achieved",
  "student_id": "uuid",
  "milestone_type": "concept_mastery",
  "title": "분수 덧셈 개념 완전 이해",
  "timestamp": "2025-11-18T11:00:00Z"
}
```

---

## 4. 성장 피드백 메시지 생성

### 4.1 AI 피드백 생성 로직

```python
# AI 프롬프트 템플릿 (성장 중심)
def generate_growth_feedback(attempt_data):
    prompt = f"""
    당신은 격려와 성장을 중시하는 수학 교육 전문가입니다.

    학생 정보:
    - 문제: {attempt_data['problem']}
    - 학생 답안: {attempt_data['student_answer']}
    - 정답: {attempt_data['expected_answer']}
    - 시도 횟수: {attempt_data['attempt_number']}
    - 걸린 시간: {attempt_data['time_spent']}초

    이전 시도 분석:
    {attempt_data['previous_attempts']}

    다음 기준으로 성장 중심 피드백을 작성하세요:
    1. 학생이 보여준 긍정적 시도나 개선점 강조
    2. 오답도 학습 과정의 일부임을 인식
    3. 구체적인 다음 단계 제시
    4. 격려와 동기부여
    5. 성장 마인드셋 강화

    피드백 형식:
    {{
      "encouragement": "긍정적 인정",
      "growth_observed": "관찰된 성장/개선",
      "learning_opportunity": "이번 시도에서 배울 점",
      "next_steps": "다음 단계 제안",
      "celebration": "축하할 점 (있다면)"
    }}
    """

    # Claude API 호출
    response = call_claude_api(prompt)
    return response

# 성장 카테고리 자동 분류
def classify_growth_category(attempt_data):
    if attempt_data['is_correct'] and attempt_data['attempt_number'] == 1:
        return 'first_success'
    elif attempt_data['is_correct'] and attempt_data['attempt_number'] > 1:
        return 'persistent_learning'
    elif not attempt_data['is_correct'] and has_improvement(attempt_data):
        return 'strategy_refinement'
    elif not attempt_data['is_correct'] and is_exploring_concept(attempt_data):
        return 'concept_exploration'
    # ... 기타 카테고리
```

### 4.2 피드백 예시

#### 오답 피드백 (기존 방식 - 지양)
```
❌ 틀렸습니다. 정답은 3/4입니다.
```

#### 성장로그 피드백 (새로운 방식 - 지향)
```
🌱 성장 기록

좋은 시도였어요! 분수를 더하는 과정에서 분자를 더하는 것은 정확히 이해하셨네요.

📊 이번 시도에서 배운 점:
- 분수 덧셈 시 통분이 필요하다는 것을 발견했어요
- 이전 시도보다 30% 빠르게 문제를 해결했어요

🎯 다음 단계:
- 통분 개념을 시각적으로 한 번 더 살펴보면 좋을 것 같아요
- 피자 모델을 이용해 1/2 + 1/4가 어떻게 되는지 직접 조작해보세요

💪 성장 점수: +15 (끈기 있는 학습)

계속 도전해보세요! 여러분은 계속 성장하고 있어요!
```

---

## 5. LMS 연동 구현

### 5.1 지원 LMS 플랫폼

**Phase 1 (MVP)**:
- Canvas LMS
- Moodle
- Google Classroom

**Phase 2**:
- Blackboard Learn
- Schoology
- Custom LMS (API 제공 시)

### 5.2 연동 방식

#### A. LTI (Learning Tools Interoperability) 1.3
```
장점:
- 표준 프로토콜
- 대부분의 LMS가 지원
- SSO 자동 처리

구현:
- LTI Provider로 우리 시스템 등록
- LMS에서 External Tool로 추가
- 성적 자동 동기화 (LTI Advantage)
```

#### B. REST API 직접 연동
```
장점:
- 세밀한 제어 가능
- 커스터마이징 용이

구현:
- 각 LMS의 REST API 활용
- Canvas API, Moodle Web Services 등
- OAuth 2.0 인증
```

#### C. CSV/파일 기반 가져오기/내보내기
```
장점:
- 간단한 구현
- LMS API 없어도 사용 가능

구현:
- 성장로그를 CSV로 내보내기
- LMS에 수동 업로드
- 또는 scheduled import 설정
```

### 5.3 동기화할 데이터

**LMS로 전송 (Push)**:
```
1. 성장 점수 (Growth Score)
   - LMS의 gradebook에 기록
   - 전통적인 점수가 아닌 성장 지표임을 명시

2. 학습 활동 로그
   - 문제 시도 횟수
   - 학습 시간
   - 참여도

3. 성장 마일스톤
   - 주요 성취 기록
   - 배지/인증서

4. 피드백 및 코멘트
   - AI 생성 피드백
   - 교사 코멘트
```

**LMS에서 가져오기 (Pull)**:
```
1. 학생 명단 및 정보
2. 과제/활동 설정
3. 학급 구성 정보
4. 교사 피드백 (LMS에서 작성 시)
```

### 5.4 동기화 전략

```python
# 실시간 동기화 (Real-time)
@app.post("/api/v1/growth-logs")
async def create_growth_log(data: GrowthLogCreate):
    # 1. 성장로그 생성
    growth_log = await db.growth_logs.create(data)

    # 2. 즉시 LMS 동기화 (비동기)
    if should_sync_to_lms(growth_log):
        background_tasks.add_task(sync_to_lms, growth_log)

    return growth_log

# 배치 동기화 (Scheduled)
@celery.task
def sync_growth_logs_batch():
    # 마지막 동기화 이후의 로그 가져오기
    logs = get_unsynced_growth_logs()

    for log in logs:
        try:
            sync_to_lms(log)
            mark_as_synced(log)
        except Exception as e:
            log_sync_error(log, e)
```

---

## 6. 보안 및 프라이버시

### 6.1 데이터 보호

```
- LMS 인증 정보는 AES-256으로 암호화 저장
- 학생 개인 정보는 GDPR/PIPA 준수
- 성장로그 데이터는 학생/보호자 동의 하에만 공유
- LMS 통신은 TLS 1.3 이상 사용
```

### 6.2 접근 제어

```
역할 기반 권한:
- 학생: 자신의 성장로그만 조회
- 교사: 담당 학생들의 성장로그 조회/코멘트
- 관리자: 전체 데이터 접근, LMS 연동 설정
- 시스템: LMS 동기화 작업 실행
```

---

## 7. 성공 지표

### 7.1 기술적 지표

- LMS 동기화 성공률 > 99%
- 실시간 동기화 지연 시간 < 5초
- 배치 동기화 완료 시간 < 10분 (1000 레코드 기준)

### 7.2 교육적 지표

- 학생 동기부여 증가 (설문 조사)
- 재시도율 증가 (포기하지 않고 계속 시도)
- 교사 만족도 (성장 중심 평가에 대한 긍정 반응)
- 학습 지속성 향상

---

## 8. 구현 우선순위

### Phase 1 (MVP) - 4주
- [ ] 성장로그 데이터베이스 스키마 구현
- [ ] 성장로그 CRUD API 개발
- [ ] AI 성장 피드백 생성 로직
- [ ] Canvas LMS 기본 연동 (LTI)

### Phase 2 - 4주
- [ ] 실시간 LMS 동기화
- [ ] 성장 마일스톤 시스템
- [ ] Moodle 연동
- [ ] 성장 분석 대시보드

### Phase 3 - 4주
- [ ] 추가 LMS 플랫폼 지원
- [ ] 양방향 동기화
- [ ] 고급 분석 기능
- [ ] 학부모 리포트 생성

---

## 9. 예상 과제 및 해결 방안

### 과제 1: LMS마다 다른 API 구조
**해결**: Adapter 패턴 사용, 각 LMS별 어댑터 구현

### 과제 2: 성장 점수의 LMS gradebook 매핑
**해결**:
- 0-100 스케일로 정규화
- 설명 필드에 "성장 지표" 명시
- 교사 대시보드에서 상세 정보 제공

### 과제 3: 실시간 동기화 성능
**해결**:
- 메시지 큐 (Redis/RabbitMQ) 사용
- 비동기 처리
- 배치 처리 옵션 제공

---

## 10. 참고 자료

### LMS API 문서
- Canvas API: https://canvas.instructure.com/doc/api/
- Moodle Web Services: https://docs.moodle.org/dev/Web_services
- LTI Advantage: https://www.imsglobal.org/activity/learning-tools-interoperability

### 성장 마인드셋 참고
- Carol Dweck의 성장 마인드셋 연구
- Formative Assessment 원칙
- Standards-Based Grading

---

## Document Control

- **Version**: 1.0.0
- **Author**: AI Development Team
- **Created**: 2025-11-18
- **Purpose**: LMS 연동 및 성장로그 시스템 기술 설계
- **Target**: Development Team, Product Managers
