# Focus Light API 사용 예제

## 목차
1. [문제 API](#문제-api)
2. [도형 API](#도형-api)
3. [Focus Elements API](#focus-elements-api)
4. [실전 예제](#실전-예제)

## 문제 API

### 1. 모든 문제 조회

**요청**
```bash
curl -X GET "http://localhost/api/problems.php"
```

**응답**
```json
{
  "success": true,
  "data": [
    {
      "id": "1",
      "title": "직각삼각형의 빗변 찾기",
      "description": "직각삼각형에서 빗변의 길이를 구하는 문제입니다.",
      "subject": "geometry",
      "grade_level": "5학년",
      "difficulty": "medium",
      "created_at": "2025-11-18 10:00:00"
    }
  ],
  "message": "Problems retrieved successfully"
}
```

### 2. 필터링된 문제 조회

**난이도별 조회**
```bash
curl -X GET "http://localhost/api/problems.php?difficulty=easy"
```

**학년별 조회**
```bash
curl -X GET "http://localhost/api/problems.php?grade=3학년"
```

**과목별 조회**
```bash
curl -X GET "http://localhost/api/problems.php?subject=geometry"
```

**복합 조건**
```bash
curl -X GET "http://localhost/api/problems.php?subject=geometry&grade=5학년&difficulty=medium"
```

### 3. 특정 문제 상세 조회 (도형 및 Focus 요소 포함)

**요청**
```bash
curl -X GET "http://localhost/api/problems.php?id=1"
```

**응답**
```json
{
  "success": true,
  "data": {
    "id": "1",
    "title": "직각삼각형의 빗변 찾기",
    "description": "직각삼각형에서 빗변의 길이를 구하는 문제입니다.",
    "subject": "geometry",
    "grade_level": "5학년",
    "difficulty": "medium",
    "shapes": [
      {
        "id": "1",
        "problem_id": "1",
        "shape_type": "triangle",
        "svg_data": "M 50,200 L 200,200 L 200,50 Z",
        "properties": {
          "width": 150,
          "height": 150,
          "angles": [90, 45, 45],
          "sides": {
            "a": 150,
            "b": 150,
            "c": 212.13
          }
        },
        "position_x": 100,
        "position_y": 100,
        "focus_elements": [
          {
            "id": "1",
            "shape_id": "1",
            "element_type": "side",
            "element_selector": ".hypotenuse",
            "label": "빗변",
            "highlight_color": "#FFD700",
            "glow_intensity": "4",
            "animation_type": "glow",
            "is_active": "1",
            "display_order": "1"
          },
          {
            "id": "2",
            "shape_id": "1",
            "element_type": "angle",
            "element_selector": ".right-angle",
            "label": "90°",
            "highlight_color": "#FF6B6B",
            "glow_intensity": "3",
            "animation_type": "pulse",
            "is_active": "1",
            "display_order": "2"
          }
        ]
      }
    ]
  },
  "message": "Problem details retrieved successfully"
}
```

### 4. 새 문제 생성

**요청**
```bash
curl -X POST "http://localhost/api/problems.php" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "원의 넓이 구하기",
    "description": "반지름이 주어진 원의 넓이를 계산하세요.",
    "subject": "geometry",
    "grade_level": "4학년",
    "difficulty": "easy"
  }'
```

**응답**
```json
{
  "success": true,
  "data": {
    "id": "4"
  },
  "message": "Problem created successfully"
}
```

## 도형 API

### 1. 문제의 모든 도형 조회

**요청**
```bash
curl -X GET "http://localhost/api/shapes.php?problem_id=1"
```

**응답**
```json
{
  "success": true,
  "data": [
    {
      "id": "1",
      "problem_id": "1",
      "shape_type": "triangle",
      "svg_data": "M 50,200 L 200,200 L 200,50 Z",
      "properties": {
        "width": 150,
        "height": 150,
        "angles": [90, 45, 45]
      },
      "position_x": "100",
      "position_y": "100"
    }
  ],
  "message": "Shapes retrieved successfully"
}
```

### 2. 특정 도형 조회

**요청**
```bash
curl -X GET "http://localhost/api/shapes.php?id=1"
```

### 3. 새 도형 생성

**삼각형 생성**
```bash
curl -X POST "http://localhost/api/shapes.php" \
  -H "Content-Type: application/json" \
  -d '{
    "problem_id": 1,
    "shape_type": "triangle",
    "svg_data": "M 50,200 L 200,200 L 200,50 Z",
    "properties": {
      "width": 150,
      "height": 150,
      "angles": [90, 45, 45],
      "sides": {
        "a": 150,
        "b": 150,
        "c": 212.13
      }
    },
    "position_x": 100,
    "position_y": 100
  }'
```

**정사각형 생성**
```bash
curl -X POST "http://localhost/api/shapes.php" \
  -H "Content-Type: application/json" \
  -d '{
    "problem_id": 2,
    "shape_type": "rectangle",
    "svg_data": "M 50,50 L 200,50 L 200,200 L 50,200 Z",
    "properties": {
      "width": 150,
      "height": 150,
      "angles": [90, 90, 90, 90]
    },
    "position_x": 100,
    "position_y": 100
  }'
```

**원 생성**
```bash
curl -X POST "http://localhost/api/shapes.php" \
  -H "Content-Type: application/json" \
  -d '{
    "problem_id": 3,
    "shape_type": "circle",
    "svg_data": "M 150,150 m -100,0 a 100,100 0 1,0 200,0 a 100,100 0 1,0 -200,0",
    "properties": {
      "radius": 100,
      "diameter": 200,
      "center": {
        "x": 150,
        "y": 150
      }
    },
    "position_x": 100,
    "position_y": 100
  }'
```

### 4. 도형 업데이트

```bash
curl -X PUT "http://localhost/api/shapes.php" \
  -H "Content-Type: application/json" \
  -d '{
    "id": 1,
    "position_x": 120,
    "position_y": 120
  }'
```

### 5. 도형 삭제

```bash
curl -X DELETE "http://localhost/api/shapes.php?id=1"
```

## Focus Elements API

### 1. 도형의 모든 Focus 요소 조회

**요청**
```bash
curl -X GET "http://localhost/api/focus-elements.php?shape_id=1"
```

**응답**
```json
{
  "success": true,
  "data": [
    {
      "id": "1",
      "shape_id": "1",
      "element_type": "side",
      "element_selector": ".hypotenuse",
      "label": "빗변",
      "highlight_color": "#FFD700",
      "glow_intensity": "4",
      "animation_type": "glow",
      "is_active": "1",
      "display_order": "1"
    }
  ],
  "message": "Focus elements retrieved successfully"
}
```

### 2. 특정 Focus 요소 조회

```bash
curl -X GET "http://localhost/api/focus-elements.php?id=1"
```

### 3. 새 Focus 요소 생성

**빗변 강조**
```bash
curl -X POST "http://localhost/api/focus-elements.php" \
  -H "Content-Type: application/json" \
  -d '{
    "shape_id": 1,
    "element_type": "side",
    "element_selector": ".hypotenuse",
    "label": "빗변",
    "highlight_color": "#FFD700",
    "glow_intensity": 4,
    "animation_type": "glow",
    "display_order": 1
  }'
```

**각도 강조**
```bash
curl -X POST "http://localhost/api/focus-elements.php" \
  -H "Content-Type: application/json" \
  -d '{
    "shape_id": 1,
    "element_type": "angle",
    "element_selector": ".right-angle",
    "label": "90°",
    "highlight_color": "#FF6B6B",
    "glow_intensity": 3,
    "animation_type": "pulse",
    "display_order": 2
  }'
```

**반지름 강조**
```bash
curl -X POST "http://localhost/api/focus-elements.php" \
  -H "Content-Type: application/json" \
  -d '{
    "shape_id": 3,
    "element_type": "radius",
    "element_selector": ".radius-line",
    "label": "반지름 (r)",
    "highlight_color": "#9B59B6",
    "glow_intensity": 4,
    "animation_type": "glow",
    "display_order": 1
  }'
```

### 4. Focus 요소 업데이트

**애니메이션 변경**
```bash
curl -X PUT "http://localhost/api/focus-elements.php" \
  -H "Content-Type: application/json" \
  -d '{
    "id": 1,
    "animation_type": "pulse"
  }'
```

**강도 변경**
```bash
curl -X PUT "http://localhost/api/focus-elements.php" \
  -H "Content-Type: application/json" \
  -d '{
    "id": 1,
    "glow_intensity": 5
  }'
```

**비활성화**
```bash
curl -X PUT "http://localhost/api/focus-elements.php" \
  -H "Content-Type: application/json" \
  -d '{
    "id": 1,
    "is_active": 0
  }'
```

### 5. Focus 요소 삭제

```bash
curl -X DELETE "http://localhost/api/focus-elements.php?id=1"
```

## 실전 예제

### 예제 1: 완전한 문제 생성 (평행사변형 넓이)

**Step 1: 문제 생성**
```bash
curl -X POST "http://localhost/api/problems.php" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "평행사변형의 넓이",
    "description": "밑변과 높이가 주어진 평행사변형의 넓이를 구하세요.",
    "subject": "geometry",
    "grade_level": "5학년",
    "difficulty": "medium"
  }'
```

**Step 2: 도형 생성 (problem_id = 5 가정)**
```bash
curl -X POST "http://localhost/api/shapes.php" \
  -H "Content-Type: application/json" \
  -d '{
    "problem_id": 5,
    "shape_type": "parallelogram",
    "svg_data": "M 50,200 L 200,200 L 250,50 L 100,50 Z",
    "properties": {
      "base": 150,
      "height": 100,
      "side": 120
    },
    "position_x": 100,
    "position_y": 100
  }'
```

**Step 3: Focus 요소 생성 - 밑변 (shape_id = 4 가정)**
```bash
curl -X POST "http://localhost/api/focus-elements.php" \
  -H "Content-Type: application/json" \
  -d '{
    "shape_id": 4,
    "element_type": "side",
    "element_selector": ".base-line",
    "label": "밑변 (b)",
    "highlight_color": "#4ECDC4",
    "glow_intensity": 4,
    "animation_type": "glow",
    "display_order": 1
  }'
```

**Step 4: Focus 요소 생성 - 높이**
```bash
curl -X POST "http://localhost/api/focus-elements.php" \
  -H "Content-Type: application/json" \
  -d '{
    "shape_id": 4,
    "element_type": "height",
    "element_selector": ".height-line",
    "label": "높이 (h)",
    "highlight_color": "#F39C12",
    "glow_intensity": 4,
    "animation_type": "pulse",
    "display_order": 2
  }'
```

### 예제 2: JavaScript에서 API 사용

**문제 목록 로드**
```javascript
async function loadProblems() {
  try {
    const response = await fetch('/api/problems.php');
    const result = await response.json();

    if (result.success) {
      console.log('문제 수:', result.data.length);
      result.data.forEach(problem => {
        console.log(`${problem.id}: ${problem.title}`);
      });
    }
  } catch (error) {
    console.error('로드 실패:', error);
  }
}
```

**특정 문제 상세 로드**
```javascript
async function loadProblemDetail(problemId) {
  try {
    const response = await fetch(`/api/problems.php?id=${problemId}`);
    const result = await response.json();

    if (result.success) {
      const problem = result.data;
      console.log('문제:', problem.title);
      console.log('도형 수:', problem.shapes.length);

      problem.shapes.forEach(shape => {
        console.log(`- ${shape.shape_type}`);
        console.log(`  Focus 요소: ${shape.focus_elements.length}개`);
      });
    }
  } catch (error) {
    console.error('로드 실패:', error);
  }
}
```

**새 문제 생성**
```javascript
async function createProblem(data) {
  try {
    const response = await fetch('/api/problems.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });

    const result = await response.json();

    if (result.success) {
      console.log('문제 생성 완료, ID:', result.data.id);
      return result.data.id;
    }
  } catch (error) {
    console.error('생성 실패:', error);
  }
}

// 사용 예
createProblem({
  title: "이등변삼각형의 각도",
  description: "이등변삼각형에서 나머지 각도를 구하세요.",
  subject: "geometry",
  grade_level: "4학년",
  difficulty: "easy"
});
```

### 예제 3: PHP에서 API 호출

```php
<?php
// 문제 조회
function getProblem($problemId) {
    $url = "http://localhost/api/problems.php?id=" . $problemId;
    $response = file_get_contents($url);
    return json_decode($response, true);
}

// 도형 생성
function createShape($data) {
    $url = "http://localhost/api/shapes.php";
    $options = [
        'http' => [
            'method' => 'POST',
            'header' => 'Content-Type: application/json',
            'content' => json_encode($data)
        ]
    ];

    $context = stream_context_create($options);
    $response = file_get_contents($url, false, $context);
    return json_decode($response, true);
}

// 사용 예
$problem = getProblem(1);
echo "문제: " . $problem['data']['title'] . "\n";

$shapeData = [
    'problem_id' => 1,
    'shape_type' => 'triangle',
    'svg_data' => 'M 50,200 L 200,200 L 200,50 Z',
    'properties' => ['width' => 150, 'height' => 150]
];

$result = createShape($shapeData);
if ($result['success']) {
    echo "도형 생성 완료, ID: " . $result['data']['id'] . "\n";
}
?>
```

### 예제 4: Python에서 API 호출

```python
import requests
import json

BASE_URL = "http://localhost/api"

# 문제 조회
def get_problems(subject=None, grade=None):
    params = {}
    if subject:
        params['subject'] = subject
    if grade:
        params['grade'] = grade

    response = requests.get(f"{BASE_URL}/problems.php", params=params)
    return response.json()

# 도형 생성
def create_shape(problem_id, shape_type, svg_data, properties):
    data = {
        'problem_id': problem_id,
        'shape_type': shape_type,
        'svg_data': svg_data,
        'properties': properties
    }

    response = requests.post(
        f"{BASE_URL}/shapes.php",
        json=data,
        headers={'Content-Type': 'application/json'}
    )
    return response.json()

# Focus 요소 생성
def create_focus_element(shape_id, element_type, selector, label, color):
    data = {
        'shape_id': shape_id,
        'element_type': element_type,
        'element_selector': selector,
        'label': label,
        'highlight_color': color,
        'glow_intensity': 4,
        'animation_type': 'glow'
    }

    response = requests.post(
        f"{BASE_URL}/focus-elements.php",
        json=data,
        headers={'Content-Type': 'application/json'}
    )
    return response.json()

# 사용 예
if __name__ == '__main__':
    # 기하 문제 조회
    problems = get_problems(subject='geometry')
    print(f"문제 수: {len(problems['data'])}")

    # 도형 생성
    shape_result = create_shape(
        problem_id=1,
        shape_type='triangle',
        svg_data='M 50,200 L 200,200 L 200,50 Z',
        properties={'width': 150, 'height': 150}
    )
    print(f"도형 ID: {shape_result['data']['id']}")

    # Focus 요소 생성
    focus_result = create_focus_element(
        shape_id=1,
        element_type='side',
        selector='.hypotenuse',
        label='빗변',
        color='#FFD700'
    )
    print(f"Focus 요소 ID: {focus_result['data']['id']}")
```

## 에러 처리

### 일반적인 에러 응답 형식
```json
{
  "success": false,
  "data": null,
  "message": "Error description here"
}
```

### HTTP 상태 코드
- `200 OK`: 성공
- `400 Bad Request`: 잘못된 요청 (필수 파라미터 누락 등)
- `404 Not Found`: 리소스 없음
- `405 Method Not Allowed`: 허용되지 않은 HTTP 메서드
- `500 Internal Server Error`: 서버 오류

### JavaScript 에러 처리 예제
```javascript
async function safeFetch(url, options = {}) {
  try {
    const response = await fetch(url, options);
    const result = await response.json();

    if (!result.success) {
      throw new Error(result.message);
    }

    return result.data;
  } catch (error) {
    console.error('API 오류:', error.message);
    // 사용자에게 에러 표시
    alert(`오류가 발생했습니다: ${error.message}`);
    return null;
  }
}
```

## 참고사항

### SVG Path 데이터 생성 도구
- [SVG Path Builder](https://codepen.io/anthonydugois/pen/mewdyZ)
- [Inkscape](https://inkscape.org/) - 무료 벡터 그래픽 편집기
- [Figma](https://www.figma.com/) - 온라인 디자인 도구

### 색상 선택 가이드
- 빗변/대각선: `#FFD700` (Gold)
- 각도/꼭짓점: `#FF6B6B` (Red)
- 변/길이: `#4ECDC4` (Turquoise)
- 반지름/중심: `#9B59B6` (Purple)
- 넓이/영역: `#50C878` (Green)
- 높이/특수: `#F39C12` (Orange)

### 애니메이션 권장 사용
- **Glow**: 기본 강조, 부드러운 학습
- **Pulse**: 중요한 포인트, 리듬감
- **Flash**: 즉각적 주의, 경고
- **Static**: 정적 표시, 지속적 참조
