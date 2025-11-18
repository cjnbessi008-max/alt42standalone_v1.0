# Shift Trail Feature Specification

## 개요

**Shift Trail**은 벡터의 평행이동(translation)을 시각적으로 표현하고 기록하는 핵심 기능입니다. 학생이 벡터를 드래그하여 이동시킬 때, 이동 경로를 선(Trail)으로 실시간 표시하여 평행이동의 개념을 직관적으로 이해할 수 있도록 합니다.

## 핵심 개념

### 벡터 평행이동 (Vector Translation)

수학에서 벡터의 평행이동은 벡터를 방향과 크기를 유지한 채로 다른 위치로 이동시키는 변환입니다.

```
초기 벡터: v = (x₁, y₁) → (x₂, y₂)
평행이동: v' = (x₁ + dx, y₁ + dy) → (x₂ + dx, y₂ + dy)
```

**주요 특징:**
- 벡터의 방향은 변하지 않음
- 벡터의 크기(길이)는 변하지 않음
- 시작점과 끝점이 동일한 이동 벡터만큼 이동

### Trail (이동 경로)

Trail은 벡터가 이동한 경로를 선으로 기록한 것입니다.

**구성 요소:**
- **Trail Points**: 이동 경로 상의 좌표점들
- **Timestamp**: 각 포인트의 시간 정보
- **Visual Style**: 선의 색상, 두께 등

## 기술 명세

### 1. Trail 데이터 구조

```javascript
{
  trail: {
    points: [
      { x: 100.0, y: 100.0, timestamp: 0 },
      { x: 105.2, y: 103.1, timestamp: 50 },
      { x: 110.5, y: 106.4, timestamp: 100 },
      // ...
      { x: 200.0, y: 200.0, timestamp: 1500 }
    ],
    color: "#3498db",
    width: 3,
    duration: 1500
  },
  vector: {
    startX: 200.0,
    startY: 200.0,
    endX: 300.0,
    endY: 300.0,
    length: 141.42,
    angle: 45.0
  },
  translation: {
    dx: 100.0,
    dy: 100.0,
    distance: 141.42,
    angle: 45.0
  }
}
```

### 2. Trail 기록 알고리즘

#### 샘플링 방식

이동 경로의 모든 픽셀을 기록하면 데이터가 너무 많아지므로, 일정 간격(기본 50ms)으로 샘플링합니다.

```javascript
// Sampling configuration
const SAMPLING_INTERVAL = 50; // milliseconds
let lastSampleTime = 0;

function onDragMove(x, y) {
  const now = Date.now();

  if (now - lastSampleTime >= SAMPLING_INTERVAL) {
    addTrailPoint(x, y);
    lastSampleTime = now;
  }
}
```

#### Trail Point 추가

```javascript
function addTrailPoint(x, y) {
  const elapsed = Date.now() - trailStartTime;

  trail.points.push({
    x: Math.round(x * 100) / 100,  // 소수점 2자리
    y: Math.round(y * 100) / 100,
    timestamp: elapsed
  });
}
```

### 3. 벡터 렌더링

#### Canvas API 사용

```javascript
// 벡터 그리기
function drawVector(startX, startY, endX, endY) {
  ctx.strokeStyle = '#e74c3c';
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';

  // 벡터 선
  ctx.beginPath();
  ctx.moveTo(startX, startY);
  ctx.lineTo(endX, endY);
  ctx.stroke();

  // 화살표 머리
  const angle = Math.atan2(endY - startY, endX - startX);
  const arrowLength = 15;
  const arrowAngle = Math.PI / 6;

  ctx.fillStyle = '#e74c3c';
  ctx.beginPath();
  ctx.moveTo(endX, endY);
  ctx.lineTo(
    endX - arrowLength * Math.cos(angle - arrowAngle),
    endY - arrowLength * Math.sin(angle - arrowAngle)
  );
  ctx.lineTo(
    endX - arrowLength * Math.cos(angle + arrowAngle),
    endY - arrowLength * Math.sin(angle + arrowAngle)
  );
  ctx.closePath();
  ctx.fill();
}
```

#### Trail 렌더링

```javascript
function drawTrail(points, color, width) {
  if (points.length < 2) return;

  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);

  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i].x, points[i].y);
  }

  ctx.stroke();

  // 시작점과 끝점 마커
  ctx.fillStyle = color;

  // 시작점
  ctx.beginPath();
  ctx.arc(points[0].x, points[0].y, 5, 0, 2 * Math.PI);
  ctx.fill();

  // 끝점
  const lastPoint = points[points.length - 1];
  ctx.beginPath();
  ctx.arc(lastPoint.x, lastPoint.y, 5, 0, 2 * Math.PI);
  ctx.fill();
}
```

### 4. 드래그 앤 드롭 처리

#### 벡터 선택 감지

```javascript
function isNearVector(mouseX, mouseY) {
  const threshold = 10; // pixels

  // 점과 선분 사이의 거리 계산
  const dx = vectorEndX - vectorStartX;
  const dy = vectorEndY - vectorStartY;
  const lengthSq = dx * dx + dy * dy;

  if (lengthSq === 0) {
    // 벡터가 점인 경우
    const dist = Math.sqrt(
      Math.pow(mouseX - vectorStartX, 2) +
      Math.pow(mouseY - vectorStartY, 2)
    );
    return dist <= threshold;
  }

  // 점을 선분에 투영
  const t = Math.max(0, Math.min(1,
    ((mouseX - vectorStartX) * dx + (mouseY - vectorStartY) * dy) / lengthSq
  ));

  const projX = vectorStartX + t * dx;
  const projY = vectorStartY + t * dy;

  const dist = Math.sqrt(
    Math.pow(mouseX - projX, 2) +
    Math.pow(mouseY - projY, 2)
  );

  return dist <= threshold;
}
```

#### 드래그 처리

```javascript
let isDragging = false;
let dragOffset = { x: 0, y: 0 };

canvas.addEventListener('mousedown', (e) => {
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  if (isNearVector(x, y)) {
    isDragging = true;
    dragOffset.x = x - vectorStartX;
    dragOffset.y = y - vectorStartY;

    startTrailRecording();
  }
});

canvas.addEventListener('mousemove', (e) => {
  if (!isDragging) return;

  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  // 벡터의 형태를 유지하면서 이동
  const dx = vectorEndX - vectorStartX;
  const dy = vectorEndY - vectorStartY;

  vectorStartX = x - dragOffset.x;
  vectorStartY = y - dragOffset.y;
  vectorEndX = vectorStartX + dx;
  vectorEndY = vectorStartY + dy;

  // Trail 포인트 기록
  recordTrailPoint(vectorStartX, vectorStartY);

  render();
});

canvas.addEventListener('mouseup', () => {
  if (isDragging) {
    isDragging = false;
    stopTrailRecording();
  }
});
```

### 5. Trail 애니메이션

#### 재생 알고리즘

```javascript
async function animateTrail() {
  const duration = 1000; // ms
  const points = trail.points;
  const totalTime = points[points.length - 1].timestamp;

  return new Promise((resolve) => {
    let startTime = null;

    function animate(currentTime) {
      if (!startTime) startTime = currentTime;
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // 현재 진행률에 해당하는 Trail 포인트 찾기
      const targetTime = progress * totalTime;
      let currentIndex = 0;

      for (let i = 0; i < points.length; i++) {
        if (points[i].timestamp <= targetTime) {
          currentIndex = i;
        } else {
          break;
        }
      }

      // 현재 포인트까지 렌더링
      clearCanvas();
      drawGrid();
      drawPartialTrail(points.slice(0, currentIndex + 1));
      drawVectorAtPoint(points[currentIndex]);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        resolve();
      }
    }

    requestAnimationFrame(animate);
  });
}
```

### 6. Translation 계산

```javascript
function calculateTranslationVector(startX, startY, endX, endY) {
  const dx = endX - startX;
  const dy = endY - startY;

  const distance = Math.sqrt(dx * dx + dy * dy);
  const angle = Math.atan2(dy, dx) * (180 / Math.PI);

  return {
    dx: Math.round(dx * 100) / 100,
    dy: Math.round(dy * 100) / 100,
    distance: Math.round(distance * 100) / 100,
    angle: Math.round(angle * 100) / 100
  };
}
```

## 사용자 경험 (UX)

### 시각적 피드백

1. **호버 효과**
   - 벡터 위에 마우스를 올리면 커서가 "grab"으로 변경
   - 벡터 색상이 약간 밝아짐

2. **드래그 중**
   - 커서가 "grabbing"으로 변경
   - Trail이 실시간으로 그려짐
   - 이동 정보가 좌측 패널에 업데이트

3. **드래그 종료**
   - Trail이 완성된 상태로 고정
   - 피드백 메시지 표시
   - Trail 포인트 개수 표시

### 상호작용 가이드

**단계 1: 벡터 선택**
```
[시각적 표시]
- 벡터 하이라이트
- "클릭하여 드래그" 툴팁
```

**단계 2: 드래그**
```
[실시간 피드백]
- Trail 선 표시
- 이동 거리 업데이트
- 이동 각도 업데이트
```

**단계 3: 릴리즈**
```
[결과 표시]
- 완성된 Trail
- Translation 벡터 정보
- "제출" 버튼 활성화
```

## 성능 최적화

### 1. Canvas 렌더링 최적화

```javascript
// Dirty flag pattern
let needsRender = false;

function requestRender() {
  if (!needsRender) {
    needsRender = true;
    requestAnimationFrame(() => {
      render();
      needsRender = false;
    });
  }
}
```

### 2. Trail 포인트 제한

```javascript
const MAX_TRAIL_POINTS = 1000;

function addTrailPoint(x, y) {
  if (trail.points.length >= MAX_TRAIL_POINTS) {
    // 오래된 포인트 제거 (FIFO)
    trail.points.shift();
  }

  trail.points.push({ x, y, timestamp: Date.now() - trailStartTime });
}
```

### 3. Debouncing/Throttling

```javascript
// 샘플링 간격으로 자동 throttling
const SAMPLING_INTERVAL = 50; // ms

function throttledAddPoint(x, y) {
  const now = Date.now();
  if (now - lastSampleTime >= SAMPLING_INTERVAL) {
    addTrailPoint(x, y);
    lastSampleTime = now;
  }
}
```

## 접근성 (Accessibility)

### 키보드 지원

```javascript
// 화살표 키로 벡터 이동
canvas.addEventListener('keydown', (e) => {
  const step = 5; // pixels

  switch (e.key) {
    case 'ArrowUp':
      moveVector(0, -step);
      break;
    case 'ArrowDown':
      moveVector(0, step);
      break;
    case 'ArrowLeft':
      moveVector(-step, 0);
      break;
    case 'ArrowRight':
      moveVector(step, 0);
      break;
  }
});
```

### 스크린 리더 지원

```html
<canvas id="trail-canvas"
        role="application"
        aria-label="벡터 평행이동 캔버스"
        aria-describedby="canvas-instructions">
</canvas>

<div id="canvas-instructions" class="sr-only">
  벡터를 클릭하여 드래그하면 평행이동됩니다.
  화살표 키로도 이동할 수 있습니다.
</div>
```

## 확장 가능성

### 1. 다중 벡터 지원

```javascript
class MultiVectorTrail {
  vectors = [];
  trails = [];

  addVector(vector) {
    this.vectors.push(vector);
    this.trails.push({ points: [] });
  }

  moveVector(index, dx, dy) {
    // 특정 벡터 이동 및 Trail 기록
  }
}
```

### 2. 3D 벡터 지원

```javascript
// WebGL 또는 Three.js 사용
class Vector3DTrail {
  points = []; // { x, y, z, timestamp }

  render() {
    // 3D 렌더링
  }
}
```

### 3. 협업 기능

```javascript
// WebSocket으로 실시간 공유
socket.on('trail-update', (data) => {
  renderPeerTrail(data);
});
```

## 문제 해결

### 일반적인 문제

**문제 1: Trail이 끊어져 보임**
- 원인: 샘플링 간격이 너무 김
- 해결: `SAMPLING_INTERVAL` 값을 줄임 (예: 50ms → 25ms)

**문제 2: 성능 저하**
- 원인: Trail 포인트가 너무 많음
- 해결: `MAX_TRAIL_POINTS` 제한 적용 또는 포인트 간소화 알고리즘 적용

**문제 3: 벡터가 클릭되지 않음**
- 원인: Hit detection threshold가 너무 작음
- 해결: `threshold` 값을 늘림 (예: 10px → 15px)

## 참고 자료

- [MDN Canvas API](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API)
- [벡터의 평행이동 (수학)](https://en.wikipedia.org/wiki/Translation_(geometry))
- [드래그 앤 드롭 이벤트](https://developer.mozilla.org/en-US/docs/Web/API/HTML_Drag_and_Drop_API)
- [requestAnimationFrame](https://developer.mozilla.org/en-US/docs/Web/API/window/requestAnimationFrame)

---

**버전**: 1.0.0
**최종 업데이트**: 2024
**작성자**: Shift Trail Development Team
