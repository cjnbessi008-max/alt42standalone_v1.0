# Moodle 3.7 연동 가이드

ALT42 Asymptote Reveal 앱과 Moodle 통합 방법

## 📖 개요

ALT42는 Moodle 퀴즈 시스템과 통합되어 자동으로 문제 정보를 가져와 점근선 애니메이션을 표시합니다.

## 🔗 연동 방식

### 1. 데이터베이스 직접 연동 (현재 구현)

Moodle 데이터베이스에서 직접 퀴즈 정보를 조회합니다.

**장점:**
- 빠른 응답 속도
- 추가 플러그인 불필요
- 단순한 구조

**단점:**
- Moodle DB 읽기 권한 필요
- Moodle 버전 변경 시 테이블 구조 변경 가능성

### 2. Moodle Web Services (향후 구현)

Moodle REST API를 통한 데이터 조회

**장점:**
- 공식 API 사용
- 버전 호환성 높음
- 권한 관리 용이

**단점:**
- 설정 복잡
- API 토큰 관리 필요

## 🛠 설정 방법

### 방법 1: 데이터베이스 직접 연동

#### 1단계: MySQL 권한 부여

```sql
-- alt42 사용자에게 Moodle 테이블 읽기 권한
GRANT SELECT ON moodle.mdl_question TO 'alt42_user'@'localhost';
GRANT SELECT ON moodle.mdl_question_answers TO 'alt42_user'@'localhost';
GRANT SELECT ON moodle.mdl_quiz_slots TO 'alt42_user'@'localhost';
GRANT SELECT ON moodle.mdl_question_numerical_options TO 'alt42_user'@'localhost';
FLUSH PRIVILEGES;
```

#### 2단계: Moodle 퀴즈 생성

1. Moodle 관리자 로그인
2. **코스 관리** → **퀴즈 추가**
3. 퀴즈 이름: "점근선 찾기"
4. **문제 추가** → **새 문제** → **수치형**

#### 3단계: 문제 작성 예시

**문제 텍스트:**
```
다음 함수의 점근선을 찾으시오.

f(x) = 1/x

수직 점근선의 x 좌표를 입력하세요.
```

**정답:** 0

**문제 ID 확인:**
```sql
SELECT id, name, questiontext
FROM mdl_question
WHERE name LIKE '%점근선%'
ORDER BY id DESC
LIMIT 5;
```

예: `quiz_id = 123`

#### 4단계: ALT42 앱에서 호출

URL:
```
http://alt42.local?quiz_id=123
```

또는 iframe:
```html
<iframe src="http://alt42.local?quiz_id=123" width="100%" height="800"></iframe>
```

### 방법 2: Moodle Web Services 연동 (고급)

#### 1단계: Web Services 활성화

Moodle 관리:
1. **사이트 관리** → **고급 기능** → **Web services 활성화**
2. **사이트 관리** → **플러그인** → **Web services** → **프로토콜 관리** → **REST 활성화**

#### 2단계: 외부 서비스 생성

1. **사이트 관리** → **Web services** → **외부 서비스**
2. **서비스 추가**:
   - 이름: ALT42 Quiz Service
   - 약칭: alt42_quiz
   - 활성화: 예

#### 3단계: 함수 추가

외부 서비스에 다음 함수 추가:
- `core_course_get_courses`
- `mod_quiz_get_quizzes_by_courses`
- `core_question_get_random_question_summaries`

#### 4단계: 사용자 토큰 생성

```sql
-- Moodle DB에서 토큰 확인
SELECT token, userid, serviceid, timecreated
FROM mdl_external_tokens
WHERE externalserviceid = (SELECT id FROM mdl_external_services WHERE shortname = 'alt42_quiz');
```

#### 5단계: PHP 코드 수정

`backend/moodle/moodle-webservice.php` (신규 파일):

```php
<?php
class MoodleWebService {
    private $moodleUrl;
    private $token;

    public function __construct($url, $token) {
        $this->moodleUrl = $url;
        $this->token = $token;
    }

    public function getQuizQuestion($quizId) {
        $endpoint = $this->moodleUrl . '/webservice/rest/server.php';

        $params = [
            'wstoken' => $this->token,
            'wsfunction' => 'mod_quiz_get_quiz_data',
            'moodlewsrestformat' => 'json',
            'quizid' => $quizId
        ];

        $url = $endpoint . '?' . http_build_query($params);
        $response = file_get_contents($url);

        return json_decode($response, true);
    }
}
```

## 📊 Moodle 테이블 구조 (v3.7)

### mdl_question
```sql
id              bigint(10)      # 문제 ID
name            varchar(255)    # 문제 이름
questiontext    text            # 문제 텍스트 (HTML)
qtype           varchar(20)     # 문제 타입 (numerical, shortanswer, etc.)
```

### mdl_quiz_slots
```sql
id              bigint(10)
quizid          bigint(10)      # 퀴즈 ID
questionid      bigint(10)      # 문제 ID (FK)
slot            bigint(10)      # 순서
```

### mdl_question_answers
```sql
id              bigint(10)
question        bigint(10)      # 문제 ID (FK)
answer          text            # 정답
fraction        decimal(12,7)   # 배점 (1.0 = 100%)
```

## 🎯 문제 유형 지원

### 지원되는 Moodle 문제 유형

1. **수치형 (Numerical)**
   - 점근선 좌표 입력
   - 정확한 값 또는 범위

2. **단답형 (Short answer)**
   - 함수식 입력
   - 예: "x=0", "y=0"

3. **서술형 (Essay)**
   - 점근선 설명

### 커스텀 문제 필드

Moodle 문제에 커스텀 필드 추가 가능:

```sql
-- 함수식 저장
ALTER TABLE mdl_question ADD COLUMN alt42_function VARCHAR(255);

-- 점근선 정보 JSON
ALTER TABLE mdl_question ADD COLUMN alt42_asymptotes TEXT;

UPDATE mdl_question
SET alt42_function = '1/x',
    alt42_asymptotes = '{"vertical": [0], "horizontal": [0]}'
WHERE id = 123;
```

## 🔐 보안 고려사항

1. **데이터베이스 권한 최소화**
   - 읽기 전용 권한만 부여
   - 필요한 테이블만 접근

2. **SQL Injection 방지**
   - PDO Prepared Statements 사용
   - 입력 검증

3. **API 토큰 보호**
   - 환경 변수 사용
   - `.gitignore`에 설정 파일 추가

## 📝 예제: 샘플 Moodle 퀴즈

```sql
-- 샘플 데이터 삽입 (테스트용)
INSERT INTO mdl_question (name, questiontext, qtype, category)
VALUES (
    '점근선 찾기 - 1/x',
    '<p>함수 f(x) = 1/x 의 수직 점근선을 찾으세요.</p>',
    'numerical',
    1
);

SET @question_id = LAST_INSERT_ID();

INSERT INTO mdl_question_answers (question, answer, fraction)
VALUES (@question_id, '0', 1.0);

INSERT INTO mdl_quiz_slots (quizid, questionid, slot)
VALUES (1, @question_id, 1);
```

## 🚀 테스트

### API 테스트

```bash
# Moodle 퀴즈 데이터 가져오기
curl "http://localhost/alt42standalone_v1.0/backend/api/get-problem.php?quiz_id=1"
```

### 프론트엔드 테스트

```javascript
// 브라우저 콘솔에서
fetch('http://localhost/alt42standalone_v1.0/backend/api/get-problem.php?quiz_id=1')
  .then(res => res.json())
  .then(data => console.log(data));
```

## 📚 참고 자료

- [Moodle Web Services Documentation](https://docs.moodle.org/dev/Web_services)
- [Moodle Question Bank](https://docs.moodle.org/37/en/Question_bank)
- [Moodle Database Schema](https://docs.moodle.org/dev/Database_schema)
