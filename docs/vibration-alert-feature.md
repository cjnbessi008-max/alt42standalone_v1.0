# LMS 진동 경고 기능 (Vibration Alert Feature)

## 개요 (Overview)

LMS 시스템에 통합된 진동 경고 기능은 학생이 오답을 제출할 가능성이 높은 단계에서 햅틱 피드백을 제공하여 학습 경험을 향상시킵니다.

This feature provides haptic feedback alerts to students at stages with high probability of wrong answers, enhancing the learning experience in the LMS system.

---

## 주요 기능 (Key Features)

### 1. 위험도 평가 (Risk Assessment)
- 학생의 답변 시도 횟수 추적
- 개념 중요도 평가
- 문제 난이도 고려
- 소요 시간 분석

### 2. 적응형 진동 패턴 (Adaptive Vibration Patterns)
- **낮은 위험도 (Low Risk)**: 짧은 단일 펄스
- **중간 위험도 (Medium Risk)**: 이중 펄스
- **높은 위험도 (High Risk)**: 삼중 경고 패턴

### 3. 개인화 설정 (Personalization)
- 사용자가 진동 활성화/비활성화 가능
- 강도 조절 (1-10 단계)
- 학년별 맞춤 설정

---

## 시스템 아키텍처 (System Architecture)

```
┌─────────────────────────────────────┐
│  Frontend (React + TypeScript)      │
│  - VibrationHandler.ts              │
│  - AssessmentFeedback.tsx           │
│  - Web Vibration API Integration    │
└──────────────┬──────────────────────┘
               │ REST API / WebSocket
┌──────────────▼──────────────────────┐
│  Backend API (Python FastAPI)       │
│  - submission_routes.py             │
│  - vibration_service.py             │
│  - Risk Assessment Engine           │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│  Database (PostgreSQL)              │
│  - vibration_settings               │
│  - student_attempts                 │
│  - vibration_events                 │
│  - problem_metadata                 │
└─────────────────────────────────────┘
```

---

## 설치 및 설정 (Installation & Setup)

### 1. 데이터베이스 스키마 설치

```bash
psql -U postgres -d lms_database -f database/schema/vibration_settings.sql
```

### 2. 백엔드 의존성 설치

```bash
cd backend
pip install -r requirements.txt
```

### 3. 프론트엔드 의존성 설치

```bash
cd frontend
npm install
```

### 4. 설정 파일 구성

`config/vibration_config.json` 파일을 프로젝트 요구사항에 맞게 수정:

```json
{
  "default_settings": {
    "enabled": true,
    "trigger_on_wrong_answer": true,
    "intensity_level": 5,
    "risk_threshold": "medium"
  }
}
```

---

## 사용 방법 (Usage)

### Frontend 컴포넌트 통합

```typescript
import AssessmentFeedback from './components/AssessmentFeedback';
import VibrationHandler from './utils/VibrationHandler';

function ProblemSolver() {
  const [feedback, setFeedback] = useState<FeedbackResponse | null>(null);

  const handleSubmit = async (answer: Answer) => {
    const response = await fetch(`/api/modules/${moduleId}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        student_id: studentId,
        problem_id: problemId,
        answer_numerator: answer.numerator,
        answer_denominator: answer.denominator,
        time_spent_seconds: timeSpent,
        device_info: {
          vibration_supported: VibrationHandler.isSupported(),
          user_agent: navigator.userAgent
        }
      })
    });

    const feedbackData = await response.json();
    setFeedback(feedbackData);
  };

  return (
    <div>
      {/* Problem display */}
      <ProblemDisplay />

      {/* Answer input */}
      <AnswerInput onSubmit={handleSubmit} />

      {/* Feedback with vibration */}
      {feedback && (
        <AssessmentFeedback
          moduleId={moduleId}
          problemId={problemId}
          studentId={studentId}
          response={feedback}
          enableVibration={true}
        />
      )}
    </div>
  );
}
```

### Backend API 엔드포인트

#### 답변 제출

```
POST /api/modules/{module_id}/submit
```

**Request Body:**
```json
{
  "student_id": "uuid",
  "problem_id": "uuid",
  "answer_numerator": 3,
  "answer_denominator": 4,
  "time_spent_seconds": 120,
  "device_info": {
    "vibration_supported": true,
    "user_agent": "Mozilla/5.0..."
  }
}
```

**Response:**
```json
{
  "is_correct": false,
  "feedback_text": "Not quite right. Try again!",
  "next_action": "retry",
  "attempt_number": 2,
  "risk_level": "medium",
  "vibration": {
    "trigger": true,
    "pattern": "double_pulse",
    "duration_ms": 250,
    "intensity": 5,
    "pulses": [100, 50, 100]
  },
  "assessment_details": {
    "attempt_count": 2,
    "concept_importance": 0.8,
    "time_spent_seconds": 120
  },
  "timestamp": "2025-11-18T10:30:00Z"
}
```

#### 진동 설정 조회

```
GET /api/modules/{module_id}/vibration/settings
```

#### 진동 설정 업데이트

```
PUT /api/modules/{module_id}/vibration/settings
```

---

## 진동 패턴 (Vibration Patterns)

### 1. Short Pulse (단일 펄스)
- **용도**: 낮은 위험도 오답
- **패턴**: `[200]` ms
- **강도**: 3/10
- **사용 시나리오**: 첫 시도 오답, 간단한 실수

### 2. Double Pulse (이중 펄스)
- **용도**: 중간 위험도 오답
- **패턴**: `[100, 50, 100]` ms
- **강도**: 5/10
- **사용 시나리오**: 여러 번 시도, 중요한 개념

### 3. Warning Pattern (경고 패턴)
- **용도**: 높은 위험도 오답
- **패턴**: `[150, 75, 150, 75, 150]` ms
- **강도**: 7/10
- **사용 시나리오**: 많은 실패 시도, 핵심 개념 오답

### 4. Critical Alert (긴급 경고)
- **용도**: 매우 높은 위험도
- **패턴**: `[200, 100, 200, 100, 200, 100, 200]` ms
- **강도**: 9/10
- **사용 시나리오**: 선수 개념 실패, 긴급 개입 필요

### 5. Success Pulse (성공 피드백)
- **용도**: 정답 피드백 (선택적)
- **패턴**: `[200]` ms
- **강도**: 4/10
- **사용 시나리오**: 정답 제출, 달성 보상

---

## 위험도 평가 알고리즘 (Risk Assessment Algorithm)

### 위험도 점수 계산

```python
risk_score = (
    attempt_count_factor * 0.4 +
    concept_importance * 0.3 +
    difficulty_factor * 0.2 +
    time_spent_factor * 0.1
)
```

### 점수 구간별 위험도

- **0.0 - 0.4**: 낮은 위험도 (Low Risk)
- **0.4 - 0.7**: 중간 위험도 (Medium Risk)
- **0.7 - 1.0**: 높은 위험도 (High Risk)

### 요소별 점수

#### 1. 시도 횟수 (Attempt Count) - 40%
- 1회 시도: 0.1
- 2회 시도: 0.2
- 3회 시도: 0.3
- 4회 이상: 0.4

#### 2. 개념 중요도 (Concept Importance) - 30%
- 범위: 0.0 (낮음) ~ 1.0 (높음)
- 교육과정 내 중요도에 따라 결정

#### 3. 난이도 (Difficulty) - 20%
- 쉬움: 0.0
- 보통: 0.1
- 어려움: 0.2

#### 4. 소요 시간 (Time Spent) - 10%
- 0-3분: 0.0
- 3-5분: 0.05
- 5분 이상: 0.1

---

## 접근성 고려사항 (Accessibility Considerations)

### 1. 사용자 제어
- 진동 활성화/비활성화 옵션 제공
- 강도 조절 가능
- 패턴 선택 가능

### 2. 장치 지원 감지
```typescript
const isSupported = VibrationHandler.isSupported();
if (!isSupported) {
  // 시각적 대체 피드백 제공
  showVisualAlert();
}
```

### 3. Reduced Motion 지원
```typescript
if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  // 진동 비활성화 또는 약한 피드백
  VibrationHandler.setUserPreference(false);
}
```

### 4. 학년별 조정
- 초등학교: 낮은 강도 (최대 6/10)
- 중학교: 중간 강도 (최대 7/10)
- 고등학교: 표준 강도 (최대 8/10)
- 대학: 전체 범위 (최대 10/10)

---

## 분석 및 모니터링 (Analytics & Monitoring)

### 추적 메트릭

1. **진동 트리거 이벤트**
   - 총 진동 수
   - 위험도 수준별 분포
   - 패턴별 사용 빈도

2. **장치 지원**
   - 지원되는 장치 비율
   - 브라우저별 호환성
   - 사용자 에이전트 분석

3. **효과성 측정**
   - 진동 후 정답률 향상
   - 평균 시도 횟수 변화
   - 학습 시간 단축

4. **사용자 선호도**
   - 활성화/비활성화 비율
   - 선호 강도 분포
   - 피드백 만족도

### 분석 쿼리 예시

```sql
-- 모듈별 진동 효과성
SELECT
    module_id,
    pattern,
    COUNT(*) as total_vibrations,
    AVG(attempt_number) as avg_attempts_with_vibration
FROM vibration_events
GROUP BY module_id, pattern
ORDER BY avg_attempts_with_vibration;

-- 위험도별 정답률
SELECT
    risk_level,
    COUNT(*) as total_attempts,
    SUM(CASE WHEN is_correct THEN 1 ELSE 0 END) as correct_count,
    ROUND(AVG(CASE WHEN is_correct THEN 1.0 ELSE 0.0 END) * 100, 2) as success_rate
FROM student_attempts
WHERE vibration_triggered = true
GROUP BY risk_level;
```

---

## 문제 해결 (Troubleshooting)

### 진동이 작동하지 않을 때

1. **장치 지원 확인**
   ```typescript
   console.log('Vibration supported:', VibrationHandler.isSupported());
   ```

2. **사용자 권한 확인**
   - 일부 브라우저는 사용자 상호작용 후에만 진동 허용
   - HTTPS 연결 필요 (localhost 제외)

3. **브라우저 호환성**
   - Chrome/Edge: 완전 지원
   - Firefox: 부분 지원
   - Safari: iOS에서 제한적 지원
   - Samsung Internet: 완전 지원

4. **설정 확인**
   ```typescript
   const status = VibrationHandler.getStatus();
   console.log('Status:', status);
   // { supported: true, enabled: true, userAgent: "..." }
   ```

### 일반적인 문제

#### 문제: 진동이 너무 약함
**해결책**: 강도 수준 증가
```typescript
VibrationHandler.vibrateWithPattern('double_pulse', 8); // intensity 8
```

#### 문제: 진동이 너무 자주 발생
**해결책**: 쿨다운 시간 설정
```json
{
  "performance": {
    "cooldown_between_vibrations_ms": 3000
  }
}
```

#### 문제: iOS에서 작동 안 함
**해결책**: iOS는 제한적 지원. 시각적 대체 피드백 제공
```typescript
if (!vibration.isSupported) {
  showVisualAlert(); // 시각적 대체
}
```

---

## 보안 고려사항 (Security Considerations)

### 1. Rate Limiting
- 분당 최대 10회 진동 제한
- 남용 방지

### 2. 데이터 프라이버시
- 진동 이벤트 로그는 익명화
- GDPR 준수

### 3. 사용자 제어
- 언제든지 비활성화 가능
- 데이터 삭제 요청 지원

---

## API 참조 (API Reference)

### VibrationHandler Class

#### Methods

##### `isSupported(): boolean`
장치가 진동 API를 지원하는지 확인

##### `vibrate(pattern: number | number[]): boolean`
진동 패턴 실행

##### `vibrateWithPattern(patternName: VibrationPatternName, intensity?: number): boolean`
미리 정의된 패턴으로 진동

##### `vibrateForAnswer(isCorrect: boolean, riskLevel?: RiskLevel, customPattern?: VibrationPatternName, intensity?: number): boolean`
답변 결과에 따라 진동

##### `setUserPreference(enabled: boolean): void`
사용자 진동 선호도 설정

##### `getStatus(): {supported: boolean, enabled: boolean, userAgent: string}`
장치 및 설정 상태 반환

---

## 향후 개선 사항 (Future Enhancements)

1. **적응형 학습**
   - AI 기반 패턴 최적화
   - 개인별 선호도 학습

2. **다중 감각 피드백**
   - 진동 + 시각 + 청각 통합
   - 접근성 향상

3. **교사 대시보드**
   - 진동 효과성 모니터링
   - 학급별 분석

4. **고급 패턴**
   - 동적 패턴 생성
   - 문제 유형별 커스터마이징

---

## 라이센스 (License)

이 기능은 alt42standalone 프로젝트의 일부입니다.

---

## 기여 (Contributing)

기여를 환영합니다! Pull request를 제출하기 전에 다음을 확인해주세요:

1. 테스트 작성
2. 문서 업데이트
3. 접근성 가이드라인 준수
4. 브라우저 호환성 테스트

---

## 지원 (Support)

문제나 질문이 있으시면 GitHub Issues에 제출해주세요.

---

## 변경 이력 (Changelog)

### v1.0.0 (2025-11-18)
- 초기 릴리스
- 기본 진동 패턴 구현
- 위험도 평가 알고리즘
- React 컴포넌트 및 API 엔드포인트
- 데이터베이스 스키마
- 설정 파일 및 문서화

---

## 참고 자료 (References)

- [Web Vibration API Specification](https://www.w3.org/TR/vibration/)
- [MDN Web Docs: Vibration API](https://developer.mozilla.org/en-US/docs/Web/API/Vibration_API)
- [Browser Compatibility](https://caniuse.com/vibration)
- [Accessibility Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
