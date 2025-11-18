# Mind Wandering Detection - Implementation Guide

## 개요

이 가이드는 LMS와 연동하여 학생의 Mind Wandering(집중력 저하)을 자동 감지하는 시스템의 구현 상세를 설명합니다.

## 시스템 구성 요소

### 1. Backend (Python FastAPI)

#### 핵심 서비스

**MindWanderingDetector** (`app/services/mind_wandering_detector.py`)
- 최근 행동 데이터를 분석하여 mind wandering 감지
- 다중 요인 분석:
  - **Inactivity Duration**: 마지막 이벤트 이후 경과 시간
  - **Focus Losses**: 페이지 blur 이벤트 빈도
  - **Mouse Stillness**: 마우스가 정지한 시간
  - **Rapid Clicks**: 빠른 클릭 패턴 (좌절감 지표)

```python
# 감지 알고리즘 수식
confidence = (
    (inactivity_score * INACTIVITY_WEIGHT) +
    (focus_loss_score * FOCUS_LOSS_WEIGHT) +
    (stillness_score * MOUSE_STILLNESS_WEIGHT) +
    (rapid_click_score * RAPID_CLICK_WEIGHT)
) / total_weight
```

#### API 엔드포인트

**Behavior Tracking API** (`/api/v1/behavior/*`)
- `POST /sessions/start`: 학습 세션 시작
- `POST /events`: 개별 이벤트 추적
- `POST /events/batch`: 배치 이벤트 전송 (권장)
- `POST /sessions/end`: 세션 종료

**Mind Wandering API** (`/api/v1/mind-wandering/*`)
- `GET /detect/{student_id}/{session_id}`: 실시간 감지
- `GET /history/{student_id}`: 감지 이력 조회
- `GET /analytics/{student_id}`: 분석 통계
- `PUT /events/{event_id}/intervention`: 개입 업데이트

**LMS Integration API** (`/api/v1/lms/*`)
- `POST /sync`: LMS로 데이터 동기화
- `GET /report/{student_id}/{module_id}`: 리포트 생성
- `POST /webhook/student-progress`: Webhook 수신

### 2. Frontend (React + TypeScript)

#### 핵심 컴포넌트

**useBehaviorTracking Hook**
```tsx
const {
  sessionId,
  isTracking,
  checkMindWandering,
  flushEvents
} = useBehaviorTracking({
  studentId,
  moduleId,
  apiUrl,
  onMindWanderingDetected: (data) => {
    // 감지 시 처리
  }
});
```

**BehaviorTrackingProvider**
- 앱 전체에 행동 추적 기능 제공
- 자동으로 이벤트 수집 및 전송
- Mind wandering 감지 시 알림 표시

**MindWanderingAlert**
- 감지된 상황에 맞는 맞춤형 알림
- 4가지 개입 유형:
  1. `gentle_reminder`: 기본 리마인더
  2. `focus_reminder`: 집중 요청
  3. `break_suggestion`: 휴식 제안
  4. `help_offer`: 도움 제공

#### 이벤트 수집

추적되는 이벤트:
- `mouse_move`: 마우스 움직임 (500ms 쓰로틀링)
- `click`: 클릭 (버튼, 대상 포함)
- `scroll`: 스크롤 위치
- `focus`/`blur`: 페이지 포커스 변경
- `page_hidden`/`page_visible`: 페이지 가시성

### 3. Database Schema

#### behavior_events
```sql
CREATE TABLE behavior_events (
    id UUID PRIMARY KEY,
    student_id UUID NOT NULL,
    module_id UUID NOT NULL,
    session_id UUID NOT NULL,
    event_type VARCHAR(50) NOT NULL,
    event_data JSON,
    mouse_x INTEGER,
    mouse_y INTEGER,
    scroll_x INTEGER,
    scroll_y INTEGER,
    timestamp TIMESTAMP NOT NULL,
    time_since_last_event FLOAT,
    page_url VARCHAR(500),
    page_title VARCHAR(200),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_behavior_student_session ON behavior_events(student_id, session_id);
CREATE INDEX idx_behavior_module_timestamp ON behavior_events(module_id, timestamp);
```

#### mind_wandering_events
```sql
CREATE TABLE mind_wandering_events (
    id UUID PRIMARY KEY,
    student_id UUID NOT NULL,
    module_id UUID NOT NULL,
    session_id UUID NOT NULL,
    detected_at TIMESTAMP NOT NULL,
    duration_seconds FLOAT,
    confidence_score FLOAT NOT NULL,
    behavior_pattern JSON,
    contributing_factors JSON,
    intervention_shown BOOLEAN DEFAULT FALSE,
    intervention_type VARCHAR(50),
    student_response VARCHAR(50),
    synced_to_lms BOOLEAN DEFAULT FALSE,
    synced_at TIMESTAMP
);

CREATE INDEX idx_mw_student_detected ON mind_wandering_events(student_id, detected_at);
```

#### learning_sessions
```sql
CREATE TABLE learning_sessions (
    id UUID PRIMARY KEY,
    student_id UUID NOT NULL,
    module_id UUID NOT NULL,
    started_at TIMESTAMP NOT NULL,
    ended_at TIMESTAMP,
    duration_seconds FLOAT,
    total_events INTEGER DEFAULT 0,
    mind_wandering_count INTEGER DEFAULT 0,
    total_mind_wandering_duration FLOAT DEFAULT 0.0,
    engagement_score FLOAT,
    device_type VARCHAR(50),
    browser VARCHAR(50)
);
```

## 감지 알고리즘 상세

### 1. 요인 계산

**Inactivity Duration**
- 연속된 이벤트 간 최대 간격 측정
- 임계값: 30초 (설정 가능)
- 정규화: `min(duration / threshold, 1.0)`

**Focus Losses**
- `blur` 이벤트 횟수
- 정규화: `min(count / 3, 1.0)`

**Mouse Stillness**
- 50px 미만 이동을 "정지"로 간주
- 연속 정지 시간의 최대값 측정
- 임계값: 20초
- 정규화: `min(stillness / threshold, 1.0)`

**Rapid Clicks**
- 클릭 빈도가 0.5회/초 초과 시
- 좌절감 또는 무작위 클릭의 지표
- 정규화: `min(count / (threshold * 2), 1.0)`

### 2. 신뢰도 점수 계산

```python
confidence = (
    inactivity_normalized * 0.6 +
    focus_loss_normalized * 0.8 +
    stillness_normalized * 0.5 +
    rapid_click_normalized * 0.7
) / (0.6 + 0.8 + 0.5 + 0.7)
```

임계값 초과 시 mind wandering으로 판정 (기본: 0.65)

### 3. 개입 결정

```python
if confidence > 0.8 and inactivity > 60:
    return "break_suggestion"
elif focus_losses > 2:
    return "focus_reminder"
elif rapid_clicks > 10:
    return "help_offer"
else:
    return "gentle_reminder"
```

## LMS 통합 프로토콜

### 데이터 동기화

**Step 1**: 세션 데이터 수집
```python
sessions = get_sessions(student_id, module_id, start_date, end_date)
```

**Step 2**: 메트릭 계산
```python
metrics = {
    "session_count": len(sessions),
    "total_time_seconds": sum(s.duration_seconds),
    "mind_wandering_events": sum(s.mind_wandering_count),
    "engagement_score": avg(s.engagement_score)
}
```

**Step 3**: LMS로 전송
```python
POST {LMS_API_URL}/student-progress
Authorization: Bearer {LMS_API_KEY}
{
    "student_id": "...",
    "metrics": {...},
    "sessions": [...]
}
```

### Webhook 처리

LMS → 이 시스템:
```json
POST /api/v1/lms/webhook/student-progress
{
    "event_type": "student_enrolled" | "module_updated",
    "student_id": "uuid",
    "module_id": "uuid",
    "data": {...}
}
```

## 성능 최적화

### 1. 배치 처리
- 이벤트를 50개씩 묶어서 전송
- 네트워크 요청 횟수 감소

### 2. 쓰로틀링
- 마우스 이동: 500ms
- 스크롤: passive listener 사용

### 3. 비동기 분석
- Mind wandering 분석은 백그라운드 태스크
- 메인 요청 흐름 차단하지 않음

### 4. 데이터베이스 인덱싱
```sql
-- 필수 인덱스
CREATE INDEX idx_behavior_student_session ON behavior_events(student_id, session_id);
CREATE INDEX idx_behavior_module_timestamp ON behavior_events(module_id, timestamp);
CREATE INDEX idx_mw_student_detected ON mind_wandering_events(student_id, detected_at);
```

## 프라이버시 & 보안

### 데이터 최소화
- 페이지 URL만 저장 (쿼리 파라미터 제외 옵션)
- 마우스 좌표는 상대 위치만 저장
- 클릭 대상은 태그명만 (내용 제외)

### 데이터 보존 정책
```python
# 90일 이상 된 behavior_events 삭제
DELETE FROM behavior_events
WHERE created_at < NOW() - INTERVAL '90 days';
```

### 접근 제어
- 학생은 자신의 데이터만 조회 가능
- 교사는 담당 모듈의 학생 데이터만 조회
- 관리자는 전체 접근 가능

## 트러블슈팅

### 이벤트가 전송되지 않는 경우
1. CORS 설정 확인
2. 네트워크 탭에서 요청 확인
3. Backend 로그 확인

### 감지가 작동하지 않는 경우
1. 임계값 설정 확인
2. 충분한 이벤트가 수집되었는지 확인
3. `analyze_recent_behavior` 함수의 lookback_seconds 조정

### 성능 이슈
1. 배치 크기 조정 (`batchSize`)
2. 전송 간격 조정 (`flushInterval`)
3. 마우스 추적 비활성화 고려

## 다음 단계

### Phase 2 기능
- [ ] 머신러닝 기반 패턴 학습
- [ ] 학생별 맞춤 임계값
- [ ] 실시간 대시보드
- [ ] 모바일 앱 지원

### 개선 사항
- [ ] A/B 테스트를 통한 알림 최적화
- [ ] 더 정교한 마우스 패턴 분석
- [ ] 눈 추적 하드웨어 통합 (선택)

## 참고 자료

- FastAPI 문서: https://fastapi.tiangolo.com/
- React Hooks: https://react.dev/reference/react
- PostgreSQL: https://www.postgresql.org/docs/
