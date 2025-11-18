# Moodle 3.7 연동 가이드

Solid Spin Viewer를 Moodle 3.7 LMS와 연동하는 방법을 안내합니다.

## 연동 방법

### 방법 1: iframe 임베드 (간단)

Moodle 문제 또는 페이지에 iframe으로 직접 삽입:

```html
<iframe
    src="https://your-domain.com/solid-spin-viewer/public/?question_id={question_id}&user_id={user_id}&session_token={sesskey}"
    width="100%"
    height="800px"
    frameborder="0"
    allowfullscreen>
</iframe>
```

#### Moodle 변수 사용

```php
// Moodle 페이지에서
global $USER, $DB;

$question_id = required_param('qid', PARAM_INT);
$viewer_url = new moodle_url('https://your-domain.com/solid-spin-viewer/public/', [
    'question_id' => $question_id,
    'user_id' => $USER->id,
    'session_token' => sesskey()
]);

echo html_writer::tag('iframe', '', [
    'src' => $viewer_url->out(false),
    'width' => '100%',
    'height' => '800px',
    'frameborder' => '0'
]);
```

### 방법 2: Moodle 활동 플러그인 (권장)

완전한 Moodle 통합을 위한 활동 모듈 생성:

#### 1. 플러그인 구조 생성

```bash
mkdir -p /var/www/html/moodle/mod/solidviewer
cd /var/www/html/moodle/mod/solidviewer
```

#### 2. version.php

```php
<?php
defined('MOODLE_INTERNAL') || die();

$plugin->component = 'mod_solidviewer';
$plugin->version = 2025111800;
$plugin->requires = 2019052000; // Moodle 3.7
$plugin->maturity = MATURITY_STABLE;
$plugin->release = '1.0.0';
```

#### 3. lib.php

```php
<?php
defined('MOODLE_INTERNAL') || die();

define('SOLIDVIEWER_BASE_URL', 'https://your-domain.com/solid-spin-viewer/public/');

function solidviewer_add_instance($data) {
    global $DB;
    $data->timecreated = time();
    $data->timemodified = time();
    return $DB->insert_record('solidviewer', $data);
}

function solidviewer_update_instance($data) {
    global $DB;
    $data->timemodified = time();
    $data->id = $data->instance;
    return $DB->update_record('solidviewer', $data);
}

function solidviewer_delete_instance($id) {
    global $DB;
    return $DB->delete_records('solidviewer', ['id' => $id]);
}
```

#### 4. view.php

```php
<?php
require_once('../../config.php');
require_once('lib.php');

$id = required_param('id', PARAM_INT); // Course module ID

$cm = get_coursemodule_from_id('solidviewer', $id, 0, false, MUST_EXIST);
$course = $DB->get_record('course', ['id' => $cm->course], '*', MUST_EXIST);
$solidviewer = $DB->get_record('solidviewer', ['id' => $cm->instance], '*', MUST_EXIST);

require_login($course, true, $cm);
$context = context_module::instance($cm->id);

// Log view
$event = \mod_solidviewer\event\course_module_viewed::create([
    'objectid' => $solidviewer->id,
    'context' => $context,
]);
$event->add_record_snapshot('course', $course);
$event->add_record_snapshot('solidviewer', $solidviewer);
$event->trigger();

// Page setup
$PAGE->set_url('/mod/solidviewer/view.php', ['id' => $cm->id]);
$PAGE->set_title($solidviewer->name);
$PAGE->set_heading($course->fullname);

// Output
echo $OUTPUT->header();
echo $OUTPUT->heading($solidviewer->name);

// Embed viewer
$viewer_params = [
    'question_id' => $solidviewer->question_id,
    'user_id' => $USER->id,
    'session_token' => sesskey()
];
$viewer_url = new moodle_url(SOLIDVIEWER_BASE_URL, $viewer_params);

echo html_writer::start_tag('div', ['class' => 'solidviewer-container']);
echo html_writer::tag('iframe', '', [
    'src' => $viewer_url->out(false),
    'width' => '100%',
    'height' => '800px',
    'frameborder' => '0',
    'class' => 'solidviewer-iframe'
]);
echo html_writer::end_tag('div');

echo $OUTPUT->footer();
```

#### 5. mod_form.php

```php
<?php
defined('MOODLE_INTERNAL') || die();

require_once($CFG->dirroot.'/course/moodleform_mod.php');

class mod_solidviewer_mod_form extends moodleform_mod {
    public function definition() {
        $mform = $this->_form;

        // General
        $mform->addElement('header', 'general', get_string('general', 'form'));

        $mform->addElement('text', 'name', get_string('name'), ['size' => '64']);
        $mform->setType('name', PARAM_TEXT);
        $mform->addRule('name', null, 'required', null, 'client');

        $mform->addElement('text', 'question_id', 'Question ID', ['size' => '10']);
        $mform->setType('question_id', PARAM_INT);
        $mform->addRule('question_id', null, 'required', null, 'client');
        $mform->addHelpButton('question_id', 'question_id', 'mod_solidviewer');

        $this->standard_intro_elements();
        $this->standard_coursemodule_elements();
        $this->add_action_buttons();
    }
}
```

#### 6. db/install.xml

```xml
<?xml version="1.0" encoding="UTF-8" ?>
<XMLDB PATH="mod/solidviewer/db" VERSION="20251118" COMMENT="Solid Viewer module database">
  <TABLES>
    <TABLE NAME="solidviewer" COMMENT="Stores solid viewer activities">
      <FIELDS>
        <FIELD NAME="id" TYPE="int" LENGTH="10" NOTNULL="true" SEQUENCE="true"/>
        <FIELD NAME="course" TYPE="int" LENGTH="10" NOTNULL="true" DEFAULT="0" SEQUENCE="false"/>
        <FIELD NAME="name" TYPE="char" LENGTH="255" NOTNULL="true" SEQUENCE="false"/>
        <FIELD NAME="intro" TYPE="text" NOTNULL="false" SEQUENCE="false"/>
        <FIELD NAME="introformat" TYPE="int" LENGTH="4" NOTNULL="true" DEFAULT="0" SEQUENCE="false"/>
        <FIELD NAME="question_id" TYPE="int" LENGTH="10" NOTNULL="true" SEQUENCE="false"/>
        <FIELD NAME="timecreated" TYPE="int" LENGTH="10" NOTNULL="true" DEFAULT="0" SEQUENCE="false"/>
        <FIELD NAME="timemodified" TYPE="int" LENGTH="10" NOTNULL="true" DEFAULT="0" SEQUENCE="false"/>
      </FIELDS>
      <KEYS>
        <KEY NAME="primary" TYPE="primary" FIELDS="id"/>
      </KEYS>
      <INDEXES>
        <INDEX NAME="course" UNIQUE="false" FIELDS="course"/>
      </INDEXES>
    </TABLE>
  </TABLES>
</XMLDB>
```

#### 7. 플러그인 설치

```bash
# Moodle 관리자로 로그인
# Site administration > Notifications 페이지 방문
# 플러그인 설치 확인
```

### 방법 3: 문제 유형 플러그인

3D 입체도형 문제 전용 문제 유형 생성:

```bash
mkdir -p /var/www/html/moodle/question/type/solid3d
```

#### question.php

```php
<?php
class qtype_solid3d_question extends question_graded_automatically {
    public $shape_id;
    public $question_text;

    public function get_expected_data() {
        return ['answer' => PARAM_RAW];
    }

    public function summarise_response(array $response) {
        if (isset($response['answer'])) {
            return $response['answer'];
        }
        return null;
    }

    public function is_complete_response(array $response) {
        return !empty($response['answer']);
    }

    public function get_validation_error(array $response) {
        if ($this->is_gradable_response($response)) {
            return '';
        }
        return get_string('pleaseenterananswer', 'qtype_solid3d');
    }

    public function is_same_response(array $prevresponse, array $newresponse) {
        return question_utils::arrays_same_at_key_missing_is_blank(
            $prevresponse, $newresponse, 'answer');
    }

    public function get_correct_response() {
        return ['answer' => $this->rightanswer];
    }

    public function grade_response(array $response) {
        if (isset($response['answer']) && $response['answer'] == $this->rightanswer) {
            return [1, question_state::$gradedright];
        }
        return [0, question_state::$gradedwrong];
    }
}
```

## 데이터베이스 연동

### Solid Spin Viewer에서 Moodle 데이터 접근

`includes/moodle_api.php`에서 제공하는 메서드:

```php
$moodleAPI = new MoodleAPI();

// 문제 정보 가져오기
$question = $moodleAPI->getQuestion($question_id);

// 사용자 정보 가져오기
$user = $moodleAPI->getUser($user_id);

// 세션 검증
$user_id = $moodleAPI->verifySessionToken($session_token);

// 활동 로그
$moodleAPI->logActivity($user_id, 'viewed', $question_id, 'question');
```

### Moodle에서 Solid Spin Viewer 데이터 접근

```php
// Moodle에서 외부 데이터베이스 연결
$external_db = moodle_database::get_driver_instance('mysqli', 'native');
$external_db->connect(
    'solid_viewer_host',
    'solid_viewer_user',
    'solid_viewer_pass',
    'solid_spin_viewer',
    ''
);

// 사용자 상호작용 기록 조회
$sql = "SELECT * FROM user_interactions WHERE moodle_user_id = ? ORDER BY created_at DESC";
$interactions = $external_db->get_records_sql($sql, [$USER->id]);
```

## SSO (Single Sign-On) 연동

### Moodle 세션을 Solid Spin Viewer에 전달

```php
// Moodle에서
$session_token = sesskey();
$encrypted_token = encrypt_session_token($session_token, $USER->id);

// URL에 암호화된 토큰 전달
$url = new moodle_url(SOLIDVIEWER_BASE_URL, [
    'question_id' => $qid,
    'token' => $encrypted_token
]);
```

### Solid Spin Viewer에서 세션 검증

```php
// includes/moodle_api.php에 추가
public function verifyEncryptedToken($encrypted_token) {
    // 토큰 복호화 및 검증
    $decrypted = decrypt_token($encrypted_token);
    return $this->verifySessionToken($decrypted);
}
```

## CORS 설정

Moodle과 Solid Spin Viewer가 다른 도메인인 경우:

### Apache (.htaccess)

```apache
<IfModule mod_headers.c>
    Header set Access-Control-Allow-Origin "https://your-moodle-domain.com"
    Header set Access-Control-Allow-Methods "GET, POST, OPTIONS"
    Header set Access-Control-Allow-Headers "Content-Type, Authorization"
    Header set Access-Control-Allow-Credentials "true"
</IfModule>
```

### Nginx

```nginx
location /solid-spin-viewer {
    add_header Access-Control-Allow-Origin "https://your-moodle-domain.com";
    add_header Access-Control-Allow-Methods "GET, POST, OPTIONS";
    add_header Access-Control-Allow-Headers "Content-Type, Authorization";
    add_header Access-Control-Allow-Credentials "true";
}
```

## 문제 매핑 생성

Moodle 문제와 3D 도형 연결:

```sql
-- Moodle 문제 ID 123을 정육면체(shape_id=1)와 연결
INSERT INTO moodle_questions
(moodle_question_id, solid_shape_id, question_type, rotation_enabled, auto_rotate, rotation_speed)
VALUES
(123, 1, 'identify', 1, 1, 0.01);
```

또는 PHP 스크립트:

```php
<?php
require_once('config/database.php');
require_once('includes/db.php');

$db = Database::getInstance();

$sql = "INSERT INTO moodle_questions
        (moodle_question_id, solid_shape_id, question_type, rotation_enabled, auto_rotate)
        VALUES (:moodle_qid, :shape_id, :type, :rotation, :auto_rotate)";

$db->execute($sql, [
    ':moodle_qid' => 123,
    ':shape_id' => 1,
    ':type' => 'identify',
    ':rotation' => 1,
    ':auto_rotate' => 1
]);
```

## 학습 분석 연동

Moodle의 학습 분석(Learning Analytics)과 통합:

```php
// Solid Spin Viewer 상호작용 데이터를 Moodle 로그로 전송
function sync_interactions_to_moodle($user_id) {
    global $DB;

    $api_url = "https://your-domain.com/solid-spin-viewer/api/get_interactions.php";
    $response = file_get_contents($api_url . "?user_id=" . $user_id);
    $data = json_decode($response, true);

    foreach ($data['interactions'] as $interaction) {
        // Moodle 로그에 기록
        $event = \core\event\user_graded::create([
            'objectid' => $interaction['question_id'],
            'context' => context_user::instance($user_id),
            'other' => [
                'interaction_type' => $interaction['interaction_type'],
                'time_spent' => $interaction['time_spent_seconds']
            ]
        ]);
        $event->trigger();
    }
}
```

## 문제 해결

### 세션 공유 문제

Moodle과 Solid Spin Viewer가 세션을 공유하지 못하는 경우:

```php
// Moodle config.php
$CFG->sessioncookiedomain = '.your-domain.com';
$CFG->sessioncookiepath = '/';
```

### iframe 로딩 문제

X-Frame-Options 헤더 설정:

```apache
# Solid Spin Viewer .htaccess
Header set X-Frame-Options "ALLOW-FROM https://your-moodle-domain.com"
```

또는:

```apache
Header set Content-Security-Policy "frame-ancestors 'self' https://your-moodle-domain.com"
```

## 참고 자료

- [Moodle Plugin Development](https://docs.moodle.org/dev/Main_Page)
- [Moodle Question Types](https://docs.moodle.org/dev/Question_types)
- [Moodle Activity Modules](https://docs.moodle.org/dev/Activity_modules)
