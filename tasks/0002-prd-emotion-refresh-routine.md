# PRD: 1분 감정 리프레시 루틴 기능 (1-Minute Emotion Refresh Routine)

**작성자**: AI Education System Development Team
**날짜**: 2025-11-18
**버전**: 1.0
**상태**: Draft

---

## 1. 개요 (Executive Summary)

### 1.1 목적
KAIST Touch Math Academy AI 교육 시스템에 학생의 감정 상태를 모니터링하고, 1분 내에 완료할 수 있는 맞춤형 감정 리프레시 루틴을 제공하는 기능을 추가합니다. 이를 통해 학생들의 정서적 웰빙을 개선하고 학습 효율성을 높입니다.

### 1.2 배경
- 장시간 학습 시 학생들의 집중력 저하 및 스트레스 증가
- 감정 상태가 학습 성과에 미치는 영향이 크다는 연구 결과
- 짧은 시간(1분)의 웰니스 활동으로도 감정 상태 개선 가능

### 1.3 목표
- 학생의 감정 상태를 실시간으로 파악
- AI 기반 맞춤형 1분 리프레시 루틴 자동 생성
- 감정 개선 효과 측정 및 분석
- 교사가 학생들의 감정 트렌드를 모니터링할 수 있는 대시보드 제공

---

## 2. 사용자 스토리 (User Stories)

### 2.1 학생 관점
**As a** 학생
**I want to** 학습 중 내 감정 상태를 체크하고 빠르게 기분을 전환할 수 있는 활동을 받기를
**So that** 스트레스를 줄이고 더 효과적으로 학습할 수 있다

**Acceptance Criteria:**
- [ ] 학습 중 언제든지 감정 체크인 가능
- [ ] 1분 이내에 완료할 수 있는 활동 제공
- [ ] 활동 후 기분 변화를 기록
- [ ] 내 감정 히스토리를 시각적으로 확인

### 2.2 교사 관점
**As a** 교사
**I want to** 학생들의 감정 상태와 웰빙 트렌드를 모니터링하기를
**So that** 필요한 학생에게 적절한 지원을 제공할 수 있다

**Acceptance Criteria:**
- [ ] 반 전체의 집계된 감정 데이터 확인
- [ ] 개별 학생의 감정 패턴 분석 (익명화)
- [ ] 감정 상태와 학습 성과의 상관관계 확인
- [ ] 알림: 특정 학생의 부정적 감정 지속 시

---

## 3. 기능 요구사항 (Functional Requirements)

### FR-1: 감정 체크인 (Emotion Check-In)

#### FR-1.1 감정 상태 선택
- 학생이 현재 감정 상태를 선택할 수 있는 UI 제공
- 감정 옵션:
  - 😊 행복 (Happy)
  - 😰 스트레스 (Stressed)
  - 😓 피곤 (Tired)
  - 😐 지루함 (Bored)
  - 😡 화남 (Frustrated)
  - 🎯 집중 (Focused)
  - 😟 불안 (Anxious)

#### FR-1.2 감정 강도 입력
- 1-10 스케일로 감정의 강도 입력
- 슬라이더 UI 또는 숫자 선택

#### FR-1.3 선택적 메모
- 학생이 추가 컨텍스트를 텍스트로 입력 가능 (선택사항)
- 예: "수학 문제가 너무 어려워요"

### FR-2: AI 기반 1분 리프레시 루틴 생성

#### FR-2.1 활동 자동 생성
- Claude API를 사용하여 맞춤형 활동 생성
- 입력 변수:
  - 현재 감정 상태
  - 감정 강도
  - 학생 연령/학년
  - 학습 중인 모듈 정보
  - 학습 경과 시간
  - 과거 선호 활동 (선택사항)

#### FR-2.2 활동 유형
1. **호흡 운동 (Breathing Exercise)**
   - 4-7-8 호흡법
   - 박스 호흡법
   - 애니메이션 가이드

2. **간단한 스트레칭 (Quick Stretch)**
   - 목/어깨 스트레칭
   - 손목/손가락 운동
   - 앉은 자세 개선

3. **마인드풀니스 (Mindfulness)**
   - 1분 명상 가이드
   - 감각 집중 (5-4-3-2-1 기법)
   - 긍정 확언 (Positive Affirmation)

4. **에너지 부스트 (Energy Boost)**
   - 가벼운 움직임 (제자리 걷기 등)
   - 리듬 박수
   - 간단한 게임

#### FR-2.3 타이머 기능
- 정확히 60초 타이머
- 시각적 진행 표시 (원형 프로그레스 바)
- 음성/텍스트 가이드 (단계별)

### FR-3: 활동 실행 및 피드백

#### FR-3.1 활동 플레이어
- 전체화면 또는 모달 형식
- 단계별 지시사항 표시
- 애니메이션 또는 비디오 가이드
- 배경음악 (선택사항, 학생이 켜고 끌 수 있음)

#### FR-3.2 활동 후 감정 재평가
- 활동 완료 후 감정 상태 다시 체크
- 개선도 계산 및 표시
- 긍정적 피드백 메시지

#### FR-3.3 활동 평가
- 활동이 도움이 되었는지 평가 (👍/👎)
- 다음에 비슷한 활동 선호 여부

### FR-4: 데이터 수집 및 분석

#### FR-4.1 감정 데이터 저장
- 모든 체크인 기록 저장
- 활동 전/후 감정 상태
- 활동 참여도 및 평가

#### FR-4.2 학생 대시보드
- 개인 감정 히스토리 시각화
- 주간/월간 감정 트렌드 그래프
- 가장 효과적이었던 활동 추천

#### FR-4.3 교사 대시보드
- 반 전체 감정 트렌드 (집계)
- 감정 상태와 학습 성과 상관관계
- 리프레시 루틴 참여율
- 익명화된 데이터만 표시 (개인 정보 보호)

### FR-5: 자동 트리거 (선택사항 - Phase 2)

#### FR-5.1 시간 기반 트리거
- 30분 학습 후 자동으로 리프레시 제안
- 학생이 설정에서 간격 조정 가능

#### FR-5.2 행동 기반 트리거
- 반복적인 오답 입력 시
- 학습 속도가 현저히 느려질 때
- 장시간 활동 없음 감지 시

---

## 4. 비기능 요구사항 (Non-Functional Requirements)

### NFR-1: 성능
- 감정 체크인 저장: < 500ms
- AI 활동 생성: < 3초
- UI 반응성: 60fps 유지

### NFR-2: 확장성
- 동시 사용자 1,000명 지원
- 감정 데이터 무제한 히스토리 저장

### NFR-3: 보안 및 개인정보
- 감정 데이터 암호화 저장
- FERPA/COPPA 준수
- 학생은 자신의 데이터만 접근
- 교사는 집계된 익명 데이터만 접근

### NFR-4: 접근성
- WCAG 2.1 AA 기준 충족
- 키보드 네비게이션 완전 지원
- 스크린 리더 호환

### NFR-5: 다국어 지원
- 한국어 우선 지원
- 영어 지원 (Phase 2)

---

## 5. 기술 아키텍처

### 5.1 시스템 구성도

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (React)                     │
│  ┌──────────────────┐  ┌──────────────────────────┐    │
│  │ Emotion Check-In │  │ Refresh Routine Player   │    │
│  │    Widget        │  │      Component           │    │
│  └──────────────────┘  └──────────────────────────┘    │
│           │                        │                     │
│           └───────┬────────────────┘                     │
│                   │ WebSocket / REST API                │
└───────────────────┼──────────────────────────────────────┘
                    │
┌───────────────────┼──────────────────────────────────────┐
│                   │   API Gateway (Node.js)              │
│                   ▼                                      │
│  ┌──────────────────────────────────────────┐           │
│  │      Emotion & Routine Routes            │           │
│  │  /api/emotions/check-in                  │           │
│  │  /api/refresh/generate                   │           │
│  │  /api/refresh/complete                   │           │
│  └──────────────────────────────────────────┘           │
└───────────────────┼──────────────────────────────────────┘
                    │
┌───────────────────┼──────────────────────────────────────┐
│                   │   Backend Services (Python)          │
│                   ▼                                      │
│  ┌─────────────────────────────────────────┐            │
│  │     Emotion Service (FastAPI)           │            │
│  │  - emotion_service.py                   │            │
│  │  - routine_generator.py                 │            │
│  │  - wellness_orchestrator.py             │            │
│  └─────────────────────────────────────────┘            │
│                   │                                      │
│                   ├──► Claude API (Activity Generation)  │
│                   ├──► PostgreSQL (Data Storage)         │
│                   └──► Redis Cache (Session Data)        │
└──────────────────────────────────────────────────────────┘
```

### 5.2 데이터베이스 스키마

```sql
-- 감정 체크인 기록
CREATE TABLE emotion_check_ins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id),
    module_id UUID REFERENCES modules(id),
    emotion_type VARCHAR(50) NOT NULL,
    emotion_score INTEGER CHECK (emotion_score BETWEEN 1 AND 10),
    context_note TEXT,
    session_duration_minutes INTEGER,
    timestamp TIMESTAMP DEFAULT NOW(),

    INDEX idx_student_timestamp (student_id, timestamp),
    INDEX idx_module_timestamp (module_id, timestamp)
);

-- 리프레시 활동 템플릿 (AI 생성)
CREATE TABLE refresh_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    activity_type VARCHAR(100) NOT NULL,
    target_emotion VARCHAR(50),
    duration_seconds INTEGER DEFAULT 60,
    difficulty_level INTEGER CHECK (difficulty_level BETWEEN 1 AND 5),
    min_grade_level INTEGER,
    max_grade_level INTEGER,
    ai_generated_content JSONB NOT NULL,
    -- JSONB 구조:
    -- {
    --   "title": "차분한 호흡",
    --   "description": "4-7-8 호흡법으로 마음을 안정시켜요",
    --   "steps": [
    --     {"time": 0, "instruction": "편안하게 앉으세요", "visual": "sitting.svg"},
    --     {"time": 4, "instruction": "4초 동안 숨을 들이마세요", "visual": "inhale.svg"},
    --     {"time": 11, "instruction": "7초 동안 숨을 참으세요", "visual": "hold.svg"},
    --     {"time": 18, "instruction": "8초 동안 숨을 내쉬세요", "visual": "exhale.svg"}
    --   ],
    --   "background_music": "calm-ambient.mp3",
    --   "visual_guide": "breathing-animation.json"
    -- }
    usage_count INTEGER DEFAULT 0,
    avg_effectiveness_score FLOAT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 학생 리프레시 세션
CREATE TABLE student_refresh_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id),
    activity_id UUID NOT NULL REFERENCES refresh_activities(id),
    module_id UUID REFERENCES modules(id),
    pre_emotion_type VARCHAR(50) NOT NULL,
    pre_emotion_score INTEGER NOT NULL,
    post_emotion_type VARCHAR(50),
    post_emotion_score INTEGER,
    engagement_level INTEGER CHECK (engagement_level BETWEEN 1 AND 5),
    completed BOOLEAN DEFAULT FALSE,
    completion_percentage INTEGER DEFAULT 0,
    student_rating INTEGER CHECK (student_rating IN (-1, 0, 1)), -- 👎, neutral, 👍
    session_timestamp TIMESTAMP DEFAULT NOW(),
    duration_seconds INTEGER,

    INDEX idx_student_session (student_id, session_timestamp),
    INDEX idx_activity_rating (activity_id, student_rating)
);

-- 감정 분석 캐시 (교사 대시보드용)
CREATE TABLE emotion_analytics_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    module_id UUID NOT NULL REFERENCES modules(id),
    date DATE NOT NULL,
    total_check_ins INTEGER DEFAULT 0,
    avg_emotion_score FLOAT,
    emotion_distribution JSONB,
    -- {"happy": 15, "stressed": 8, "tired": 5, ...}
    refresh_participation_rate FLOAT,
    avg_improvement_score FLOAT,
    last_updated TIMESTAMP DEFAULT NOW(),

    UNIQUE(module_id, date)
);
```

### 5.3 API 엔드포인트

#### 감정 체크인
```
POST /api/emotions/check-in
Request Body:
{
  "student_id": "uuid",
  "module_id": "uuid",
  "emotion_type": "stressed",
  "emotion_score": 7,
  "context_note": "수학 문제가 너무 어려워요",
  "session_duration_minutes": 25
}

Response:
{
  "check_in_id": "uuid",
  "suggested_activity_id": "uuid",
  "message": "잠깐 쉬면서 기분을 전환해볼까요?"
}
```

#### 리프레시 활동 생성
```
POST /api/refresh/generate
Request Body:
{
  "student_id": "uuid",
  "check_in_id": "uuid",
  "emotion_type": "stressed",
  "emotion_score": 7,
  "grade_level": 5,
  "preferences": {
    "preferred_activities": ["breathing", "mindfulness"],
    "avoid_activities": ["physical"]
  }
}

Response:
{
  "activity_id": "uuid",
  "activity": {
    "title": "차분한 호흡",
    "description": "4-7-8 호흡법으로 마음을 안정시켜요",
    "duration_seconds": 60,
    "steps": [...],
    "visual_guide": {...}
  }
}
```

#### 세션 완료
```
POST /api/refresh/complete
Request Body:
{
  "session_id": "uuid",
  "post_emotion_type": "focused",
  "post_emotion_score": 4,
  "completed": true,
  "student_rating": 1
}

Response:
{
  "improvement_score": 3,
  "message": "좋아요! 기분이 많이 나아졌네요 😊",
  "badges": ["first_refresh", "stress_buster"]
}
```

#### 학생 감정 히스토리
```
GET /api/emotions/student/{student_id}?days=7

Response:
{
  "student_id": "uuid",
  "date_range": {"start": "2025-11-11", "end": "2025-11-18"},
  "emotion_trend": [
    {"date": "2025-11-11", "avg_score": 6.5, "check_ins": 3},
    {"date": "2025-11-12", "avg_score": 5.2, "check_ins": 4},
    ...
  ],
  "most_common_emotion": "focused",
  "total_refresh_sessions": 12,
  "avg_improvement": 2.8
}
```

#### 교사 대시보드 분석
```
GET /api/emotions/analytics/{module_id}?date=2025-11-18

Response:
{
  "module_id": "uuid",
  "date": "2025-11-18",
  "total_students": 25,
  "total_check_ins": 47,
  "avg_emotion_score": 5.8,
  "emotion_distribution": {
    "happy": 12,
    "stressed": 8,
    "tired": 10,
    "focused": 15,
    "frustrated": 2
  },
  "refresh_participation_rate": 0.68,
  "avg_improvement_score": 2.3,
  "correlation_with_performance": 0.42
}
```

### 5.4 Claude AI 프롬프트 템플릿

```python
# backend/src/prompts/emotion_refresh_prompts.py

ACTIVITY_GENERATION_PROMPT = """
Role: You are a wellness and education expert specializing in quick emotional regulation techniques for students.

Context:
- Student Grade Level: {grade_level}
- Current Emotion: {emotion_type} (intensity: {emotion_score}/10)
- Learning Duration: {session_duration_minutes} minutes
- Subject: {subject}
- Previous Successful Activities: {past_preferences}

Task: Generate a personalized 1-minute (60 seconds) emotion refresh routine.

Constraints:
- Must be exactly 60 seconds
- Age-appropriate for grade {grade_level}
- Can be done while sitting at a desk
- No special equipment needed
- Should improve {emotion_type} emotion
- Clear step-by-step instructions

Activity Types Available:
1. Breathing Exercise (4-7-8, box breathing, etc.)
2. Quick Stretch (neck, shoulders, wrists)
3. Mindfulness (5-4-3-2-1 senses, body scan)
4. Energy Boost (gentle movement, rhythm)

Output Format (JSON):
{{
  "title": "Korean title (short and friendly)",
  "description": "Korean description (encouraging tone)",
  "activity_type": "breathing|stretch|mindfulness|energy",
  "steps": [
    {{
      "time_seconds": 0,
      "instruction": "Korean instruction (clear and simple)",
      "duration_seconds": 4,
      "visual_cue": "inhale|exhale|hold|stretch|relax|focus"
    }},
    ...
  ],
  "total_duration": 60,
  "expected_outcome": "Korean description of expected feeling",
  "encouragement": "Korean encouraging message for completion"
}}

Generate the activity now:
"""

FEEDBACK_GENERATION_PROMPT = """
Role: You are an encouraging mentor for students.

Context:
- Pre-activity emotion: {pre_emotion} (score: {pre_score}/10)
- Post-activity emotion: {post_emotion} (score: {post_score}/10)
- Improvement: {improvement} points
- Student completed: {completed}

Task: Generate an encouraging, age-appropriate feedback message in Korean.

Guidelines:
- Be genuinely encouraging, not patronizing
- Acknowledge the effort
- If improvement is small or negative, still be positive and suggest trying again later
- Keep it to 1-2 sentences
- Use appropriate emoji (1-2 max)

Output (plain text, Korean):
"""
```

---

## 6. UI/UX 디자인

### 6.1 감정 체크인 위젯

**위치**: 학생 학습 모듈 우측 상단 또는 하단 플로팅 버튼

**상태 1: 축소 모드**
```
┌──────────────┐
│   🙂 기분?   │  ← 클릭 가능한 버튼
└──────────────┘
```

**상태 2: 확장 모드 (클릭 시)**
```
┌─────────────────────────────────────┐
│  지금 기분이 어때요?                │
│                                     │
│  😊  😰  😓  😐  😡  🎯  😟        │
│  행복 스트레스 피곤 지루함 화남 집중 불안 │
│                                     │
│  [감정 강도 슬라이더: 1━━━●━━━━10]  │
│                                     │
│  메모 (선택사항):                   │
│  [_____________________________]    │
│                                     │
│  [체크인]  [나중에]                 │
└─────────────────────────────────────┘
```

### 6.2 리프레시 루틴 플레이어

**전체화면 모달**
```
┌────────────────────────────────────────────┐
│                                         [X] │
│                                            │
│          🌊 차분한 호흡                     │
│     4-7-8 호흡법으로 마음을 안정시켜요       │
│                                            │
│              ╭───────────╮                 │
│              │           │                 │
│              │    ◉      │  ← 애니메이션   │
│              │           │                 │
│              ╰───────────╯                 │
│                                            │
│         4초 동안 숨을 들이마세요             │
│                                            │
│   ●━━━━━━━━━━━━━━━━━━○━━━━━━━━━━━         │
│              37초 남음                      │
│                                            │
│                                            │
│            [🔇] [⏸️] [⏭️]                   │
└────────────────────────────────────────────┘
```

**활동 완료 화면**
```
┌────────────────────────────────────────────┐
│                                            │
│                  🎉                         │
│              잘했어요!                       │
│                                            │
│        이제 기분이 어떤가요?                 │
│                                            │
│  😊  😰  😓  😐  😡  🎯  😟                │
│                                            │
│  [감정 강도 슬라이더: 1━━━━━━━●━━10]        │
│                                            │
│     이 활동이 도움이 되었나요?               │
│         👍  👎                             │
│                                            │
│          [학습 계속하기]                     │
└────────────────────────────────────────────┘
```

### 6.3 학생 감정 대시보드

```
┌───────────────────────────────────────────────────────┐
│  내 감정 기록 📊                      [지난 7일 ▼]    │
├───────────────────────────────────────────────────────┤
│                                                       │
│  감정 트렌드                                          │
│  10 ┤                                                │
│   8 ┤      ●                                         │
│   6 ┤   ●     ●   ●                                  │
│   4 ┤            ●   ●   ●   ●                       │
│   2 ┤                                                │
│   0 └──────────────────────────────                  │
│      월  화  수  목  금  토  일                       │
│                                                       │
│  가장 자주 느낀 감정: 🎯 집중 (35%)                    │
│  리프레시 루틴 참여: 12회                              │
│  평균 기분 개선: +2.8점                                │
│                                                       │
│  ───────────────────────────────────────             │
│                                                       │
│  나에게 효과적인 활동 💪                               │
│  1. 🌊 차분한 호흡 (평균 +3.5점)                      │
│  2. 🧘 1분 명상 (평균 +3.2점)                         │
│  3. 💪 간단한 스트레칭 (평균 +2.8점)                   │
│                                                       │
└───────────────────────────────────────────────────────┘
```

### 6.4 교사 대시보드 (집계된 데이터)

```
┌───────────────────────────────────────────────────────┐
│  반 감정 분석 📈                  [2025-11-18 ▼]      │
├───────────────────────────────────────────────────────┤
│                                                       │
│  오늘의 체크인: 47회 (학생 25명 중 23명 참여)          │
│  평균 감정 점수: 5.8/10                                │
│  리프레시 참여율: 68%                                  │
│                                                       │
│  감정 분포                                             │
│  ┌─────────────────────────────────────────┐        │
│  │ 🎯 집중      ████████████████  15 (32%)  │        │
│  │ 😊 행복      ████████████      12 (26%)  │        │
│  │ 😓 피곤      ██████████        10 (21%)  │        │
│  │ 😰 스트레스  ████████           8 (17%)  │        │
│  │ 😡 화남      ██                 2 (4%)   │        │
│  └─────────────────────────────────────────┘        │
│                                                       │
│  📊 감정 트렌드 (지난 7일)                             │
│  평균 점수가 5.2 → 5.8로 개선되었습니다 ↑              │
│                                                       │
│  🔗 학습 성과 상관관계                                 │
│  감정 점수와 문제 정답률: 0.42 (중간 상관관계)          │
│                                                       │
│  ⚠️ 알림                                              │
│  • 3명의 학생이 3일 연속 낮은 감정 점수                 │
│    (개별 지원 필요 가능성)                             │
│                                                       │
└───────────────────────────────────────────────────────┘
```

---

## 7. 구현 단계 (Implementation Phases)

### Phase 1: 기본 기능 (2주)
- [ ] 데이터베이스 스키마 생성
- [ ] 감정 체크인 API 구현
- [ ] 기본 프론트엔드 컴포넌트 (체크인 위젯)
- [ ] Claude AI 프롬프트 통합
- [ ] 리프레시 활동 생성 API

### Phase 2: 활동 플레이어 (1.5주)
- [ ] 리프레시 루틴 플레이어 UI
- [ ] 타이머 및 애니메이션
- [ ] 활동 후 피드백 수집
- [ ] 학생 감정 히스토리 페이지

### Phase 3: 분석 및 대시보드 (1.5주)
- [ ] 교사 대시보드 구현
- [ ] 감정 트렌드 시각화
- [ ] 상관관계 분석 알고리즘
- [ ] 알림 시스템

### Phase 4: 최적화 및 개선 (1주)
- [ ] 성능 최적화
- [ ] A/B 테스트 프레임워크
- [ ] 접근성 테스트 및 개선
- [ ] 사용자 피드백 수집 및 반영

### Phase 5: 고급 기능 (향후)
- [ ] 자동 트리거 (시간/행동 기반)
- [ ] 더 다양한 활동 유형
- [ ] 음성 가이드
- [ ] 커스터마이징 가능한 활동

---

## 8. 성공 지표 (Success Metrics)

### 8.1 사용량 지표
- 일일 활성 사용자 (DAU) 중 감정 체크인 참여율 > 60%
- 리프레시 루틴 완료율 > 75%
- 학생당 평균 주간 체크인 횟수 > 5

### 8.2 효과성 지표
- 평균 감정 개선 점수 > +2.0
- 활동 긍정 평가율 (👍) > 70%
- 체크인 후 학습 지속률 > 85%

### 8.3 학습 성과 지표
- 감정 상태와 문제 정답률 상관관계 분석
- 리프레시 루틴 참여 학생의 평균 성적 개선
- 학습 세션 평균 시간 증가

### 8.4 교사 만족도
- 교사 대시보드 사용률 > 50%
- 교사 피드백 만족도 > 4.0/5.0
- 학생 웰빙 인식 개선도

---

## 9. 리스크 및 완화 전략

### 9.1 개인정보 보호
**리스크**: 감정 데이터는 매우 민감한 개인정보
**완화**:
- 엔드투엔드 암호화
- 최소한의 데이터 수집
- 학생/학부모 동의 필수
- 데이터 보유 기간 제한 (1년)

### 9.2 AI 생성 콘텐츠 품질
**리스크**: 부적절하거나 효과 없는 활동 생성 가능
**완화**:
- 인간 전문가 검증 프로세스
- 활동 템플릿 큐레이션
- 실시간 피드백 루프
- 비상 대체 활동 풀

### 9.3 학생 과의존
**리스크**: 학생들이 감정 조절을 시스템에만 의존
**완화**:
- 교육 콘텐츠: 자기 조절 기술 학습
- 적절한 사용 빈도 가이드
- 교사/상담사 개입 필요 시 알림

### 9.4 기술적 제약
**리스크**: Claude API 지연 또는 장애
**완화**:
- 사전 생성된 활동 캐시
- 폴백 메커니즘
- 오프라인 모드 지원

---

## 10. 향후 확장 가능성

### 10.1 생리적 데이터 통합 (Phase 3+)
- 웨어러블 기기 연동 (심박수, 활동량)
- 자동 감정 상태 감지
- 더 정확한 맞춤형 추천

### 10.2 소셜 기능 (Phase 3+)
- 반 전체 그룹 리프레시 활동
- 친구와 함께하는 챌린지
- 감정 일기 공유 (선택적)

### 10.3 장기 웰니스 프로그램 (Phase 4+)
- 주간/월간 웰니스 목표 설정
- 개인화된 웰니스 플랜
- 전문 상담사 연결

---

## 11. 참고 자료

### 11.1 연구 논문
- Gross, J. J. (2015). Emotion Regulation: Current Status and Future Prospects. *Psychological Inquiry*, 26(1), 1-26.
- Pekrun, R. (2006). The Control-Value Theory of Achievement Emotions. *Educational Psychology Review*, 18(4), 315-341.

### 11.2 유사 제품
- Calm (명상 앱)
- Headspace (마인드풀니스 앱)
- Moodpath (감정 추적 앱)

### 11.3 디자인 가이드라인
- Apple Human Interface Guidelines - Wellness Apps
- Google Material Design - Health & Wellness

---

## 12. 부록

### 12.1 용어 정의
- **감정 체크인**: 학생이 현재 감정 상태를 기록하는 행위
- **리프레시 루틴**: 1분 내에 완료할 수 있는 감정 개선 활동
- **감정 점수**: 1-10 스케일로 측정된 감정의 강도
- **개선 점수**: 활동 전후 감정 점수의 차이

### 12.2 예시 활동 템플릿

**호흡 운동: 4-7-8 기법**
```json
{
  "title": "차분한 호흡",
  "description": "4-7-8 호흡법으로 마음을 안정시켜요",
  "activity_type": "breathing",
  "duration_seconds": 60,
  "steps": [
    {
      "time_seconds": 0,
      "instruction": "편안하게 앉아 눈을 감으세요",
      "duration_seconds": 5,
      "visual_cue": "relax"
    },
    {
      "time_seconds": 5,
      "instruction": "4초 동안 코로 천천히 숨을 들이마세요",
      "duration_seconds": 4,
      "visual_cue": "inhale"
    },
    {
      "time_seconds": 9,
      "instruction": "7초 동안 숨을 참으세요",
      "duration_seconds": 7,
      "visual_cue": "hold"
    },
    {
      "time_seconds": 16,
      "instruction": "8초 동안 입으로 천천히 숨을 내쉬세요",
      "duration_seconds": 8,
      "visual_cue": "exhale"
    },
    {
      "time_seconds": 24,
      "instruction": "다시 4초 동안 숨을 들이마세요",
      "duration_seconds": 4,
      "visual_cue": "inhale"
    },
    {
      "time_seconds": 28,
      "instruction": "7초 동안 숨을 참으세요",
      "duration_seconds": 7,
      "visual_cue": "hold"
    },
    {
      "time_seconds": 35,
      "instruction": "8초 동안 숨을 내쉬세요",
      "duration_seconds": 8,
      "visual_cue": "exhale"
    },
    {
      "time_seconds": 43,
      "instruction": "마지막으로 4초 동안 숨을 들이마세요",
      "duration_seconds": 4,
      "visual_cue": "inhale"
    },
    {
      "time_seconds": 47,
      "instruction": "7초 동안 숨을 참으세요",
      "duration_seconds": 7,
      "visual_cue": "hold"
    },
    {
      "time_seconds": 54,
      "instruction": "8초 동안 숨을 내쉬고, 눈을 뜨세요",
      "duration_seconds": 6,
      "visual_cue": "exhale"
    }
  ],
  "expected_outcome": "마음이 차분해지고 집중력이 높아질 거예요",
  "encouragement": "잘했어요! 언제든지 필요할 때 다시 해보세요 🌟"
}
```

---

**변경 이력**

| 버전 | 날짜 | 작성자 | 변경 내용 |
|------|------|--------|----------|
| 1.0 | 2025-11-18 | AI Dev Team | 초기 PRD 작성 |

---

**승인**

| 역할 | 이름 | 날짜 | 서명 |
|------|------|------|------|
| Product Owner | | | |
| Tech Lead | | | |
| UX Designer | | | |
| Security Lead | | | |

---

*이 문서는 KAIST Touch Math Academy AI 교육 시스템의 공식 PRD입니다.*
