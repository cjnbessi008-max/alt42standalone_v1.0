# Edge Melody API 문서

## 개요
Moodle LMS와 연동하여 문제 정보를 제공하는 RESTful API입니다.

## Base URL
```
http://localhost:8080/api
```

## 인증
현재 버전에서는 별도 인증이 필요하지 않습니다. (개발 환경)

---

## Endpoints

### 1. 문제 목록 조회

**GET** `/questions`

문제 목록을 조회합니다.

#### Query Parameters
| 파라미터 | 타입 | 필수 | 설명 | 기본값 |
|---------|------|------|------|--------|
| category | integer | X | 카테고리 ID | null |
| limit | integer | X | 조회 개수 | 10 |

#### 응답 예시
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "category": 5,
      "name": "수학 문제 1",
      "questiontext": "다음 중 올바른 답은?",
      "qtype": "multichoice",
      "defaultmark": 2.0,
      "timecreated": 1637123456,
      "timemodified": 1637123456,
      "category_name": "수학"
    }
  ],
  "count": 1
}
```

---

### 2. 특정 문제 조회

**GET** `/questions/{id}`

특정 문제의 상세 정보를 조회합니다.

#### Path Parameters
| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| id | integer | O | 문제 ID |

#### 응답 예시
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "수학 문제 1",
    "questiontext": "다음 중 올바른 답은?",
    "qtype": "multichoice",
    "defaultmark": 2.0,
    "category_name": "수학",
    "answers": [
      {
        "id": 1,
        "answer": "선택지 1",
        "fraction": 1.0,
        "feedback": "정답입니다!"
      },
      {
        "id": 2,
        "answer": "선택지 2",
        "fraction": 0.0,
        "feedback": "틀렸습니다."
      }
    ]
  }
}
```

---

### 3. Edge Melody 시각화 데이터

**GET** `/questions/{id}/edge-melody`

Edge Melody 3D 시각화를 위한 메타데이터를 조회합니다.

#### Path Parameters
| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| id | integer | O | 문제 ID |

#### 응답 예시
```json
{
  "success": true,
  "data": {
    "question": {
      "id": 1,
      "name": "수학 문제 1",
      "questiontext": "다음 중 올바른 답은?",
      "qtype": "multichoice",
      "defaultmark": 2.0,
      "answers": [...]
    },
    "visualization": {
      "type": "3d_cube",
      "edges": [
        {
          "id": 0,
          "coordinates": {
            "start": [0, 0, 0],
            "end": [1, 0, 0]
          },
          "active": true,
          "intensity": 1.0,
          "delay": 0
        }
      ],
      "animation": {
        "speed": 1.2,
        "pattern": "melodic",
        "color_scheme": ["#00ff88", "#00ccff", "#ff00ff"]
      }
    },
    "metadata": {
      "difficulty": "medium",
      "question_type": "multichoice",
      "points": 2.0
    }
  }
}
```

---

### 4. 카테고리 목록

**GET** `/categories`

문제 카테고리 목록을 조회합니다.

#### 응답 예시
```json
{
  "success": true,
  "data": [
    {
      "id": 5,
      "name": "수학",
      "contextid": 10,
      "info": "수학 문제 카테고리",
      "parent": 1
    }
  ],
  "count": 1
}
```

---

## 에러 응답

모든 에러는 다음 형식으로 반환됩니다:

```json
{
  "success": false,
  "error": "에러 메시지"
}
```

### HTTP 상태 코드

| 코드 | 설명 |
|------|------|
| 200 | 성공 |
| 404 | 리소스를 찾을 수 없음 |
| 500 | 서버 내부 오류 |

---

## Edge Melody 시각화 알고리즘

### 1. Edge 패턴 생성
- 정육면체의 12개 모서리 중 답변 개수만큼 활성화
- 각 모서리는 고유한 딜레이와 강도를 가짐

### 2. 애니메이션 속도
- 배점에 비례: `speed = 1.0 + (points / 10)`
- 난이도가 높을수록 느린 애니메이션

### 3. 색상 스킴
- 카테고리별로 고유한 색상 조합
- 음악적 리듬에 따라 색상 순환

### 4. 난이도 계산
- **Easy**: 배점 < 2점, 선택지 < 3개
- **Medium**: 배점 2-3점, 선택지 3-4개
- **Hard**: 배점 >= 3점, 선택지 >= 5개

---

## 사용 예시

### JavaScript (Axios)
```javascript
import axios from 'axios'

// 문제 목록 조회
const questions = await axios.get('http://localhost:8080/api/questions?limit=20')

// Edge Melody 데이터 조회
const edgeMelody = await axios.get('http://localhost:8080/api/questions/1/edge-melody')
```

### cURL
```bash
# 문제 목록
curl http://localhost:8080/api/questions

# Edge Melody 데이터
curl http://localhost:8080/api/questions/1/edge-melody
```
