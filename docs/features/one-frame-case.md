# One-Frame Case Feature Specification

## Overview

**One-Frame Case**는 복잡한 경우의 수나 문제 해결 과정을 하나의 압축된 시각적 애니메이션으로 표현하는 기능입니다. 학생들이 여러 경우의 수를 한 눈에 파악하고, 문제의 전체 구조를 직관적으로 이해할 수 있도록 돕습니다.

## Use Cases

### 1. 수학 문제의 다양한 풀이 경로
- 분수 덧셈: 여러 가지 통분 방법을 한 화면에 표시
- 방정식 풀이: 다양한 해법을 병렬로 시각화
- 조합/순열: 모든 가능한 조합을 트리 구조로 표시

### 2. 학습 경로 시각화
- 학생이 선택할 수 있는 다양한 학습 경로
- 각 경로의 난이도와 예상 소요 시간 표시
- 추천 경로 하이라이트

### 3. 게임 기반 학습 시나리오
- 여러 선택지와 그 결과를 한 화면에 표시
- 각 선택의 영향을 시각적으로 비교
- 최적 전략 학습

## Technical Architecture

### Component Structure

```
OneFrameCase/
├── OneFrameCaseViewer.tsx      # Main viewer component
├── CaseNode.tsx                 # Individual case representation
├── CaseAnimation.tsx            # Animation controller
├── CaseLayout.tsx               # Layout algorithm (tree, grid, radial)
└── types.ts                     # TypeScript definitions
```

### Data Model

```typescript
interface CaseData {
  id: string;
  title: string;
  description: string;
  cases: Case[];
  layout: LayoutType; // 'tree' | 'grid' | 'radial' | 'flow'
  animation?: AnimationConfig;
}

interface Case {
  id: string;
  label: string;
  content: CaseContent;
  position?: Position;
  connections?: string[]; // IDs of connected cases
  metadata?: {
    difficulty?: number;
    timeEstimate?: number;
    isRecommended?: boolean;
  };
}

interface CaseContent {
  type: 'text' | 'image' | 'svg' | 'interactive';
  data: any;
  visualization?: VisualizationConfig;
}

interface AnimationConfig {
  type: 'sequential' | 'parallel' | 'radial';
  duration: number; // milliseconds
  easing: string;
  highlight?: HighlightConfig;
}

interface LayoutType {
  algorithm: 'tree' | 'grid' | 'radial' | 'flow';
  spacing: number;
  direction?: 'horizontal' | 'vertical';
}
```

### Backend API

```python
# FastAPI endpoints

@router.post("/api/cases/generate")
async def generate_one_frame_case(
    problem_id: str,
    case_type: CaseType,
    config: CaseGenerationConfig
) -> CaseData:
    """
    Generate One-Frame Case visualization from problem data
    """
    pass

@router.get("/api/cases/{case_id}")
async def get_case(case_id: str) -> CaseData:
    """
    Retrieve saved case visualization
    """
    pass

@router.post("/api/cases/{case_id}/interact")
async def record_interaction(
    case_id: str,
    student_id: str,
    interaction: InteractionData
) -> InteractionResponse:
    """
    Record student interaction with case visualization
    """
    pass
```

### Database Schema

```sql
-- Case visualizations metadata
CREATE TABLE case_visualizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    module_id UUID NOT NULL REFERENCES modules(id),
    problem_id UUID,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    layout_type VARCHAR(50) NOT NULL,
    case_data JSONB NOT NULL, -- Full case structure
    animation_config JSONB,
    created_by UUID REFERENCES teachers(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Student interactions with cases
CREATE TABLE case_interactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID NOT NULL REFERENCES case_visualizations(id),
    student_id UUID NOT NULL REFERENCES students(id),
    case_node_id VARCHAR(255) NOT NULL, -- Which case was interacted with
    interaction_type VARCHAR(50) NOT NULL, -- 'view', 'click', 'hover', 'select'
    interaction_data JSONB,
    time_spent_ms INTEGER,
    interacted_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_case_interactions_student ON case_interactions(student_id);
CREATE INDEX idx_case_interactions_case ON case_interactions(case_id);
```

## LMS Integration

### Moodle Integration (Future)

```php
// Moodle plugin structure (future implementation)
// mod/oneframecase/

// Receive problem data from Moodle
function oneframecase_get_problem_data($problemid) {
    // Fetch problem from Moodle database
    // Transform to OneFrameCase format
    // Return to standalone app
}

// Send student progress back to Moodle
function oneframecase_update_progress($studentid, $caseid, $progress) {
    // Update Moodle gradebook
    // Record completion status
}
```

### Mock LMS Service (MVP)

```python
# backend/services/mock_lms.py

class MockLMSService:
    """
    Mock LMS service for development and testing
    Simulates Moodle API responses
    """

    async def get_problem(self, problem_id: str) -> ProblemData:
        """Return sample problem data"""
        return {
            "id": problem_id,
            "type": "fraction_addition",
            "title": "분수의 덧셈",
            "description": "1/2 + 1/3를 계산하세요",
            "cases": [
                {"method": "통분법 1", "steps": [...]},
                {"method": "통분법 2", "steps": [...]},
                {"method": "시각화", "steps": [...]}
            ]
        }

    async def update_progress(
        self,
        student_id: str,
        problem_id: str,
        progress: float
    ) -> bool:
        """Mock progress update"""
        logger.info(f"Progress updated: {student_id} - {progress}%")
        return True
```

## UI/UX Design

### Layout Algorithms

1. **Tree Layout** (계층 구조)
   - 루트 케이스에서 가지치기
   - 의사결정 트리 형태
   - D3.js tree layout 활용

2. **Grid Layout** (격자 배치)
   - 동등한 중요도의 케이스들
   - 카드 형태로 정렬
   - 반응형 그리드

3. **Radial Layout** (방사형)
   - 중심 문제에서 방사형으로 확장
   - 관련도에 따라 거리 조정
   - 시각적 임팩트 강함

4. **Flow Layout** (흐름도)
   - 순차적 프로세스 표현
   - 화살표로 연결
   - 시간 순서 표현에 적합

### Animation Types

1. **Sequential** (순차 애니메이션)
   - 케이스를 하나씩 순서대로 표시
   - 학습 순서가 중요한 경우
   - Duration: 500ms per case

2. **Parallel** (병렬 애니메이션)
   - 모든 케이스 동시에 나타남
   - 비교가 중요한 경우
   - Duration: 800ms total

3. **Radial** (방사형 애니메이션)
   - 중심에서 바깥으로 확장
   - 시각적 흥미 유발
   - Duration: 1000ms

### Smartphone Display Integration

#### 우측 하단 가상 스마트폰 화면

```typescript
// Virtual smartphone viewport component
interface SmartphoneViewportProps {
  width?: number;  // default: 375px (iPhone SE)
  height?: number; // default: 667px
  position?: 'bottom-right' | 'bottom-left' | 'center';
  scale?: number;  // default: 0.6
}

const SmartphoneViewport: React.FC<SmartphoneViewportProps> = ({
  width = 375,
  height = 667,
  position = 'bottom-right',
  scale = 0.6,
  children
}) => {
  return (
    <div className={`smartphone-viewport ${position}`}>
      <div className="smartphone-frame">
        <div className="smartphone-notch" />
        <div className="smartphone-screen" style={{
          width: `${width}px`,
          height: `${height}px`,
          transform: `scale(${scale})`
        }}>
          {children}
        </div>
      </div>
    </div>
  );
};
```

#### CSS for Smartphone Display

```css
.smartphone-viewport {
  position: fixed;
  z-index: 1000;
  pointer-events: auto;
}

.smartphone-viewport.bottom-right {
  bottom: 20px;
  right: 20px;
}

.smartphone-frame {
  background: #1a1a1a;
  border-radius: 40px;
  padding: 15px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
}

.smartphone-notch {
  width: 120px;
  height: 20px;
  background: #1a1a1a;
  border-radius: 0 0 15px 15px;
  margin: 0 auto;
  position: relative;
  z-index: 1001;
}

.smartphone-screen {
  background: white;
  border-radius: 25px;
  overflow: hidden;
  transform-origin: top left;
}
```

## Accessibility

- **Keyboard Navigation**: 모든 케이스 노드 키보드로 탐색 가능
- **Screen Reader**: 각 케이스에 명확한 레이블과 설명
- **High Contrast**: 고대비 모드 지원
- **Animation Control**: 애니메이션 끄기 옵션 제공
- **Font Scaling**: 텍스트 크기 조절 가능

## Performance Considerations

- **Lazy Loading**: 대량 케이스 시 viewport 기반 렌더링
- **SVG Optimization**: 복잡한 시각화는 SVG로 최적화
- **Animation Throttling**: 저사양 기기에서 애니메이션 간소화
- **Caching**: 자주 사용되는 케이스 패턴 캐싱

## Example: Fraction Addition Cases

```typescript
const fractionAdditionCase: CaseData = {
  id: "fraction-add-1-2-plus-1-3",
  title: "1/2 + 1/3 풀이 방법",
  description: "분수 덧셈의 다양한 접근법",
  layout: {
    algorithm: 'tree',
    spacing: 80,
    direction: 'vertical'
  },
  cases: [
    {
      id: "root",
      label: "문제: 1/2 + 1/3",
      content: {
        type: 'svg',
        data: {
          svg: '<svg>...</svg>' // Fraction visualization
        }
      },
      connections: ["method-1", "method-2", "method-3"]
    },
    {
      id: "method-1",
      label: "방법 1: 공통분모 6 사용",
      content: {
        type: 'interactive',
        data: {
          steps: [
            "1/2 = 3/6",
            "1/3 = 2/6",
            "3/6 + 2/6 = 5/6"
          ]
        }
      },
      metadata: {
        difficulty: 2,
        timeEstimate: 60000, // 1 minute
        isRecommended: true
      }
    },
    {
      id: "method-2",
      label: "방법 2: 시각적 이해",
      content: {
        type: 'svg',
        data: {
          visualization: 'pizza-slices' // Pizza visualization
        }
      },
      metadata: {
        difficulty: 1,
        timeEstimate: 90000
      }
    },
    {
      id: "method-3",
      label: "방법 3: 교차곱셈",
      content: {
        type: 'text',
        data: {
          formula: "(1×3 + 2×1) / (2×3) = 5/6"
        }
      },
      metadata: {
        difficulty: 3,
        timeEstimate: 45000
      }
    }
  ],
  animation: {
    type: 'sequential',
    duration: 500,
    easing: 'ease-out',
    highlight: {
      recommendedCase: true,
      color: '#4CAF50'
    }
  }
};
```

## Implementation Priority

### Phase 1 (MVP)
- [x] Basic OneFrameCase component structure
- [ ] Tree layout algorithm
- [ ] Sequential animation
- [ ] Mock LMS integration
- [ ] Smartphone viewport component
- [ ] Basic interaction tracking

### Phase 2
- [ ] Grid and radial layouts
- [ ] Advanced animations (parallel, radial)
- [ ] Real Moodle integration
- [ ] Analytics dashboard
- [ ] A/B testing framework

### Phase 3
- [ ] AI-powered case generation
- [ ] Adaptive case selection based on student performance
- [ ] Collaborative case exploration
- [ ] Export to video/image

## Success Metrics

- **Engagement**: 학생이 평균 2개 이상의 케이스를 탐색
- **Comprehension**: One-Frame Case 사용 후 문제 해결 정확도 15% 향상
- **Time Efficiency**: 개념 이해 시간 30% 단축
- **Teacher Satisfaction**: 교사의 80% 이상이 유용하다고 평가

## References

- D3.js for layout algorithms: https://d3js.org/
- React Spring for animations: https://react-spring.io/
- Moodle LTI Integration: https://docs.moodle.org/dev/LTI
