# 사용 가이드

## 목차
1. [개요](#개요)
2. [문제 생성 및 관리](#문제-생성-및-관리)
3. [Dynamic Tree 사용법](#dynamic-tree-사용법)
4. [Moodle 통합](#moodle-통합)
5. [API 사용 예시](#api-사용-예시)

---

## 개요

Dynamic Tree는 Moodle LMS와 연동하여 트리 구조로 수학 문제를 시각화하고 학습할 수 있는 웹 애플리케이션입니다.

### 주요 기능
- **확률 트리**: 동전 던지기, 주사위 등의 확률 문제
- **조합 트리**: 경우의 수 계산 문제
- **소인수분해 트리**: 수의 소인수분해 과정 시각화
- **실시간 애니메이션**: 트리가 살아 움직이며 경우를 계산
- **모바일 최적화**: 가상 스마트폰 화면에 표시

---

## 문제 생성 및 관리

### 1. Moodle을 통한 문제 생성

#### Step 1: Moodle 퀴즈 생성
1. Moodle 코스에서 "퀴즈" 활동 추가
2. 퀴즈 이름 입력 (예: "동전 던지기 확률")
3. 퀴즈 설명란에 Dynamic Tree 설정 추가

#### Step 2: Dynamic Tree 설정 작성

퀴즈 설명란(intro)에 JSON 형식으로 트리 설정을 추가합니다.

**확률 트리 예시 (동전 3번 던지기)**
```json
{
  "type": "probability_tree",
  "levels": 3,
  "rootLabel": "시작",
  "branchLabels": ["앞면(H)", "뒷면(T)"],
  "branchProbabilities": [0.5, 0.5],
  "calculateOutcomes": true,
  "showProbabilities": true,
  "animation": {
    "enabled": true,
    "speed": 500,
    "expandOnClick": true
  }
}
```

**조합 트리 예시 (주사위 + 동전)**
```json
{
  "type": "combination_tree",
  "levels": 2,
  "rootLabel": "시작",
  "branches": [
    {
      "level": 1,
      "label": "주사위",
      "options": ["1", "2", "3", "4", "5", "6"]
    },
    {
      "level": 2,
      "label": "동전",
      "options": ["앞면", "뒷면"]
    }
  ],
  "calculateTotal": true,
  "animation": {
    "enabled": true,
    "speed": 400
  }
}
```

**소인수분해 트리 예시**
```json
{
  "type": "factorization_tree",
  "rootValue": 72,
  "targetPrimes": true,
  "showSteps": true,
  "allowInteraction": true,
  "correctFactors": [2, 2, 2, 3, 3],
  "animation": {
    "enabled": true,
    "speed": 600,
    "highlightPath": true
  }
}
```

#### Step 3: 퀴즈 저장

퀴즈를 저장하면 Moodle에 퀴즈가 생성됩니다.

#### Step 4: Dynamic Tree로 동기화

```bash
# API 호출
curl -X POST http://localhost:3001/api/moodle/sync/[QUIZ_ID]
```

또는 Frontend에서:
1. 문제 목록 페이지 접속
2. "Moodle 동기화" 버튼 클릭 (향후 구현 예정)

### 2. API를 통한 직접 생성

```javascript
const problemData = {
  moodle_quiz_id: 1,
  title: "동전 던지기 확률 트리",
  description: "동전을 3번 던질 때의 모든 경우를 트리로 표현하세요.",
  tree_config: {
    type: "probability_tree",
    levels: 3,
    rootLabel: "시작",
    branchLabels: ["앞면", "뒷면"],
    branchProbabilities: [0.5, 0.5],
    calculateOutcomes: true,
    showProbabilities: true,
    animation: {
      enabled: true,
      speed: 500
    }
  },
  problem_type: "probability_tree",
  difficulty_level: 1
};

const response = await fetch('http://localhost:3001/api/problems', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(problemData)
});
```

---

## Dynamic Tree 사용법

### 학생 화면 흐름

#### 1. 문제 목록에서 선택
- 문제 카드 클릭하여 트리 화면으로 이동

#### 2. 트리 시각화 화면
- **트리 구조**: D3.js로 렌더링된 애니메이션 트리
- **노드**: 각 노드는 레이블과 확률 표시
- **간선**: 부모-자식 관계를 연결하는 선

#### 3. 인터랙션
- **노드 클릭**: 노드를 선택하면 상세 정보 표시
- **줌/팬**: 마우스 휠로 확대/축소, 드래그로 이동
- **애니메이션**: 트리가 단계적으로 펼쳐지며 표시

#### 4. 계산 결과
- **전체 경우의 수**: 하단에 표시
- **각 경로의 확률**: 리프 노드에 표시
- **선택한 노드 정보**: 레이블, 확률, 레벨

#### 5. 답안 제출
- 노드를 선택한 후 "답안 제출" 버튼 클릭
- 제출 시간과 상호작용 로그가 기록됨

### 모바일 프레임 뷰

#### 가상 스마트폰 화면
- URL: `/problem/[ID]`
- 우측 하단에 iPhone 스타일 프레임으로 표시
- 실제 모바일 기기와 동일한 크기 (375x667px)

#### 임베딩 모드
- URL: `/embed/[ID]`
- 프레임 없이 전체 화면으로 표시
- iframe으로 다른 페이지에 임베딩 가능

```html
<!-- 임베딩 예시 -->
<iframe
  src="http://localhost:5173/embed/1"
  width="375"
  height="667"
  frameborder="0"
></iframe>
```

---

## Moodle 통합

### 학습 흐름

```
Moodle 퀴즈 생성
    ↓
Dynamic Tree 설정 (JSON)
    ↓
API로 동기화
    ↓
문제 자동 생성 + 트리 노드 생성
    ↓
학생이 Dynamic Tree 앱에서 학습
    ↓
답안 제출 → 진행도 저장
    ↓
(향후) Moodle 성적부로 결과 전송
```

### Moodle 사용자 인증

현재 버전에서는 `moodleUserId`를 수동으로 전달하지만, 향후 다음과 같이 통합 예정:

1. **LTI (Learning Tools Interoperability) 통합**
   - Moodle에서 LTI Tool로 등록
   - 자동 SSO (Single Sign-On)
   - 사용자 정보 자동 전달

2. **토큰 기반 인증**
   - Moodle Web Services 토큰 활용
   - JWT 토큰 발급 및 검증

### 진행도 추적

학생의 학습 진행도는 다음 정보를 포함합니다:

- **시도 횟수**: 총 시도 및 정답 횟수
- **숙련도**: (정답 횟수 / 총 시도) × 100
- **소요 시간**: 각 시도별 소요 시간
- **상호작용 로그**: 클릭한 노드, 확대/축소 등

```json
{
  "moodle_user_id": 123,
  "problem_id": 1,
  "mastery_level": 85.5,
  "total_attempts": 10,
  "correct_attempts": 8,
  "last_attempt_at": "2024-11-18T10:30:00Z"
}
```

---

## API 사용 예시

### 1. 문제 목록 가져오기
```bash
GET /api/problems
```

응답:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "title": "동전 던지기 확률 트리",
      "problem_type": "probability_tree",
      "difficulty_level": 1
    }
  ],
  "meta": {
    "count": 1,
    "timestamp": "2024-11-18T10:00:00Z"
  }
}
```

### 2. 특정 문제 조회 (트리 노드 포함)
```bash
GET /api/problems/1
```

응답:
```json
{
  "success": true,
  "data": {
    "problem": {
      "id": 1,
      "title": "동전 던지기 확률 트리",
      "tree_config": { ... }
    },
    "treeNodes": [
      {
        "node_key": "root",
        "label": "시작",
        "level": 0,
        "probability": 1.0
      },
      {
        "node_key": "root_H_1_0",
        "label": "앞면",
        "parent_key": "root",
        "level": 1,
        "probability": 0.5
      }
    ]
  }
}
```

### 3. 트리 계산 수행
```bash
POST /api/tree/calculate
Content-Type: application/json

{
  "problemId": 1
}
```

응답:
```json
{
  "success": true,
  "data": {
    "totalOutcomes": 8,
    "paths": [
      {
        "path": ["시작", "앞면", "앞면", "앞면"],
        "probability": 0.125,
        "outcome": "시작 → 앞면 → 앞면 → 앞면"
      }
    ],
    "metadata": {
      "maxDepth": 3,
      "totalNodes": 15
    }
  }
}
```

### 4. 학생 답안 제출
```bash
POST /api/progress/attempt
Content-Type: application/json

{
  "problemId": 1,
  "moodleUserId": 123,
  "studentName": "홍길동",
  "answer": {
    "selectedNode": "hhh"
  },
  "isCorrect": true,
  "timeSpentSeconds": 120,
  "treeInteractionLog": {
    "clicks": ["root", "h1", "h1_h2", "hhh"],
    "zooms": 2
  }
}
```

응답:
```json
{
  "success": true,
  "data": {
    "attemptId": 42,
    "attemptNumber": 3,
    "isCorrect": true
  }
}
```

### 5. 학생 진행도 조회
```bash
GET /api/progress/student/123/problem/1
```

응답:
```json
{
  "success": true,
  "data": {
    "progress": {
      "mastery_level": 75.0,
      "total_attempts": 4,
      "correct_attempts": 3
    },
    "attempts": [
      {
        "attempt_number": 1,
        "is_correct": false,
        "time_spent_seconds": 180
      }
    ]
  }
}
```

---

## 고급 사용법

### 커스텀 트리 시각화

#### 노드 색상 커스터마이징
`frontend/src/components/DynamicTree/DynamicTree.tsx` 파일에서:

```typescript
.style('fill', d => {
  // 커스텀 색상 로직
  if (d.data.probability && d.data.probability > 0.5) {
    return '#10b981'; // 녹색 (높은 확률)
  }
  return '#ef4444'; // 빨간색 (낮은 확률)
})
```

#### 애니메이션 속도 조정
트리 설정에서:
```json
{
  "animation": {
    "enabled": true,
    "speed": 1000  // 밀리초 (느리게)
  }
}
```

### 대량 문제 생성 스크립트

```bash
#!/bin/bash
# bulk_create_problems.sh

for i in {1..10}; do
  curl -X POST http://localhost:3001/api/problems \
    -H "Content-Type: application/json" \
    -d '{
      "moodle_quiz_id": '$i',
      "title": "문제 '$i'",
      "tree_config": {
        "type": "probability_tree",
        "levels": 3
      }
    }'
done
```

---

## 문제 해결

### Q: 트리가 표시되지 않습니다
A:
1. 브라우저 콘솔에서 오류 확인
2. API에서 트리 노드가 제대로 반환되는지 확인
3. D3.js 라이브러리가 로드되었는지 확인

### Q: Moodle 퀴즈 동기화가 실패합니다
A:
1. Moodle Web Services가 활성화되어 있는지 확인
2. 토큰이 유효한지 확인
3. 퀴즈 설명란에 올바른 JSON 형식이 있는지 확인

### Q: 애니메이션이 너무 느립니다
A: 트리 설정에서 `animation.speed` 값을 낮추세요 (예: 200)

---

## 다음 단계

- Moodle LTI 통합 구현
- 성적 자동 동기화
- 더 다양한 트리 타입 추가
- 협력 학습 기능 (멀티플레이어)

---

문의사항이 있으시면 GitHub Issues에 등록해주세요!
