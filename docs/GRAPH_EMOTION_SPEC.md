# Graph Emotion 기술 명세서

## 1. 개요

Graph Emotion은 그래프 구조의 개념 관계를 시각화하고, 각 노드의 난이도와 학습 진행 상태를 **온도**, **색감**, **리듬**이라는 세 가지 감정 표현 방식으로 보여주는 시스템입니다.

## 2. 감정 표현 시스템

### 2.1 온도 표현 (Temperature Emotion)

#### 목적
개념의 난이도를 직관적인 색상 온도로 표현

#### 매핑 알고리즘
```typescript
difficulty (0-1) → HSL Color
- 0.0 (매우 쉬움): hue=240° (파란색), saturation=60%, lightness=60%
- 0.2 (쉬움):      hue=192° (청록색), saturation=66%, lightness=58%
- 0.4 (보통):      hue=144° (초록색), saturation=72%, lightness=56%
- 0.6 (어려움):    hue=96°  (연두색), saturation=78%, lightness=54%
- 0.8 (어려움):    hue=48°  (노란색), saturation=84%, lightness=52%
- 1.0 (매우 어려움): hue=0°   (빨간색), saturation=90%, lightness=50%
```

#### 구현 세부사항
- **색상 공간**: HSL (Hue, Saturation, Lightness)
- **라이브러리**: chroma.js
- **보간 방식**: Linear interpolation
- **적용 위치**: 노드의 중심 원

#### 시각적 효과
- 차가운 색 (파란색): 접근하기 쉬운 개념
- 따뜻한 색 (노란색): 중간 난이도
- 뜨거운 색 (빨간색): 도전적인 개념

### 2.2 색감 표현 (Color Emotion)

#### 목적
개념의 카테고리, 완성도, 현재 상태를 색상으로 구분

#### 카테고리별 주요 색상
```typescript
Foundation (기초):   #3B82F6 (Blue 500)
Core (핵심):         #10B981 (Green 500)
Advanced (심화):     #F59E0B (Amber 500)
Application (응용):  #8B5CF6 (Violet 500)
```

#### 상태별 보조 색상
```typescript
Completed (완료):     #22C55E (Green 500)
In Progress (진행중): #FBBF24 (Yellow 400)
Not Started (미시작): #9CA3AF (Gray 400)
```

#### 진행률 그라디언트
```typescript
progress (0-100) → Linear Gradient
- 0%:   100% Gray (#E5E7EB) + 0% Primary Color
- 50%:  50% Gray + 50% Primary Color
- 100%: 0% Gray + 100% Primary Color
```

#### 구현 세부사항
- **적용 위치**:
  - 노드 배경: 카테고리 색상 (30% opacity)
  - 노드 테두리: 상태 색상 (3px stroke)
  - 진행률 링: 초록색 원형 프로그레스 바
- **CSS**: linear-gradient, SVG stroke-dasharray

### 2.3 리듬 표현 (Rhythm Emotion)

#### 목적
학습 진행 상태를 맥박 애니메이션으로 표현

#### 리듬 패턴
```typescript
Pattern       | Tempo | Pulse | Condition
--------------|-------|-------|---------------------------
Calm          | 0.2   | false | completed=true OR progress=0
Steady        | 0.5   | true  | 0 < progress ≤ 50
Active        | 0.8   | true  | 50 < progress < 100
Intense       | 1.0   | true  | (reserved for future use)
```

#### 애니메이션 매개변수
```typescript
tempo (0-1) → animation duration
- minDuration: 0.5s
- maxDuration: 3.0s
- duration = maxDuration - tempo × (maxDuration - minDuration)

Example:
- tempo=0.2 → duration=2.6s (느린 맥박)
- tempo=0.5 → duration=1.75s (보통 맥박)
- tempo=0.8 → duration=0.9s (빠른 맥박)
```

#### 맥박 애니메이션 (Pulse)
```typescript
keyframe:
  0%:   scale=0.85, opacity=1.0
  50%:  scale=0.95, opacity=0.9
  100%: scale=0.85, opacity=1.0
```

#### 구현 세부사항
- **라이브러리**: D3.js transition
- **적용 대상**: 노드의 온도 원 (temperature circle)
- **지속 시간**: tempo 기반 동적 계산
- **반복**: 무한 루프 (recursive transition)

## 3. 그래프 시각화

### 3.1 Force-Directed Layout

#### D3 Force Simulation 설정
```typescript
forces:
  - forceLink: distance=80, strength=edge.strength
  - forceManyBody: strength=-300 (repulsion)
  - forceCenter: x=0, y=0
  - forceCollide: radius=nodeSize/2 + 10
```

#### 노드 크기 계산
```typescript
baseSize = 30px
progressBonus = progress × 0.3 (최대 30% 증가)
difficultyBonus = difficulty × 0.2 (최대 20% 증가)
nodeSize = baseSize × (1 + progressBonus + difficultyBonus)

Range: 30px ~ 45px
```

#### 엣지 두께 계산
```typescript
strength (0-1) → edge thickness
- minThickness: 1px
- maxThickness: 5px
- thickness = minThickness + strength × (maxThickness - minThickness)
```

### 3.2 노드 구조

#### SVG 레이어 (bottom to top)
1. **배경 원** (background circle)
   - radius: nodeSize
   - fill: category color (30% opacity)

2. **온도 원** (temperature circle)
   - radius: nodeSize × 0.85
   - fill: temperature color
   - stroke: state color (3px)
   - animation: pulse (if active)

3. **진행률 링** (progress ring)
   - radius: nodeSize × 0.95
   - stroke: green (#22C55E, 4px)
   - stroke-dasharray: circumference × progress
   - opacity: progress > 0 ? 0.8 : 0

4. **라벨 텍스트** (label)
   - position: dy = nodeSize + 20
   - font-size: 12px
   - font-weight: 600

5. **난이도 텍스트** (difficulty label)
   - position: center (dy=5)
   - font-size: 11px
   - color: white

### 3.3 인터랙션

#### 마우스 이벤트
```typescript
mouseenter:
  - setHoveredNode(node.id)
  - scale temperature circle to 1.1×

mouseleave:
  - setHoveredNode(null)
  - restore temperature circle to 0.85×

click:
  - setSelectedNode(node)
  - show info panel
  - trigger onNodeClick callback
```

#### 드래그 앤 드롭
```typescript
dragStarted:
  - simulation.alphaTarget(0.3).restart()
  - fix node position (node.fx = node.x)

dragging:
  - update node.fx, node.fy

dragEnded:
  - simulation.alphaTarget(0)
  - unfix node position (node.fx = null)
```

## 4. 데이터 플로우

### 4.1 LMS 연동 시뮬레이션

#### 문제 데이터 페칭
```typescript
fetchLMSProblems():
  1. setLoading(true)
  2. [Simulated] await delay(1000ms)
  3. Generate sample LMS problems
  4. setLmsProblems(problems)
  5. setLoading(false)
```

#### 실제 연동 시 예상 플로우
```typescript
fetchLMSProblems():
  1. POST /api/lms/problems
     Headers: { Authorization: Bearer token }
  2. Response: LMSProblem[]
  3. Transform to GraphNode[]
  4. Update graph data
```

### 4.2 학습 진행 업데이트

#### 진행 상황 시뮬레이션
```typescript
simulateProgress(nodeId):
  1. Find node by nodeId
  2. newProgress = min(100, currentProgress + 20)
  3. Update node.progress = newProgress
  4. Update node.completed = (newProgress === 100)
  5. Trigger re-render
```

#### 실제 연동 시 플로우
```typescript
updateStudentProgress(progress: StudentProgress):
  1. POST /api/student/progress
     Body: { nodeId, completed, score, attempts }
  2. Update local graph data
  3. Sync with LMS database
  4. Trigger graph emotion update
```

## 5. 성능 최적화

### 5.1 렌더링 최적화
- **React.memo**: 불필요한 컴포넌트 리렌더링 방지
- **useCallback**: 이벤트 핸들러 메모이제이션
- **useMemo**: 복잡한 계산 결과 캐싱

### 5.2 애니메이션 최적화
- **CSS Transform**: GPU 가속 활용
- **requestAnimationFrame**: 부드러운 애니메이션
- **D3 Transition**: 효율적인 SVG 애니메이션

### 5.3 메모리 최적화
- **Simulation cleanup**: 컴포넌트 언마운트 시 시뮬레이션 중지
- **Event listener cleanup**: useEffect cleanup 함수 활용

## 6. 반응형 디자인

### 6.1 브레이크포인트
```css
Desktop (≥1024px):  Full layout with virtual phone
Tablet (768-1023px): Reduced virtual phone size
Mobile (<768px):     Hide virtual phone, show main graph only
```

### 6.2 가상 스마트폰
```typescript
Desktop: 400px × 720px
Tablet:  350px × 630px
Mobile:  hidden
```

## 7. 접근성 (Accessibility)

### 7.1 색맹 고려사항
- 온도 표현: 색상 + 텍스트 라벨 병행
- 상태 표현: 색상 + 아이콘 병행
- 진행률: 색상 + 숫자 백분율 표시

### 7.2 키보드 네비게이션
- Tab: 노드 간 이동
- Enter/Space: 노드 선택
- Escape: 선택 해제

### 7.3 스크린 리더
- aria-label: 노드 정보 설명
- role: "button" for interactive nodes

## 8. 브라우저 호환성

### 8.1 지원 브라우저
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

### 8.2 필수 기능
- CSS Grid/Flexbox
- SVG 2.0
- ES2020
- Web Animations API

## 9. 향후 개선 방향

### 9.1 단기 (Phase 1)
- [ ] 실제 LMS API 연동
- [ ] 사용자 인증 시스템
- [ ] 학습 데이터 영속성 (LocalStorage/IndexedDB)
- [ ] 다크 모드 지원

### 9.2 중기 (Phase 2)
- [ ] 3D 그래프 시각화 (Three.js)
- [ ] AI 기반 학습 경로 추천
- [ ] 실시간 멀티플레이어 학습
- [ ] 모바일 네이티브 앱 (React Native)

### 9.3 장기 (Phase 3)
- [ ] VR/AR 그래프 경험
- [ ] 음성 인터랙션
- [ ] 촉각 피드백 (햅틱)
- [ ] 뇌파 기반 난이도 조정

## 10. 참고 문헌

- [D3.js Force-Directed Graph](https://observablehq.com/@d3/force-directed-graph)
- [Chroma.js Color Scales](https://gka.github.io/chroma.js/#chroma-scale)
- [Framer Motion Animation](https://www.framer.com/motion/)
- [React Performance Optimization](https://react.dev/learn/render-and-commit)

---

**문서 버전**: 1.0
**최종 수정일**: 2025-11-18
**작성자**: Claude AI Assistant
