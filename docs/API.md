# API 문서

## 기본 정보

- **Base URL**: `http://localhost:8000/api/v1`
- **응답 형식**: JSON
- **인증**: 현재 버전에서는 인증 없음 (추후 추가 예정)

## 엔드포인트

### 학생 (Students)

#### 학생 목록 조회

```http
GET /api/v1/students
```

**응답 예시**:
```json
[
  {
    "id": "uuid",
    "student_number": "S001",
    "name": "김민준",
    "email": "minjun.kim@example.com",
    "grade_level": "3학년",
    "lms_user_id": "lms_001",
    "preferences": {},
    "created_at": "2024-01-01T00:00:00",
    "updated_at": "2024-01-01T00:00:00"
  }
]
```

#### 학생 상세 정보

```http
GET /api/v1/students/{student_id}
```

**응답 예시**:
```json
{
  "id": "uuid",
  "student_number": "S001",
  "name": "김민준",
  "grade_level": "3학년",
  "total_cards": 15,
  "total_learning_time": 450,
  "average_score": 85.5
}
```

#### 학생 등록

```http
POST /api/v1/students
```

**요청 본문**:
```json
{
  "student_number": "S004",
  "name": "홍길동",
  "email": "gildong@example.com",
  "grade_level": "4학년",
  "lms_user_id": "lms_004"
}
```

#### 학습 진행 현황

```http
GET /api/v1/students/{student_id}/progress?limit=20
```

### 루틴 카드 (Cards)

#### 오늘의 카드 조회 (자동 생성)

```http
GET /api/v1/cards/today/{student_id}
```

카드가 없으면 자동으로 생성됩니다.

**응답 예시**:
```json
{
  "id": "uuid",
  "student_id": "uuid",
  "card_date": "2024-01-15",
  "title": "민준님의 멋진 학습 여행! 🚀",
  "learning_goals": [
    "분수의 덧셈을 완벽하게 이해하기",
    "연습 문제 10개 풀기",
    "틀린 문제 복습하기"
  ],
  "recommended_activities": [
    {
      "title": "분수 덧셈 연습",
      "description": "같은 분모를 가진 분수의 덧셈을 연습해봅시다",
      "duration_minutes": 20,
      "difficulty": "medium",
      "subject": "수학",
      "topic": "분수의 덧셈"
    }
  ],
  "progress_summary": {
    "current_topics": ["분수의 덧셈과 뺄셈"],
    "strengths": ["기본 개념 이해"],
    "areas_for_improvement": ["복잡한 계산"],
    "overall_progress": "잘 진행하고 있습니다"
  },
  "motivation_message": "민준님, 오늘도 즐겁게 공부해봐요! 여러분의 노력이 멋진 결과를 만들어낼 거예요.",
  "next_steps": [
    "분수의 뺄셈 배우기",
    "분수의 크기 비교하기"
  ],
  "status": "active",
  "created_at": "2024-01-15T07:00:00"
}
```

#### 카드 생성 (수동)

```http
POST /api/v1/cards/generate
```

**요청 본문**:
```json
{
  "student_id": "uuid",
  "card_date": "2024-01-15",
  "force_regenerate": false
}
```

- `card_date`: 선택사항, 기본값은 오늘
- `force_regenerate`: 기존 카드가 있어도 재생성 여부

#### 특정 카드 조회

```http
GET /api/v1/cards/{card_id}
```

#### 학생의 카드 목록

```http
GET /api/v1/cards/student/{student_id}?limit=30
```

#### 카드 완료 표시

```http
POST /api/v1/cards/{card_id}/complete
```

#### 모든 학생의 카드 일괄 생성

```http
POST /api/v1/cards/generate-all
```

관리자/스케줄러용 엔드포인트

**응답 예시**:
```json
{
  "total": 10,
  "success": 8,
  "failed": 2,
  "errors": [
    {
      "student_id": "uuid",
      "student_name": "홍길동",
      "error": "학습 데이터가 충분하지 않습니다"
    }
  ]
}
```

## 에러 코드

| 상태 코드 | 설명 |
|---------|------|
| 200 | 성공 |
| 201 | 생성 성공 |
| 204 | 삭제 성공 (응답 본문 없음) |
| 400 | 잘못된 요청 |
| 404 | 리소스를 찾을 수 없음 |
| 500 | 서버 내부 오류 |

## 에러 응답 형식

```json
{
  "detail": "에러 메시지"
}
```

## 사용 예제

### Python (requests)

```python
import requests

BASE_URL = "http://localhost:8000/api/v1"

# 학생 목록 조회
response = requests.get(f"{BASE_URL}/students")
students = response.json()

# 오늘의 카드 조회
student_id = students[0]['id']
response = requests.get(f"{BASE_URL}/cards/today/{student_id}")
card = response.json()

print(f"제목: {card['title']}")
print(f"학습 목표: {card['learning_goals']}")
```

### JavaScript (axios)

```javascript
import axios from 'axios';

const BASE_URL = 'http://localhost:8000/api/v1';

// 학생 목록 조회
const students = await axios.get(`${BASE_URL}/students`);

// 오늘의 카드 조회
const studentId = students.data[0].id;
const card = await axios.get(`${BASE_URL}/cards/today/${studentId}`);

console.log('제목:', card.data.title);
console.log('학습 목표:', card.data.learning_goals);
```

### cURL

```bash
# 학생 목록
curl http://localhost:8000/api/v1/students

# 오늘의 카드
curl http://localhost:8000/api/v1/cards/today/{student_id}

# 카드 생성
curl -X POST http://localhost:8000/api/v1/cards/generate \
  -H "Content-Type: application/json" \
  -d '{"student_id": "uuid"}'
```
