# Relation Thermo - 기술 문서

## 아키텍처 개요

### 시스템 구성

```
┌─────────────────────────────────────────────┐
│           Moodle LMS 3.7                    │
│  ┌───────────────────────────────────────┐  │
│  │   mod_relationthermo Plugin           │  │
│  │  ┌─────────────┐   ┌───────────────┐  │  │
│  │  │  PHP Backend│   │ Web Interface │  │  │
│  │  │   (7.1.9)   │◄─►│  (HTML/CSS/JS)│  │  │
│  │  └──────┬──────┘   └───────┬───────┘  │  │
│  └─────────┼──────────────────┼──────────┘  │
└────────────┼──────────────────┼─────────────┘
             │                  │
             ▼                  ▼
    ┌────────────────┐  ┌─────────────────┐
    │  MySQL 5.7     │  │  Browser        │
    │  - rt_problems │  │  - Smartphone   │
    │  - rt_responses│  │  - Thermometer  │
    └────────────────┘  └─────────────────┘
```

### 기술 스택

#### 백엔드
- **PHP**: 7.1.9
  - Moodle API 활용
  - JSON 데이터 처리
  - REST API 엔드포인트
- **MySQL**: 5.7
  - InnoDB 스토리지 엔진
  - UTF-8MB4 문자셋
  - JSON 타입 컬럼

#### 프론트엔드
- **HTML5**: 시맨틱 마크업
- **CSS3**: Flexbox, 그라디언트, 애니메이션
- **JavaScript**: ES5 호환 (IE11 지원)
  - Vanilla JS (프레임워크 없음)
  - Fetch API
  - DOM 조작

#### Moodle 통합
- Activity Module API
- Grade API
- Capability System
- XMLDB Schema

## 데이터베이스 설계

### ERD (Entity Relationship Diagram)

```
┌─────────────────┐         ┌──────────────────┐
│  rt_problems    │         │ rt_responses     │
├─────────────────┤         ├──────────────────┤
│ id (PK)         │◄────────│ problem_id (FK)  │
│ course_id       │         │ user_id (FK)     │
│ activity_id     │         │ selected_relation│
│ title           │         │ confidence_level │
│ description     │         │ is_correct       │
│ set_a (JSON)    │         │ time_spent       │
│ set_b (JSON)    │         │ submitted_at     │
│ relation_type   │         └──────────────────┘
│ difficulty      │
└─────────────────┘
         │
         │
         ▼
┌─────────────────┐
│  rt_progress    │
├─────────────────┤
│ user_id (FK)    │
│ course_id (FK)  │
│ total_problems  │
│ correct_answers │
│ avg_confidence  │
└─────────────────┘
```

### 테이블 상세

#### 1. rt_problems (문제)
```sql
CREATE TABLE rt_problems (
    id INT PRIMARY KEY AUTO_INCREMENT,
    moodle_course_id INT NOT NULL,
    moodle_activity_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    set_a VARCHAR(255) NOT NULL,      -- JSON: [1,2,3]
    set_b VARCHAR(255) NOT NULL,      -- JSON: [4,5,6]
    relation_type ENUM(...) NOT NULL, -- 정답
    difficulty TINYINT DEFAULT 1,     -- 1-5
    INDEX idx_activity (moodle_activity_id)
);
```

#### 2. rt_responses (학생 응답)
```sql
CREATE TABLE rt_responses (
    id INT PRIMARY KEY AUTO_INCREMENT,
    problem_id INT NOT NULL,
    user_id INT NOT NULL,
    selected_relation ENUM(...),
    confidence_level TINYINT,         -- 0-100
    is_correct BOOLEAN,
    time_spent INT,                   -- 초 단위
    submitted_at TIMESTAMP,
    FOREIGN KEY (problem_id) REFERENCES rt_problems(id)
);
```

#### 3. rt_progress (진행 상황)
```sql
CREATE TABLE rt_progress (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    moodle_course_id INT NOT NULL,
    total_problems INT DEFAULT 0,
    correct_answers INT DEFAULT 0,
    average_confidence DECIMAL(5,2),
    UNIQUE KEY (user_id, moodle_course_id)
);
```

## API 엔드포인트

### Base URL
```
/mod/relationthermo/api.php
```

### 1. GET /api.php?action=get_problems

#### 요청
```http
GET /api.php?action=get_problems&activity_id=1
```

#### 응답
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "title": "부분집합 관계",
      "description": "두 집합의 관계를 파악하세요",
      "set_a": [1, 2, 3],
      "set_b": [1, 2, 3, 4, 5],
      "difficulty": 1
    }
  ]
}
```

### 2. POST /api.php?action=submit_response

#### 요청
```http
POST /api.php?action=submit_response
  &activity_id=1
  &problem_id=1
  &selected_relation=subset
  &confidence_level=85
  &time_spent=30
```

#### 응답
```json
{
  "success": true,
  "data": {
    "response_id": 123,
    "is_correct": true,
    "correct_answer": "subset"
  }
}
```

### 3. GET /api.php?action=get_progress

#### 요청
```http
GET /api.php?action=get_progress&activity_id=1
```

#### 응답
```json
{
  "success": true,
  "data": {
    "total_problems": 10,
    "correct_answers": 8,
    "accuracy": 80.00,
    "avg_confidence": 72.50,
    "avg_time": 45.30
  }
}
```

## 프론트엔드 구조

### 파일 구조
```
mod_relationthermo/
├── view.php              # 메인 페이지
├── api.php              # REST API
├── scripts/
│   └── app.js          # 메인 JavaScript
└── styles/
    └── app.css         # 메인 스타일
```

### JavaScript 모듈

#### 앱 객체 구조
```javascript
var app = {
    config: {
        courseId: int,
        activityId: int,
        userId: int,
        problemCount: int,
        difficulty: int,
        showThermometer: bool,
        apiEndpoint: string
    },
    problems: [],
    currentProblemIndex: 0,
    selectedRelation: null,
    confidenceLevel: 50,
    startTime: timestamp,
    responses: []
};
```

#### 주요 함수

1. **init()**: 앱 초기화
2. **loadProblems()**: 문제 불러오기
3. **showProblem(index)**: 문제 표시
4. **submitResponse()**: 응답 제출
5. **updateThermometer()**: 온도계 업데이트
6. **showFeedback()**: 피드백 표시
7. **showResults()**: 최종 결과

### CSS 컴포넌트

#### 1. 스마트폰 프레임
```css
.smartphone-frame {
    position: fixed;
    bottom: 20px;
    right: 20px;
    width: 360px;
    height: 640px;
    border-radius: 36px;
    background: #1a1a1a;
}
```

#### 2. 온도계
```css
.thermometer {
    width: 60px;
    height: 300px;
    background: linear-gradient(to top, #e0e0e0, #e0e0e0);
    border-radius: 30px;
}

.thermometer-fill {
    height: 0%;  /* JavaScript로 제어 */
    background: linear-gradient(to top, #0066FF, #FF6600);
    transition: height 0.5s ease-in-out;
}
```

## Moodle 플러그인 구조

### 필수 파일

```
mod_relationthermo/
├── version.php          # 플러그인 버전 정보
├── lib.php             # 핵심 함수
├── mod_form.php        # 활동 설정 폼
├── view.php            # 학생 뷰
├── api.php             # REST API
├── db/
│   ├── install.xml     # 데이터베이스 스키마
│   └── access.php      # 권한 정의
├── lang/
│   ├── en/
│   │   └── relationthermo.php
│   └── ko/
│       └── relationthermo.php
├── scripts/
│   └── app.js
└── styles/
    └── app.css
```

### Moodle API 사용

#### 1. 데이터베이스 접근
```php
global $DB;

// SELECT
$records = $DB->get_records('rt_problems', ['activity_id' => $id]);

// INSERT
$id = $DB->insert_record('rt_responses', $data);

// UPDATE
$DB->update_record('rt_progress', $data);

// DELETE
$DB->delete_records('rt_responses', ['id' => $id]);
```

#### 2. 권한 확인
```php
require_login($course, true, $cm);
$context = context_module::instance($cm->id);
require_capability('mod/relationthermo:submit', $context);
```

#### 3. 성적 업데이트
```php
grade_update(
    'mod/relationthermo',
    $course->id,
    'mod',
    'relationthermo',
    $activity->id,
    0,
    $grades,
    $params
);
```

## 알고리즘

### 집합 관계 판별

```php
function determine_relation($set_a, $set_b) {
    $a = json_decode($set_a);
    $b = json_decode($set_b);

    $intersection = array_intersect($a, $b);

    // 같음
    if (count($a) == count($b) &&
        count($intersection) == count($a)) {
        return 'equal';
    }

    // 부분집합
    if (count($intersection) == count($a) &&
        count($a) < count($b)) {
        return 'subset';
    }

    // 초집합
    if (count($intersection) == count($b) &&
        count($b) < count($a)) {
        return 'superset';
    }

    // 서로소
    if (count($intersection) == 0) {
        return 'disjoint';
    }

    // 교집합 존재
    return 'intersect';
}
```

### 성적 계산

```php
function calculate_grade($responses) {
    $total = count($responses);
    $correct = array_filter($responses, function($r) {
        return $r->is_correct;
    });

    $accuracy = (count($correct) / $total) * 100;

    // 확신도 보너스 (최대 10점)
    $avg_confidence = array_sum(array_map(function($r) {
        return $r->confidence_level;
    }, $responses)) / $total;

    $confidence_bonus = ($avg_confidence / 100) * 10;

    return min(100, $accuracy + $confidence_bonus);
}
```

## 성능 최적화

### 1. 데이터베이스 인덱스
```sql
CREATE INDEX idx_activity ON rt_problems(moodle_activity_id);
CREATE INDEX idx_user_problem ON rt_responses(user_id, problem_id);
CREATE INDEX idx_user_course ON rt_progress(user_id, moodle_course_id);
```

### 2. 쿼리 최적화
```php
// 나쁜 예: N+1 문제
foreach ($problems as $problem) {
    $responses = $DB->get_records('rt_responses', ['problem_id' => $problem->id]);
}

// 좋은 예: JOIN 사용
$sql = "SELECT p.*, r.user_id, r.is_correct
        FROM {rt_problems} p
        LEFT JOIN {rt_responses} r ON p.id = r.problem_id
        WHERE p.activity_id = :activity_id";
```

### 3. 프론트엔드 캐싱
```javascript
// 문제 데이터를 로컬에 저장
sessionStorage.setItem('problems', JSON.stringify(problems));

// 재사용
var cached = JSON.parse(sessionStorage.getItem('problems'));
```

## 보안

### 1. SQL 인젝션 방지
```php
// Moodle DB API 사용 (자동 이스케이프)
$DB->get_records('rt_problems', ['id' => $id]);
```

### 2. XSS 방지
```php
// 출력 시 이스케이프
echo format_string($problem->title);
echo format_text($problem->description);
```

### 3. CSRF 방지
```php
// Moodle 세션 확인
require_sesskey();
```

### 4. 권한 확인
```php
require_capability('mod/relationthermo:submit', $context);
```

## 테스트

### 1. 단위 테스트 (PHPUnit)
```php
class relationthermo_test extends advanced_testcase {
    public function test_calculate_grade() {
        $this->resetAfterTest(true);

        $responses = [
            (object)['is_correct' => true, 'confidence_level' => 80],
            (object)['is_correct' => false, 'confidence_level' => 50],
        ];

        $grade = calculate_grade($responses);
        $this->assertEquals(60, $grade); // 50% + 10% bonus
    }
}
```

### 2. 통합 테스트
```bash
# Behat 시나리오
Feature: Relation Thermo Activity
  Scenario: Student completes activity
    Given I am logged in as "student1"
    And I am on "Course 1" course homepage
    When I follow "Relation Thermo"
    And I select "subset" relation
    And I set confidence to "85"
    And I press "Submit"
    Then I should see "Correct!"
```

## 배포

### 1. 버전 관리
```php
// version.php
$plugin->version   = 2025011801; // 날짜 + 일련번호
$plugin->requires  = 2017051500; // Moodle 3.3
$plugin->maturity  = MATURITY_STABLE;
$plugin->release   = 'v1.0.1';
```

### 2. 업그레이드 스크립트
```php
// db/upgrade.php
function xmldb_relationthermo_upgrade($oldversion) {
    global $DB;
    $dbman = $DB->get_manager();

    if ($oldversion < 2025011801) {
        // 새 테이블 추가
        $table = new xmldb_table('rt_settings');
        // ...
        $dbman->create_table($table);

        upgrade_mod_savepoint(true, 2025011801, 'relationthermo');
    }

    return true;
}
```

## 문제 해결

### 디버깅 활성화
```php
// config.php에 추가
$CFG->debug = E_ALL;
$CFG->debugdisplay = 1;
```

### 로그 확인
```php
// 커스텀 로그
debugging('Problem ID: ' . $problem->id, DEBUG_DEVELOPER);

// 이벤트 로그
\mod_relationthermo\event\response_submitted::create([
    'context' => $context,
    'objectid' => $response->id,
])->trigger();
```

## 확장성

### 1. 새로운 관계 타입 추가
```php
// lib.php에서 ENUM 확장
ALTER TABLE rt_problems
MODIFY relation_type ENUM(
    'subset', 'superset', 'equal',
    'disjoint', 'intersect',
    'proper_subset'  // 새로 추가
);
```

### 2. 다국어 지원
```php
// lang/ko/relationthermo.php
$string['relation_proper_subset'] = '진부분집합 (A ⊂ B)';
```

### 3. 플러그인 확장
- 블록 플러그인: 대시보드 위젯
- 리포트 플러그인: 상세 분석
- 퀴즈 질문 타입: 기존 퀴즈 통합

---

**버전**: 1.0.0
**작성일**: 2025-01-18
**작성자**: KAIST Touch Math Academy
