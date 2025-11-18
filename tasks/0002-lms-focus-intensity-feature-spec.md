# LMS 연동 및 집중 강도 조절 기능 명세서
# LMS Integration and Focus Intensity Adjustment Feature Specification

## 1. 개요 (Overview)

### 배경 (Background)
기존 AI Education System Pipeline (PRD 0001)에서 LMS 통합은 Phase 3/Future Work로 계획되어 있었습니다. 본 명세서는 학생이 문제를 풀 때 **문제 난이도에 따라 집중 강도를 자동으로 조절**하는 기능과 **외부 LMS와의 연동**을 정의합니다.

### 목적 (Purpose)
1. **적응형 학습 환경**: 학생의 실시간 수행 능력과 문제 난이도에 맞춰 UI/UX를 동적으로 조절
2. **학습 몰입도 향상**: 집중 강도 조절을 통해 학생의 학습 몰입(Flow State) 유지
3. **LMS 통합**: Canvas, Moodle 등 주요 LMS와의 seamless 연동으로 기존 학습 생태계에 통합
4. **데이터 기반 개인화**: 학생별 집중 강도 패턴 분석을 통한 맞춤형 학습 경험 제공

### 범위 (Scope)
- **Phase 1**: 집중 강도 조절 기능 (Focus Intensity Adjustment)
- **Phase 2**: LMS 기본 연동 (LTI 1.3 표준)
- **Phase 3**: 고급 분석 및 적응형 알고리즘

---

## 2. 핵심 개념 정의 (Core Concepts)

### 2.1 집중 강도 (Focus Intensity)
학생이 문제를 풀 때 경험하는 **인지적 부하와 몰입 수준을 조절하는 UI/UX 파라미터들의 집합**

#### 집중 강도 레벨 (5단계)
| 레벨 | 이름 | 설명 | 적용 상황 |
|------|------|------|----------|
| 1 | Relaxed (편안함) | 최소한의 압박, 충분한 시간과 힌트 제공 | 새로운 개념 학습, 난이도 1-2 문제 |
| 2 | Comfortable (여유) | 적당한 시간, 필요 시 힌트 제공 | 복습 단계, 난이도 2-3 문제 |
| 3 | Engaged (집중) | 표준 시간, 제한적 힌트 | 일반적인 연습, 난이도 3 문제 |
| 4 | Challenged (도전) | 짧은 시간, 최소 힌트 | 숙련도 향상, 난이도 4 문제 |
| 5 | Peak Focus (최고 집중) | 타이트한 시간, 힌트 없음 | 평가/시험, 난이도 5 문제 |

#### 집중 강도에 따른 UI/UX 변화
```typescript
interface FocusIntensitySettings {
  // 시간 관련
  timeLimit: number;              // 문제당 제한 시간 (초)
  showTimer: boolean;             // 타이머 표시 여부
  timerUrgencyThreshold: number;  // 긴박감 표시 임계값 (%)

  // 힌트 및 도움말
  hintsAvailable: number;         // 사용 가능한 힌트 수
  hintDelay: number;              // 힌트 활성화까지 대기 시간 (초)
  showSolution: boolean;          // 정답 보기 옵션 표시 여부

  // 시각적 요소
  uiComplexity: 'minimal' | 'standard' | 'rich';  // UI 복잡도
  distractionLevel: 'none' | 'low' | 'medium';    // 시각적 자극 수준
  backgroundColor: string;         // 배경색 (집중도에 따라 변경)
  animationSpeed: number;          // 애니메이션 속도 (0-1)

  // 피드백
  immediateFeedback: boolean;      // 즉시 피드백 제공 여부
  feedbackDetail: 'minimal' | 'detailed' | 'comprehensive';
  encouragementFrequency: number;  // 격려 메시지 빈도

  // 음향 (선택적)
  soundEnabled: boolean;
  backgroundMusic: 'none' | 'ambient' | 'focus';
  soundEffects: boolean;
}
```

### 2.2 난이도-집중도 매핑 알고리즘
기본 매핑 규칙 (자동 조정 전):
```
문제 난이도 (1-5) → 기본 집중 강도 (1-5)
├─ 난이도 1 → 집중 강도 1 (Relaxed)
├─ 난이도 2 → 집중 강도 2 (Comfortable)
├─ 난이도 3 → 집중 강도 3 (Engaged)
├─ 난이도 4 → 집중 강도 4 (Challenged)
└─ 난이도 5 → 집중 강도 5 (Peak Focus)
```

#### 적응형 조정 규칙
학생의 실시간 수행 능력에 따라 집중 강도를 조정:

```python
def calculate_adaptive_intensity(
    base_difficulty: int,          # 1-5
    student_accuracy_rate: float,  # 0.0-1.0
    avg_response_time: float,      # 초
    expected_response_time: float, # 초
    consecutive_correct: int,
    consecutive_incorrect: int
) -> int:
    """
    적응형 집중 강도 계산
    """
    intensity = base_difficulty  # 기본값

    # 정확도 기반 조정
    if student_accuracy_rate > 0.9 and consecutive_correct >= 3:
        intensity = min(5, intensity + 1)  # 강도 증가
    elif student_accuracy_rate < 0.5 and consecutive_incorrect >= 2:
        intensity = max(1, intensity - 1)  # 강도 감소

    # 응답 속도 기반 조정
    speed_ratio = avg_response_time / expected_response_time
    if speed_ratio < 0.5 and student_accuracy_rate > 0.8:
        intensity = min(5, intensity + 1)  # 너무 쉬움 → 강도 증가
    elif speed_ratio > 2.0 and student_accuracy_rate < 0.7:
        intensity = max(1, intensity - 1)  # 너무 어려움 → 강도 감소

    return intensity
```

### 2.3 LMS 통합 방식

#### 지원 LMS 플랫폼 (Phase 2)
- **Canvas** (Priority 1)
- **Moodle** (Priority 2)
- **Google Classroom** (Priority 3)
- **기타 LTI 1.3 호환 LMS**

#### 통합 프로토콜
**LTI 1.3 (Learning Tools Interoperability)**
- 표준 OAuth 2.0 기반 인증
- Deep Linking 지원
- Assignment and Grade Services (AGS)
- Names and Role Provisioning Services (NRPS)

---

## 3. 사용자 스토리 (User Stories)

### Story 1: 적응형 난이도 조절 경험 (학생 관점)
> **As a** 수학 학습 학생
> **I want** 시스템이 내 실력에 맞춰 자동으로 문제의 집중 강도를 조절해주길
> **So that** 너무 쉽거나 어렵지 않은 최적의 학습 경험을 할 수 있다

**Acceptance Criteria**:
- [ ] 쉬운 문제는 편안한 UI로 제시됨 (힌트 많음, 시간 여유)
- [ ] 어려운 문제는 집중된 UI로 제시됨 (최소 힌트, 제한 시간)
- [ ] 연속으로 맞추면 자동으로 강도가 올라감
- [ ] 연속으로 틀리면 자동으로 강도가 낮아짐
- [ ] 강도 변화를 시각적으로 느낄 수 있음

### Story 2: LMS 통합 수업 관리 (교사 관점)
> **As a** 수학 선생님
> **I want** 생성한 모듈을 Canvas LMS에 바로 연동할 수 있길
> **So that** 학생들이 기존 LMS에서 seamless하게 학습하고 성적이 자동으로 동기화될 수 있다

**Acceptance Criteria**:
- [ ] Canvas에서 "External Tool" 추가 시 모듈 선택 가능
- [ ] 학생이 Canvas에서 과제 클릭 시 모듈로 자동 로그인
- [ ] 학생의 진도와 점수가 Canvas Grade Book에 자동 반영
- [ ] 교사가 Canvas에서 학생별 진도 확인 가능

### Story 3: 집중 강도 분석 (교사 관점)
> **As a** 교사
> **I want** 학생별로 어떤 집중 강도에서 가장 학습 효과가 좋은지 분석 리포트를 보고 싶다
> **So that** 각 학생에게 최적화된 학습 전략을 수립할 수 있다

**Acceptance Criteria**:
- [ ] 학생별 집중 강도별 정답률 그래프
- [ ] 집중 강도 변화 추이 시각화
- [ ] 최적 집중 강도 추천 (AI 분석)
- [ ] 학생 그룹별 비교 분석

### Story 4: 실시간 집중 강도 피드백 (학생 관점)
> **As a** 학생
> **I want** 내가 현재 어떤 집중 강도로 학습하고 있는지 알고 싶다
> **So that** 내 학습 상태를 인지하고 집중력을 조절할 수 있다

**Acceptance Criteria**:
- [ ] 화면 상단에 현재 집중 강도 표시 (예: 🔵🔵🔵⚪⚪)
- [ ] 강도 변경 시 부드러운 애니메이션과 알림
- [ ] 강도별 설명 툴팁 제공
- [ ] 선택적으로 강도 표시 숨기기 가능

---

## 4. 기능 요구사항 (Functional Requirements)

### FR-FI-1: 집중 강도 자동 조절
**Priority: P0 (Critical)**

- **FR-FI-1.1**: 시스템은 문제 난이도 (1-5)를 기반으로 기본 집중 강도를 설정해야 함
- **FR-FI-1.2**: 시스템은 학생의 최근 5개 문제 정답률을 실시간으로 계산해야 함
- **FR-FI-1.3**: 정답률이 90% 이상이고 3개 연속 정답 시 집중 강도를 1단계 증가해야 함
- **FR-FI-1.4**: 정답률이 50% 미만이고 2개 연속 오답 시 집중 강도를 1단계 감소해야 함
- **FR-FI-1.5**: 집중 강도 변경 시 학생에게 시각적 피드백을 제공해야 함

### FR-FI-2: UI/UX 집중 강도 매핑
**Priority: P0 (Critical)**

- **FR-FI-2.1**: 각 집중 강도 레벨별 UI 설정을 데이터베이스에 저장해야 함
- **FR-FI-2.2**: 시스템은 집중 강도에 따라 다음을 동적으로 조절해야 함:
  - 타이머 표시/숨김
  - 힌트 개수 (레벨 1: 3개, 레벨 5: 0개)
  - 배경색 (레벨 1: 밝은 파스텔, 레벨 5: 중성 회색)
  - 애니메이션 속도 및 복잡도
- **FR-FI-2.3**: 교사는 각 집중 강도 레벨의 설정을 커스터마이징할 수 있어야 함
- **FR-FI-2.4**: UI 변화는 부드러운 트랜지션 (0.3-0.5초)으로 적용되어야 함

### FR-FI-3: 집중 강도 데이터 수집 및 분석
**Priority: P1 (High)**

- **FR-FI-3.1**: 각 문제 시도 시 현재 집중 강도를 기록해야 함
- **FR-FI-3.2**: 집중 강도별 정답률, 평균 응답 시간을 집계해야 함
- **FR-FI-3.3**: 학생별 최적 집중 강도를 ML 알고리즘으로 추천해야 함
- **FR-FI-3.4**: 교사 대시보드에서 집중 강도 분석 리포트를 제공해야 함

### FR-LMS-1: LTI 1.3 기본 통합
**Priority: P1 (High)**

- **FR-LMS-1.1**: LTI 1.3 표준을 준수한 OAuth 2.0 인증을 구현해야 함
- **FR-LMS-1.2**: LMS에서 Deep Linking을 통해 모듈을 과제로 추가할 수 있어야 함
- **FR-LMS-1.3**: LMS 사용자 정보 (이름, 이메일, 역할)를 자동으로 동기화해야 함
- **FR-LMS-1.4**: 학생이 LMS에서 과제 클릭 시 SSO로 자동 로그인되어야 함

### FR-LMS-2: 성적 동기화 (AGS)
**Priority: P1 (High)**

- **FR-LMS-2.1**: 학생의 모듈 완료율을 LMS Grade Book에 자동 전송해야 함
- **FR-LMS-2.2**: 실시간 진도 업데이트 (문제 풀 때마다) 또는 배치 업데이트 (1시간마다) 선택 가능해야 함
- **FR-LMS-2.3**: 성적 전송 실패 시 재시도 메커니즘 (최대 3회)을 구현해야 함
- **FR-LMS-2.4**: 성적 동기화 이력을 로그로 저장해야 함

### FR-LMS-3: 명단 동기화 (NRPS)
**Priority: P2 (Medium)**

- **FR-LMS-3.1**: LMS의 수강생 명단을 자동으로 가져와야 함
- **FR-LMS-3.2**: 신규 학생 추가 시 자동으로 모듈 접근 권한을 부여해야 함
- **FR-LMS-3.3**: 학생 제외 시 모듈 접근을 차단해야 함 (데이터는 보존)

### FR-FI-4: 집중 강도 수동 조절 (선택 기능)
**Priority: P2 (Medium)**

- **FR-FI-4.1**: 교사는 특정 학생의 집중 강도 자동 조절을 비활성화할 수 있어야 함
- **FR-FI-4.2**: 교사는 특정 학생의 집중 강도를 수동으로 고정할 수 있어야 함
- **FR-FI-4.3**: 학생은 자신의 집중 강도 레벨을 요청할 수 있어야 함 (교사 승인 필요)

---

## 5. 비기능 요구사항 (Non-Functional Requirements)

### NFR-1: 성능
- 집중 강도 계산 시간 < 50ms
- UI 업데이트 반응 시간 < 100ms
- LMS 성적 동기화 < 2초 (단일 학생)
- 동시 접속 500명 이상 지원

### NFR-2: 보안
- LTI 1.3 표준 OAuth 2.0 보안 준수
- LMS 토큰 암호화 저장 (AES-256)
- 학생 데이터 LMS 간 전송 시 TLS 1.3 사용
- RBAC: 교사만 집중 강도 설정 변경 가능

### NFR-3: 호환성
- Canvas LMS (최신 버전)
- Moodle 4.0+
- Google Classroom API v1
- 모든 LTI 1.3 Certified 플랫폼

### NFR-4: 접근성
- 집중 강도 시각적 표현은 색맹 친화적 (색 + 아이콘 병용)
- 스크린 리더 지원 (집중 강도 레벨 음성 안내)
- 키보드 내비게이션 지원

### NFR-5: 모니터링
- 집중 강도 변경 이벤트 로깅
- LMS 연동 오류 실시간 알림
- 평균 집중 강도 추이 대시보드

---

## 6. 데이터 모델 (Data Models)

### 6.1 신규 테이블

#### `focus_intensity_levels`
집중 강도 레벨별 설정 정의
```sql
CREATE TABLE focus_intensity_levels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    module_id UUID REFERENCES modules(id),
    level INTEGER NOT NULL CHECK (level BETWEEN 1 AND 5),

    -- 시간 설정
    time_limit_seconds INTEGER,
    show_timer BOOLEAN DEFAULT TRUE,
    timer_urgency_threshold INTEGER DEFAULT 30, -- %

    -- 힌트 설정
    hints_available INTEGER DEFAULT 0,
    hint_delay_seconds INTEGER DEFAULT 0,
    show_solution BOOLEAN DEFAULT FALSE,

    -- UI 설정
    ui_complexity VARCHAR(20) DEFAULT 'standard', -- minimal, standard, rich
    distraction_level VARCHAR(20) DEFAULT 'low',  -- none, low, medium
    background_color VARCHAR(7) DEFAULT '#F5F5F5',
    animation_speed DECIMAL(3,2) DEFAULT 1.0,

    -- 피드백 설정
    immediate_feedback BOOLEAN DEFAULT TRUE,
    feedback_detail VARCHAR(20) DEFAULT 'detailed', -- minimal, detailed, comprehensive
    encouragement_frequency INTEGER DEFAULT 3,

    -- 메타데이터
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),

    UNIQUE(module_id, level)
);

-- 기본 집중 강도 레벨 생성 트리거
CREATE OR REPLACE FUNCTION create_default_focus_levels()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO focus_intensity_levels (module_id, level, time_limit_seconds, hints_available)
    VALUES
        (NEW.id, 1, 300, 3),  -- Relaxed
        (NEW.id, 2, 240, 2),  -- Comfortable
        (NEW.id, 3, 180, 1),  -- Engaged
        (NEW.id, 4, 120, 0),  -- Challenged
        (NEW.id, 5, 90, 0);   -- Peak Focus
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER create_module_focus_levels
    AFTER INSERT ON modules
    FOR EACH ROW
    EXECUTE FUNCTION create_default_focus_levels();
```

#### `student_focus_sessions`
학생별 집중 강도 추적
```sql
CREATE TABLE student_focus_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id),
    module_id UUID NOT NULL REFERENCES modules(id),
    problem_id UUID NOT NULL, -- 동적 테이블 참조

    -- 집중 강도 정보
    focus_intensity_level INTEGER CHECK (focus_intensity_level BETWEEN 1 AND 5),
    auto_adjusted BOOLEAN DEFAULT TRUE, -- 자동 조절 여부
    adjustment_reason VARCHAR(100), -- 'high_accuracy', 'consecutive_correct', 'slow_response', etc.

    -- 문제 풀이 결과
    is_correct BOOLEAN,
    time_spent_seconds INTEGER,
    hints_used INTEGER DEFAULT 0,

    -- 성과 지표
    response_time_ratio DECIMAL(4,2), -- 실제 시간 / 예상 시간

    -- 타임스탬프
    started_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP,

    -- 인덱스
    INDEX idx_student_focus (student_id, module_id),
    INDEX idx_focus_level (focus_intensity_level),
    INDEX idx_completed (completed_at)
);
```

#### `lms_integrations`
LMS 연동 설정
```sql
CREATE TABLE lms_integrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- LMS 정보
    lms_platform VARCHAR(50) NOT NULL, -- 'canvas', 'moodle', 'google_classroom'
    lms_instance_url VARCHAR(255) NOT NULL,
    lms_course_id VARCHAR(100),

    -- LTI 1.3 설정
    client_id VARCHAR(255) NOT NULL,
    deployment_id VARCHAR(255),
    auth_token_url VARCHAR(255) NOT NULL,
    auth_login_url VARCHAR(255) NOT NULL,
    keyset_url VARCHAR(255) NOT NULL,

    -- 연동 모듈
    module_id UUID REFERENCES modules(id),

    -- 동기화 설정
    sync_grades BOOLEAN DEFAULT TRUE,
    sync_roster BOOLEAN DEFAULT TRUE,
    grade_sync_mode VARCHAR(20) DEFAULT 'realtime', -- 'realtime', 'batch'

    -- 보안
    public_key TEXT,
    private_key_encrypted TEXT, -- AES-256 암호화

    -- 상태
    status VARCHAR(20) DEFAULT 'active', -- 'active', 'inactive', 'error'
    last_sync_at TIMESTAMP,
    last_error TEXT,

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),

    UNIQUE(lms_platform, lms_instance_url, lms_course_id, module_id)
);
```

#### `lms_grade_sync_log`
성적 동기화 이력
```sql
CREATE TABLE lms_grade_sync_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    integration_id UUID REFERENCES lms_integrations(id),
    student_id UUID REFERENCES students(id),

    -- 동기화 데이터
    score DECIMAL(5,2), -- 0-100
    completion_percentage INTEGER,

    -- 동기화 결과
    sync_status VARCHAR(20), -- 'success', 'failed', 'pending'
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,

    synced_at TIMESTAMP DEFAULT NOW(),

    INDEX idx_sync_status (sync_status, synced_at)
);
```

### 6.2 기존 테이블 확장

#### `student_attempts` 테이블에 컬럼 추가
```sql
ALTER TABLE student_attempts ADD COLUMN focus_intensity_level INTEGER CHECK (focus_intensity_level BETWEEN 1 AND 5);
ALTER TABLE student_attempts ADD COLUMN ui_settings JSONB; -- UI 설정 스냅샷
```

#### `students` 테이블에 컬럼 추가
```sql
ALTER TABLE students ADD COLUMN lms_user_id VARCHAR(255); -- LMS의 사용자 ID
ALTER TABLE students ADD COLUMN lms_platform VARCHAR(50); -- 어느 LMS에서 온 사용자인지
ALTER TABLE students ADD COLUMN optimal_focus_level INTEGER DEFAULT 3; -- AI 추천 최적 집중 강도
```

---

## 7. API 설계 (API Design)

### 7.1 집중 강도 API

#### `GET /api/modules/{module_id}/focus-intensity/levels`
모듈의 집중 강도 레벨 설정 조회
```typescript
// Response
{
  "levels": [
    {
      "level": 1,
      "name": "Relaxed",
      "time_limit_seconds": 300,
      "hints_available": 3,
      "show_timer": false,
      "background_color": "#E3F2FD",
      "ui_complexity": "rich"
    },
    // ... levels 2-5
  ]
}
```

#### `PUT /api/modules/{module_id}/focus-intensity/levels/{level}`
집중 강도 레벨 설정 수정 (교사만 가능)
```typescript
// Request
{
  "time_limit_seconds": 180,
  "hints_available": 2,
  "background_color": "#FFF3E0"
}

// Response
{
  "success": true,
  "updated_level": { /* updated settings */ }
}
```

#### `POST /api/students/{student_id}/focus-intensity/adjust`
학생의 집중 강도 조절 (실시간)
```typescript
// Request
{
  "module_id": "uuid",
  "problem_id": "uuid",
  "current_level": 3,
  "performance_data": {
    "recent_accuracy": 0.85,
    "avg_response_time": 45,
    "expected_response_time": 60,
    "consecutive_correct": 2
  }
}

// Response
{
  "new_level": 4,
  "adjustment_reason": "high_accuracy_consecutive_correct",
  "ui_settings": {
    "time_limit_seconds": 120,
    "hints_available": 0,
    "show_timer": true,
    "background_color": "#E0E0E0"
  }
}
```

#### `GET /api/students/{student_id}/focus-intensity/analytics`
학생별 집중 강도 분석
```typescript
// Response
{
  "student_id": "uuid",
  "optimal_level": 3,
  "level_performance": [
    {
      "level": 1,
      "accuracy_rate": 0.95,
      "avg_time_spent": 120,
      "total_attempts": 20
    },
    // ... levels 2-5
  ],
  "recommendations": [
    "Student performs best at level 3",
    "Consider increasing to level 4 for challenge"
  ]
}
```

### 7.2 LMS 통합 API

#### `POST /api/lms/lti/launch`
LTI 1.3 Launch 엔드포인트 (LMS에서 호출)
```typescript
// Request (LMS에서 전송하는 LTI JWT)
{
  "iss": "https://canvas.instructure.com",
  "aud": "our-client-id",
  "sub": "user-id-from-lms",
  "https://purl.imsglobal.org/spec/lti/claim/context": {
    "id": "course-id",
    "label": "Math 101"
  },
  "https://purl.imsglobal.org/spec/lti/claim/resource_link": {
    "id": "assignment-id"
  }
}

// Response: 학생을 모듈 페이지로 리다이렉트
```

#### `POST /api/lms/integrations`
LMS 연동 설정 생성 (교사)
```typescript
// Request
{
  "lms_platform": "canvas",
  "lms_instance_url": "https://kaist.instructure.com",
  "lms_course_id": "12345",
  "module_id": "uuid",
  "sync_grades": true,
  "grade_sync_mode": "realtime"
}

// Response
{
  "integration_id": "uuid",
  "status": "active",
  "lti_config": {
    "client_id": "generated-client-id",
    "auth_login_url": "https://our-app.com/api/lms/lti/auth",
    "target_link_uri": "https://our-app.com/api/lms/lti/launch",
    "public_jwk_url": "https://our-app.com/api/lms/lti/jwks"
  }
}
```

#### `POST /api/lms/grades/sync`
성적 수동 동기화 (배치)
```typescript
// Request
{
  "integration_id": "uuid",
  "student_ids": ["uuid1", "uuid2"] // optional, 전체 동기화 시 생략
}

// Response
{
  "sync_job_id": "uuid",
  "total_students": 25,
  "status": "processing"
}
```

#### `GET /api/lms/grades/sync/{job_id}`
동기화 작업 상태 조회
```typescript
// Response
{
  "job_id": "uuid",
  "status": "completed",
  "total_students": 25,
  "successful": 24,
  "failed": 1,
  "errors": [
    {
      "student_id": "uuid",
      "error": "LMS API rate limit exceeded"
    }
  ]
}
```

---

## 8. UI/UX 설계 (UI/UX Design)

### 8.1 집중 강도 시각적 표현

#### 화면 상단 집중 강도 인디케이터
```
┌─────────────────────────────────────────────┐
│  집중 레벨: ●●●○○ (레벨 3 - 집중)            │
│  [?] 힌트 1개 사용 가능                       │
│  ⏱ 남은 시간: 2:45                           │
└─────────────────────────────────────────────┘
```

#### 레벨별 배경색 & 테마
| 레벨 | 배경색 | 테마 | 설명 |
|------|--------|------|------|
| 1 | `#E3F2FD` (Light Blue) | Calm | 부드러운 파스텔 블루, 넉넉한 공간 |
| 2 | `#FFF3E0` (Light Orange) | Warm | 따뜻한 오렌지, 친근한 느낌 |
| 3 | `#F5F5F5` (Light Gray) | Neutral | 중립적인 회색, 표준 학습 모드 |
| 4 | `#E0E0E0` (Gray) | Focused | 차분한 회색, 집중 유도 |
| 5 | `#FAFAFA` (Near White) | Minimal | 최소한의 요소, 고도 집중 |

### 8.2 집중 강도 전환 애니메이션
```typescript
const transitionFocusLevel = (fromLevel: number, toLevel: number) => {
  // 1. 알림 표시
  showNotification({
    message: `집중 레벨이 ${fromLevel}에서 ${toLevel}로 변경되었습니다`,
    duration: 2000,
    type: toLevel > fromLevel ? 'challenge' : 'support'
  });

  // 2. 배경색 전환 (0.5초)
  animateBackgroundColor(
    getFocusLevelColor(fromLevel),
    getFocusLevelColor(toLevel),
    500
  );

  // 3. UI 요소 fade in/out
  if (toLevel >= 4) {
    fadeOut('.hint-button', 300);
  } else {
    fadeIn('.hint-button', 300);
  }
};
```

### 8.3 학생 대시보드 - 집중 강도 히스토리
```
┌─────────────────────────────────────────────┐
│  내 학습 집중도 분석                          │
├─────────────────────────────────────────────┤
│  현재 집중 레벨: ●●●○○ (레벨 3)              │
│  오늘의 평균: 레벨 2.8                        │
│                                              │
│  레벨별 정답률:                               │
│  레벨 1: ████████░░ 85%                      │
│  레벨 2: █████████░ 92%                      │
│  레벨 3: ███████░░░ 78%  ← 현재              │
│  레벨 4: █████░░░░░ 65%                      │
│  레벨 5: ███░░░░░░░ 45%                      │
│                                              │
│  💡 추천: 레벨 2-3에서 가장 잘하고 있어요!   │
└─────────────────────────────────────────────┘
```

### 8.4 교사 대시보드 - 학급 집중 강도 모니터링
```
┌─────────────────────────────────────────────┐
│  학급 집중도 실시간 모니터링                  │
├─────────────────────────────────────────────┤
│  평균 집중 레벨: 3.2                          │
│                                              │
│  학생별 현재 상태:                            │
│  김철수  ●●●●○ (레벨 4) - 문제 5번 풀이 중  │
│  이영희  ●●○○○ (레벨 2) - 문제 3번 풀이 중  │
│  박민수  ●●●●● (레벨 5) - 문제 8번 풀이 중  │
│  ...                                         │
│                                              │
│  ⚠️ 주의: 이영희 학생이 2단계 낮아졌습니다    │
└─────────────────────────────────────────────┘
```

### 8.5 LMS 통합 UI Flow

#### Canvas에서 모듈 추가
```
Canvas 교사 화면
├─ Assignments 탭
├─ "+ Assignment" 버튼
├─ Assignment Type: "External Tool"
├─ "Find" 버튼 클릭
├─ "KAIST Touch Math AI Modules" 선택
└─ 모듈 목록에서 선택 → 과제 생성 완료
```

#### 학생 경험 (Canvas에서 시작)
```
Canvas 학생 화면
├─ "Math Module: Fractions" 과제 클릭
├─ → 자동으로 모듈 웹앱으로 이동 (SSO 인증)
├─ 문제 풀이 시작
├─ 집중 강도 자동 조절
├─ 완료 시 자동으로 Canvas에 성적 전송
└─ Canvas Grade Book에 점수 반영
```

---

## 9. 구현 계획 (Implementation Plan)

### Phase 1: 집중 강도 조절 기능 (4주)

#### Week 1: 데이터 모델 및 백엔드 API
- [ ] `focus_intensity_levels` 테이블 생성
- [ ] `student_focus_sessions` 테이블 생성
- [ ] 기본 CRUD API 구현
- [ ] 집중 강도 계산 알고리즘 구현

#### Week 2: 프론트엔드 UI 컴포넌트
- [ ] `FocusIntensityIndicator` 컴포넌트
- [ ] 집중 강도별 테마 시스템
- [ ] 전환 애니메이션
- [ ] 타이머 컴포넌트 (강도별 설정)

#### Week 3: 적응형 로직 통합
- [ ] 실시간 성과 추적
- [ ] 자동 조절 트리거 구현
- [ ] WebSocket 실시간 업데이트
- [ ] 교사 대시보드 모니터링

#### Week 4: 테스트 및 최적화
- [ ] 단위 테스트 (알고리즘)
- [ ] 통합 테스트 (UI/API)
- [ ] 성능 최적화 (50ms 목표)
- [ ] 사용자 피드백 수집

### Phase 2: LMS 통합 (6주)

#### Week 5-6: LTI 1.3 기반 구조
- [ ] LTI 1.3 라이브러리 선택 (pylti1p3 추천)
- [ ] OAuth 2.0 인증 플로우
- [ ] `lms_integrations` 테이블 및 API
- [ ] JWKS 엔드포인트 구현

#### Week 7-8: Canvas 통합 (우선)
- [ ] Canvas LTI 1.3 설정
- [ ] Deep Linking 구현
- [ ] Assignment and Grade Services (AGS)
- [ ] 실시간 성적 동기화

#### Week 9: Moodle 통합
- [ ] Moodle LTI 1.3 설정
- [ ] Moodle 특화 설정 처리
- [ ] 성적 동기화 테스트

#### Week 10: 테스트 및 문서화
- [ ] LMS 통합 E2E 테스트
- [ ] 교사용 설정 가이드
- [ ] 문제 해결 가이드
- [ ] 성능 모니터링 대시보드

### Phase 3: 고급 분석 (4주)

#### Week 11-12: ML 기반 최적화
- [ ] 학생별 최적 집중 강도 예측 모델
- [ ] 시계열 분석 (집중 강도 추이)
- [ ] 클러스터링 (학습 패턴 그룹)

#### Week 13-14: 리포팅 및 인사이트
- [ ] 고급 분석 대시보드
- [ ] PDF 리포트 생성
- [ ] 교사용 AI 인사이트

---

## 10. 기술 스택 추가 사항 (Technology Stack Additions)

### Backend (Python/FastAPI)
- **LTI 1.3**: `pylti1p3` - LTI 1.3 표준 구현
- **JWT**: `PyJWT` - 토큰 생성/검증
- **Canvas API**: `canvasapi` - Canvas REST API 클라이언트
- **Moodle API**: `requests` + custom wrapper

### Frontend (React/TypeScript)
- **Animation**: `framer-motion` - 집중 강도 전환 애니메이션
- **Charts**: `recharts` - 집중 강도 분석 그래프
- **Color System**: `chroma-js` - 동적 색상 계산

### Database
- **PostgreSQL Extensions**:
  - `pgcrypto` - LMS 토큰 암호화
  - `pg_cron` - 배치 성적 동기화 스케줄링

### Monitoring
- **집중 강도 메트릭**:
  - Prometheus counter: `focus_intensity_adjustments_total`
  - Prometheus gauge: `current_avg_focus_level`
- **LMS 동기화 메트릭**:
  - Prometheus counter: `lms_grade_sync_total{status="success|failed"}`
  - Prometheus histogram: `lms_api_request_duration_seconds`

---

## 11. 성공 지표 (Success Metrics)

### 집중 강도 기능
| 지표 | 목표 | 측정 방법 |
|------|------|----------|
| 학습 몰입도 향상 | +15% | 문제당 평균 체류 시간 증가 |
| 정답률 향상 | +10% | 집중 강도 조절 전후 비교 |
| 학생 만족도 | NPS > 60 | 설문 조사 (월 1회) |
| 적응 정확도 | >85% | 교사가 수동 조정하지 않은 비율 |

### LMS 통합
| 지표 | 목표 | 측정 방법 |
|------|------|----------|
| LMS 사용 교사 비율 | >50% | 6개월 내 |
| 성적 동기화 성공률 | >99% | 성공/실패 로그 분석 |
| 평균 동기화 시간 | <2초 | API 응답 시간 |
| LMS 인증 실패율 | <1% | 인증 오류 로그 |

---

## 12. 위험 요소 및 완화 계획 (Risks & Mitigation)

### 위험 1: LMS API 변경
- **위험도**: High
- **영향**: LMS 업데이트 시 통합 중단 가능
- **완화**:
  - LTI 1.3 표준 준수 (버전 변경에 강건)
  - LMS 버전별 호환성 테스트 자동화
  - LMS 업데이트 모니터링 및 조기 대응

### 위험 2: 집중 강도 조절이 학생에게 스트레스 유발
- **위험도**: Medium
- **영향**: 학생 만족도 하락
- **완화**:
  - 학생별 자동 조절 on/off 옵션 제공
  - 부드러운 전환 (급격한 변화 방지)
  - 학생 피드백 수집 및 알고리즘 개선

### 위험 3: LMS 성적 동기화 지연/실패
- **위험도**: Medium
- **영향**: 교사/학생 혼란
- **완화**:
  - 재시도 메커니즘 (최대 3회)
  - 실패 시 교사에게 알림
  - 수동 동기화 옵션 제공

### 위험 4: 개인정보 보호 (LMS 연동 시)
- **위험도**: High
- **영향**: 법적 문제, 신뢰 하락
- **완화**:
  - LTI 1.3 표준 보안 준수
  - 최소 권한 원칙 (필요한 데이터만 요청)
  - GDPR/FERPA 준수 검토

---

## 13. 오픈 질문 (Open Questions)

### High Priority
1. **집중 강도 레벨 수**: 5단계가 적절한가, 3단계 또는 7단계로 조정 필요?
2. **LMS 우선순위**: Canvas, Moodle, Google Classroom 중 어느 것을 먼저 지원?
3. **성적 계산 방식**: 완료율(0-100%) vs. 정답률(0-100%) vs. 숙련도(1-5)?
4. **학생 자율성**: 학생이 직접 집중 강도를 선택할 수 있게 할 것인가?

### Medium Priority
5. **집중 강도 시각화**: 현재 디자인이 학생 연령대에 적합한가?
6. **LMS 인증**: KAIST SSO와 LMS 인증을 어떻게 통합할 것인가?
7. **배치 동기화 주기**: 실시간이 부담스러울 경우 몇 분마다 동기화?

---

## 14. 참고 자료 (References)

### LTI 1.3 표준
- [IMS Global LTI 1.3 Specification](https://www.imsglobal.org/spec/lti/v1p3/)
- [LTI Advantage: AGS](https://www.imsglobal.org/spec/lti-ags/v2p0)
- [LTI Advantage: NRPS](https://www.imsglobal.org/spec/lti-nrps/v2p0)

### 학습 과학 (Learning Science)
- Csikszentmihalyi, M. (1990). *Flow: The Psychology of Optimal Experience*
- Sweller, J. (1988). Cognitive Load Theory
- Vygotsky, L.S. (1978). Zone of Proximal Development

### 기술 참고
- [Canvas LTI 1.3 Documentation](https://canvas.instructure.com/doc/api/file.lti_dev_key_config.html)
- [Moodle LTI Documentation](https://docs.moodle.org/en/LTI_and_Moodle)
- [pylti1p3 Library](https://github.com/dmitry-viskov/pylti1p3)

---

## Document Control

- **Version**: 1.0.0
- **Author**: AI Agent (Claude)
- **Created**: 2025-11-18
- **Related PRD**: 0001-prd-ai-education-pipeline.md
- **Status**: Draft for Review
- **Branch**: `claude/lms-focus-intensity-feature-01Fk7bkT5vfK1Ej62xVszE65`
- **Next Steps**:
  - [ ] Stakeholder review and feedback
  - [ ] Database schema approval
  - [ ] Begin Phase 1 implementation
