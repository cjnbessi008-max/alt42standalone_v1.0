# Thinking Points Tracking Feature

## 개요 (Overview)

**Thinking Points Tracking**은 학생들이 문제를 풀 때 **어느 부분에서 가장 오래 고민했는지**를 자동으로 추적하고 시각화하는 기능입니다. 이를 통해:

- **학생**: 자신의 학습 패턴을 이해하고 어려워하는 부분을 파악
- **교사**: 학생들이 공통적으로 어려워하는 개념을 발견하고 교육 내용 개선
- **시스템**: 문제의 난이도를 자동으로 조정하고 개인화된 학습 경로 제공

---

## 주요 기능 (Key Features)

### 1. 자동 시간 추적
- 문제 전체, 각 단계, 각 입력 필드별 소요 시간 자동 측정
- Active time (실제 작업 시간) vs. Passive time (읽기/사고 시간) 구분
- 일시정지 감지 및 기록

### 2. 행동 패턴 분류
학생의 상호작용 패턴을 4가지로 자동 분류:
- **Productive (생산적)**: 꾸준한 진행, 정상적인 속도
- **Struggle (고전)**: 긴 일시정지, 여러 번 시도, 느린 진행
- **Confusion (혼란)**: 빠른 필드 전환, 도움 요청, 불규칙한 행동
- **Mastery (숙달)**: 빠르고 자신감 있는 상호작용, 정확한 답변

### 3. 시각화
- **히트맵**: 색상으로 난이도와 소요 시간 표시
- **학생 뷰**: 개인별 고민 지점 분석
- **교사 뷰**: 전체 학생의 집계 데이터 및 어려운 섹션 강조

### 4. 맞춤형 인사이트
- 학생별 추천 복습 주제
- 추가 지원이 필요한 학생 자동 식별
- 문제 난이도 조정 제안

---

## 시스템 아키텍처 (System Architecture)

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React)                          │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  useThinkingPointsTracker Hook                        │  │
│  │  - 시간 측정 및 이벤트 추적                             │  │
│  │  - 자동 데이터 제출 (30초마다)                          │  │
│  └──────────────────────────────────────────────────────┘  │
│                           │                                  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  ThinkingPointsHeatmap Component                      │  │
│  │  - 히트맵 시각화                                        │  │
│  │  - 어려운 섹션 표시                                     │  │
│  └──────────────────────────────────────────────────────┘  │
└───────────────────────┬─────────────────────────────────────┘
                        │ REST API
┌───────────────────────▼─────────────────────────────────────┐
│                 Backend (FastAPI)                            │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Thinking Points API                                  │  │
│  │  - POST /thinking-points (데이터 저장)                 │  │
│  │  - GET  /heatmap/{problem_id} (히트맵 데이터)          │  │
│  │  - GET  /insights/{student_id} (개인화된 인사이트)     │  │
│  └──────────────────────────────────────────────────────┘  │
│                           │                                  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Pattern Classification Logic                         │  │
│  │  - 상호작용 패턴 분석                                   │  │
│  │  - 자동 난이도 계산                                     │  │
│  └──────────────────────────────────────────────────────┘  │
└───────────────────────┬─────────────────────────────────────┘
                        │
┌───────────────────────▼─────────────────────────────────────┐
│                PostgreSQL Database                           │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  thinking_points                                      │  │
│  │  - 개별 학생의 상호작용 데이터                         │  │
│  │  - 이벤트 로그 (JSONB)                                 │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  thinking_point_summaries                             │  │
│  │  - 집계 통계 (평균, 중앙값, 백분위수)                  │  │
│  │  - 주의 필요 플래그                                    │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  student_thinking_insights                            │  │
│  │  - 학생별 맞춤형 인사이트                              │  │
│  │  - 추천 복습 주제                                      │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## 데이터 모델 (Data Models)

### ThinkingPoint (개별 상호작용 기록)

```typescript
{
  id: UUID
  student_id: UUID
  problem_id: UUID
  module_id: UUID
  section_identifier: string        // "numerator_input", "step_2", etc.
  section_type: enum                // problem_level, step_level, concept_level, interaction_level

  // 시간 메트릭
  time_spent_seconds: number
  active_time_seconds: number       // 실제 작업 시간
  passive_time_seconds: number      // 읽기/사고 시간

  // 상호작용 메트릭
  interaction_count: number
  focus_count: number
  blur_count: number

  // 일시정지 분석
  pause_count: number
  longest_pause_seconds: number
  avg_pause_seconds: number

  // 패턴 분류
  thinking_pattern: enum            // productive, struggle, confusion, mastery

  // 행동 지표
  backtrack_count: number           // 이전 섹션으로 돌아간 횟수
  help_requested_count: number
  hint_used_count: number

  // 상세 이벤트 로그
  events: JSONB[]                   // [{type, section, timestamp, data}]

  first_interaction_at: timestamp
  last_interaction_at: timestamp
  created_at: timestamp
  updated_at: timestamp
}
```

### ThinkingPointSummary (집계 통계)

```typescript
{
  id: UUID
  problem_id: UUID
  module_id: UUID
  section_identifier: string

  // 집계 메트릭
  total_students: number
  total_interactions: number

  // 시간 통계
  avg_time_spent_seconds: number
  median_time_spent_seconds: number
  min_time_spent_seconds: number
  max_time_spent_seconds: number
  stddev_time_spent_seconds: number
  p25_time_seconds: number          // 25번째 백분위수
  p75_time_seconds: number          // 75번째 백분위수
  p90_time_seconds: number          // 90번째 백분위수

  // 패턴 분포
  productive_count: number
  struggle_count: number
  confusion_count: number
  mastery_count: number

  // 비율
  struggle_rate: number             // 0.0 ~ 1.0
  confusion_rate: number
  mastery_rate: number

  // 주의 플래그
  needs_attention: boolean          // struggle_rate > 0.5 또는 avg_time > 2*median
  difficulty_score: number          // 계산된 난이도 (0~100)

  recommendations: string           // 자동 생성된 추천사항
  last_calculated_at: timestamp
}
```

### StudentThinkingInsight (개인화된 인사이트)

```typescript
{
  id: UUID
  student_id: UUID
  module_id: UUID

  // 전체 패턴
  dominant_pattern: string          // 가장 일반적인 패턴
  avg_problem_time_seconds: number
  total_problems_attempted: number

  // 취약점 및 강점
  struggle_sections: string[]       // 어려워하는 섹션 목록
  mastery_sections: string[]        // 숙달한 섹션 목록

  // 행동 특성
  tends_to_seek_help: boolean
  uses_hints_frequently: boolean
  backtracks_often: boolean

  // 시간 관리
  avg_pause_duration_seconds: number
  works_methodically: boolean       // 일관된 속도 vs. 불규칙

  // 추천사항
  suggested_review_topics: string[]
  needs_support: boolean
  support_priority: enum            // low, medium, high, critical

  last_updated_at: timestamp
}
```

---

## 사용 방법 (Usage Guide)

### 1. Frontend: React Hook 사용

```tsx
import { useThinkingPointsTracker } from '../hooks/useThinkingPointsTracker';

const FractionProblem = ({ problem, module }) => {
  // 트래커 초기화
  const tracker = useThinkingPointsTracker({
    problemId: problem.id,
    moduleId: module.id,
    sections: ['numerator', 'denominator', 'visualizer', 'submit'],
    autoSubmit: true,
    submitInterval: 30000  // 30초마다 자동 제출
  });

  return (
    <div className="problem-container">
      <h2>분수 덧셈 문제</h2>

      {/* 분자 입력 - 자동 추적 */}
      <div>
        <label htmlFor="numerator">분자:</label>
        <input
          id="numerator"
          type="number"
          {...tracker.trackSection('numerator')}
        />
      </div>

      {/* 분모 입력 - 자동 추적 */}
      <div>
        <label htmlFor="denominator">분모:</label>
        <input
          id="denominator"
          type="number"
          {...tracker.trackSection('denominator')}
        />
      </div>

      {/* 시각화 영역 - 클릭 추적 */}
      <div {...tracker.trackSection('visualizer')}>
        <FractionVisualizer />
      </div>

      {/* 도움말 버튼 - 수동 이벤트 기록 */}
      <button onClick={() => tracker.recordHelp('numerator')}>
        도움말
      </button>

      {/* 힌트 버튼 */}
      <button onClick={() => tracker.recordHint('denominator')}>
        힌트 보기
      </button>

      {/* 제출 버튼 */}
      <button
        {...tracker.trackSection('submit')}
        onClick={async () => {
          // 최종 데이터 제출
          await tracker.submitData();
          // 문제 제출 로직...
        }}
      >
        제출
      </button>
    </div>
  );
};
```

### 2. Frontend: 히트맵 시각화

```tsx
import ThinkingPointsHeatmap from '../components/ThinkingPointsHeatmap';

// 학생 뷰 - 개인 히트맵
const StudentResultsPage = ({ problemId, moduleId, studentId }) => {
  return (
    <div>
      <h2>내가 고민한 지점</h2>
      <ThinkingPointsHeatmap
        problemId={problemId}
        moduleId={moduleId}
        viewMode="student"
        studentId={studentId}
        colorScheme="time"
        onSectionClick={(sectionId) => {
          console.log('Clicked section:', sectionId);
          // 해당 섹션 상세 정보 표시
        }}
      />
    </div>
  );
};

// 교사 뷰 - 전체 학생 집계
const TeacherAnalyticsPage = ({ problemId, moduleId }) => {
  return (
    <div>
      <h2>학생들이 어려워하는 부분</h2>
      <ThinkingPointsHeatmap
        problemId={problemId}
        moduleId={moduleId}
        viewMode="teacher"
        colorScheme="difficulty"
        onSectionClick={(sectionId) => {
          // 해당 섹션의 상세 분석 페이지로 이동
          navigate(`/analytics/section/${sectionId}`);
        }}
      />
    </div>
  );
};
```

### 3. Backend: API 엔드포인트

#### 데이터 제출
```http
POST /api/modules/{module_id}/thinking-points
Content-Type: application/json

{
  "thinking_points": [
    {
      "student_id": "uuid",
      "problem_id": "uuid",
      "section_identifier": "numerator",
      "section_type": "concept_level",
      "time_spent_seconds": 45,
      "active_time_seconds": 30,
      "passive_time_seconds": 15,
      "interaction_count": 12,
      "pause_count": 2,
      "longest_pause_seconds": 8,
      "events": [...]
    }
  ]
}
```

#### 히트맵 데이터 조회
```http
GET /api/modules/{module_id}/thinking-points/heatmap/{problem_id}

Response:
{
  "problem_id": "uuid",
  "sections": [
    {
      "section_identifier": "numerator",
      "avg_time_seconds": 42.5,
      "median_time_seconds": 38.0,
      "struggle_rate": 0.35,
      "total_students": 20,
      "needs_attention": false,
      "difficulty_score": 45.2
    }
  ],
  "overall_difficulty": 52.3,
  "high_struggle_sections": ["denominator", "submit"]
}
```

#### 개인화된 인사이트 조회
```http
GET /api/modules/{module_id}/thinking-points/insights/{student_id}

Response:
{
  "student_id": "uuid",
  "module_id": "uuid",
  "dominant_pattern": "productive",
  "avg_problem_time_seconds": 180,
  "total_problems_attempted": 15,
  "struggle_sections": ["denominator", "complex_fractions"],
  "mastery_sections": ["numerator", "simple_addition"],
  "needs_support": false,
  "support_priority": "low",
  "suggested_review_topics": ["분모 개념 복습", "복잡한 분수 연습"]
}
```

### 4. Database: 마이그레이션 실행

```bash
# 데이터베이스 마이그레이션 실행
psql -U your_username -d your_database -f database/migrations/001_create_thinking_points_tables.sql

# 또는 마이그레이션 도구 사용
alembic upgrade head
```

---

## 패턴 분류 로직 (Pattern Classification)

시스템은 다음 메트릭을 기반으로 자동으로 패턴을 분류합니다:

```python
def classify_thinking_pattern(
    time_spent: int,
    pause_count: int,
    longest_pause: int,
    backtrack_count: int,
    help_count: int,
    interaction_count: int
) -> str:
    # 상호작용 속도 계산 (분당 상호작용 수)
    interaction_pace = (interaction_count / time_spent) * 60 if time_spent > 0 else 0

    # 혼란 (Confusion)
    if help_count > 2 or (backtrack_count > 3 and longest_pause > 30):
        return "confusion"

    # 고전 (Struggle)
    elif longest_pause > 45 or pause_count > 5:
        return "struggle"

    # 숙달 (Mastery)
    elif interaction_pace > 3 and pause_count < 3 and backtrack_count == 0:
        return "mastery"

    # 생산적 (Productive)
    else:
        return "productive"
```

### 난이도 점수 계산

```python
difficulty_score = (avg_time_seconds / 60 * 0.6) + (struggle_rate * 40)

# 예시:
# - avg_time = 120초 (2분)
# - struggle_rate = 0.4 (40%)
# difficulty_score = (120/60 * 0.6) + (0.4 * 40) = 1.2 + 16 = 17.2
```

### 주의 필요 플래그

섹션에 다음 조건 중 하나라도 만족하면 `needs_attention = true`:
- `struggle_rate > 0.5` (학생의 50% 이상이 고전)
- `avg_time > 2 * median_time` (평균이 중앙값의 2배 초과)

---

## 프라이버시 및 윤리적 고려사항

### 1. 비침습적 추적
- **타이머 표시 안 함**: 학생에게 압박감을 주지 않기 위해 가시적 타이머 없음
- **백그라운드 추적**: 학습 경험을 방해하지 않도록 자동 추적

### 2. 데이터 사용 목적
- **학습 개선용**: 처벌이 아닌 개선을 위한 데이터
- **투명성**: 학생과 학부모에게 데이터 수집 및 사용 방법 공개

### 3. 접근 권한
- **학생**: 본인의 데이터만 조회 가능
- **교사**: 집계된 익명 데이터 + 개별 학생 데이터 (교육 목적)
- **관리자**: 전체 통계 및 시스템 분석

### 4. 데이터 보안
- 암호화 저장 (AES-256)
- 전송 시 TLS 1.3 사용
- FERPA/COPPA 규정 준수

---

## 예제 시나리오 (Example Scenarios)

### 시나리오 1: 학생 - 자기 분석

**상황**: 민수는 분수 문제를 풀고 결과를 확인합니다.

```
[히트맵 표시]
- 분자 입력: 평균 15초 (녹색 - 쉬움)
- 분모 입력: 평균 85초 (노란색 - 보통)  ⚠️ 가장 오래 고민한 지점
- 시각화: 평균 30초 (녹색 - 쉬움)

[인사이트]
"분모를 입력할 때 가장 많은 시간을 보냈네요.
분모의 개념을 다시 복습해보는 것이 도움이 될 수 있어요."

[추천 복습 자료]
- 분모란 무엇인가?
- 분모가 다른 분수 더하기
```

### 시나리오 2: 교사 - 교육 내용 개선

**상황**: 김 선생님이 3학년 분수 문제의 분석 결과를 확인합니다.

```
[전체 학생 히트맵]
문제: "3/4 + 1/2 = ?"

섹션별 난이도:
- 첫 번째 분수 입력: 난이도 25 (쉬움)
- 두 번째 분수 입력: 난이도 30 (쉬움)
- 통분 단계: 난이도 78 (어려움) ⚠️ 주의 필요
- 덧셈 계산: 난이도 45 (보통)
- 답 입력: 난이도 20 (쉬움)

[분석]
- 전체 20명 중 16명(80%)이 통분 단계에서 고전
- 평균 소요 시간: 3분 20초 (다른 단계 평균의 4배)

[추천]
"통분 개념에 대한 추가 설명이 필요합니다.
다음 수업에서 통분을 시각적으로 설명하는 자료를 사용하세요."
```

### 시나리오 3: 시스템 - 자동 난이도 조정

**상황**: AI 시스템이 문제 난이도를 자동으로 조정합니다.

```python
# 시스템 분석
if summary.needs_attention and summary.struggle_rate > 0.6:
    # 너무 어려움 - 난이도 하향 조정
    recommend_difficulty_adjustment(problem_id, direction="easier")
    suggest_prerequisite_review(section_identifier)

elif summary.mastery_rate > 0.8 and summary.avg_time < summary.median_time * 0.5:
    # 너무 쉬움 - 난이도 상향 조정 또는 건너뛰기 제안
    recommend_difficulty_adjustment(problem_id, direction="harder")
    suggest_skip_to_advanced(student_id)
```

---

## 성능 최적화 (Performance Optimization)

### 1. 프론트엔드
- **배치 제출**: 개별 이벤트가 아닌 30초마다 배치로 제출
- **로컬 버퍼링**: 네트워크 실패 시 로컬 스토리지에 임시 저장
- **최소 데이터 전송**: 필요한 메트릭만 전송, 상세 이벤트는 선택적

### 2. 백엔드
- **비동기 처리**: 통계 재계산은 비동기로 처리 (Fire-and-forget)
- **캐싱**: Redis를 사용한 히트맵 데이터 캐싱 (5분 TTL)
- **인덱싱**: 자주 조회되는 필드에 대한 데이터베이스 인덱스

### 3. 데이터베이스
- **파티셔닝**: 날짜 기준 테이블 파티셔닝 (월별)
- **Materialized Views**: 자주 조회되는 집계 데이터는 Materialized View 사용
- **Scheduled Jobs**: 통계 재계산은 오프피크 시간대에 스케줄링

---

## 테스트 (Testing)

### 단위 테스트

```typescript
// useThinkingPointsTracker 테스트
describe('useThinkingPointsTracker', () => {
  it('should track time spent on a section', () => {
    const { result } = renderHook(() => useThinkingPointsTracker({
      problemId: 'test-problem',
      moduleId: 'test-module',
      sections: ['section1']
    }));

    const tracker = result.current.trackSection('section1');

    // Focus 이벤트 시뮬레이션
    act(() => {
      tracker.onFocus({} as React.FocusEvent);
    });

    // 2초 대기
    await sleep(2000);

    // Blur 이벤트 시뮬레이션
    act(() => {
      tracker.onBlur({} as React.FocusEvent);
    });

    const metrics = result.current.getMetrics('section1');
    expect(metrics.timeSpentSeconds).toBeGreaterThanOrEqual(2);
  });
});
```

### 통합 테스트

```python
# API 통합 테스트
async def test_submit_and_retrieve_thinking_points():
    # 데이터 제출
    response = await client.post(
        f"/api/modules/{module_id}/thinking-points",
        json={
            "thinking_points": [{
                "student_id": str(student_id),
                "problem_id": str(problem_id),
                "section_identifier": "test_section",
                "section_type": "concept_level",
                "time_spent_seconds": 60,
                "interaction_count": 10,
                ...
            }]
        }
    )
    assert response.status_code == 201

    # 히트맵 조회
    heatmap = await client.get(
        f"/api/modules/{module_id}/thinking-points/heatmap/{problem_id}"
    )
    assert heatmap.status_code == 200
    assert len(heatmap.json()["sections"]) > 0
```

---

## 향후 개선 사항 (Future Enhancements)

### Phase 2
- **실시간 알림**: 학생이 너무 오래 고민 시 실시간 힌트 제공
- **AI 코치**: GPT 기반 맞춤형 학습 조언
- **비교 분석**: 또래 학생들과의 비교 (익명)

### Phase 3
- **예측 모델**: 머신러닝을 통한 학생 성과 예측
- **자동 커리큘럼 조정**: 학생별 맞춤 학습 경로 자동 생성
- **음성 및 영상 분석**: 멀티모달 데이터 통합

---

## 문제 해결 (Troubleshooting)

### 문제: 데이터가 제출되지 않음
**원인**: 네트워크 오류 또는 인증 토큰 만료
**해결**:
```typescript
// 로컬 스토리지에 버퍼링 추가
const submitDataInternal = async () => {
  try {
    await thinkingPointsAPI.submit(moduleId, thinkingPoints);
    // 성공 시 로컬 버퍼 비우기
    localStorage.removeItem('thinking_points_buffer');
  } catch (error) {
    // 실패 시 로컬 스토리지에 저장
    localStorage.setItem('thinking_points_buffer', JSON.stringify(thinkingPoints));
    // 재시도 예약
    setTimeout(() => submitDataInternal(), 5000);
  }
};
```

### 문제: 히트맵이 표시되지 않음
**원인**: 데이터 부족 (통계 계산 불가)
**해결**: 최소 3명 이상의 학생 데이터가 필요함을 사용자에게 안내

### 문제: 패턴 분류가 부정확함
**원인**: 임계값 조정 필요
**해결**:
```python
# 학교/학년별 임계값 커스터마이징
PATTERN_THRESHOLDS = {
    'elementary': {
        'pause_threshold': 5,
        'struggle_pause': 45,
        'confusion_help_count': 2
    },
    'middle': {
        'pause_threshold': 3,
        'struggle_pause': 30,
        'confusion_help_count': 3
    }
}
```

---

## 참고 자료 (References)

- [PRD - AI Education System Pipeline](/tasks/0001-prd-ai-education-pipeline.md)
- [Database Migration Script](/database/migrations/001_create_thinking_points_tables.sql)
- [Frontend Hook Documentation](/frontend/src/hooks/useThinkingPointsTracker.ts)
- [Backend API Documentation](/backend/api/thinking_points.py)
- [Heatmap Component](/frontend/src/components/ThinkingPointsHeatmap.tsx)

---

## 라이선스 및 기여 (License & Contributing)

이 기능은 KAIST Touch Math Academy AI Education System의 일부입니다.

**기여 방법**:
1. 이슈 생성
2. Feature 브랜치 생성 (`git checkout -b feature/thinking-points-enhancement`)
3. 변경사항 커밋
4. Pull Request 생성

**문의**: education-tech@kaist.ac.kr

---

**마지막 업데이트**: 2025-11-18
**버전**: 1.0.0
**작성자**: AI Development Team
