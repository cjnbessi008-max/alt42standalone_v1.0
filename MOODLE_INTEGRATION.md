# Moodle 연동 가이드

Reverse Bloom 앱을 Moodle 3.7에 통합하는 방법을 설명합니다.

## 연동 방법

### 방법 1: iframe 임베드 (권장)

Moodle 페이지나 활동에 iframe으로 Reverse Bloom을 임베드합니다.

#### Moodle HTML 블록에 추가

1. Moodle 코스 페이지 편집 모드 활성화
2. "블록 추가" → "HTML" 선택
3. HTML 블록 설정에 다음 코드 입력:

```html
<div style="position: relative; width: 100%; height: 800px;">
    <iframe
        src="https://your-domain.com/reversebloom/embed.php"
        style="width: 100%; height: 100%; border: none; border-radius: 10px; box-shadow: 0 4px 20px rgba(0,0,0,0.1);"
        allow="fullscreen"
        title="Reverse Bloom Learning System">
    </iframe>
</div>
```

#### Moodle 활동 설명에 추가

1. 활동 편집 → 설명(Description) 필드
2. HTML 모드로 전환
3. 위의 iframe 코드 삽입

#### 우측 하단 플로팅 버전

Moodle 테마에 다음 코드를 추가하여 모든 페이지에서 사용 가능:

```html
<!-- Moodle 테마 footer.php 또는 header.php에 추가 -->
<iframe
    src="https://your-domain.com/reversebloom/index.php"
    style="position: fixed; bottom: 0; right: 0; width: 400px; height: 750px; border: none; z-index: 9999; pointer-events: none;"
    id="reverse-bloom-widget"
    scrolling="no">
</iframe>

<script>
// iframe 내부 요소만 클릭 가능하도록 설정
document.getElementById('reverse-bloom-widget').style.pointerEvents = 'all';
</script>
```

### 방법 2: Moodle 플러그인 개발 (고급)

완전히 통합된 플러그인으로 개발하려면:

#### 플러그인 구조

```
moodle/mod/reversebloom/
├── version.php          # 플러그인 버전 정보
├── db/
│   ├── install.xml      # 데이터베이스 스키마
│   └── access.php       # 권한 설정
├── lang/
│   ├── en/
│   │   └── reversebloom.php
│   └── ko/
│       └── reversebloom.php
├── view.php             # 메인 뷰
├── lib.php              # 필수 함수
└── index.php            # 코스 인스턴스 목록
```

#### version.php

```php
<?php
defined('MOODLE_INTERNAL') || die();

$plugin->component = 'mod_reversebloom';
$plugin->version = 2025011800;
$plugin->requires = 2019052000; // Moodle 3.7
$plugin->maturity = MATURITY_STABLE;
$plugin->release = 'v1.0';
```

#### lib.php (필수 함수)

```php
<?php
function reversebloom_add_instance($data) {
    global $DB;
    $data->timecreated = time();
    return $DB->insert_record('reversebloom', $data);
}

function reversebloom_update_instance($data) {
    global $DB;
    $data->timemodified = time();
    $data->id = $data->instance;
    return $DB->update_record('reversebloom', $data);
}

function reversebloom_delete_instance($id) {
    global $DB;
    return $DB->delete_records('reversebloom', array('id' => $id));
}
```

#### view.php

```php
<?php
require_once('../../config.php');

$id = required_param('id', PARAM_INT); // Course Module ID

$cm = get_coursemodule_from_id('reversebloom', $id, 0, false, MUST_EXIST);
$course = $DB->get_record('course', array('id' => $cm->course), '*', MUST_EXIST);

require_login($course, true, $cm);

$PAGE->set_url('/mod/reversebloom/view.php', array('id' => $cm->id));
$PAGE->set_title($course->fullname);
$PAGE->set_heading($course->fullname);

echo $OUTPUT->header();

// Reverse Bloom iframe 임베드
echo '<div style="width: 100%; height: 800px;">';
echo '<iframe src="' . new moodle_url('/path/to/reversebloom/embed.php') . '" ';
echo 'style="width: 100%; height: 100%; border: none;"></iframe>';
echo '</div>';

echo $OUTPUT->footer();
```

### 방법 3: External Tool (LTI) 연동

Moodle의 External Tool 기능을 사용하여 LTI로 연동:

1. Reverse Bloom에 LTI Provider 구현
2. Moodle에서 External Tool 활동 추가
3. LTI 설정 구성

#### LTI Provider 설정 (기본 예제)

```php
<?php
// lti_config.php
require_once(__DIR__ . '/../vendor/autoload.php');

use IMSGlobal\LTI;

$lti = LTI\LTI_Tool_Provider::fromReceivedRequest();

if ($lti->ok) {
    // 유효한 LTI 요청
    $user_id = $lti->user->getId();
    $context_id = $lti->context->getId();

    // Reverse Bloom 세션 초기화
    session_start();
    $_SESSION['lti_user'] = $user_id;
    $_SESSION['lti_context'] = $context_id;

    // Reverse Bloom 앱으로 리디렉션
    header('Location: embed.php');
    exit;
} else {
    die('Invalid LTI request');
}
```

## 데이터 공유

### Moodle 문제 뱅크 접근

Reverse Bloom은 다음 Moodle 테이블에 접근합니다:

```php
// Question Model에서 사용
$sql = "SELECT q.*, qc.name as categoryname
        FROM {$prefix}question q
        LEFT JOIN {$prefix}question_categories qc ON q.category = qc.id
        WHERE q.id = :id";
```

**보안 권장사항:**
- 읽기 전용(SELECT) 권한만 부여
- 별도의 DB 사용자 생성
- 네트워크 접근 제한

```sql
CREATE USER 'reversebloom'@'localhost' IDENTIFIED BY 'secure_password';
GRANT SELECT ON moodle.mdl_question TO 'reversebloom'@'localhost';
GRANT SELECT ON moodle.mdl_question_categories TO 'reversebloom'@'localhost';
GRANT SELECT ON moodle.mdl_question_answers TO 'reversebloom'@'localhost';
FLUSH PRIVILEGES;
```

### 학습 진도 동기화 (옵션)

Reverse Bloom의 학습 데이터를 Moodle에 저장하려면:

```php
// Save progress to Moodle custom table
function save_progress_to_moodle($user_id, $question_id, $level, $correct) {
    global $DB;

    $record = new stdClass();
    $record->userid = $user_id;
    $record->questionid = $question_id;
    $record->bloomlevel = $level;
    $record->iscorrect = $correct;
    $record->timecreated = time();

    $DB->insert_record('reversebloom_progress', $record);
}
```

## SSO 연동

### Moodle SSO를 통한 자동 로그인

```php
<?php
// sso.php - Reverse Bloom 앱에 추가
session_start();

// Moodle 세션 확인
require_once('/path/to/moodle/config.php');
require_login();

// 사용자 정보 가져오기
global $USER;

if (isloggedin() && !isguestuser()) {
    // Reverse Bloom 세션 생성
    $_SESSION['user_id'] = $USER->id;
    $_SESSION['user_name'] = fullname($USER);
    $_SESSION['user_email'] = $USER->email;

    // 앱으로 리디렉션
    header('Location: index.php');
} else {
    // Moodle 로그인 페이지로 리디렉션
    redirect($CFG->wwwroot . '/login/index.php');
}
```

## 테마 통합

Moodle 테마와 일관된 스타일 적용:

```css
/* Moodle 색상 변수 가져오기 */
:root {
    --moodle-primary: #0f6cbf;
    --moodle-secondary: #495057;
    --moodle-success: #28a745;
}

/* Reverse Bloom 버튼에 Moodle 색상 적용 */
.bloom-btn-next {
    background: var(--moodle-primary);
}

.bloom-btn-up {
    background: var(--moodle-success);
}
```

## 문제 카테고리 필터링

특정 Moodle 코스의 문제만 표시:

```php
// URL 파라미터로 카테고리 전달
// embed.php?category=123

$categoryId = isset($_GET['category']) ? intval($_GET['category']) : null;
```

```javascript
// JavaScript에서 처리
const urlParams = new URLSearchParams(window.location.search);
const categoryId = urlParams.get('category');

// API 호출 시 카테고리 포함
fetch(`api.php?action=random&category_id=${categoryId}`)
```

## iframe 통신 (고급)

부모 Moodle 페이지와 Reverse Bloom iframe 간 통신:

### 부모 페이지 (Moodle)

```javascript
// 메시지 수신
window.addEventListener('message', function(event) {
    if (event.origin !== 'https://your-reversebloom-domain.com') return;

    const data = event.data;

    if (data.type === 'QUESTION_ANSWERED') {
        console.log('학생이 정답을 맞췄습니다:', data.questionId);
        // Moodle gradebook 업데이트 등
    }
});
```

### Reverse Bloom iframe

```javascript
// 부모 페이지로 메시지 전송
function notifyParent(type, data) {
    window.parent.postMessage({
        type: type,
        ...data
    }, 'https://your-moodle-domain.com');
}

// 정답 제출 시
selectAnswer(element) {
    const isCorrect = parseFloat(element.dataset.fraction) === 1.0;

    if (isCorrect) {
        notifyParent('QUESTION_ANSWERED', {
            questionId: this.currentQuestion.id,
            level: this.currentLevel,
            correct: true
        });
    }
}
```

## 성능 최적화

### 캐싱

```php
// Moodle 캐시 사용
$cache = cache::make('mod_reversebloom', 'questions');

$questions = $cache->get('category_' . $categoryId);
if (!$questions) {
    $questions = $DB->get_records('question', ['category' => $categoryId]);
    $cache->set('category_' . $categoryId, $questions);
}
```

### CDN 사용

정적 파일(CSS, JS)을 CDN에서 제공:

```html
<link rel="stylesheet" href="https://cdn.example.com/reversebloom/smartphone.css">
<script src="https://cdn.example.com/reversebloom/reverse-bloom.js"></script>
```

## 문제 해결

### iframe이 로드되지 않음

1. **X-Frame-Options 헤더 확인**

```php
// Reverse Bloom에서 허용
header('X-Frame-Options: ALLOW-FROM https://your-moodle-domain.com');
// 또는
header('Content-Security-Policy: frame-ancestors https://your-moodle-domain.com');
```

2. **CORS 설정**

```php
header('Access-Control-Allow-Origin: https://your-moodle-domain.com');
header('Access-Control-Allow-Credentials: true');
```

### 세션 문제

iframe 내에서 쿠키가 작동하지 않을 수 있음 (SameSite 정책):

```php
// Reverse Bloom 세션 쿠키 설정
session_set_cookie_params([
    'lifetime' => 0,
    'path' => '/',
    'domain' => '.your-domain.com',
    'secure' => true,
    'httponly' => true,
    'samesite' => 'None' // iframe에서 작동하도록
]);
```

## 배포 체크리스트

- [ ] Moodle DB 연결 테스트 완료
- [ ] iframe 임베드 테스트 완료
- [ ] SSO 로그인 동작 확인
- [ ] 문제 카테고리 필터링 동작 확인
- [ ] 반응형 디자인 테스트 (모바일/태블릿/데스크톱)
- [ ] 보안 설정 (CORS, X-Frame-Options) 확인
- [ ] 성능 테스트 (동시 접속자 100명)
- [ ] 브라우저 호환성 테스트 (Chrome, Firefox, Safari, Edge)

---

**Moodle 연동 완료 후 학생들에게 혁신적인 Reverse Bloom 학습 경험을 제공하세요! 🎓✨**
