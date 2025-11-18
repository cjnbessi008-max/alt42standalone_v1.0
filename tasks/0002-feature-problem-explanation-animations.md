# Feature Specification: 문제별 미니 해설 애니메이션
# Problem Explanation Animation System

## 문서 정보 / Document Information
- **Feature ID**: FEA-0002
- **작성일 / Created**: 2025-11-18
- **상태 / Status**: Design Phase
- **우선순위 / Priority**: High
- **관련 PRD**: 0001-prd-ai-education-pipeline.md
- **대상 사용자 / Target Users**: Students (primary), Teachers (secondary)

---

## 1. 개요 / Overview

### 1.1 기능 목적 / Feature Purpose

LMS 웹앱에서 각 문제에 대한 **단계별 해설 애니메이션**을 제공하여:
- 학생들이 문제 풀이 과정을 시각적으로 이해
- 오답 시 개념을 재학습할 수 있는 기회 제공
- 자기주도 학습 능력 향상
- 교사의 개별 설명 부담 감소

Provide **step-by-step explanation animations** for each problem to:
- Help students visually understand problem-solving processes
- Provide concept review opportunities when incorrect
- Improve self-directed learning capabilities
- Reduce teachers' individual explanation burden

### 1.2 사용자 시나리오 / User Scenarios

**시나리오 1: 오답 후 해설 보기**
```
학생이 분수 덧셈 문제를 풀고 오답 제출
→ "해설 보기" 버튼 활성화
→ 클릭 시 애니메이션 시작:
  1단계: 분수 개념 시각화 (피자 조각)
  2단계: 공통 분모 찾기 과정 애니메이션
  3단계: 분자 더하기 단계별 표시
  4단계: 최종 답 및 간소화
→ 학생이 "다시 풀기" 선택 가능
```

**Scenario 1: View Explanation After Wrong Answer**
```
Student submits wrong answer for fraction addition problem
→ "View Explanation" button activates
→ Click triggers animation sequence:
  Step 1: Visualize fraction concept (pizza slices)
  Step 2: Animate finding common denominator
  Step 3: Show adding numerators step-by-step
  Step 4: Display final answer and simplification
→ Student can choose "Try Again"
```

**시나리오 2: 문제 풀기 전 힌트 요청**
```
학생이 어려운 문제를 보고 "힌트 보기" 클릭
→ 짧은 개념 애니메이션 재생 (30초 이내)
→ 핵심 개념만 설명하고 전체 풀이는 숨김
→ 학생이 스스로 문제 해결 시도
```

**Scenario 2: Request Hint Before Solving**
```
Student views difficult problem and clicks "Show Hint"
→ Short concept animation plays (under 30 seconds)
→ Explains core concept only, hides complete solution
→ Student attempts to solve independently
```

---

## 2. 기능 요구사항 / Functional Requirements

### FR-EA-1: 해설 콘텐츠 자동 생성
**Priority: P0 (Must Have)**

- **FR-EA-1.1**: AI가 문제 유형별 해설 스크립트 자동 생성
  - Input: 문제 데이터 (문제 유형, 난이도, 정답, 학년)
  - Output: JSON 형식의 해설 단계 및 애니메이션 설정
  - 예시:
    ```json
    {
      "problem_id": "uuid",
      "explanation_steps": [
        {
          "step_number": 1,
          "title": "분수의 개념 이해",
          "description": "1/2와 1/4를 시각화합니다",
          "animation_type": "fraction_visualizer",
          "duration_ms": 3000,
          "animation_config": {
            "visual_type": "pizza",
            "fractions": [
              {"numerator": 1, "denominator": 2, "color": "#FF6B6B"},
              {"numerator": 1, "denominator": 4, "color": "#4ECDC4"}
            ]
          }
        },
        {
          "step_number": 2,
          "title": "공통 분모 찾기",
          "description": "2와 4의 최소공배수는 4입니다",
          "animation_type": "number_transformation",
          "duration_ms": 2500,
          "animation_config": {
            "from": "1/2",
            "to": "2/4",
            "show_process": true
          }
        }
      ]
    }
    ```

- **FR-EA-1.2**: 교사가 생성된 해설 수정 가능
  - 해설 단계 추가/삭제/순서 변경
  - 애니메이션 타이밍 조정
  - 설명 텍스트 수정 (한국어/영어)

### FR-EA-2: 애니메이션 플레이어
**Priority: P0 (Must Have)**

- **FR-EA-2.1**: 단계별 재생 컨트롤
  - 재생 / 일시정지 / 처음부터
  - 이전 단계 / 다음 단계 버튼
  - 진행 상황 표시 (예: "3/5 단계")

- **FR-EA-2.2**: 재생 속도 조절
  - 0.5배속, 1배속, 1.5배속 옵션
  - 학생 선호도 저장 (localStorage)

- **FR-EA-2.3**: 자동 재생 및 반복
  - 기본: 자동 재생 활성화
  - 반복 재생 옵션 (학생이 선택)

### FR-EA-3: 애니메이션 유형 라이브러리
**Priority: P0 (Must Have)**

분수, 기하학, 대수 등 수학 개념별 애니메이션 컴포넌트:

#### 분수 애니메이션 (Fraction Animations)
- `fraction_visualizer`: 피자/케이크/막대 그래프로 분수 표현
- `fraction_addition`: 분수 덧셈 과정 시각화
- `fraction_subtraction`: 분수 뺄셈 과정 시각화
- `fraction_simplification`: 약분 과정 애니메이션
- `common_denominator`: 공통분모 찾기 과정

#### 기하학 애니메이션 (Geometry Animations)
- `shape_transformation`: 도형 변환 (회전, 이동, 확대)
- `area_calculation`: 넓이 계산 과정 시각화
- `perimeter_calculation`: 둘레 계산 과정
- `angle_visualization`: 각도 측정 및 비교

#### 대수 애니메이션 (Algebra Animations)
- `equation_solving`: 방정식 풀이 과정 단계별 표시
- `variable_substitution`: 변수 대입 과정
- `number_line`: 수직선 위의 연산 시각화

### FR-EA-4: 학습 데이터 추적
**Priority: P1 (Should Have)**

- **FR-EA-4.1**: 해설 시청 이력 저장
  - 어떤 문제의 해설을 봤는지
  - 몇 번째 시도 후에 봤는지
  - 해설을 본 후 정답률 변화

- **FR-EA-4.2**: 교사용 분석 대시보드
  - 해설 시청률 (문제별, 학생별)
  - 해설 효과성 분석 (해설 후 정답률 개선도)
  - 가장 많이 본 해설 TOP 10

### FR-EA-5: 접근성 및 다국어
**Priority: P1 (Should Have)**

- **FR-EA-5.1**: 음성 내레이션 옵션
  - TTS(Text-to-Speech) 한국어/영어
  - 음성 켜기/끄기 토글

- **FR-EA-5.2**: 자막 제공
  - 모든 애니메이션에 텍스트 설명 포함
  - 시각 장애 학생을 위한 스크린 리더 지원

- **FR-EA-5.3**: 키보드 내비게이션
  - Space: 재생/일시정지
  - 좌우 화살표: 이전/다음 단계
  - ESC: 해설 닫기

---

## 3. 기술 설계 / Technical Design

### 3.1 데이터베이스 스키마 / Database Schema

```sql
-- 해설 메타데이터
CREATE TABLE problem_explanations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    problem_id UUID NOT NULL,
    -- problem_id는 동적 생성 테이블 참조 (예: fraction_problems, geometry_problems)
    module_id UUID NOT NULL REFERENCES modules(id),

    title VARCHAR(200) NOT NULL,
    description TEXT,

    -- 해설 단계 (JSON)
    steps JSONB NOT NULL,
    -- 예시: [{"step_number": 1, "title": "...", "animation_type": "...", ...}, ...]

    -- 애니메이션 설정
    total_duration_ms INTEGER NOT NULL,
    difficulty_level INTEGER CHECK (difficulty_level BETWEEN 1 AND 5),

    -- AI 생성 vs 교사 수정
    is_ai_generated BOOLEAN DEFAULT true,
    last_edited_by UUID REFERENCES teachers(id),

    -- 버전 관리
    version INTEGER DEFAULT 1,
    parent_explanation_id UUID REFERENCES problem_explanations(id),

    -- 다국어 지원
    language VARCHAR(10) DEFAULT 'ko',

    -- 메타데이터
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_problem_explanations_problem ON problem_explanations(problem_id);
CREATE INDEX idx_problem_explanations_module ON problem_explanations(module_id);

-- 학생 해설 시청 이력
CREATE TABLE explanation_views (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id),
    explanation_id UUID NOT NULL REFERENCES problem_explanations(id),
    problem_attempt_id UUID, -- 어느 시도 후에 봤는지

    -- 시청 행동
    viewed_at TIMESTAMP DEFAULT NOW(),
    completed_viewing BOOLEAN DEFAULT false, -- 끝까지 봤는지
    steps_viewed JSONB, -- 어떤 단계를 봤는지 [1, 2, 3, 5] (4번 건너뜀)
    playback_speed DECIMAL(3,2) DEFAULT 1.0, -- 재생 속도
    total_watch_time_ms INTEGER, -- 실제 시청 시간

    -- 시청 후 결과
    retried_after_viewing BOOLEAN,
    correct_after_viewing BOOLEAN,

    -- 사용자 피드백
    was_helpful BOOLEAN,
    feedback_text TEXT
);

CREATE INDEX idx_explanation_views_student ON explanation_views(student_id);
CREATE INDEX idx_explanation_views_explanation ON explanation_views(explanation_id);

-- 애니메이션 템플릿 라이브러리
CREATE TABLE animation_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE, -- 예: 'fraction_visualizer'
    category VARCHAR(50) NOT NULL, -- 'fraction', 'geometry', 'algebra'

    description TEXT,

    -- 템플릿 설정 스키마 (JSON Schema)
    config_schema JSONB NOT NULL,
    -- 예시: {"type": "object", "properties": {"visual_type": {...}, ...}}

    -- 예시 사용법
    example_usage JSONB,

    -- 기본 애니메이션 지속 시간
    default_duration_ms INTEGER DEFAULT 3000,

    -- 미리보기 이미지 URL
    preview_image_url TEXT,

    created_at TIMESTAMP DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true
);

-- 해설 효과성 통계 (Materialized View)
CREATE MATERIALIZED VIEW explanation_effectiveness AS
SELECT
    e.id AS explanation_id,
    e.problem_id,
    e.module_id,
    COUNT(ev.id) AS total_views,
    COUNT(DISTINCT ev.student_id) AS unique_viewers,
    AVG(CASE WHEN ev.completed_viewing THEN 1 ELSE 0 END) AS completion_rate,
    AVG(CASE WHEN ev.correct_after_viewing THEN 1 ELSE 0 END) AS success_rate_after_viewing,
    AVG(ev.total_watch_time_ms) AS avg_watch_time_ms,
    COUNT(ev.was_helpful) FILTER (WHERE ev.was_helpful = true) AS helpful_count,
    COUNT(ev.was_helpful) FILTER (WHERE ev.was_helpful = false) AS not_helpful_count
FROM problem_explanations e
LEFT JOIN explanation_views ev ON e.id = ev.explanation_id
GROUP BY e.id, e.problem_id, e.module_id;

CREATE UNIQUE INDEX idx_explanation_effectiveness ON explanation_effectiveness(explanation_id);
```

### 3.2 컴포넌트 아키텍처 / Component Architecture

```
/frontend/src/components/explanations/
├── ExplanationPlayer/
│   ├── ExplanationPlayer.tsx          # 메인 플레이어 컴포넌트
│   ├── ExplanationPlayer.module.css
│   ├── PlayerControls.tsx             # 재생 컨트롤
│   ├── ProgressIndicator.tsx          # 진행 상황 표시
│   └── StepNavigator.tsx              # 단계 네비게이션
│
├── AnimationEngine/
│   ├── AnimationRenderer.tsx          # 애니메이션 렌더링 엔진
│   ├── AnimationContext.tsx           # 애니메이션 상태 관리
│   └── useAnimationController.ts      # 애니메이션 제어 hook
│
├── AnimationTypes/
│   ├── FractionAnimations/
│   │   ├── FractionVisualizer.tsx
│   │   ├── FractionAddition.tsx
│   │   ├── FractionSubtraction.tsx
│   │   ├── CommonDenominator.tsx
│   │   └── FractionSimplification.tsx
│   │
│   ├── GeometryAnimations/
│   │   ├── ShapeTransformation.tsx
│   │   ├── AreaCalculation.tsx
│   │   ├── PerimeterCalculation.tsx
│   │   └── AngleVisualization.tsx
│   │
│   ├── AlgebraAnimations/
│   │   ├── EquationSolving.tsx
│   │   ├── VariableSubstitution.tsx
│   │   └── NumberLine.tsx
│   │
│   └── index.ts                       # 애니메이션 타입 레지스트리
│
├── ExplanationModal/
│   ├── ExplanationModal.tsx           # 해설 모달 컨테이너
│   ├── ExplanationHeader.tsx          # 제목, 닫기 버튼
│   └── ExplanationFooter.tsx          # 피드백, 다시풀기 버튼
│
└── TeacherTools/
    ├── ExplanationEditor.tsx          # 교사용 해설 편집기
    ├── AnimationPreview.tsx           # 애니메이션 미리보기
    └── ExplanationAnalytics.tsx       # 해설 효과 분석 대시보드
```

### 3.3 API 엔드포인트 / API Endpoints

```typescript
// 해설 조회 및 생성
GET    /api/problems/{problemId}/explanations
       Response: { explanations: ExplanationMetadata[] }

POST   /api/problems/{problemId}/explanations/generate
       Body: { language: 'ko' | 'en', difficulty_level?: number }
       Response: { explanation: ExplanationData }

GET    /api/explanations/{explanationId}
       Response: { explanation: ExplanationData }

PUT    /api/explanations/{explanationId}
       Body: { steps: Step[], title?: string, ... }
       Response: { explanation: ExplanationData }

// 학생 시청 이력
POST   /api/explanations/{explanationId}/view
       Body: {
         student_id: string,
         problem_attempt_id?: string,
         steps_viewed: number[],
         completed_viewing: boolean,
         watch_time_ms: number,
         playback_speed: number
       }
       Response: { view_id: string }

POST   /api/explanations/{explanationId}/feedback
       Body: {
         student_id: string,
         was_helpful: boolean,
         feedback_text?: string
       }
       Response: { success: true }

// 교사용 분석
GET    /api/modules/{moduleId}/explanations/analytics
       Response: {
         total_explanations: number,
         total_views: number,
         avg_completion_rate: number,
         top_viewed: ExplanationAnalytics[],
         effectiveness: EffectivenessMetrics
       }

// 애니메이션 템플릿
GET    /api/animation-templates
       Query: { category?: string }
       Response: { templates: AnimationTemplate[] }

GET    /api/animation-templates/{templateId}
       Response: { template: AnimationTemplate }
```

### 3.4 TypeScript 인터페이스 / TypeScript Interfaces

```typescript
// 해설 단계
interface ExplanationStep {
  step_number: number;
  title: string;
  description: string;
  animation_type: AnimationType;
  duration_ms: number;
  animation_config: Record<string, any>;
  narration_text?: string;
  subtitle_text?: string;
}

// 애니메이션 타입
type AnimationType =
  | 'fraction_visualizer'
  | 'fraction_addition'
  | 'fraction_subtraction'
  | 'fraction_simplification'
  | 'common_denominator'
  | 'shape_transformation'
  | 'area_calculation'
  | 'perimeter_calculation'
  | 'angle_visualization'
  | 'equation_solving'
  | 'variable_substitution'
  | 'number_line';

// 해설 데이터
interface ExplanationData {
  id: string;
  problem_id: string;
  module_id: string;
  title: string;
  description?: string;
  steps: ExplanationStep[];
  total_duration_ms: number;
  difficulty_level: number;
  is_ai_generated: boolean;
  language: 'ko' | 'en';
  version: number;
  created_at: string;
  updated_at: string;
}

// 플레이어 상태
interface PlayerState {
  isPlaying: boolean;
  currentStepIndex: number;
  playbackSpeed: 1 | 0.5 | 1.5;
  isMuted: boolean;
  showSubtitles: boolean;
  loop: boolean;
}

// 시청 이력
interface ExplanationView {
  id: string;
  student_id: string;
  explanation_id: string;
  problem_attempt_id?: string;
  viewed_at: string;
  completed_viewing: boolean;
  steps_viewed: number[];
  playback_speed: number;
  total_watch_time_ms: number;
  retried_after_viewing?: boolean;
  correct_after_viewing?: boolean;
  was_helpful?: boolean;
  feedback_text?: string;
}

// 애니메이션 템플릿
interface AnimationTemplate {
  id: string;
  name: string;
  category: 'fraction' | 'geometry' | 'algebra';
  description: string;
  config_schema: JSONSchema;
  example_usage: Record<string, any>;
  default_duration_ms: number;
  preview_image_url?: string;
}
```

### 3.5 애니메이션 라이브러리 선택 / Animation Library Selection

#### 추천 라이브러리 / Recommended Libraries

**1. Framer Motion (추천 / Recommended)**
- React 최적화
- Declarative API
- 수학 애니메이션에 적합
- 예시:
```tsx
import { motion } from 'framer-motion';

const FractionVisualizer = ({ numerator, denominator }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* 분수 시각화 */}
    </motion.div>
  );
};
```

**2. React Spring**
- Physics-based 애니메이션
- Smooth transitions
- 복잡한 인터랙션에 적합

**3. Manim (Python - AI 파이프라인 통합)**
- 수학 애니메이션 전문
- Python 기반 (AI Pipeline과 통합 가능)
- 비디오 렌더링 후 웹에서 재생
- 사용 예시:
```python
from manim import *

class FractionAddition(Scene):
    def construct(self):
        # 분수 덧셈 애니메이션 생성
        fraction1 = MathTex(r"\frac{1}{2}")
        fraction2 = MathTex(r"\frac{1}{4}")

        self.play(Write(fraction1))
        self.play(Write(fraction2))
        # ... 애니메이션 계속
```

**4. Lottie (선택적 / Optional)**
- After Effects 애니메이션 재생
- 디자이너-개발자 협업 용이
- 파일 크기 작음

#### 권장 접근 방식 / Recommended Approach
- **실시간 생성 애니메이션**: Framer Motion (React)
- **복잡한 수학 시각화**: Manim (Python, 사전 렌더링)
- **간단한 UI 애니메이션**: CSS Transitions + Framer Motion

---

## 4. AI 파이프라인 통합 / AI Pipeline Integration

### 4.1 해설 생성 프롬프트 / Explanation Generation Prompt

```
Role: 당신은 수학 교육 전문가이자 시각적 학습 콘텐츠 제작자입니다.

Context:
- 문제 유형: {problem_type}
- 학년: {grade_level}
- 난이도: {difficulty_level}
- 문제 데이터: {problem_data}
- 정답: {correct_answer}

Task: 이 문제에 대한 단계별 해설 애니메이션 스크립트를 생성하세요.

Requirements:
1. 3-5개의 명확한 단계로 구성
2. 각 단계는 하나의 핵심 개념만 설명
3. 초등학생이 이해할 수 있는 쉬운 언어 사용
4. 시각적 요소 우선 (텍스트 최소화)
5. 각 단계는 2-4초 길이로 제한

Output Format (JSON):
{
  "title": "문제 해설 제목",
  "steps": [
    {
      "step_number": 1,
      "title": "단계 제목",
      "description": "설명 텍스트",
      "animation_type": "애니메이션 타입",
      "duration_ms": 3000,
      "animation_config": {
        // 애니메이션 설정
      },
      "narration_text": "음성 내레이션 텍스트"
    }
  ]
}

Available Animation Types:
- fraction_visualizer, fraction_addition, fraction_subtraction
- shape_transformation, area_calculation
- equation_solving, number_line
(전체 목록은 animation_templates 참조)

Example for "1/2 + 1/4 = ?":
{
  "title": "분수 덧셈 해설",
  "steps": [
    {
      "step_number": 1,
      "title": "분수 시각화",
      "description": "1/2는 피자 한 판의 절반, 1/4는 4조각 중 1조각입니다",
      "animation_type": "fraction_visualizer",
      "duration_ms": 3000,
      "animation_config": {
        "visual_type": "pizza",
        "fractions": [
          {"numerator": 1, "denominator": 2, "color": "#FF6B6B"},
          {"numerator": 1, "denominator": 4, "color": "#4ECDC4"}
        ]
      },
      "narration_text": "먼저 각 분수가 무엇을 의미하는지 봅시다"
    }
  ]
}
```

### 4.2 생성 파이프라인 / Generation Pipeline

```python
# AI Pipeline Orchestrator (Python/FastAPI)

async def generate_problem_explanation(
    problem_id: str,
    problem_data: dict,
    language: str = 'ko'
) -> ExplanationData:
    """
    문제 해설 자동 생성
    """
    # 1. 문제 유형 분석
    problem_type = analyze_problem_type(problem_data)

    # 2. Claude API로 해설 스크립트 생성
    prompt = build_explanation_prompt(
        problem_type=problem_type,
        problem_data=problem_data,
        language=language
    )

    claude_response = await call_claude_api(prompt)
    explanation_script = parse_claude_response(claude_response)

    # 3. 애니메이션 템플릿 검증
    validated_steps = validate_animation_config(
        explanation_script['steps']
    )

    # 4. 복잡한 시각화는 Manim으로 사전 렌더링
    for step in validated_steps:
        if step['animation_type'] in MANIM_TYPES:
            video_url = await render_manim_animation(step)
            step['video_url'] = video_url

    # 5. 데이터베이스 저장
    explanation = await db.problem_explanations.create({
        'problem_id': problem_id,
        'steps': validated_steps,
        'language': language,
        'is_ai_generated': True,
        # ... 기타 필드
    })

    return explanation


def validate_animation_config(steps: list) -> list:
    """
    애니메이션 설정 검증 및 보정
    """
    validated = []

    for step in steps:
        template = get_animation_template(step['animation_type'])

        # JSON Schema로 설정 검증
        jsonschema.validate(
            instance=step['animation_config'],
            schema=template['config_schema']
        )

        # 기본값 적용
        step.setdefault('duration_ms', template['default_duration_ms'])

        validated.append(step)

    return validated
```

---

## 5. 사용자 경험 (UX) / User Experience

### 5.1 해설 트리거 시점 / Explanation Trigger Points

**1. 오답 제출 후 (Primary)**
```
[오답 피드백 화면]
┌─────────────────────────────────┐
│  ❌ 아쉬워요!                    │
│  정답은 3/4 입니다               │
│                                 │
│  [해설 보기] [다시 풀기]         │
└─────────────────────────────────┘
```

**2. 문제 풀기 전 힌트 (Secondary)**
```
[문제 화면 우측 상단]
┌─────────────────────────────────┐
│  문제: 1/2 + 1/4 = ?             │
│                          [💡 힌트]│
└─────────────────────────────────┘
```

**3. 학습 복습 모드 (Tertiary)**
```
[학습 이력 화면]
┌─────────────────────────────────┐
│  틀린 문제 #5                    │
│  분수 덧셈                       │
│  [해설 다시 보기]                │
└─────────────────────────────────┘
```

### 5.2 해설 플레이어 UI / Explanation Player UI

```
┌──────────────────────────────────────────────────────┐
│  분수 덧셈 해설                               [✕ 닫기] │
├──────────────────────────────────────────────────────┤
│                                                      │
│         [애니메이션 표시 영역]                        │
│                                                      │
│         피자 조각 애니메이션                          │
│         1/2 + 1/4 시각화                             │
│                                                      │
├──────────────────────────────────────────────────────┤
│  [자막] 먼저 각 분수가 무엇을 의미하는지 봅시다       │
├──────────────────────────────────────────────────────┤
│  단계 1/4: 분수 시각화                               │
│  ●━━━━○━━━━○━━━━○                                   │
│                                                      │
│  [◀ 이전]  [⏸ 일시정지]  [다음 ▶]     [속도: 1.0x]  │
│                                                      │
│  [🔊 음성] [CC 자막]                                 │
└──────────────────────────────────────────────────────┘
│  [👍 도움됨] [👎 어려움]      [다시 풀기] [다음 문제]  │
└──────────────────────────────────────────────────────┘
```

### 5.3 접근성 고려사항 / Accessibility Considerations

- **키보드 네비게이션**: Tab, Space, Arrow keys
- **스크린 리더**: ARIA labels 및 alt text
- **고대비 모드**: 색맹 사용자 고려
- **애니메이션 감소 옵션**: `prefers-reduced-motion` 미디어 쿼리
- **텍스트 크기 조절**: 확대/축소 지원

---

## 6. 성능 및 최적화 / Performance & Optimization

### 6.1 성능 목표 / Performance Targets

- 해설 로딩 시간: < 500ms
- 애니메이션 프레임률: 60 FPS
- 번들 크기: < 200KB (애니메이션 라이브러리 포함)
- 초기 재생 지연: < 100ms

### 6.2 최적화 전략 / Optimization Strategies

**1. 코드 스플리팅**
```typescript
// 애니메이션 컴포넌트 지연 로딩
const FractionVisualizer = lazy(() =>
  import('./AnimationTypes/FractionAnimations/FractionVisualizer')
);
```

**2. 애니메이션 사전 캐싱**
```typescript
// 학생이 문제를 푸는 동안 해설 미리 로드
useEffect(() => {
  prefetchExplanation(problemId);
}, [problemId]);
```

**3. 이미지/비디오 최적화**
- WebP 포맷 사용
- Lazy loading
- CDN 캐싱

**4. 데이터베이스 인덱싱**
```sql
CREATE INDEX idx_explanation_views_student_time
ON explanation_views(student_id, viewed_at DESC);
```

---

## 7. 테스트 계획 / Testing Plan

### 7.1 단위 테스트 / Unit Tests

```typescript
describe('ExplanationPlayer', () => {
  it('should load explanation data correctly', () => {
    // ...
  });

  it('should play animation when play button clicked', () => {
    // ...
  });

  it('should navigate to next step', () => {
    // ...
  });

  it('should respect playback speed setting', () => {
    // ...
  });
});

describe('FractionVisualizer', () => {
  it('should render correct number of slices', () => {
    // ...
  });

  it('should animate fraction addition', () => {
    // ...
  });
});
```

### 7.2 통합 테스트 / Integration Tests

- 문제 풀이 → 오답 → 해설 보기 → 다시 풀기 플로우
- 해설 생성 API → DB 저장 → 프론트엔드 표시
- 교사 해설 수정 → 학생 화면 업데이트

### 7.3 사용자 테스트 / User Testing

**파일럿 테스트 계획**:
1. 초등학교 3학년 학생 10명
2. 5개 분수 문제 풀이
3. 해설 시청 및 재시도
4. 피드백 수집:
   - 이해하기 쉬웠나요?
   - 애니메이션 속도가 적절했나요?
   - 다시 보고 싶은 부분이 있었나요?

---

## 8. 마일스톤 및 일정 / Milestones & Timeline

### Sprint 1 (Week 1-2): 기초 설계 및 인프라
- [ ] 데이터베이스 스키마 생성
- [ ] API 엔드포인트 설계
- [ ] 애니메이션 라이브러리 평가 및 선택
- [ ] 기본 컴포넌트 구조 설계

### Sprint 2 (Week 3-4): 핵심 애니메이션 개발
- [ ] ExplanationPlayer 컴포넌트
- [ ] PlayerControls 구현
- [ ] 분수 애니메이션 3종 (visualizer, addition, subtraction)
- [ ] AnimationRenderer 엔진

### Sprint 3 (Week 5-6): AI 통합 및 자동 생성
- [ ] Claude API 프롬프트 개발
- [ ] 해설 생성 파이프라인
- [ ] 애니메이션 템플릿 시스템
- [ ] 설정 검증 로직

### Sprint 4 (Week 7-8): 사용자 경험 및 접근성
- [ ] 키보드 네비게이션
- [ ] TTS 음성 내레이션
- [ ] 자막 시스템
- [ ] 반응형 디자인

### Sprint 5 (Week 9): 교사 도구 개발
- [ ] 해설 편집기
- [ ] 애니메이션 미리보기
- [ ] 분석 대시보드

### Sprint 6 (Week 10): 테스트 및 최적화
- [ ] 단위/통합 테스트
- [ ] 성능 최적화
- [ ] 사용자 테스트
- [ ] 버그 수정

### Sprint 7 (Week 11-12): 베타 출시 및 피드백
- [ ] 파일럿 학급 배포
- [ ] 피드백 수집 및 분석
- [ ] 개선사항 적용
- [ ] 정식 출시 준비

---

## 9. 위험 및 완화 전략 / Risks & Mitigation

### 위험 요소 / Risks

**1. AI 생성 품질 불안정**
- 위험: 해설이 부정확하거나 이해하기 어려울 수 있음
- 완화:
  - 교사 검토 워크플로우
  - 학생 피드백 기반 자동 개선
  - 템플릿 기반 fallback

**2. 애니메이션 성능 문제**
- 위험: 저사양 기기에서 끊김 현상
- 완화:
  - 성능 프로파일링
  - 복잡한 애니메이션은 비디오로 사전 렌더링
  - GPU 가속 활용

**3. 다양한 문제 유형 지원**
- 위험: 분수 외 다른 개념 지원 어려움
- 완화:
  - 단계적 애니메이션 타입 확장
  - 커뮤니티 템플릿 기여
  - 일반화된 애니메이션 프레임워크

**4. 학생 과의존**
- 위험: 학생들이 문제 풀기 전에 항상 해설을 볼 수 있음
- 완화:
  - 힌트는 개념만, 전체 풀이는 오답 후에만
  - 해설 시청 횟수 제한 옵션 (교사 설정)
  - 스스로 풀기 보상 시스템

---

## 10. 성공 지표 / Success Metrics

### 단기 목표 (3개월) / Short-term Goals (3 months)

- **해설 생성 성공률**: > 90%
  - AI가 생성한 해설 중 교사 검토 통과율

- **학생 만족도**: > 4.0/5.0
  - "해설이 이해하기 쉬웠나요?" 설문 평균

- **해설 후 정답률 개선**: > 30%
  - 오답 → 해설 시청 → 재시도 시 정답률 상승폭

- **시스템 성능**:
  - 로딩 시간 < 500ms: > 95% 요청
  - 프레임률 60 FPS: > 90% 애니메이션

### 장기 목표 (6-12개월) / Long-term Goals (6-12 months)

- **학습 효과**:
  - 해설 시스템 사용 학급 vs 비사용 학급 성적 비교
  - 목표: 10% 이상 향상

- **교사 활용도**:
  - 전체 교사의 70% 이상이 해설 기능 활성화

- **애니메이션 라이브러리 확장**:
  - 50개 이상의 애니메이션 타입 지원
  - 10개 이상의 교사 기여 커스텀 애니메이션

- **비용 효율성**:
  - AI 생성 비용 < $0.50 per explanation
  - 교사 해설 제작 시간 80% 절감

---

## 11. 향후 개선 사항 / Future Enhancements

### Phase 2 기능 / Phase 2 Features

1. **인터랙티브 해설**
   - 학생이 직접 조작 가능한 애니메이션
   - 단계별 퀴즈 삽입

2. **개인화된 해설**
   - 학생의 학습 스타일에 맞춘 해설 (시각형/청각형)
   - 오답 패턴 분석 기반 맞춤 설명

3. **음성 녹음 해설**
   - 교사가 직접 녹음한 음성 해설
   - 학생 간 또래 튜터링 (학생이 만든 해설)

4. **3D 시각화**
   - Three.js 기반 입체 도형 애니메이션
   - VR/AR 지원

5. **다국어 자동 번역**
   - 한국어 해설 → 영어/중국어/일본어 자동 변환

---

## 12. 부록 / Appendix

### A. 애니메이션 타입 상세 스펙 / Animation Type Specifications

#### A.1 fraction_visualizer

**설명**: 분수를 피자, 케이크, 막대 그래프로 시각화

**설정 스키마**:
```json
{
  "type": "object",
  "properties": {
    "visual_type": {
      "type": "string",
      "enum": ["pizza", "cake", "bar", "circle"]
    },
    "fractions": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "numerator": { "type": "integer", "minimum": 0 },
          "denominator": { "type": "integer", "minimum": 1 },
          "color": { "type": "string", "pattern": "^#[0-9A-Fa-f]{6}$" },
          "label": { "type": "string" }
        },
        "required": ["numerator", "denominator"]
      }
    },
    "show_labels": { "type": "boolean", "default": true },
    "animate_fill": { "type": "boolean", "default": true }
  },
  "required": ["visual_type", "fractions"]
}
```

**사용 예시**:
```typescript
<FractionVisualizer
  visualType="pizza"
  fractions={[
    { numerator: 1, denominator: 2, color: "#FF6B6B", label: "1/2" }
  ]}
  showLabels={true}
  animateFill={true}
/>
```

#### A.2 common_denominator

**설명**: 공통분모 찾기 과정 애니메이션

**설정 스키마**:
```json
{
  "type": "object",
  "properties": {
    "fractions": {
      "type": "array",
      "minItems": 2,
      "maxItems": 4,
      "items": {
        "type": "object",
        "properties": {
          "numerator": { "type": "integer" },
          "denominator": { "type": "integer", "minimum": 1 }
        }
      }
    },
    "show_process": { "type": "boolean", "default": true },
    "highlight_lcm": { "type": "boolean", "default": true }
  },
  "required": ["fractions"]
}
```

### B. 코드 예시 / Code Examples

#### B.1 ExplanationPlayer 기본 사용법

```typescript
import { ExplanationPlayer } from '@/components/explanations';

function ProblemPage() {
  const [showExplanation, setShowExplanation] = useState(false);

  const handleWrongAnswer = () => {
    setShowExplanation(true);
  };

  return (
    <div>
      {/* 문제 UI */}

      {showExplanation && (
        <ExplanationPlayer
          explanationId="explanation-uuid"
          onClose={() => setShowExplanation(false)}
          onRetry={handleRetryProblem}
          studentId={currentStudent.id}
          problemAttemptId={attemptId}
        />
      )}
    </div>
  );
}
```

#### B.2 커스텀 애니메이션 컴포넌트 생성

```typescript
import { motion } from 'framer-motion';
import { AnimationComponentProps } from '@/types/animations';

export const CustomAnimation: React.FC<AnimationComponentProps> = ({
  config,
  isPlaying,
  onComplete
}) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: isPlaying ? 1 : 0.5 }}
      onAnimationComplete={onComplete}
    >
      {/* 커스텀 애니메이션 로직 */}
    </motion.div>
  );
};

// 템플릿 등록
registerAnimationType('custom_animation', CustomAnimation);
```

---

## 문서 승인 / Document Approval

- [ ] 기술 리드 검토 / Tech Lead Review
- [ ] 교육 전문가 검토 / Education Expert Review
- [ ] UX 디자이너 검토 / UX Designer Review
- [ ] 제품 오너 승인 / Product Owner Approval

---

## 변경 이력 / Change History

| 버전 | 날짜 | 변경 내용 | 작성자 |
|------|------|-----------|--------|
| 1.0  | 2025-11-18 | 초안 작성 | AI Agent |

---

**다음 단계 / Next Steps**:
1. 이해관계자 피드백 수집
2. 기술 스택 최종 확정
3. Sprint 1 착수

**질문 및 피드백 / Questions & Feedback**:
이 명세서에 대한 질문이나 제안사항이 있으시면 [담당자]에게 연락 주세요.
