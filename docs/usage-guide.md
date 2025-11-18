# Shape Morph Animation - 사용 가이드

## 목차

1. [개요](#개요)
2. [기본 사용법](#기본-사용법)
3. [JavaScript API](#javascript-api)
4. [설정 옵션](#설정-옵션)
5. [개념 관리](#개념-관리)
6. [애니메이션 커스터마이징](#애니메이션-커스터마이징)
7. [이벤트 핸들링](#이벤트-핸들링)
8. [예제](#예제)

---

## 개요

Shape Morph Animation은 Moodle LMS에서 수학 개념의 시각적 전이를 표현하는 시스템입니다. 우측 하단의 스마트폰 프레임 안에서 부드러운 애니메이션으로 개념 변화를 보여줍니다.

### 주요 기능

- ✨ **자동 개념 감지**: 문제 내용에서 개념을 자동으로 추출
- 🎨 **부드러운 전환**: 2초간의 부드러운 모핑 애니메이션
- 📱 **모바일 친화적**: 우측 하단 스마트폰 프레임으로 표시
- 🔄 **실시간 업데이트**: Moodle과 실시간 연동
- ♿ **접근성**: WCAG 2.1 AA 준수

---

## 기본 사용법

### 자동 초기화

Shape Morph는 페이지 로드 시 자동으로 초기화됩니다.

```html
<!-- Moodle 테마에 추가 -->
<script src="/local/shape_morph/dist/shape-morph.js"></script>
<link rel="stylesheet" href="/local/shape_morph/dist/shape-morph.css">
```

### 수동 설정

HTML에서 설정을 지정할 수 있습니다:

```html
<div id="shape-morph-root"
     data-position="bottom-right"
     data-size="medium"
     data-theme="light"
     data-course-id="1">
</div>
```

---

## JavaScript API

### 글로벌 API

페이지에서 Shape Morph를 제어할 수 있는 API:

```javascript
// Shape Morph 버전 확인
console.log(window.ShapeMorph.version); // "1.0.0"

// 재로드
window.ShapeMorph.reload();

// 재초기화
window.ShapeMorph.init();
```

### 컴포넌트 API

개별 기능을 제어하는 API:

```javascript
// 현재 개념 조회
const concept = window.shapeMorphAPI.getCurrentConcept();
console.log(concept);
// {
//   id: 1,
//   name: "fraction_half",
//   category: "fraction",
//   shape_data: {...},
//   colors: { primary: "#FF6B6B", secondary: "#FFA07A" }
// }

// 특정 개념으로 전환 (애니메이션 포함)
window.shapeMorphAPI.transitionToConcept(2);

// 개념 재로드 (서버에서 최신 상태 가져오기)
window.shapeMorphAPI.reloadConcept();
```

---

## 설정 옵션

### Position (위치)

스마트폰 프레임의 화면 위치:

- `bottom-right` (기본값): 우측 하단
- `bottom-left`: 좌측 하단
- `top-right`: 우측 상단
- `top-left`: 좌측 상단

```html
<div id="shape-morph-root" data-position="bottom-right"></div>
```

### Size (크기)

스마트폰 프레임의 크기:

- `small`: 180x360px
- `medium` (기본값): 240x480px
- `large`: 300x600px

```html
<div id="shape-morph-root" data-size="medium"></div>
```

### Theme (테마)

색상 테마:

- `light` (기본값): 밝은 배경
- `dark`: 어두운 배경

```html
<div id="shape-morph-root" data-theme="light"></div>
```

### Course ID (코스 ID)

Moodle 코스 ID:

```html
<div id="shape-morph-root" data-course-id="1"></div>
```

---

## 개념 관리

### 기본 제공 개념

#### 분수 개념

| 개념 이름 | 표시 | 설명 |
|---------|------|------|
| `fraction_half` | 1/2 | 반으로 나눈 원 |
| `fraction_third` | 1/3 | 3등분한 원 |
| `fraction_quarter` | 1/4 | 4등분한 원 |
| `fraction_two_thirds` | 2/3 | 3등분 중 2개 채움 |
| `fraction_three_quarters` | 3/4 | 4등분 중 3개 채움 |

#### 기하학 개념

| 개념 이름 | 표시 | 설명 |
|---------|------|------|
| `triangle` | △ | 정삼각형 |
| `square` | □ | 정사각형 |
| `pentagon` | ⬟ | 정오각형 |
| `hexagon` | ⬢ | 정육각형 |
| `circle` | ○ | 원 |

### 새 개념 추가

SQL을 통해 새 개념을 추가할 수 있습니다:

```sql
INSERT INTO mdl_concept_shapes
  (concept_name, concept_category, shape_data, color_primary, color_secondary, description)
VALUES
  ('octagon', 'geometry',
   '{"type": "polygon", "sides": 8, "radius": 50, "rotation": 22.5}',
   '#FF6B6B', '#FFA07A', '정팔각형');
```

### 전환 규칙 추가

개념 간 전환을 정의합니다:

```sql
INSERT INTO mdl_concept_transitions
  (from_concept_id, to_concept_id, transition_type, duration_ms, easing_function)
VALUES
  (4, 11, 'morph', 2000, 'ease-in-out');  -- square → octagon
```

---

## 애니메이션 커스터마이징

### Easing 함수

전환 애니메이션의 속도 곡선:

- `linear`: 일정한 속도
- `ease-in`: 천천히 시작
- `ease-out`: 천천히 끝
- `ease-in-out`: 천천히 시작하고 끝 (기본값)
- `ease-in-cubic`: 큐빅 가속
- `ease-out-cubic`: 큐빅 감속
- `ease-in-out-cubic`: 큐빅 가속/감속
- `bounce`: 탄성 효과
- `elastic`: 탄성 진동 효과

### 전환 시간 조정

```sql
-- 특정 전환의 시간을 3초로 변경
UPDATE mdl_concept_transitions
SET duration_ms = 3000
WHERE from_concept_id = 1 AND to_concept_id = 2;
```

### 전역 애니메이션 속도

```sql
-- 코스별 애니메이션 속도 조정 (1.0 = 정상, 0.5 = 느림, 2.0 = 빠름)
UPDATE mdl_shape_morph_config
SET animation_speed = 1.5
WHERE moodle_course_id = 1;
```

---

## 이벤트 핸들링

### 애니메이션 이벤트 리스닝

```javascript
// Canvas 요소 가져오기
const canvas = document.querySelector('.shape-morph-canvas');

// 애니메이션 완료 이벤트
canvas.addEventListener('morphComplete', (event) => {
  console.log('애니메이션 완료:', event.detail.shape);

  // 사용자 정의 로직
  showNotification('새로운 개념: ' + event.detail.shape.name);
});
```

### 개념 변경 추적

```javascript
// React 컴포넌트에서 (고급 사용)
<ShapeMorphCanvas
  onConceptChange={(concept) => {
    console.log('개념 변경:', concept.name);
    trackAnalytics('concept_change', { concept: concept.name });
  }}
/>
```

---

## 예제

### 예제 1: 문제 풀이 시 자동 전환

Moodle 퀴즈에서 학생이 문제를 풀 때 자동으로 개념 전환:

```javascript
// Moodle 이벤트 리스너
document.addEventListener('quiz:question-answered', function(event) {
  const questionId = event.detail.questionId;

  // 문제의 개념 조회
  fetch(`/local/shape_morph/api/problem-provider.php?action=get_problem_concept&questionid=${questionId}`)
    .then(res => res.json())
    .then(data => {
      if (data.success && data.data.shape) {
        // 해당 개념으로 전환
        window.shapeMorphAPI.transitionToConcept(data.data.shape.id);
      }
    });
});
```

### 예제 2: 커스텀 버튼으로 제어

```html
<button onclick="showFraction('half')">1/2 보기</button>
<button onclick="showFraction('third')">1/3 보기</button>
<button onclick="showFraction('quarter')">1/4 보기</button>

<script>
function showFraction(type) {
  const conceptMap = {
    'half': 1,
    'third': 2,
    'quarter': 3
  };

  const conceptId = conceptMap[type];
  if (conceptId) {
    window.shapeMorphAPI.transitionToConcept(conceptId);
  }
}
</script>
```

### 예제 3: 학습 진행 상황 표시

```javascript
// 학습 단계별 개념 전환
const learningPath = [
  { step: 1, concept: 'fraction_half', label: '1/2 이해하기' },
  { step: 2, concept: 'fraction_third', label: '1/3 이해하기' },
  { step: 3, concept: 'fraction_quarter', label: '1/4 이해하기' },
];

let currentStep = 0;

function nextStep() {
  if (currentStep < learningPath.length) {
    const step = learningPath[currentStep];

    // 개념 ID 조회 후 전환
    fetch(`/local/shape_morph/api/problem-provider.php?action=get_all_concepts&category=fraction`)
      .then(res => res.json())
      .then(data => {
        const concept = data.data.concepts.find(c => c.name === step.concept);
        if (concept) {
          window.shapeMorphAPI.transitionToConcept(concept.id);
          console.log(`Step ${step.step}: ${step.label}`);
          currentStep++;
        }
      });
  }
}

// 5초마다 다음 단계
setInterval(nextStep, 5000);
```

### 예제 4: 데이터 분석

```javascript
// 애니메이션 이벤트 로그 조회
fetch('/local/shape_morph/api/analytics.php?action=get_events&courseid=1&userid=123')
  .then(res => res.json())
  .then(data => {
    console.log('총 전환 횟수:', data.total_transitions);
    console.log('가장 많이 본 개념:', data.most_viewed_concept);
    console.log('평균 애니메이션 시간:', data.avg_duration_ms + 'ms');
  });
```

---

## 고급 기능

### 프로그래밍 방식 초기화

```javascript
// 동적으로 Shape Morph 생성
import { SmartphoneFrame } from './components/SmartphoneFrame';
import ReactDOM from 'react-dom/client';

const container = document.getElementById('custom-container');
const root = ReactDOM.createRoot(container);

root.render(
  <SmartphoneFrame
    position="top-right"
    size="large"
    theme="dark"
    courseId={2}
  />
);
```

### REST API 직접 호출

```javascript
// 현재 개념 조회
const response = await fetch('/local/shape_morph/api/problem-provider.php?action=get_current_concept&courseid=1', {
  credentials: 'include'  // Moodle 세션 쿠키 포함
});

const data = await response.json();
console.log(data.data.current_concept);

// 진행 상황 업데이트
await fetch('/local/shape_morph/api/problem-provider.php?action=update_progress&courseid=1&conceptid=3', {
  method: 'POST',
  credentials: 'include'
});
```

---

## 접근성

### 키보드 내비게이션

- `Tab`: 스마트폰 프레임으로 포커스 이동
- `Enter/Space`: 최소화/확대 토글

### 스크린 리더 지원

```html
<!-- ARIA 레이블 자동 추가 -->
<div role="img" aria-label="현재 개념: 1/2 (반)">
  <canvas>...</canvas>
</div>
```

### 애니메이션 비활성화

사용자가 애니메이션 감소를 선호하는 경우 자동 감지:

```css
@media (prefers-reduced-motion: reduce) {
  .shape-morph-canvas {
    transition-duration: 0.01ms !important;
  }
}
```

---

## 문제 해결

### 애니메이션이 보이지 않음

1. 브라우저 콘솔 확인 (F12)
2. `window.shapeMorphAPI` 존재 확인
3. Canvas 지원 확인

### API 호출 실패

1. Moodle 세션 확인
2. CORS 설정 확인
3. PHP 오류 로그 확인

---

## 참고 자료

- [기술 사양서](./shape-morph-animation-spec.md)
- [설치 가이드](./installation-guide.md)
- [API 문서](./api-documentation.md)
