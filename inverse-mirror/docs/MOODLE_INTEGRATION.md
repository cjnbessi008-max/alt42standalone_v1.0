# Moodle 연동 가이드

## Moodle Web Services 연동 상세

Inverse Mirror 앱은 Moodle LMS와 Web Services API를 통해 연동됩니다.

## 연동 아키텍처

```
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│   Frontend  │ ──REST──▶│   Backend   │ ──WS───▶│   Moodle    │
│  (React)    │◀────────│  (Node.js)  │◀────────│   (PHP)     │
└─────────────┘         └─────────────┘         └─────────────┘
                              │
                              ▼
                        ┌──────────┐
                        │  MySQL   │
                        └──────────┘
```

## Moodle 퀴즈 문제 형식

### 권장 문제 형식

Moodle에서 다음 형식으로 문제를 작성하세요:

**예시 1: 역함수 미분**
```
문제 텍스트:
함수 f(x) = x^2 (domain [0, 3])에 대해,
점 x = 1.5에서 역함수의 미분계수를 구하시오.

답변:
(자동 채점 또는 수동 채점)
```

**예시 2: 미분 계수**
```
문제 텍스트:
함수 f(x) = exp(x)의 x = 1에서의 미분계수를 구하시오.

답변:
2.718... (수치 답변)
```

### 문제 파싱 규칙

백엔드는 다음 패턴으로 문제를 파싱합니다:

1. **함수 표현식**: `f(x) = <expression>`
2. **정의역**: `domain [<min>, <max>]`
3. **점**: `x = <value>`

## Moodle Web Services 함수

### 사용 중인 함수

#### 1. `core_webservice_get_site_info`
- **목적**: Moodle 사이트 정보 및 연결 테스트
- **파라미터**: 없음
- **반환**: 사이트명, 버전 등

#### 2. `core_course_get_courses`
- **목적**: 코스 정보 가져오기
- **파라미터**: `options[ids]` - 코스 ID 배열
- **반환**: 코스 정보 객체

#### 3. `mod_quiz_get_quiz_access_information`
- **목적**: 퀴즈 문제 정보 가져오기
- **파라미터**: `quizid` - 퀴즈 ID
- **반환**: 문제 목록

#### 4. `mod_quiz_save_attempt`
- **목적**: 학생 답안 및 점수 저장
- **파라미터**: `attemptid`, `userid`, `grade`
- **반환**: 성공/실패 상태

## 커스텀 Moodle 플러그인 (선택사항)

더 나은 연동을 위해 커스텀 Moodle 플러그인을 개발할 수 있습니다.

### 플러그인 구조

```
moodle/local/inversemirror/
├── version.php
├── lib.php
├── db/
│   ├── access.php
│   └── services.php
├── classes/
│   └── external/
│       ├── get_problem.php
│       └── submit_answer.php
└── lang/
    └── en/
        └── local_inversemirror.php
```

### 커스텀 Web Service 함수

#### `local_inversemirror_get_problem`

```php
<?php
// classes/external/get_problem.php

namespace local_inversemirror\external;

use external_api;
use external_function_parameters;
use external_single_structure;
use external_value;

class get_problem extends external_api {

    public static function execute_parameters() {
        return new external_function_parameters([
            'problemid' => new external_value(PARAM_INT, 'Problem ID', VALUE_OPTIONAL),
        ]);
    }

    public static function execute($problemid = null) {
        global $DB;

        // Get problem from custom table or quiz
        if ($problemid) {
            $problem = $DB->get_record('inversemirror_problems', ['id' => $problemid]);
        } else {
            // Get random problem
            $problem = $DB->get_record_sql(
                "SELECT * FROM {inversemirror_problems} ORDER BY RAND() LIMIT 1"
            );
        }

        return [
            'id' => $problem->id,
            'function_expression' => $problem->function_expression,
            'domain_min' => $problem->domain_min,
            'domain_max' => $problem->domain_max,
            'point' => $problem->point,
            'question_type' => $problem->question_type,
        ];
    }

    public static function execute_returns() {
        return new external_single_structure([
            'id' => new external_value(PARAM_INT, 'Problem ID'),
            'function_expression' => new external_value(PARAM_TEXT, 'Function'),
            'domain_min' => new external_value(PARAM_FLOAT, 'Domain min'),
            'domain_max' => new external_value(PARAM_FLOAT, 'Domain max'),
            'point' => new external_value(PARAM_FLOAT, 'Point'),
            'question_type' => new external_value(PARAM_TEXT, 'Type'),
        ]);
    }
}
```

## 데이터 동기화

### Moodle → Inverse Mirror

1. **문제 가져오기** (실시간)
   - API 호출: `GET /api/problems/moodle/:quizId`
   - Moodle Web Service 호출
   - 파싱 후 반환

2. **학생 정보** (캐싱)
   - Moodle에서 학생 목록 가져오기
   - 로컬 DB에 캐싱
   - 주기적 동기화 (예: 1일 1회)

### Inverse Mirror → Moodle

1. **진행도 제출** (실시간)
   - 학생이 문제 완료 시
   - API 호출: `POST /api/progress`
   - Moodle에 점수 제출

2. **성적 동기화** (배치)
   - 주기적으로 모든 진행도 동기화
   - Cron job 또는 스케줄러 사용

## 보안 고려사항

### 1. 토큰 관리
- `.env` 파일에 토큰 저장 (Git에 커밋하지 않음)
- 프로덕션에서는 환경 변수 또는 비밀 관리 서비스 사용
- 정기적으로 토큰 갱신

### 2. 권한 제한
- Moodle Web Service 사용자에게 최소 권한만 부여
- 읽기/쓰기 권한 분리
- IP 화이트리스트 설정 (가능한 경우)

### 3. 데이터 검증
- 모든 Moodle 응답 검증
- SQL Injection 방지
- XSS 방지

## 문제 해결

### Moodle 토큰 오류

```
Error: Invalid token
```

**해결:**
1. Moodle에서 토큰 재생성
2. `.env` 파일 업데이트
3. 백엔드 재시작

### 함수 권한 오류

```
Error: Access to web service function not allowed
```

**해결:**
1. Moodle 외부 서비스 설정 확인
2. 필요한 함수가 추가되었는지 확인
3. 사용자 권한 확인

### CORS 오류

```
Error: CORS policy
```

**해결:**
- Moodle에서 CORS 헤더 허용 설정
- 또는 백엔드를 프록시로 사용 (현재 구현)

## 테스트

### 연결 테스트

```bash
# 백엔드에서 Moodle 연결 테스트
cd inverse-mirror/backend
npm run dev

# 로그 확인
# ✅ Moodle connection successful: <사이트명>
```

### API 테스트

```bash
# 문제 가져오기
curl http://localhost:5000/api/problems/moodle/1

# 응답 예시
{
  "id": 1,
  "functionExpression": "x^2",
  "domain": [0, 3],
  "point": 1.5,
  "questionType": "both"
}
```

## 참고 자료

- [Moodle Web Services Documentation](https://docs.moodle.org/dev/Web_services)
- [Moodle External API](https://docs.moodle.org/dev/External_functions_API)
- [Moodle Quiz API](https://docs.moodle.org/dev/Quiz_API)
