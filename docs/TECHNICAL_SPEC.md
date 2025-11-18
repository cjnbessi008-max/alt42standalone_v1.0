# 기술 명세서: LMS 연동 감정 패턴 감지 시스템

## 개요

본 시스템은 학습자의 행동 패턴을 실시간으로 분석하여 감정 상태(좌절, 집중, 답답함)를 자동으로 감지하고, LMS(Learning Management System)와 연동하여 교육자에게 알림을 전송하는 웹 애플리케이션입니다.

## 시스템 요구사항

### 하드웨어 요구사항
- **개발 환경**:
  - CPU: 2코어 이상
  - RAM: 4GB 이상
  - 저장공간: 10GB 이상

- **프로덕션 환경**:
  - CPU: 4코어 이상
  - RAM: 8GB 이상
  - 저장공간: 50GB 이상

### 소프트웨어 요구사항
- Docker 20.10+
- Docker Compose 1.29+
- PostgreSQL 15+
- Redis 7+
- Python 3.11+
- Node.js 18+

## 데이터 모델

### BehaviorEvent (행동 이벤트)

학습자의 개별 행동을 추적하는 모델입니다.

```python
{
    "id": "UUID",
    "student_id": "UUID",
    "session_id": "UUID",
    "module_id": "UUID",
    "event_type": "click | keypress | mouse_move | scroll | focus | blur",
    "event_data": {
        # 이벤트별 추가 데이터
    },
    "timestamp": "datetime",
    "duration_ms": "integer",
    "mouse_speed": "float",  # px/s
    "click_force": "float",
    "keypress_speed": "float",  # chars/min
    "page_url": "string",
    "element_id": "string",
    "element_type": "string",
    "is_correct_answer": "correct | incorrect | partial | na",
    "attempt_number": "integer",
    "time_since_last_event_ms": "integer"
}
```

### EmotionState (감정 상태)

특정 시점의 감정 상태를 나타내는 모델입니다.

```python
{
    "id": "UUID",
    "student_id": "UUID",
    "session_id": "UUID",
    "module_id": "UUID",
    "frustration_score": "float (0.0-1.0)",
    "concentration_score": "float (0.0-1.0)",
    "confusion_score": "float (0.0-1.0)",
    "primary_emotion": "frustration | concentration | confusion | neutral",
    "confidence": "float (0.0-1.0)",
    "behavior_window_start": "datetime",
    "behavior_window_end": "datetime",
    "events_analyzed": "integer",
    "analysis_method": "rule_based | ai_enhanced",
    "analysis_metadata": {},
    "detected_at": "datetime"
}
```

### EmotionPattern (감정 패턴)

시간 경과에 따른 감정 패턴 분석 결과입니다.

```python
{
    "id": "UUID",
    "student_id": "UUID",
    "session_id": "UUID",
    "module_id": "UUID",
    "window_start": "datetime",
    "window_end": "datetime",
    "duration_minutes": "integer",
    "frustration_count": "integer",
    "concentration_count": "integer",
    "confusion_count": "integer",
    "neutral_count": "integer",
    "frustration_duration_sec": "integer",
    "concentration_duration_sec": "integer",
    "confusion_duration_sec": "integer",
    "dominant_emotion": "string",
    "emotion_transitions": "integer",
    "is_concerning": "yes | no | monitor",
    "intervention_suggested": "yes | no",
    "intervention_type": "string",
    "avg_accuracy": "float",
    "completion_rate": "float"
}
```

## 감정 분석 알고리즘

### 규칙 기반 분석 (Rule-based Analysis)

#### 좌절 (Frustration) 점수 계산

```python
def score_frustration(metrics):
    score = 0.0

    if metrics['rapid_click_count'] >= 5:
        score += 0.3

    if metrics['avg_mouse_speed'] > 500:
        score += 0.25

    if metrics['error_count'] >= 3:
        score += 0.3

    if 0 < metrics['avg_time_between_events'] < 1:
        score += 0.15

    return min(score, 1.0)
```

**임계값**:
- 빠른 클릭: 2초 내 5회 이상
- 높은 마우스 속도: 500 px/s 이상
- 반복 오류: 3회 이상
- 빠른 키입력: 분당 200자 이상

#### 집중 (Concentration) 점수 계산

```python
def score_concentration(metrics):
    score = 0.0

    if 2 <= metrics['avg_time_between_events'] <= 10:
        score += 0.35

    if metrics['accuracy_rate'] >= 0.7:
        score += 0.35

    if metrics['backtrack_rate'] < 0.1:
        score += 0.15

    if metrics['hesitation_count'] < 2:
        score += 0.15

    return min(score, 1.0)
```

**임계값**:
- 안정적 상호작용: 이벤트 간 2~10초
- 높은 정확도: 70% 이상
- 낮은 역추적: 10% 미만

#### 답답함 (Confusion) 점수 계산

```python
def score_confusion(metrics):
    score = 0.0

    if metrics['avg_time_between_events'] > 30:
        score += 0.3

    if metrics['backtrack_rate'] > 0.3:
        score += 0.25

    if metrics['hesitation_count'] >= 3:
        score += 0.25

    if metrics['long_pauses'] >= 2:
        score += 0.2

    return min(score, 1.0)
```

**임계값**:
- 느린 응답: 30초 이상
- 높은 역추적: 30% 이상
- 많은 주저: 3회 이상

### AI 기반 분석 (AI-enhanced Analysis)

Claude API를 사용한 고급 감정 분석 (선택사항):

```python
def ai_enhanced_analysis(events, metrics):
    prompt = f"""
    학습자 행동 데이터 분석:
    - 총 이벤트: {metrics['total_events']}
    - 평균 이벤트 간격: {metrics['avg_time_between_events']}초
    - 정확도: {metrics['accuracy_rate']}
    - 오류 횟수: {metrics['error_count']}

    감정 상태를 분석하고 다음 형식으로 응답:
    {{
        "primary_emotion": "frustration|concentration|confusion",
        "confidence": 0.0-1.0,
        "scores": {{...}},
        "reasoning": "분석 근거"
    }}
    """

    response = claude_client.messages.create(
        model="claude-3-sonnet-20240229",
        messages=[{"role": "user", "content": prompt}]
    )

    return parse_response(response)
```

## API 설계

### REST API 엔드포인트

#### 1. 행동 이벤트 추적

```http
POST /api/emotions/behavior-events
Content-Type: application/json

{
  "student_id": "uuid",
  "session_id": "uuid",
  "module_id": "uuid",
  "event_type": "click",
  "event_data": {...},
  "mouse_speed": 250.5
}

Response 201:
{
  "id": "uuid",
  "timestamp": "2025-11-18T10:30:00Z",
  "primary_emotion": "concentration",
  "emotion_confidence": 0.85
}
```

#### 2. 감정 분석 요청

```http
POST /api/emotions/analyze
Content-Type: application/json

{
  "session_id": "uuid",
  "student_id": "uuid",
  "window_minutes": 5
}

Response 200:
{
  "id": "uuid",
  "frustration_score": 0.2,
  "concentration_score": 0.8,
  "confusion_score": 0.1,
  "primary_emotion": "concentration",
  "confidence": 0.85,
  "events_analyzed": 42
}
```

#### 3. 감정 대시보드 조회

```http
GET /api/emotions/dashboard/{session_id}?student_id={uuid}

Response 200:
{
  "current_emotion": {...},
  "emotion_history": [...],
  "pattern_analysis": {...},
  "alerts": ["높은 좌절 감지"],
  "recommendations": ["휴식 제안"]
}
```

## LMS 연동 사양

### 지원 LMS 플랫폼

1. **Canvas LMS**
   - API: REST API v1
   - 인증: Bearer Token
   - 엔드포인트: `/api/v1/courses/{course_id}/custom_events`

2. **Moodle**
   - API: Web Services API
   - 인증: Token-based
   - 함수: `core_calendar_create_calendar_events`

3. **Blackboard Learn**
   - API: REST API
   - 인증: OAuth 2.0
   - 엔드포인트: `/learn/api/public/v1/courses/{course_id}/contents`

4. **Custom Webhook**
   - 프로토콜: HTTPS
   - 메서드: POST
   - 인증: API Key (헤더)

### 웹훅 페이로드 형식

```json
{
  "event_type": "emotion_alert",
  "student_id": "uuid",
  "session_id": "uuid",
  "module_id": "uuid",
  "timestamp": "2025-11-18T10:30:00Z",
  "emotion_data": {
    "primary_emotion": "frustration",
    "confidence": 0.85,
    "duration_minutes": 8
  },
  "severity": "high",
  "recommended_action": "Consider providing a hint"
}
```

## 성능 최적화

### 백엔드 최적화

1. **비동기 처리**: 모든 I/O 작업은 async/await 사용
2. **배치 처리**: 행동 이벤트를 배치로 처리 (기본 10개)
3. **캐싱**: Redis를 통한 세션 데이터 캐싱
4. **DB 인덱싱**:
   - `behavior_events(student_id, timestamp)`
   - `emotion_states(session_id, detected_at)`
   - `emotion_patterns(student_id, window_start)`

### 프론트엔드 최적화

1. **이벤트 디바운싱**: 마우스 움직임 500ms, 스크롤 300ms
2. **배치 전송**: 이벤트 큐잉 및 배치 전송 (10개 또는 5초마다)
3. **메모이제이션**: React 컴포넌트 최적화
4. **레이지 로딩**: 대시보드 컴포넌트 지연 로딩

## 보안 설계

### 인증 및 인가

- JWT 토큰 기반 인증
- 토큰 만료: 24시간
- 리프레시 토큰 지원

### 데이터 보안

- **전송 중 암호화**: TLS 1.3
- **저장 시 암호화**: AES-256
- **비밀번호**: bcrypt 해싱
- **API 키**: 환경 변수로 관리

### 입력 검증

- Pydantic을 통한 스키마 검증
- SQL Injection 방지: Parameterized queries
- XSS 방지: 출력 인코딩

### 속도 제한

- 일반 API: 분당 100 요청
- 감정 분석 API: 시간당 100 요청
- 행동 이벤트: 초당 10 요청

## 모니터링 및 로깅

### 로깅 전략

```python
# 구조화된 로깅
logger.info(
    "emotion_detected",
    student_id=student_id,
    emotion=primary_emotion,
    confidence=confidence
)
```

### 모니터링 메트릭

- API 응답 시간
- 감정 분석 처리 시간
- LMS 연동 성공률
- 에러율
- 활성 세션 수

### 알림 조건

- API 응답 시간 > 2초
- 에러율 > 5%
- LMS 연동 실패율 > 10%
- 디스크 사용량 > 80%

## 테스트 전략

### 단위 테스트

```python
def test_frustration_detection():
    analyzer = EmotionAnalyzer()

    # 좌절 패턴 시뮬레이션
    events = generate_frustration_events()
    result = analyzer.analyze_emotion(events)

    assert result['primary_emotion'] == 'frustration'
    assert result['confidence'] > 0.7
```

### 통합 테스트

```python
@pytest.mark.asyncio
async def test_emotion_analysis_pipeline():
    # 이벤트 추적 → 분석 → LMS 알림
    await track_behavior_event(event)
    emotion = await analyze_emotions(session_id)
    success = await send_lms_alert(emotion)

    assert success is True
```

## 배포 가이드

### Docker Compose 배포

```bash
# 환경 변수 설정
cp .env.example .env
vim .env

# 서비스 시작
docker-compose up -d

# 로그 확인
docker-compose logs -f backend

# 서비스 중지
docker-compose down
```

### 프로덕션 체크리스트

- [ ] 환경 변수 설정 완료
- [ ] PostgreSQL 백업 설정
- [ ] HTTPS/SSL 인증서 설치
- [ ] 방화벽 규칙 설정
- [ ] 모니터링 도구 연동
- [ ] 로그 수집 시스템 구성
- [ ] 백업 및 복구 계획 수립
- [ ] 성능 테스트 완료
- [ ] 보안 감사 완료

## 문제 해결

### 일반적인 문제

1. **감정 분석이 작동하지 않음**
   - 로그 확인: `docker-compose logs backend`
   - 행동 이벤트가 수집되는지 확인
   - 데이터베이스 연결 확인

2. **LMS 연동 실패**
   - LMS URL 및 API 키 확인
   - 네트워크 연결 테스트
   - LMS 플랫폼 상태 확인

3. **프론트엔드 연결 오류**
   - CORS 설정 확인
   - API URL 환경 변수 확인
   - 네트워크 탭에서 요청 확인

## 향후 개선 사항

1. **AI 분석 강화**: Claude API 통합으로 더 정확한 감정 감지
2. **실시간 알림**: WebSocket을 통한 실시간 감정 상태 푸시
3. **다국어 지원**: 한국어, 영어 외 추가 언어 지원
4. **모바일 앱**: 네이티브 모바일 앱 개발
5. **고급 분석**: 장기 감정 패턴 및 학습 성과 상관관계 분석
6. **맞춤형 개입**: AI 기반 개인화된 학습 개입 추천

---

**작성일**: 2025-11-18
**버전**: 1.0.0
**작성자**: KAIST Touch Math Academy
