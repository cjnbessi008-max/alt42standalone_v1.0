# AI Education System Pipeline 연동 계획

## 개요

이 문서는 Moodle Confidence Reasoning 플러그인과 AI Education System Pipeline (PRD 참조) 간의 향후 연동 계획을 설명합니다.

---

## 현재 구현 상태

### Moodle 플러그인 (완료)
- ✅ Moodle 3.7 + MySQL 5.7 + PHP 7.1.9 지원
- ✅ 확신도 및 이유 데이터 수집
- ✅ 학생용 UI (슬라이더, 카테고리, 자유 텍스트)
- ✅ 교사용 리포트 페이지
- ✅ 통계 집계 (평균 확신도, 정답률 상관관계)
- ✅ GDPR 준수 (Privacy API)

### AI Education System Pipeline (계획)
- 📋 PostgreSQL + Python/Node.js 스택
- 📋 Claude AI 기반 자동 모듈 생성
- 📋 세계관 재구성 → 룰 생성 → 데이터 관리 → UI 생성
- 📋 Phase 3에서 LMS 연동 예정

---

## 연동 아키텍처

### 1단계: LTI (Learning Tools Interoperability) 연동

```
┌─────────────────────┐         LTI 1.3          ┌──────────────────────┐
│   Moodle 3.7 LMS    │◄─────────────────────────►│  AI Education        │
│  (Tool Consumer)    │                           │  System Pipeline     │
│                     │                           │  (Tool Provider)     │
│  • 학생 인증        │                           │  • 모듈 생성         │
│  • 퀴즈 관리        │                           │  • 적응형 학습       │
│  • 확신도 수집      │                           │  • 분석 엔진         │
└─────────────────────┘                           └──────────────────────┘
         │                                                   │
         │                                                   │
         ▼                                                   ▼
┌─────────────────────┐         REST API          ┌──────────────────────┐
│  MySQL 5.7          │◄─────────────────────────►│  PostgreSQL 15+      │
│  mdl_local_         │     Data Sync             │  AI 생성 스키마      │
│  confidence_*       │                           │  학생 진행 데이터    │
└─────────────────────┘                           └──────────────────────┘
```

### 2단계: 데이터 동기화

#### Moodle → AI System
**확신도 데이터 전송**

```json
{
  "event": "confidence_data_submitted",
  "timestamp": "2025-11-18T10:30:00Z",
  "student_id": "user_12345",
  "quiz_id": "quiz_789",
  "question_id": "q_101",
  "confidence_level": 4,
  "reasoning": "공부했던 내용이라 확신합니다",
  "reasoning_category": "studied",
  "answer_correct": true,
  "time_spent_seconds": 45
}
```

#### AI System → Moodle
**적응형 문제 추천**

```json
{
  "event": "adaptive_problem_recommendation",
  "student_id": "user_12345",
  "recommended_problems": [
    {
      "difficulty": "medium",
      "topic": "fractions_addition",
      "reason": "low_confidence_pattern_detected"
    }
  ],
  "metacognitive_insights": {
    "overconfidence_bias": 0.15,
    "calibration_score": 0.78
  }
}
```

---

## 구현 계획

### Phase 1: LTI Provider 구성 (AI System)

**목표**: AI Education System을 LTI Tool Provider로 구성

**작업**:
1. LTI 1.3 표준 구현
   ```python
   # AI System - LTI Provider
   from pylti1p3.tool_config import ToolConfJsonFile
   from pylti1p3.contrib.django import DjangoOIDCLogin

   @app.route('/lti/login', methods=['POST'])
   def lti_login():
       # OIDC 로그인 처리
       pass

   @app.route('/lti/launch', methods=['POST'])
   def lti_launch():
       # LTI 런치 요청 처리
       # Moodle에서 학생 정보, 코스 정보 수신
       pass
   ```

2. Moodle에 External Tool 등록
   - **Site administration** → **Plugins** → **Activity modules** → **External tool** → **Manage tools**
   - AI System의 LTI 엔드포인트 등록

3. Single Sign-On (SSO) 구현
   - Moodle 인증 정보를 AI System에 전달
   - 학생이 별도 로그인 없이 AI 생성 모듈 접근

### Phase 2: 확신도 데이터 연동

**목표**: Moodle의 확신도 데이터를 AI System으로 전송하여 메타인지 분석

**작업**:

1. **Webhook 구현 (Moodle)**
   ```php
   // local/confidencereasoning/classes/observer.php
   public static function confidence_data_submitted($event) {
       $data = $event->get_data();

       // AI System에 webhook 전송
       $webhook_url = get_config('local_confidencereasoning', 'ai_webhook_url');
       $client = new \GuzzleHttp\Client();
       $client->post($webhook_url, [
           'json' => [
               'event' => 'confidence_submitted',
               'data' => $data
           ]
       ]);
   }
   ```

2. **API Endpoint (AI System)**
   ```python
   # AI System - FastAPI
   @app.post("/api/v1/moodle/confidence-data")
   async def receive_confidence_data(data: ConfidenceDataSchema):
       # 확신도 데이터 수신 및 저장
       await store_confidence_data(data)

       # 메타인지 분석
       analysis = await analyze_metacognition(data.student_id)

       return {"status": "success", "analysis": analysis}
   ```

3. **데이터 스키마 매핑**
   ```sql
   -- AI System PostgreSQL
   CREATE TABLE moodle_confidence_sync (
       id UUID PRIMARY KEY,
       moodle_user_id VARCHAR(50),
       ai_student_id UUID REFERENCES students(id),
       quiz_id VARCHAR(50),
       question_id VARCHAR(50),
       confidence_level INT CHECK (confidence_level BETWEEN 1 AND 5),
       reasoning TEXT,
       reasoning_category VARCHAR(50),
       is_correct BOOLEAN,
       synced_at TIMESTAMP DEFAULT NOW()
   );
   ```

### Phase 3: 메타인지 분석 및 피드백

**목표**: 확신도 데이터를 활용한 학생 메타인지 능력 분석

**분석 지표**:

1. **Confidence Calibration (확신도 보정)**
   ```
   Calibration Score = 1 - |Confidence - Accuracy|
   ```
   - 확신도와 실제 정답률의 일치도
   - 점수가 높을수록 자기 평가 능력이 정확

2. **Overconfidence Bias (과신 편향)**
   ```
   Overconfidence = (High Confidence & Wrong) / Total High Confidence
   ```
   - 높은 확신도로 오답한 비율
   - 과신 패턴 감지

3. **Underconfidence Pattern (과소평가 패턴)**
   ```
   Underconfidence = (Low Confidence & Correct) / Total Low Confidence
   ```
   - 낮은 확신도로 정답한 비율
   - 자신감 부족 패턴 감지

**AI 피드백 예시**:
```json
{
  "student_id": "user_12345",
  "metacognitive_profile": {
    "calibration_score": 0.78,
    "overconfidence_bias": 0.15,
    "underconfidence_ratio": 0.22,
    "reasoning_quality": "high"
  },
  "recommendations": [
    {
      "type": "calibration_training",
      "message": "확신도를 15% 낮춰 평가하는 경향이 있습니다. 자신의 실력을 더 믿어보세요!",
      "action": "show_past_successes"
    },
    {
      "type": "reasoning_reinforcement",
      "message": "이유를 잘 설명하고 있습니다. 계속 유지하세요!",
      "action": "positive_reinforcement"
    }
  ]
}
```

### Phase 4: 적응형 문제 생성 연동

**목표**: 확신도 패턴에 따른 맞춤형 문제 제공

**로직**:

```python
# AI System - Adaptive Problem Generator
def generate_adaptive_problems(student_id):
    confidence_stats = get_confidence_stats(student_id)

    if confidence_stats.overconfidence_bias > 0.2:
        # 과신 패턴 → 도전적인 문제 제공
        return generate_challenging_problems(
            difficulty="hard",
            require_reasoning=True
        )

    elif confidence_stats.underconfidence_ratio > 0.3:
        # 과소평가 패턴 → 자신감 회복 문제 제공
        return generate_confidence_building_problems(
            difficulty="medium",
            show_hints=True
        )

    else:
        # 잘 보정된 학생 → 점진적 난이도 상승
        return generate_progressive_problems(
            current_mastery_level=confidence_stats.avg_confidence
        )
```

---

## 기술 스택 통합

### Moodle (현재)
- **Backend**: PHP 7.1.9
- **Database**: MySQL 5.7
- **Frontend**: JavaScript (AMD), jQuery
- **API**: Moodle Web Services (REST)

### AI System (계획)
- **Backend**: Python 3.11+ (FastAPI), Node.js (Express)
- **Database**: PostgreSQL 15+
- **Frontend**: React 18+
- **AI**: Claude API (Anthropic)
- **Task Queue**: Celery + Redis

### 연동 포인트
1. **LTI 1.3**: 인증 및 런치
2. **REST API**: 데이터 동기화
3. **WebSocket**: 실시간 피드백 (선택적)
4. **Webhooks**: 이벤트 기반 통신

---

## 보안 고려사항

### 1. 데이터 전송 보안
```python
# HTTPS + JWT Token
headers = {
    'Authorization': f'Bearer {jwt_token}',
    'Content-Type': 'application/json'
}

# 데이터 암호화 (선택적)
encrypted_data = encrypt_aes256(json.dumps(confidence_data))
```

### 2. 학생 개인정보 보호
- 학생 식별자 해싱
- GDPR/FERPA 준수
- 데이터 최소화 원칙

### 3. API 인증
```php
// Moodle - API Key 설정
set_config('ai_api_key', 'secure_api_key_here', 'local_confidencereasoning');
set_config('ai_webhook_url', 'https://ai-system.kaist.ac.kr/api/v1/moodle/confidence', 'local_confidencereasoning');
```

---

## 마일스톤

| Phase | 작업 | 예상 기간 | 상태 |
|-------|------|-----------|------|
| 1 | LTI Provider 구현 | 2주 | 📋 계획 |
| 2 | 확신도 데이터 연동 | 1주 | 📋 계획 |
| 3 | 메타인지 분석 엔진 | 3주 | 📋 계획 |
| 4 | 적응형 문제 생성 | 4주 | 📋 계획 |
| 5 | 통합 테스트 | 2주 | 📋 계획 |
| 6 | 파일럿 런칭 | 1주 | 📋 계획 |

**총 예상 기간**: 13주 (약 3개월)

---

## 다음 단계

1. **AI Education System Pipeline 개발 완료** (PRD 기준)
   - 세계관 재구성 → 룰 생성 → 데이터 관리 → UI 생성 파이프라인
   - 개발 기간: 26주 (PRD 참조)

2. **LTI 연동 설계 검토**
   - Moodle 관리자와 협의
   - AI System 아키텍트와 API 설계

3. **파일럿 테스트**
   - 소규모 학생 그룹 (10-20명)
   - 확신도 데이터 수집 및 분석 검증

4. **전체 배포**
   - KAIST Touch Math Academy 전체 학생 대상

---

## 참고 문서

- [PRD: AI Education System Pipeline](/tasks/0001-prd-ai-education-pipeline.md)
- [Moodle LTI Documentation](https://docs.moodle.org/en/LTI)
- [IMS Global LTI 1.3 Specification](https://www.imsglobal.org/spec/lti/v1p3/)
- [Claude API Documentation](https://docs.anthropic.com/claude/reference)

---

**작성일**: 2025-11-18
**버전**: 1.0
**작성자**: AI Agent (Claude)
