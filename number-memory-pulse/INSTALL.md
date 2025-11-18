# Number Memory Pulse - Installation Guide

이 가이드는 Number Memory Pulse를 Moodle 3.7 환경에 설치하는 상세한 방법을 제공합니다.

## 사전 요구사항 체크리스트

설치를 시작하기 전에 다음 사항을 확인하세요:

- [ ] Moodle 3.7 이상이 설치되어 있음
- [ ] MySQL 5.7 이상이 설치되어 있음
- [ ] PHP 7.1.9 이상이 설치되어 있음
- [ ] Moodle 관리자 권한이 있음
- [ ] 데이터베이스 접근 권한이 있음
- [ ] 서버 파일 시스템 쓰기 권한이 있음

## 설치 방법

### 방법 1: Moodle 활동 모듈로 설치 (권장)

#### 1단계: 파일 업로드

1. Number Memory Pulse 파일들을 다운로드합니다
2. Moodle 서버에 접속합니다 (FTP, SSH, 또는 파일 관리자 사용)
3. 다음 경로에 파일을 업로드합니다:
   ```
   /path/to/moodle/mod/numbermemorypulse/
   ```

폴더 구조는 다음과 같아야 합니다:
```
moodle/
└── mod/
    └── numbermemorypulse/
        ├── index.html
        ├── version.php (아래 코드 참조)
        ├── lib.php (아래 코드 참조)
        ├── view.php (아래 코드 참조)
        ├── css/
        │   ├── smartphone.css
        │   └── game.css
        ├── js/
        │   ├── config.js
        │   ├── moodle-api.js
        │   ├── game-engine.js
        │   ├── ui-controller.js
        │   └── main.js
        ├── php/
        │   ├── config.php
        │   ├── api.php
        │   └── game-functions.php
        └── sql/
            └── schema.sql
```

#### 2단계: Moodle 모듈 파일 생성

**version.php** 생성:
```php
<?php
defined('MOODLE_INTERNAL') || die();

$plugin->component = 'mod_numbermemorypulse';
$plugin->version = 2025111800;
$plugin->requires = 2019052000; // Moodle 3.7
$plugin->maturity = MATURITY_STABLE;
$plugin->release = 'v1.0.0';
```

**lib.php** 생성:
```php
<?php
defined('MOODLE_INTERNAL') || die();

function numbermemorypulse_add_instance($data) {
    global $DB;
    $data->timecreated = time();
    $data->timemodified = time();
    return $DB->insert_record('numbermemorypulse', $data);
}

function numbermemorypulse_update_instance($data) {
    global $DB;
    $data->timemodified = time();
    $data->id = $data->instance;
    return $DB->update_record('numbermemorypulse', $data);
}

function numbermemorypulse_delete_instance($id) {
    global $DB;
    return $DB->delete_records('numbermemorypulse', array('id' => $id));
}
```

**view.php** 생성:
```php
<?php
require_once(__DIR__ . '/../../config.php');
require_once(__DIR__ . '/lib.php');

$id = required_param('id', PARAM_INT);
$cm = get_coursemodule_from_id('numbermemorypulse', $id, 0, false, MUST_EXIST);
$course = $DB->get_record('course', array('id' => $cm->course), '*', MUST_EXIST);

require_login($course, true, $cm);

$PAGE->set_url('/mod/numbermemorypulse/view.php', array('id' => $cm->id));
$PAGE->set_title($course->shortname . ': Number Memory Pulse');
$PAGE->set_heading($course->fullname);

echo $OUTPUT->header();

// Include the game HTML
include(__DIR__ . '/index.html');

echo $OUTPUT->footer();
```

#### 3단계: 데이터베이스 설치

1. **phpMyAdmin 사용 방법**:
   - phpMyAdmin에 로그인
   - Moodle 데이터베이스 선택
   - 'SQL' 탭 클릭
   - `sql/schema.sql` 파일의 내용을 복사하여 붙여넣기
   - '실행' 클릭

2. **MySQL 명령줄 사용 방법**:
   ```bash
   mysql -u [username] -p [moodle_database] < sql/schema.sql
   ```

3. **테이블 생성 확인**:
   ```sql
   SHOW TABLES LIKE 'mdl_nmp_%';
   ```

   다음 테이블들이 보여야 합니다:
   - mdl_nmp_problems
   - mdl_nmp_user_attempts
   - mdl_nmp_user_progress
   - mdl_nmp_leaderboard
   - mdl_nmp_settings

#### 4단계: Moodle 플러그인 설치

1. Moodle에 관리자로 로그인
2. **사이트 관리 → 알림** 으로 이동
3. Moodle이 새 플러그인을 감지하고 설치 프로세스를 시작합니다
4. '플러그인 설치' 버튼 클릭
5. 설치 완료 확인

#### 5단계: 코스에 활동 추가

1. 원하는 코스로 이동
2. '편집 모드 켜기' 클릭
3. 활동 추가하려는 섹션에서 '활동 또는 리소스 추가' 클릭
4. 'Number Memory Pulse' 선택
5. 설정 구성:
   - 이름: "숫자 기억력 훈련"
   - 설명: 원하는 설명 입력
   - 기타 설정 구성
6. '저장하고 돌아가기' 클릭

### 방법 2: 블록으로 설치

가상 스마트폰을 모든 페이지에 표시하려면 블록으로 설치할 수 있습니다.

#### 1단계: 블록 폴더 생성

```bash
mkdir -p /path/to/moodle/blocks/numbermemorypulse
```

#### 2단계: 블록 파일 생성

**block_numbermemorypulse.php**:
```php
<?php
class block_numbermemorypulse extends block_base {
    public function init() {
        $this->title = get_string('pluginname', 'block_numbermemorypulse');
    }

    public function get_content() {
        if ($this->content !== null) {
            return $this->content;
        }

        $this->content = new stdClass;
        $this->content->text = '';
        $this->content->footer = '';

        // Include CSS
        global $PAGE;
        $PAGE->requires->css('/blocks/numbermemorypulse/css/smartphone.css');
        $PAGE->requires->css('/blocks/numbermemorypulse/css/game.css');

        // Include JS
        $PAGE->requires->js('/blocks/numbermemorypulse/js/config.js', true);
        $PAGE->requires->js('/blocks/numbermemorypulse/js/moodle-api.js', true);
        $PAGE->requires->js('/blocks/numbermemorypulse/js/game-engine.js', true);
        $PAGE->requires->js('/blocks/numbermemorypulse/js/ui-controller.js', true);
        $PAGE->requires->js('/blocks/numbermemorypulse/js/main.js', true);

        // Include HTML
        ob_start();
        include(__DIR__ . '/index.html');
        $this->content->text = ob_get_clean();

        return $this->content;
    }
}
```

#### 3단계: 블록 설치

1. Moodle에 관리자로 로그인
2. **사이트 관리 → 알림**
3. 블록 설치 진행

### 방법 3: 테마에 직접 통합

모든 페이지의 하단에 항상 표시하려면:

#### 테마 레이아웃 파일 수정

테마의 `layout` 파일 (예: `theme/yourtheme/layout/columns2.php`)을 수정:

```php
// Footer 영역 직전에 추가
echo '<link rel="stylesheet" href="' . $CFG->wwwroot . '/local/numbermemorypulse/css/smartphone.css">';
echo '<link rel="stylesheet" href="' . $CFG->wwwroot . '/local/numbermemorypulse/css/game.css">';

include($CFG->dirroot . '/local/numbermemorypulse/index.html');

echo '<script src="' . $CFG->wwwroot . '/local/numbermemorypulse/js/config.js"></script>';
echo '<script src="' . $CFG->wwwroot . '/local/numbermemorypulse/js/moodle-api.js"></script>';
echo '<script src="' . $CFG->wwwroot . '/local/numbermemorypulse/js/game-engine.js"></script>';
echo '<script src="' . $CFG->wwwroot . '/local/numbermemorypulse/js/ui-controller.js"></script>';
echo '<script src="' . $CFG->wwwroot . '/local/numbermemorypulse/js/main.js"></script>';
```

## 설치 후 구성

### 기본 설정 확인

1. 데이터베이스에서 기본 설정 확인:
   ```sql
   SELECT * FROM mdl_nmp_settings WHERE course_id = 1;
   ```

2. 필요시 설정 조정:
   ```sql
   UPDATE mdl_nmp_settings
   SET setting_value = '2000'
   WHERE setting_name = 'default_display_duration';
   ```

### 샘플 문제 생성

데이터베이스에 이미 샘플 문제가 포함되어 있습니다. 추가 문제를 생성하려면:

```php
require_once($CFG->dirroot . '/mod/numbermemorypulse/php/game-functions.php');

nmp_create_problem([
    'course_id' => 1,
    'name' => 'Custom Pattern',
    'description' => '나만의 패턴',
    'pattern' => '13579',
    'difficulty_level' => 2
]);
```

## 테스트

### 기본 기능 테스트

1. **학생 계정으로 로그인**
2. **앱이 우측 하단에 표시되는지 확인**
3. **'시작하기' 버튼 클릭**
4. **숫자 패턴이 표시되는지 확인**
5. **숫자 입력 및 제출**
6. **결과가 올바르게 표시되는지 확인**
7. **점수와 레벨이 업데이트되는지 확인**

### API 테스트

브라우저 콘솔에서:
```javascript
// 문제 가져오기 테스트
fetch('/mod/numbermemorypulse/php/api.php?action=get_problem&difficulty=1')
    .then(r => r.json())
    .then(console.log);

// 진행 상황 테스트
fetch('/mod/numbermemorypulse/php/api.php?action=get_progress')
    .then(r => r.json())
    .then(console.log);
```

## 문제 해결

### 앱이 표시되지 않음

1. **브라우저 콘솔 확인**:
   - F12 키를 눌러 개발자 도구 열기
   - Console 탭에서 오류 확인

2. **파일 경로 확인**:
   ```bash
   ls -la /path/to/moodle/mod/numbermemorypulse/
   ```

3. **권한 확인**:
   ```bash
   chmod 755 /path/to/moodle/mod/numbermemorypulse/
   chmod 644 /path/to/moodle/mod/numbermemorypulse/*
   ```

### 데이터베이스 오류

1. **테이블 존재 확인**:
   ```sql
   SHOW TABLES LIKE 'mdl_nmp_%';
   ```

2. **Moodle prefix 확인**:
   ```php
   // config.php에서 확인
   $CFG->prefix = 'mdl_';  // 이것이 맞는지 확인
   ```

3. **테이블 재생성**:
   ```sql
   DROP TABLE IF EXISTS mdl_nmp_problems;
   DROP TABLE IF EXISTS mdl_nmp_user_attempts;
   -- ... 다른 테이블들도 삭제
   -- 그 다음 schema.sql 다시 실행
   ```

### API 응답 없음

1. **PHP 오류 로그 확인**:
   ```bash
   tail -f /var/log/apache2/error.log
   ```

2. **Moodle 디버그 모드 활성화**:
   - 사이트 관리 → 개발 → 디버깅
   - 디버그 메시지: '개발자'로 설정
   - 디버그 메시지 표시: 체크

3. **API 파일 권한 확인**:
   ```bash
   chmod 644 /path/to/moodle/mod/numbermemorypulse/php/*.php
   ```

### 성능 문제

1. **데이터베이스 인덱스 확인**:
   ```sql
   SHOW INDEX FROM mdl_nmp_user_attempts;
   ```

2. **캐시 활성화**:
   - 사이트 관리 → 플러그인 → 캐싱
   - 캐시 정의 확인

3. **리더보드 갱신 최적화**:
   ```php
   // Cron job으로 주기적 업데이트
   // 매 요청마다 업데이트하지 않도록 설정
   ```

## 업그레이드

새 버전으로 업그레이드하려면:

1. **백업 생성**:
   ```bash
   mysqldump -u root -p moodle_db > backup_$(date +%Y%m%d).sql
   cp -r /path/to/moodle/mod/numbermemorypulse /path/to/backup/
   ```

2. **새 파일 업로드**:
   - 기존 파일 덮어쓰기
   - version.php의 버전 번호 증가

3. **데이터베이스 업데이트**:
   - 사이트 관리 → 알림
   - 업그레이드 스크립트 실행

## 제거

앱을 완전히 제거하려면:

1. **Moodle 관리 페이지에서 제거**:
   - 사이트 관리 → 플러그인 → 활동 모듈
   - Number Memory Pulse 찾기
   - '제거' 클릭

2. **파일 삭제**:
   ```bash
   rm -rf /path/to/moodle/mod/numbermemorypulse
   ```

3. **데이터베이스 테이블 삭제** (선택사항):
   ```sql
   DROP TABLE mdl_nmp_problems;
   DROP TABLE mdl_nmp_user_attempts;
   DROP TABLE mdl_nmp_user_progress;
   DROP TABLE mdl_nmp_leaderboard;
   DROP TABLE mdl_nmp_settings;
   ```

## 지원

문제가 지속되면:
1. Moodle 로그 확인
2. PHP 오류 로그 확인
3. 브라우저 콘솔 확인
4. README.md의 문제 해결 섹션 참조

---

**설치 완료!** 이제 Number Memory Pulse를 사용할 준비가 되었습니다. 🎉
