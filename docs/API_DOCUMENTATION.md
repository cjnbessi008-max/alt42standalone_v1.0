# Stat Story Mode API Documentation

## API 기본 정보

- **Base URL**: `/api`
- **Content-Type**: `application/json`
- **Character Encoding**: UTF-8

## 응답 형식

### 성공 응답

```json
{
  "success": true,
  "data": { ... }
}
```

### 에러 응답

```json
{
  "success": false,
  "error": "에러 메시지"
}
```

## 엔드포인트

### 1. 스토리 시나리오

#### 1.1 스토리 목록 조회

**GET** `/story_controller.php/scenarios`

스토리 시나리오 목록을 조회합니다.

**Query Parameters**:

| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| difficulty | string | X | 난이도 필터 (basic, intermediate, advanced) |
| concept | string | X | 통계 개념 필터 |
| grade | string | X | 대상 학년 필터 |

**응답 예시**:

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "title": "반 평균 키 구하기 대작전",
      "description": "민수네 반 학생들의 평균 키를 구하는 과정을 통해 평균의 개념을 배웁니다.",
      "stat_concept": "mean",
      "difficulty_level": "basic",
      "target_grade": "중1",
      "story_content": { ... },
      "created_at": "2025-11-18 10:00:00",
      "is_active": true
    }
  ]
}
```

#### 1.2 스토리 상세 조회

**GET** `/story_controller.php/scenario`

특정 스토리 시나리오의 상세 정보를 조회합니다.

**Query Parameters**:

| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| id | int | O | 시나리오 ID |

**응답 예시**:

```json
{
  "success": true,
  "data": {
    "id": 1,
    "title": "반 평균 키 구하기 대작전",
    "description": "민수네 반 학생들의 평균 키를 구하는 과정을 통해 평균의 개념을 배웁니다.",
    "stat_concept": "mean",
    "difficulty_level": "basic",
    "target_grade": "중1",
    "story_content": {
      "theme": "school_life",
      "setting": "중학교 체육시간",
      "goal": "반 학생들의 평균 키를 계산하고 평균의 의미를 이해하기"
    }
  }
}
```

#### 1.3 스토리 단계 목록 조회

**GET** `/story_controller.php/steps`

특정 시나리오의 모든 단계를 조회합니다.

**Query Parameters**:

| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| scenario_id | int | O | 시나리오 ID |

**응답 예시**:

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "scenario_id": 1,
      "step_order": 1,
      "step_type": "dialogue",
      "character_name": "민수",
      "dialogue_text": "선생님, 우리 반 평균 키가 얼마나 될까요?",
      "explanation_content": null,
      "question_data": null
    },
    {
      "id": 4,
      "scenario_id": 1,
      "step_order": 4,
      "step_type": "question",
      "character_name": "김통계 선생님",
      "dialogue_text": "그럼 연습문제를 풀어볼까?",
      "explanation_content": null,
      "question_data": {
        "question_type": "calculation",
        "data": [152, 158, 165, 160, 155],
        "question_text": "5명 학생의 키: 152cm, 158cm, 165cm, 160cm, 155cm<br>평균 키는 몇 cm인가요?",
        "answer": 158,
        "unit": "cm",
        "tolerance": 0.5
      }
    }
  ]
}
```

### 2. 스토리 진행

#### 2.1 스토리 시작

**POST** `/story_controller.php/start`

새로운 스토리를 시작합니다.

**Request Body**:

```json
{
  "student_id": 12345,
  "scenario_id": 1
}
```

**응답 예시**:

```json
{
  "success": true,
  "data": {
    "message": "Story started successfully",
    "progress_id": 101,
    "current_step_id": 1
  }
}
```

#### 2.2 답안 제출

**POST** `/story_controller.php/submit_answer`

문제에 대한 답안을 제출합니다.

**Request Body**:

```json
{
  "progress_id": 101,
  "step_id": 4,
  "answer": 158,
  "time_spent": 45
}
```

**응답 예시**:

```json
{
  "success": true,
  "data": {
    "is_correct": true,
    "attempt_number": 1,
    "explanation": "(152 + 158 + 165 + 160 + 155) ÷ 5 = 790 ÷ 5 = 158cm",
    "can_retry": false
  }
}
```

#### 2.3 다음 단계로 이동

**POST** `/story_controller.php/next_step`

현재 단계를 완료하고 다음 단계로 이동합니다.

**Request Body**:

```json
{
  "progress_id": 101
}
```

**응답 예시** (일반):

```json
{
  "success": true,
  "data": {
    "next_step_id": 5,
    "completed_steps": [1, 2, 3, 4]
  }
}
```

**응답 예시** (완료):

```json
{
  "success": true,
  "data": {
    "completed": true,
    "message": "Story completed!",
    "final_score": 85
  }
}
```

#### 2.4 힌트 사용

**POST** `/story_controller.php/use_hint`

현재 단계의 힌트를 조회합니다.

**Request Body**:

```json
{
  "progress_id": 101,
  "step_id": 4
}
```

**응답 예시**:

```json
{
  "success": true,
  "data": {
    "hint": "먼저 점수를 크기 순서로 정렬해보세요!"
  }
}
```

### 3. 진행 상황

#### 3.1 진행 상황 조회

**GET** `/story_controller.php/progress`

학생의 진행 상황을 조회합니다.

**Query Parameters**:

| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| student_id | int | O | 학생 ID |
| scenario_id | int | X | 시나리오 ID (특정 시나리오만 조회) |

**응답 예시** (특정 시나리오):

```json
{
  "success": true,
  "data": {
    "id": 101,
    "student_id": 12345,
    "scenario_id": 1,
    "current_step_id": 5,
    "completed_steps": [1, 2, 3, 4],
    "score": 40,
    "total_attempts": 5,
    "correct_answers": 4,
    "start_time": "2025-11-18 10:00:00",
    "last_activity": "2025-11-18 10:30:00",
    "is_completed": false
  }
}
```

**응답 예시** (전체 목록):

```json
{
  "success": true,
  "data": [
    {
      "id": 101,
      "student_id": 12345,
      "scenario_id": 1,
      "title": "반 평균 키 구하기 대작전",
      "stat_concept": "mean",
      "current_step_id": 5,
      "score": 40,
      "is_completed": false,
      "last_activity": "2025-11-18 10:30:00"
    }
  ]
}
```

### 4. 통계 개념

#### 4.1 통계 개념 목록 조회

**GET** `/story_controller.php/concepts`

통계 개념 목록을 조회합니다.

**Query Parameters**:

| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| category | string | X | 카테고리 필터 (descriptive, probability, inference, correlation) |

**응답 예시**:

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "concept_code": "mean",
      "concept_name_ko": "평균",
      "concept_name_en": "Mean",
      "category": "descriptive",
      "description": "모든 데이터 값의 합을 데이터 개수로 나눈 값",
      "formula": "평균 = (데이터의 합) / (데이터의 개수)",
      "difficulty": 1,
      "prerequisite_concepts": null
    },
    {
      "id": 5,
      "concept_code": "variance",
      "concept_name_ko": "분산",
      "concept_name_en": "Variance",
      "category": "descriptive",
      "description": "데이터가 평균으로부터 얼마나 흩어져 있는지 나타내는 값",
      "formula": "분산 = Σ(xi - 평균)² / n",
      "difficulty": 3,
      "prerequisite_concepts": ["mean"]
    }
  ]
}
```

## 에러 코드

| HTTP 상태 코드 | 의미 |
|--------------|------|
| 200 | 성공 |
| 400 | 잘못된 요청 (필수 파라미터 누락 등) |
| 404 | 리소스를 찾을 수 없음 |
| 405 | 허용되지 않은 HTTP 메소드 |
| 500 | 서버 내부 오류 |

## 문제 유형

### calculation (계산 문제)

```json
{
  "question_type": "calculation",
  "data": [152, 158, 165, 160, 155],
  "question_text": "평균 키는 몇 cm인가요?",
  "answer": 158,
  "unit": "cm",
  "tolerance": 0.5,
  "explanation": "계산 과정 설명"
}
```

### multiple_choice (객관식)

```json
{
  "question_type": "multiple_choice",
  "question_text": "5명의 평균 점수가 80점입니다...",
  "choices": ["70점", "75점", "80점", "85점"],
  "correct_answer": 2,
  "explanation": "설명"
}
```

### text (텍스트 입력)

```json
{
  "question_type": "text",
  "question_text": "평균의 정의를 설명하세요.",
  "answer": "모든 데이터의 합을 개수로 나눈 값",
  "explanation": "설명"
}
```

## 보안

- 모든 입력 값은 서버 측에서 검증됩니다.
- SQL Injection 방지를 위해 Prepared Statement를 사용합니다.
- XSS 방지를 위해 출력 시 이스케이프 처리됩니다.

## 제한 사항

- API 호출 제한: 없음 (추후 추가 가능)
- 파일 업로드: 현재 지원하지 않음
- 최대 응답 크기: 10MB

## 예제 코드

### JavaScript (Axios)

```javascript
// 스토리 시작
const response = await axios.post('/api/story_controller.php/start', {
  student_id: 12345,
  scenario_id: 1
});

if (response.data.success) {
  const progressId = response.data.data.progress_id;
  console.log('Progress ID:', progressId);
}
```

### PHP (cURL)

```php
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, 'http://localhost/api/story_controller.php/start');
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
    'student_id' => 12345,
    'scenario_id' => 1
]));
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json'
]);

$response = curl_exec($ch);
curl_close($ch);

$data = json_decode($response, true);
if ($data['success']) {
    echo "Progress ID: " . $data['data']['progress_id'];
}
```

## 변경 이력

- **v1.0.0** (2025-11-18): 초기 버전 릴리즈
