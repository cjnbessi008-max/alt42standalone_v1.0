# Term Melody API 명세

## Base URL

```
http://localhost:3001/api
```

## 인증

현재 버전에서는 인증이 필요하지 않습니다. (향후 추가 예정)

---

## Moodle API

### 1. 문제 목록 조회

문제 목록을 페이지네이션하여 조회합니다.

**Endpoint:** `GET /api/moodle/questions`

**Query Parameters:**

| 파라미터 | 타입 | 필수 | 기본값 | 설명 |
|---------|------|------|--------|------|
| category | number | No | - | 문제 카테고리 ID |
| type | string | No | - | 문제 유형 (multichoice, numerical 등) |
| limit | number | No | 20 | 페이지당 문제 개수 |
| offset | number | No | 0 | 페이지 오프셋 |

**응답:**

```json
{
  "questions": [
    {
      "id": 123,
      "name": "일차방정식 풀이",
      "questiontext": "x + 3 = 7을 만족하는 x의 값은?",
      "qtype": "numerical",
      "category": 5,
      "createdAt": "2024-01-15T10:30:00Z",
      "modifiedAt": "2024-01-16T12:00:00Z"
    }
  ],
  "total": 150,
  "page": 1,
  "limit": 20
}
```

**상태 코드:**
- `200 OK`: 성공
- `500 Internal Server Error`: 서버 오류

---

### 2. 특정 문제 상세 조회

특정 문제의 상세 정보를 조회합니다.

**Endpoint:** `GET /api/moodle/question/:id`

**Path Parameters:**

| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| id | number | Yes | 문제 ID |

**응답:**

```json
{
  "id": 123,
  "name": "일차방정식 풀이",
  "questiontext": "다음 방정식을 푸시오: x + 3 = 7",
  "qtype": "numerical",
  "category": 5,
  "createdAt": "2024-01-15T10:30:00Z",
  "answers": [
    {
      "id": 456,
      "question": 123,
      "answer": "4",
      "fraction": 1.0,
      "feedback": "정답입니다!"
    }
  ],
  "terms": [
    {
      "coefficient": 1,
      "variable": "x",
      "constant": 3,
      "position": 0
    }
  ]
}
```

**상태 코드:**
- `200 OK`: 성공
- `400 Bad Request`: 잘못된 ID 형식
- `404 Not Found`: 문제를 찾을 수 없음
- `500 Internal Server Error`: 서버 오류

---

### 3. 카테고리 목록 조회

문제 카테고리 목록과 각 카테고리의 문제 개수를 조회합니다.

**Endpoint:** `GET /api/moodle/categories`

**응답:**

```json
{
  "categories": [
    {
      "category": 1,
      "count": 45
    },
    {
      "category": 2,
      "count": 32
    }
  ]
}
```

**상태 코드:**
- `200 OK`: 성공
- `500 Internal Server Error`: 서버 오류

---

### 4. 문제 통계 조회

문제 유형별 통계를 조회합니다.

**Endpoint:** `GET /api/moodle/statistics`

**응답:**

```json
{
  "byType": [
    {
      "type": "multichoice",
      "count": 120
    },
    {
      "type": "numerical",
      "count": 85
    },
    {
      "type": "shortanswer",
      "count": 60
    }
  ],
  "total": 265
}
```

**상태 코드:**
- `200 OK`: 성공
- `500 Internal Server Error`: 서버 오류

---

## Melody API

### 1. 멜로디 생성

항의 변화를 음악 데이터로 변환합니다.

**Endpoint:** `POST /api/melody/generate`

**요청 본문:**

```json
{
  "questionId": 123,
  "terms": [
    {
      "coefficient": 1,
      "variable": "x",
      "constant": 3,
      "position": 0
    },
    {
      "coefficient": 1,
      "variable": "x",
      "constant": 5,
      "position": 1
    },
    {
      "coefficient": 2,
      "variable": "x",
      "constant": 1,
      "position": 2
    }
  ],
  "options": {
    "tempo": 120,
    "scale": "major",
    "baseNote": "C4"
  }
}
```

**요청 필드:**

| 필드 | 타입 | 필수 | 기본값 | 설명 |
|------|------|------|--------|------|
| questionId | number | No | - | 문제 ID (추적용) |
| terms | Term[] | Yes | - | 항 배열 |
| options.tempo | number | No | 120 | BPM |
| options.scale | string | No | "major" | 음계 (major, minor, pentatonic) |
| options.baseNote | string | No | "C4" | 기준 음 |

**응답:**

```json
{
  "melody": {
    "notes": [
      {
        "note": "E4",
        "duration": "4n",
        "time": 0,
        "velocity": 0.8
      },
      {
        "note": "G4",
        "duration": "4n",
        "time": 0.5,
        "velocity": 0.8
      },
      {
        "note": "F4",
        "duration": "4n",
        "time": 1.0,
        "velocity": 0.8
      }
    ],
    "tempo": 120,
    "timeSignature": "4/4",
    "scale": "major"
  },
  "visualization": {
    "termChanges": [
      {
        "from": "x+3",
        "to": "x+5",
        "direction": "up",
        "musicalInterpretation": "상승 멜로디"
      },
      {
        "from": "x+5",
        "to": "2x+1",
        "direction": "transform",
        "musicalInterpretation": "계수 변화"
      }
    ],
    "patterns": ["항 변화 패턴 감지됨"]
  }
}
```

**상태 코드:**
- `200 OK`: 성공
- `400 Bad Request`: 잘못된 요청 (terms 배열 누락)
- `500 Internal Server Error`: 서버 오류

---

### 2. 항 변화 분석

수학 표현식 배열을 분석하여 패턴을 감지합니다.

**Endpoint:** `POST /api/melody/analyze`

**요청 본문:**

```json
{
  "expressions": ["x+2", "x-1", "2x", "2x+3"]
}
```

**응답:**

```json
{
  "patterns": [
    {
      "type": "sequence",
      "description": "4개의 표현식 시퀀스",
      "musicalMapping": "연속적인 멜로디 라인"
    }
  ],
  "complexity": "medium",
  "suggestedTempo": 110
}
```

**응답 필드:**

| 필드 | 타입 | 설명 |
|------|------|------|
| patterns | Pattern[] | 감지된 패턴 배열 |
| complexity | string | 복잡도 (simple, medium, complex) |
| suggestedTempo | number | 추천 템포 (BPM) |

**상태 코드:**
- `200 OK`: 성공
- `400 Bad Request`: 잘못된 요청
- `500 Internal Server Error`: 서버 오류

---

## 공통 오류 응답

모든 오류는 다음 형식으로 반환됩니다:

```json
{
  "error": "Error Type",
  "message": "상세 오류 메시지 (개발 모드에만 표시)"
}
```

---

## 타입 정의

### Term

```typescript
interface Term {
  coefficient?: number
  variable?: string
  constant?: number
  operator?: string
  position: number
}
```

### Note

```typescript
interface Note {
  note: string       // 예: 'C4', 'D#5'
  duration: string   // 예: '4n' (quarter note)
  time: number       // 시작 시간 (초)
  velocity?: number  // 볼륨 (0-1)
}
```

### Melody

```typescript
interface Melody {
  notes: Note[]
  tempo: number
  timeSignature: string
  scale?: string
}
```

---

## 예제 코드

### JavaScript/TypeScript

```typescript
// 문제 목록 조회
const response = await fetch('http://localhost:3001/api/moodle/questions?limit=10')
const data = await response.json()

// 멜로디 생성
const melody = await fetch('http://localhost:3001/api/melody/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    terms: [
      { coefficient: 1, variable: 'x', constant: 3, position: 0 },
      { coefficient: 2, variable: 'x', constant: 1, position: 1 }
    ],
    options: { tempo: 120, scale: 'major' }
  })
})
```

### cURL

```bash
# 문제 목록
curl http://localhost:3001/api/moodle/questions

# 특정 문제
curl http://localhost:3001/api/moodle/question/123

# 멜로디 생성
curl -X POST http://localhost:3001/api/melody/generate \
  -H "Content-Type: application/json" \
  -d '{
    "terms": [
      {"coefficient": 1, "variable": "x", "constant": 3, "position": 0}
    ],
    "options": {"tempo": 120}
  }'
```
