# Moodle 연동 가이드

이 문서는 Focus Highlights 시스템을 Moodle 3.7과 연동하는 방법을 상세히 설명합니다.

## 📋 사전 요구사항

- Moodle 3.7 이상
- 관리자 권한
- 웹 서버에 Focus Highlights 설치 완료

## 🔧 Moodle 웹 서비스 설정

### 1단계: 웹 서비스 활성화

1. Moodle에 관리자로 로그인
2. **사이트 관리 → 고급 기능**으로 이동
3. **웹 서비스 활성화** 체크박스 활성화
4. "변경사항 저장" 클릭

### 2단계: 웹 서비스 프로토콜 활성화

1. **사이트 관리 → 서버 → 웹 서비스 → 프로토콜 관리**
2. **REST 프로토콜** 활성화 (눈 아이콘 클릭)

### 3단계: 외부 서비스 생성

1. **사이트 관리 → 서버 → 웹 서비스 → 외부 서비스**
2. "추가" 클릭
3. 다음 정보 입력:
   - **이름**: Focus Highlights Service
   - **약어**: focus_highlights
   - **활성화**: 체크
   - **승인된 사용자만**: 선택 사항
   - **파일 다운로드**: 선택 사항

4. "외부 서비스 추가" 클릭
5. 생성된 서비스 옆의 "함수" 링크 클릭
6. 다음 함수들을 추가:

```
core_user_get_users_by_field
core_course_get_courses
core_course_get_contents
core_enrol_get_enrolled_users
mod_quiz_get_user_attempts
mod_assign_get_submissions
gradereport_user_get_grade_items
```

### 4단계: 웹 서비스 사용자 생성

#### 옵션 A: 새 사용자 생성 (권장)

1. **사이트 관리 → 사용자 → 계정 → 사용자 추가**
2. 사용자 정보 입력:
   - **사용자명**: focus_highlights_api
   - **비밀번호**: 강력한 비밀번호 생성
   - **이메일**: api@yourdomain.com

3. 역할 할당:
   - **사이트 관리 → 사용자 → 권한 → 역할 정의**
   - 새 역할 생성: "Web Service User"
   - 다음 권한 추가:
     - `webservice/rest:use`
     - `moodle/user:viewdetails`
     - `moodle/course:view`
     - `moodle/course:viewparticipants`

4. 사용자에게 역할 할당:
   - **사이트 관리 → 사용자 → 권한 → 시스템 역할 할당**
   - "Web Service User" 역할 선택
   - 생성한 사용자 추가

#### 옵션 B: 기존 관리자 사용

기존 관리자 계정을 사용할 수 있지만, 보안상 권장하지 않습니다.

### 5단계: 토큰 생성

1. **사이트 관리 → 서버 → 웹 서비스 → 토큰 관리**
2. "추가" 클릭
3. 정보 입력:
   - **사용자**: focus_highlights_api (또는 선택한 사용자)
   - **서비스**: Focus Highlights Service
   - **IP 제한**: 선택 사항 (보안 강화를 위해 서버 IP 입력)
   - **유효 기간**: 선택 사항

4. "변경사항 저장" 클릭
5. **생성된 토큰을 복사하여 안전하게 보관**

## 🔗 Focus Highlights 설정

### 토큰 등록

1. Focus Highlights 설치 마법사에서 토큰 입력, 또는
2. 데이터베이스에서 직접 업데이트:

```sql
UPDATE fh_config
SET config_value = 'YOUR_TOKEN_HERE'
WHERE config_key = 'moodle_token';

UPDATE fh_config
SET config_value = 'http://your-moodle-url'
WHERE config_key = 'moodle_url';
```

### 연결 테스트

```php
<?php
require_once 'includes/moodle_api.php';

$api = new MoodleAPI();

try {
    $courses = $api->getCourses();
    echo "연결 성공! " . count($courses) . "개 과목 발견\n";
    print_r($courses);
} catch (Exception $e) {
    echo "연결 실패: " . $e->getMessage() . "\n";
}
?>
```

## 📝 Moodle 테마에 추적 코드 추가

### 방법 1: 테마 레이아웃 수정 (전체 사이트)

파일: `theme/yourtheme/layout/includes/footer.php`

```php
<?php
// Focus Highlights Tracker Integration
if (isloggedin() && !isguestuser()) {
    global $USER, $COURSE, $cm;

    // 게스트가 아닌 로그인 사용자만 추적
    $userId = $USER->id;
    $courseId = $COURSE->id;
    $activityId = isset($cm->id) ? $cm->id : '';

    // 특정 과목만 추적하려면 조건 추가
    // if ($courseId > 1) { // 사이트 홈 제외
    ?>
    <script src="/focus-highlights/public/js/tracker.js"></script>
    <div data-focus-tracker
         data-user-id="<?php echo $userId; ?>"
         data-course-id="<?php echo $courseId; ?>"
         data-activity-id="<?php echo $activityId; ?>">
    </div>
    <?php
    // }
}
?>
```

### 방법 2: 블록 플러그인으로 추가

`blocks/focus_highlights/block_focus_highlights.php` 생성:

```php
<?php
class block_focus_highlights extends block_base {
    public function init() {
        $this->title = get_string('pluginname', 'block_focus_highlights');
    }

    public function get_content() {
        global $USER, $COURSE, $cm, $PAGE;

        if ($this->content !== null) {
            return $this->content;
        }

        $this->content = new stdClass;
        $this->content->text = '';
        $this->content->footer = '';

        if (isloggedin() && !isguestuser()) {
            $userId = $USER->id;
            $courseId = $COURSE->id;
            $activityId = isset($cm->id) ? $cm->id : '';

            // JavaScript 추가
            $PAGE->requires->js(new moodle_url('/focus-highlights/public/js/tracker.js'));

            $this->content->text = html_writer::div(
                '',
                '',
                array(
                    'data-focus-tracker' => 'true',
                    'data-user-id' => $userId,
                    'data-course-id' => $courseId,
                    'data-activity-id' => $activityId
                )
            );
        }

        return $this->content;
    }

    public function applicable_formats() {
        return array('course-view' => true, 'mod' => true);
    }
}
```

### 방법 3: 관리자가 HTML 블록으로 추가

1. 과목 편집 모드 활성화
2. "블록 추가" → "HTML"
3. 다음 코드 입력:

```html
<script src="/focus-highlights/public/js/tracker.js"></script>
<script>
(function() {
    var userId = <?php echo $USER->id; ?>;
    var courseId = <?php echo $COURSE->id; ?>;

    if (userId && courseId) {
        window.focusTrackerInstance = new FocusTracker(userId, courseId);
    }
})();
</script>
```

## 🎓 퀴즈 활동과 연동

Moodle 퀴즈에서 정답/오답 정보를 추적하려면:

### quiz/attempt.php 수정

파일: `mod/quiz/attempt.php` (또는 커스텀 JavaScript 추가)

```javascript
// 퀴즈 답변 제출 시
document.addEventListener('DOMContentLoaded', function() {
    var quizForm = document.querySelector('.que');

    if (quizForm && window.focusTrackerInstance) {
        // 답변 시작 시간 기록
        window.focusTrackerInstance.startAnswer();

        // 폼 제출 이벤트
        quizForm.addEventListener('submit', function(e) {
            // 답변이 제출되면 추적
            // 정답 여부는 서버에서 확인 후 별도로 기록
        });
    }
});
```

### 퀴즈 결과 페이지에서 정답 정보 전송

```php
<?php
// mod/quiz/review.php 또는 커스텀 코드

if (isloggedin() && !isguestuser()) {
    $attempt = quiz_get_user_attempts($quiz->id, $USER->id);

    foreach ($attempt->questions as $question) {
        $isCorrect = ($question->score == $question->maxscore);
        $responseTime = $question->timecompleted - $question->timestarted;

        // JavaScript로 전송
        echo "<script>";
        echo "if (window.focusTrackerInstance) {";
        echo "  window.focusTrackerInstance.recordAnswer(" .
             ($isCorrect ? 'true' : 'false') . ", $responseTime);";
        echo "}";
        echo "</script>";
    }
}
?>
```

## 🔐 보안 고려사항

### IP 제한 (권장)

토큰 생성 시 웹 서버 IP로 제한:

```
토큰 관리 → IP 제한: 123.123.123.123
```

### HTTPS 사용

프로덕션 환경에서는 반드시 HTTPS 사용:

```php
// config/moodle.php
define('MOODLE_URL', 'https://your-moodle-url');
define('SESSION_SECURE', true);
```

### 토큰 보안

- 토큰을 코드에 하드코딩하지 마세요
- 데이터베이스에만 저장
- 정기적으로 토큰 갱신
- 로그에 토큰이 노출되지 않도록 주의

## 🧪 테스트

### 1. API 연결 테스트

```bash
curl -X POST "http://your-moodle-url/webservice/rest/server.php" \
  -d "wstoken=YOUR_TOKEN" \
  -d "wsfunction=core_course_get_courses" \
  -d "moodlewsrestformat=json"
```

### 2. 사용자 동기화 테스트

```php
<?php
require_once 'includes/moodle_api.php';

$api = new MoodleAPI();

// Moodle 사용자 ID로 동기화
$localUserId = $api->syncUser(2); // Moodle user ID = 2

echo "로컬 사용자 ID: $localUserId\n";
?>
```

### 3. 추적 테스트

1. Moodle에 로그인
2. 과목 페이지 방문
3. 브라우저 개발자 도구 → 콘솔 확인
4. "Focus tracking started" 메시지 확인
5. 몇 가지 활동 수행 (클릭, 스크롤 등)
6. 페이지 이동 또는 닫기
7. Focus Highlights 대시보드에서 세션 확인

## 🐛 문제 해결

### "Invalid token" 오류

**원인**: 토큰이 잘못되었거나 만료됨

**해결**:
1. Moodle에서 토큰 확인
2. `fh_config` 테이블의 토큰 값 확인
3. 필요시 새 토큰 생성

### "Function not found" 오류

**원인**: 필요한 웹 서비스 함수가 추가되지 않음

**해결**:
1. Moodle → 외부 서비스 → Focus Highlights Service
2. "함수" 클릭
3. 누락된 함수 추가

### 추적이 작동하지 않음

**원인**: JavaScript 경로 문제 또는 Moodle 세션 문제

**해결**:
1. 브라우저 콘솔에서 JavaScript 오류 확인
2. 네트워크 탭에서 API 호출 확인
3. `tracker.js` 경로가 올바른지 확인
4. CORS 설정 확인

### CORS 오류

**해결**: Apache `.htaccess` 또는 Nginx 설정:

```apache
# Apache
Header set Access-Control-Allow-Origin "http://your-moodle-url"
Header set Access-Control-Allow-Methods "GET, POST, OPTIONS"
Header set Access-Control-Allow-Headers "Content-Type"
```

```nginx
# Nginx
add_header Access-Control-Allow-Origin "http://your-moodle-url";
add_header Access-Control-Allow-Methods "GET, POST, OPTIONS";
add_header Access-Control-Allow-Headers "Content-Type";
```

## 📊 성능 최적화

### 캐싱

과목 및 사용자 정보는 로컬 데이터베이스에 캐시됨:

```sql
-- 캐시 갱신 주기 확인
SELECT * FROM fh_courses ORDER BY last_sync DESC;
SELECT * FROM fh_users ORDER BY updated_at DESC;
```

### 배치 동기화

여러 사용자를 한 번에 동기화:

```php
<?php
require_once 'includes/moodle_api.php';

$api = new MoodleAPI();

// 과목의 모든 학생 동기화
$courseId = 5;
$users = $api->getEnrolledUsers($courseId);

foreach ($users as $moodleUser) {
    try {
        $api->syncUser($moodleUser['id']);
        echo "동기화 완료: " . $moodleUser['username'] . "\n";
    } catch (Exception $e) {
        echo "오류: " . $e->getMessage() . "\n";
    }
}
?>
```

## 📈 모니터링

### 활동 로그 확인

```sql
-- 최근 추적 활동
SELECT
    u.username,
    s.session_start,
    s.duration_seconds,
    s.focus_score,
    s.is_highlight
FROM fh_focus_sessions s
JOIN fh_users u ON s.user_id = u.id
ORDER BY s.session_start DESC
LIMIT 20;

-- 일별 통계
SELECT
    DATE(session_start) as date,
    COUNT(*) as sessions,
    SUM(is_highlight) as highlights,
    AVG(focus_score) as avg_score
FROM fh_focus_sessions
WHERE session_start >= DATE_SUB(NOW(), INTERVAL 7 DAY)
GROUP BY DATE(session_start)
ORDER BY date DESC;
```

## 🎓 교사 교육

교사들에게 다음 내용을 안내하세요:

1. **대시보드 접근 방법**
2. **하이라이트 해석 방법**
3. **학생 모니터링 방법**
4. **개인정보 보호 정책**
5. **데이터 활용 방법**

---

추가 도움이 필요하시면 메인 README.md를 참조하거나 이슈를 등록해주세요.
