# API 엔드포인트 상세 구현 명세서
# API Endpoints Implementation Specification

## Related Documents
- **Spec**: 0002-lms-focus-intensity-feature-spec.md
- **Database**: 0003-database-migration-schema.sql

## Version
- **Version**: 1.0.0
- **Created**: 2025-11-18

---

## Table of Contents
1. [집중 강도 API](#1-집중-강도-api-focus-intensity-api)
2. [LMS 통합 API](#2-lms-통합-api-lms-integration-api)
3. [분석 및 리포팅 API](#3-분석-및-리포팅-api-analytics-api)
4. [WebSocket 실시간 이벤트](#4-websocket-실시간-이벤트)
5. [에러 코드 및 처리](#5-에러-코드-및-처리)

---

## 1. 집중 강도 API (Focus Intensity API)

### 1.1 집중 강도 레벨 설정 조회

#### `GET /api/v1/modules/{module_id}/focus-intensity/levels`
모듈의 모든 집중 강도 레벨 설정 조회

**인증**: 필요 (학생, 교사)

**Request Parameters**:
```typescript
interface GetFocusLevelsRequest {
  module_id: string; // UUID (path parameter)
}
```

**Response (200 OK)**:
```typescript
interface GetFocusLevelsResponse {
  module_id: string;
  levels: FocusIntensityLevel[];
}

interface FocusIntensityLevel {
  level: number; // 1-5
  name: string; // "Relaxed", "Comfortable", "Engaged", "Challenged", "Peak Focus"
  description: string; // 한글 설명
  time_limit_seconds: number | null;
  show_timer: boolean;
  timer_urgency_threshold: number; // %
  hints_available: number;
  hint_delay_seconds: number;
  show_solution: boolean;
  ui_complexity: 'minimal' | 'standard' | 'rich';
  distraction_level: 'none' | 'low' | 'medium';
  background_color: string; // hex color
  animation_speed: number; // 0-2
  immediate_feedback: boolean;
  feedback_detail: 'minimal' | 'detailed' | 'comprehensive';
  encouragement_frequency: number;
  sound_enabled: boolean;
  background_music: 'none' | 'ambient' | 'focus';
  sound_effects: boolean;
}
```

**Example Response**:
```json
{
  "module_id": "a1b2c3d4-5678-90ab-cdef-1234567890ab",
  "levels": [
    {
      "level": 1,
      "name": "Relaxed",
      "description": "편안한 학습 모드 - 충분한 시간과 힌트 제공",
      "time_limit_seconds": 300,
      "show_timer": false,
      "timer_urgency_threshold": 30,
      "hints_available": 3,
      "hint_delay_seconds": 0,
      "show_solution": false,
      "ui_complexity": "rich",
      "distraction_level": "low",
      "background_color": "#E3F2FD",
      "animation_speed": 1.0,
      "immediate_feedback": true,
      "feedback_detail": "comprehensive",
      "encouragement_frequency": 2,
      "sound_enabled": false,
      "background_music": "none",
      "sound_effects": false
    },
    // ... levels 2-5
  ]
}
```

---

### 1.2 집중 강도 레벨 설정 수정

#### `PUT /api/v1/modules/{module_id}/focus-intensity/levels/{level}`
특정 집중 강도 레벨의 설정 수정 (교사만 가능)

**인증**: 필요 (교사만)

**Request**:
```typescript
interface UpdateFocusLevelRequest {
  module_id: string; // path
  level: number; // path (1-5)
  time_limit_seconds?: number | null;
  show_timer?: boolean;
  hints_available?: number;
  background_color?: string;
  ui_complexity?: 'minimal' | 'standard' | 'rich';
  // ... 기타 업데이트 가능한 필드
}
```

**Request Body Example**:
```json
{
  "time_limit_seconds": 180,
  "hints_available": 2,
  "background_color": "#FFF3E0",
  "feedback_detail": "detailed"
}
```

**Response (200 OK)**:
```typescript
interface UpdateFocusLevelResponse {
  success: boolean;
  updated_level: FocusIntensityLevel;
  updated_fields: string[]; // ["time_limit_seconds", "hints_available", ...]
}
```

**Error Responses**:
- `403 Forbidden`: 교사가 아닌 사용자가 수정 시도
- `404 Not Found`: 모듈 또는 레벨이 존재하지 않음
- `400 Bad Request`: 잘못된 파라미터 (예: level이 1-5 범위 밖)

---

### 1.3 학생 집중 강도 조절 (실시간)

#### `POST /api/v1/students/{student_id}/focus-intensity/adjust`
학생의 현재 수행 데이터를 기반으로 집중 강도 자동 조절

**인증**: 필요 (시스템/학생)

**Request**:
```typescript
interface AdjustFocusIntensityRequest {
  student_id: string; // path
  module_id: string;
  problem_id: string;
  current_level: number; // 1-5
  problem_difficulty: number; // 1-5
  performance_data: {
    recent_accuracy: number; // 0.0-1.0 (최근 5개 문제)
    avg_response_time: number; // 초
    expected_response_time: number; // 초
    consecutive_correct: number;
    consecutive_incorrect: number;
  };
  force_manual_level?: number; // 교사가 수동 조절 시 (1-5)
}
```

**Request Body Example**:
```json
{
  "module_id": "a1b2c3d4-5678-90ab-cdef-1234567890ab",
  "problem_id": "prob-001",
  "current_level": 3,
  "problem_difficulty": 3,
  "performance_data": {
    "recent_accuracy": 0.85,
    "avg_response_time": 45,
    "expected_response_time": 60,
    "consecutive_correct": 2,
    "consecutive_incorrect": 0
  }
}
```

**Response (200 OK)**:
```typescript
interface AdjustFocusIntensityResponse {
  new_level: number; // 1-5
  previous_level: number;
  level_changed: boolean;
  adjustment_reason: string; // "high_accuracy_consecutive_correct", "slow_response", etc.
  ui_settings: FocusIntensityLevel;
  recommendation: string; // 학생에게 보여줄 메시지
}
```

**Example Response**:
```json
{
  "new_level": 4,
  "previous_level": 3,
  "level_changed": true,
  "adjustment_reason": "high_accuracy_consecutive_correct",
  "ui_settings": {
    "level": 4,
    "name": "Challenged",
    "time_limit_seconds": 120,
    "hints_available": 0,
    "show_timer": true,
    "background_color": "#E0E0E0",
    // ... full settings
  },
  "recommendation": "잘하고 있어요! 좀 더 도전적인 문제로 이동합니다."
}
```

**Algorithm Logic**:
```python
def adjust_focus_intensity(current_level, performance_data, problem_difficulty):
    new_level = current_level

    # 규칙 1: 정답률이 90% 이상이고 3개 연속 정답
    if performance_data['recent_accuracy'] > 0.9 and performance_data['consecutive_correct'] >= 3:
        new_level = min(5, current_level + 1)
        reason = "high_accuracy_consecutive_correct"

    # 규칙 2: 정답률이 50% 미만이고 2개 연속 오답
    elif performance_data['recent_accuracy'] < 0.5 and performance_data['consecutive_incorrect'] >= 2:
        new_level = max(1, current_level - 1)
        reason = "low_accuracy_consecutive_incorrect"

    # 규칙 3: 응답 속도 기반 조정
    speed_ratio = performance_data['avg_response_time'] / performance_data['expected_response_time']
    if speed_ratio < 0.5 and performance_data['recent_accuracy'] > 0.8:
        new_level = min(5, current_level + 1)
        reason = "fast_response_high_accuracy"
    elif speed_ratio > 2.0 and performance_data['recent_accuracy'] < 0.7:
        new_level = max(1, current_level - 1)
        reason = "slow_response_low_accuracy"

    return new_level, reason
```

---

### 1.4 집중 강도 세션 기록

#### `POST /api/v1/students/{student_id}/focus-intensity/sessions`
학생이 문제를 풀 때마다 집중 강도 세션 기록

**인증**: 필요 (시스템/학생)

**Request**:
```typescript
interface CreateFocusSessionRequest {
  student_id: string; // path
  module_id: string;
  problem_id: string;
  focus_intensity_level: number; // 1-5
  previous_level?: number; // 레벨이 변경된 경우
  auto_adjusted: boolean;
  adjustment_reason?: string;
  problem_difficulty: number;
  problem_type: string;
  is_correct: boolean;
  time_spent_seconds: number;
  hints_used: number;
  solution_viewed: boolean;
  ui_settings: object; // 전체 UI 설정 스냅샷
}
```

**Response (201 Created)**:
```typescript
interface CreateFocusSessionResponse {
  session_id: string;
  created_at: string; // ISO timestamp
}
```

---

### 1.5 학생 집중 강도 분석

#### `GET /api/v1/students/{student_id}/focus-intensity/analytics`
학생별 집중 강도 성과 분석

**인증**: 필요 (학생 본인, 교사)

**Request Parameters**:
```typescript
interface GetFocusAnalyticsRequest {
  student_id: string; // path
  module_id?: string; // query (선택적 - 특정 모듈만)
  start_date?: string; // query (ISO date)
  end_date?: string; // query
}
```

**Response (200 OK)**:
```typescript
interface FocusAnalyticsResponse {
  student_id: string;
  module_id?: string;
  period: {
    start_date: string;
    end_date: string;
  };
  current_optimal_level: number; // AI 추천 최적 레벨
  level_performance: LevelPerformance[];
  trends: {
    avg_level_over_time: TimeSeriesPoint[];
    accuracy_over_time: TimeSeriesPoint[];
  };
  recommendations: string[];
}

interface LevelPerformance {
  level: number;
  accuracy_rate: number; // 0-1
  avg_time_spent: number; // seconds
  total_attempts: number;
  correct_count: number;
  incorrect_count: number;
  efficiency_score: number; // accuracy / time (정규화)
}

interface TimeSeriesPoint {
  timestamp: string;
  value: number;
}
```

**Example Response**:
```json
{
  "student_id": "student-123",
  "module_id": "module-abc",
  "period": {
    "start_date": "2025-11-01",
    "end_date": "2025-11-18"
  },
  "current_optimal_level": 3,
  "level_performance": [
    {
      "level": 1,
      "accuracy_rate": 0.95,
      "avg_time_spent": 120,
      "total_attempts": 20,
      "correct_count": 19,
      "incorrect_count": 1,
      "efficiency_score": 0.85
    },
    {
      "level": 2,
      "accuracy_rate": 0.92,
      "avg_time_spent": 100,
      "total_attempts": 25,
      "correct_count": 23,
      "incorrect_count": 2,
      "efficiency_score": 0.92
    },
    {
      "level": 3,
      "accuracy_rate": 0.78,
      "avg_time_spent": 90,
      "total_attempts": 30,
      "correct_count": 23,
      "incorrect_count": 7,
      "efficiency_score": 0.87
    }
    // levels 4-5...
  ],
  "trends": {
    "avg_level_over_time": [
      {"timestamp": "2025-11-01", "value": 2.5},
      {"timestamp": "2025-11-08", "value": 2.8},
      {"timestamp": "2025-11-15", "value": 3.2}
    ],
    "accuracy_over_time": [
      {"timestamp": "2025-11-01", "value": 0.75},
      {"timestamp": "2025-11-08", "value": 0.82},
      {"timestamp": "2025-11-15", "value": 0.88}
    ]
  },
  "recommendations": [
    "레벨 2-3에서 가장 효율적으로 학습하고 있습니다.",
    "레벨 4로 도전해보는 것을 추천합니다.",
    "평균 정답률이 지속적으로 향상되고 있습니다!"
  ]
}
```

---

## 2. LMS 통합 API (LMS Integration API)

### 2.1 LTI 1.3 Launch (LMS → 우리 시스템)

#### `POST /api/v1/lms/lti/launch`
LMS에서 학생이 과제를 클릭했을 때 호출되는 엔드포인트

**인증**: LTI 1.3 JWT 검증

**Request**:
```typescript
// LMS가 전송하는 LTI 1.3 JWT (id_token)
interface LTILaunchRequest {
  // Standard LTI Claims
  iss: string; // LMS issuer (예: "https://canvas.instructure.com")
  aud: string; // our client_id
  sub: string; // LMS user ID
  nonce: string;
  iat: number;
  exp: number;

  // LTI Message Claims
  "https://purl.imsglobal.org/spec/lti/claim/message_type": "LtiResourceLinkRequest";
  "https://purl.imsglobal.org/spec/lti/claim/version": "1.3.0";
  "https://purl.imsglobal.org/spec/lti/claim/deployment_id": string;

  // Context (Course) Claims
  "https://purl.imsglobal.org/spec/lti/claim/context": {
    id: string; // course_id
    label: string; // course code
    title: string; // course name
    type: string[];
  };

  // Resource Link
  "https://purl.imsglobal.org/spec/lti/claim/resource_link": {
    id: string; // assignment_id
    title: string;
    description?: string;
  };

  // User Info
  name?: string;
  email?: string;
  "https://purl.imsglobal.org/spec/lti/claim/roles": string[]; // ["Student", "Instructor"]

  // Custom Parameters (우리가 설정)
  "https://purl.imsglobal.org/spec/lti/claim/custom": {
    module_id?: string;
  };
}
```

**Response**:
```typescript
// HTTP 302 Redirect to:
// https://our-app.com/modules/{module_id}?session_token={jwt_token}

interface LTILaunchResponse {
  redirect_url: string;
  session_token: string; // JWT (학생 인증용)
}
```

**처리 로직**:
1. LTI JWT 검증 (서명, 만료 시간, nonce 중복 체크)
2. LMS 사용자 ID → 우리 시스템 사용자 ID 매핑 (없으면 생성)
3. 세션 토큰 발급
4. 모듈 페이지로 리다이렉트

---

### 2.2 LMS 연동 설정 생성

#### `POST /api/v1/lms/integrations`
교사가 LMS와 모듈을 연동 설정

**인증**: 필요 (교사만)

**Request**:
```typescript
interface CreateLMSIntegrationRequest {
  lms_platform: 'canvas' | 'moodle' | 'google_classroom' | 'blackboard';
  lms_instance_url: string; // 예: "https://kaist.instructure.com"
  lms_course_id: string;
  lms_course_name?: string;
  module_id: string;
  sync_grades: boolean;
  sync_roster: boolean;
  grade_sync_mode: 'realtime' | 'batch';
  batch_sync_interval_minutes?: number; // batch 모드일 때
}
```

**Request Example**:
```json
{
  "lms_platform": "canvas",
  "lms_instance_url": "https://kaist.instructure.com",
  "lms_course_id": "12345",
  "lms_course_name": "Math 101",
  "module_id": "module-abc",
  "sync_grades": true,
  "sync_roster": true,
  "grade_sync_mode": "realtime"
}
```

**Response (201 Created)**:
```typescript
interface CreateLMSIntegrationResponse {
  integration_id: string;
  status: 'active' | 'testing';
  lti_config: {
    client_id: string;
    deployment_id: string;
    auth_login_url: string; // 교사가 LMS에 입력할 URL
    target_link_uri: string;
    public_jwk_url: string;
    oidc_initiation_url: string;
  };
  instructions: string; // LMS 설정 가이드
}
```

**Example Response**:
```json
{
  "integration_id": "int-xyz789",
  "status": "active",
  "lti_config": {
    "client_id": "kaist-math-abc123",
    "deployment_id": "dep-456",
    "auth_login_url": "https://our-app.com/api/v1/lms/lti/auth",
    "target_link_uri": "https://our-app.com/api/v1/lms/lti/launch",
    "public_jwk_url": "https://our-app.com/api/v1/lms/lti/jwks",
    "oidc_initiation_url": "https://our-app.com/api/v1/lms/lti/oidc/auth"
  },
  "instructions": "Canvas 설정: Settings > Apps > View App Configurations > +App 클릭 후 위 정보 입력"
}
```

---

### 2.3 성적 동기화 (우리 시스템 → LMS)

#### `POST /api/v1/lms/grades/sync`
학생의 모듈 진도/점수를 LMS로 전송

**인증**: 필요 (시스템/교사)

**Request**:
```typescript
interface SyncGradesRequest {
  integration_id: string;
  student_ids?: string[]; // 생략 시 전체 학생
  force_sync?: boolean; // true면 이미 동기화된 것도 재전송
}
```

**Request Example**:
```json
{
  "integration_id": "int-xyz789",
  "student_ids": ["student-001", "student-002"]
}
```

**Response (202 Accepted)**:
```typescript
interface SyncGradesResponse {
  sync_job_id: string;
  status: 'processing';
  total_students: number;
  estimated_completion_seconds: number;
}
```

**Example Response**:
```json
{
  "sync_job_id": "job-sync-001",
  "status": "processing",
  "total_students": 25,
  "estimated_completion_seconds": 30
}
```

---

### 2.4 성적 동기화 상태 조회

#### `GET /api/v1/lms/grades/sync/{job_id}`
동기화 작업 상태 확인

**인증**: 필요 (교사)

**Response (200 OK)**:
```typescript
interface SyncJobStatusResponse {
  job_id: string;
  status: 'processing' | 'completed' | 'failed' | 'partial';
  total_students: number;
  successful: number;
  failed: number;
  pending: number;
  errors: SyncError[];
  started_at: string;
  completed_at?: string;
}

interface SyncError {
  student_id: string;
  student_name: string;
  error: string;
  retry_count: number;
}
```

**Example Response**:
```json
{
  "job_id": "job-sync-001",
  "status": "completed",
  "total_students": 25,
  "successful": 24,
  "failed": 1,
  "pending": 0,
  "errors": [
    {
      "student_id": "student-010",
      "student_name": "김철수",
      "error": "LMS API rate limit exceeded (429)",
      "retry_count": 3
    }
  ],
  "started_at": "2025-11-18T10:30:00Z",
  "completed_at": "2025-11-18T10:30:45Z"
}
```

---

### 2.5 LMS 학생 명단 동기화 (LMS → 우리 시스템)

#### `POST /api/v1/lms/roster/sync`
LMS의 수강생 명단을 가져와서 우리 시스템에 추가/업데이트

**인증**: 필요 (교사)

**Request**:
```typescript
interface SyncRosterRequest {
  integration_id: string;
}
```

**Response (200 OK)**:
```typescript
interface SyncRosterResponse {
  integration_id: string;
  students_added: number;
  students_updated: number;
  students_removed: number; // 수강 취소한 학생
  students: LMSStudent[];
}

interface LMSStudent {
  lms_user_id: string;
  our_student_id: string;
  name: string;
  email: string;
  roles: string[];
  status: 'active' | 'inactive';
}
```

---

## 3. 분석 및 리포팅 API (Analytics API)

### 3.1 교사 대시보드 - 학급 집중 강도 모니터링

#### `GET /api/v1/teachers/dashboard/focus-monitoring`
학급 전체 학생의 실시간 집중 강도 상태

**인증**: 필요 (교사)

**Request Parameters**:
```typescript
interface FocusMonitoringRequest {
  module_id: string; // query
  time_range?: 'realtime' | '1hour' | '24hours'; // default: realtime
}
```

**Response (200 OK)**:
```typescript
interface FocusMonitoringResponse {
  module_id: string;
  timestamp: string;
  avg_focus_level: number; // 1-5
  students_active: number;
  students_by_level: {
    [level: number]: number; // { 1: 5, 2: 10, 3: 8, 4: 2, 5: 0 }
  };
  active_students: ActiveStudentStatus[];
  alerts: Alert[];
}

interface ActiveStudentStatus {
  student_id: string;
  student_name: string;
  current_level: number;
  problem_id: string;
  problem_number: number;
  started_at: string;
  elapsed_seconds: number;
  recent_accuracy: number;
  consecutive_correct: number;
  consecutive_incorrect: number;
}

interface Alert {
  type: 'level_drop' | 'struggling' | 'excelling';
  student_id: string;
  student_name: string;
  message: string;
  severity: 'low' | 'medium' | 'high';
}
```

**Example Response**:
```json
{
  "module_id": "module-abc",
  "timestamp": "2025-11-18T14:30:00Z",
  "avg_focus_level": 3.2,
  "students_active": 25,
  "students_by_level": {
    "1": 3,
    "2": 8,
    "3": 10,
    "4": 3,
    "5": 1
  },
  "active_students": [
    {
      "student_id": "student-001",
      "student_name": "김철수",
      "current_level": 4,
      "problem_id": "prob-005",
      "problem_number": 5,
      "started_at": "2025-11-18T14:25:00Z",
      "elapsed_seconds": 300,
      "recent_accuracy": 0.9,
      "consecutive_correct": 3,
      "consecutive_incorrect": 0
    }
    // ... more students
  ],
  "alerts": [
    {
      "type": "level_drop",
      "student_id": "student-010",
      "student_name": "이영희",
      "message": "집중 레벨이 4에서 2로 2단계 낮아졌습니다",
      "severity": "medium"
    },
    {
      "type": "struggling",
      "student_id": "student-015",
      "student_name": "박민수",
      "message": "3개 연속 오답 - 도움이 필요할 수 있습니다",
      "severity": "high"
    }
  ]
}
```

---

### 3.2 집중 강도 효과 분석 리포트

#### `GET /api/v1/analytics/focus-intensity/effectiveness`
집중 강도 기능의 전반적인 효과 분석 (관리자/연구용)

**인증**: 필요 (교사, 관리자)

**Request Parameters**:
```typescript
interface EffectivenessAnalysisRequest {
  module_id?: string; // 특정 모듈만
  start_date: string;
  end_date: string;
  compare_control_group?: boolean; // true면 집중 강도 없는 그룹과 비교
}
```

**Response (200 OK)**:
```typescript
interface EffectivenessAnalysisResponse {
  period: { start_date: string; end_date: string; };
  overall_metrics: {
    avg_accuracy_improvement: number; // %
    avg_engagement_time_increase: number; // %
    student_satisfaction_score: number; // 1-5
  };
  level_effectiveness: {
    level: number;
    avg_accuracy: number;
    avg_time_spent: number;
    student_count: number;
  }[];
  adaptive_algorithm_accuracy: number; // AI 조절이 적절했던 비율 (%)
  teacher_manual_override_rate: number; // 교사가 수동 조절한 비율 (%)
  recommendations: string[];
}
```

---

## 4. WebSocket 실시간 이벤트

### 4.1 연결

```typescript
// Client
const ws = new WebSocket('wss://our-app.com/ws/focus-intensity');
ws.send(JSON.stringify({
  type: 'authenticate',
  token: 'jwt-token'
}));
```

### 4.2 이벤트 구독

```typescript
// 학생: 자신의 집중 강도 변화 구독
ws.send(JSON.stringify({
  type: 'subscribe',
  channel: 'student.focus_intensity',
  student_id: 'student-123'
}));

// 교사: 학급 전체 모니터링 구독
ws.send(JSON.stringify({
  type: 'subscribe',
  channel: 'teacher.focus_monitoring',
  module_id: 'module-abc'
}));
```

### 4.3 서버 → 클라이언트 이벤트

#### 집중 강도 변경 이벤트
```typescript
{
  "type": "focus_intensity.changed",
  "data": {
    "student_id": "student-123",
    "module_id": "module-abc",
    "new_level": 4,
    "previous_level": 3,
    "reason": "high_accuracy_consecutive_correct",
    "ui_settings": { /* FocusIntensityLevel */ },
    "timestamp": "2025-11-18T14:35:00Z"
  }
}
```

#### 학급 상태 업데이트 (교사용)
```typescript
{
  "type": "class.focus_update",
  "data": {
    "module_id": "module-abc",
    "avg_level": 3.4,
    "students_active": 24,
    "recent_changes": [
      {
        "student_id": "student-001",
        "student_name": "김철수",
        "level_change": "+1",
        "new_level": 4
      }
    ],
    "timestamp": "2025-11-18T14:35:30Z"
  }
}
```

---

## 5. 에러 코드 및 처리

### 5.1 HTTP 상태 코드

| 코드 | 설명 | 사용 예시 |
|------|------|----------|
| 200 | OK | 성공적인 GET/PUT 요청 |
| 201 | Created | 리소스 생성 성공 (POST) |
| 202 | Accepted | 비동기 작업 수락됨 (성적 동기화) |
| 400 | Bad Request | 잘못된 파라미터 |
| 401 | Unauthorized | 인증 실패 |
| 403 | Forbidden | 권한 없음 (학생이 교사 API 호출) |
| 404 | Not Found | 리소스 없음 |
| 409 | Conflict | 중복 (이미 존재하는 LMS 연동) |
| 429 | Too Many Requests | Rate limit 초과 |
| 500 | Internal Server Error | 서버 오류 |
| 502 | Bad Gateway | LMS API 응답 오류 |
| 503 | Service Unavailable | 일시적 서비스 중단 |

### 5.2 커스텀 에러 코드

```typescript
interface APIError {
  error_code: string;
  message: string;
  details?: object;
  timestamp: string;
}
```

#### 집중 강도 관련 에러
- `FOCUS_001`: 집중 강도 레벨이 유효하지 않음 (1-5 범위 밖)
- `FOCUS_002`: 모듈에 집중 강도 설정이 없음
- `FOCUS_003`: 학생의 성과 데이터 부족 (조절 불가)
- `FOCUS_004`: 수동 조절 권한 없음

#### LMS 통합 관련 에러
- `LMS_001`: LTI JWT 검증 실패
- `LMS_002`: LMS 플랫폼 미지원
- `LMS_003`: LMS API 인증 실패
- `LMS_004`: LMS API 호출 실패 (rate limit, timeout)
- `LMS_005`: 성적 동기화 실패
- `LMS_006`: 학생 명단 동기화 실패
- `LMS_007`: 중복된 LMS 연동 설정

**Example Error Response**:
```json
{
  "error_code": "LMS_004",
  "message": "LMS API rate limit exceeded. Please try again later.",
  "details": {
    "lms_platform": "canvas",
    "retry_after_seconds": 60,
    "lms_response": "429 Too Many Requests"
  },
  "timestamp": "2025-11-18T14:40:00Z"
}
```

---

## 6. Rate Limiting

### 6.1 제한 정책

| 엔드포인트 유형 | 제한 | 기간 |
|-----------------|------|------|
| 집중 강도 조회 | 100 req | 1분 |
| 집중 강도 조절 | 10 req/학생 | 1분 |
| LMS 성적 동기화 | 5 req | 1분 |
| 분석 API | 50 req | 1분 |
| WebSocket 메시지 | 30 msg | 1분 |

### 6.2 Rate Limit Headers

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 85
X-RateLimit-Reset: 1700312400
```

---

## 7. 인증 및 권한

### 7.1 JWT 토큰 구조

```typescript
interface JWTPayload {
  sub: string; // user_id
  user_type: 'student' | 'teacher' | 'admin';
  iat: number;
  exp: number;
  permissions: string[]; // ["read:focus", "write:focus", "admin:lms"]
}
```

### 7.2 권한 매트릭스

| API | Student | Teacher | Admin |
|-----|---------|---------|-------|
| GET /focus-intensity/levels | ✓ | ✓ | ✓ |
| PUT /focus-intensity/levels | ✗ | ✓ | ✓ |
| POST /focus-intensity/adjust | ✓ (본인만) | ✓ | ✓ |
| GET /focus-intensity/analytics | ✓ (본인만) | ✓ | ✓ |
| POST /lms/integrations | ✗ | ✓ | ✓ |
| POST /lms/grades/sync | ✗ | ✓ | ✓ |
| GET /teacher/dashboard/* | ✗ | ✓ | ✓ |

---

## Document Control

- **Version**: 1.0.0
- **Author**: AI Agent (Claude)
- **Created**: 2025-11-18
- **Related Spec**: 0002-lms-focus-intensity-feature-spec.md
- **Branch**: `claude/lms-focus-intensity-feature-01Fk7bkT5vfK1Ej62xVszE65`
