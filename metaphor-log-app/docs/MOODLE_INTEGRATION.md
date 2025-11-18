# Moodle 3.7 연동 가이드

Metaphor Log를 Moodle LMS와 연동하는 방법을 안내합니다.

## 📋 사전 요구사항

- Moodle 3.7 이상
- 관리자 권한
- 웹 서비스 활성화 가능

## 🔧 Moodle 웹 서비스 설정

### 1. 웹 서비스 활성화

1. Moodle 관리자로 로그인
2. **사이트 관리 > 고급 기능** 이동
3. **웹 서비스 활성화** 체크
4. 변경사항 저장

### 2. 웹 서비스 프로토콜 활성화

1. **사이트 관리 > 플러그인 > 웹 서비스 > 프로토콜 관리**
2. **REST 프로토콜** 활성화

### 3. 외부 서비스 생성

1. **사이트 관리 > 서버 > 웹 서비스 > 외부 서비스**
2. **추가** 클릭
3. 다음 정보 입력:
   - 이름: `Metaphor Log Service`
   - 약칭: `metaphor_log`
   - 활성화 체크

### 4. 기능 추가

다음 웹 서비스 기능을 서비스에 추가:

```
core_question_get_question_data
core_user_get_user_preferences
core_user_set_user_preferences
core_grades_update_grades
```

### 5. 사용자 토큰 생성

1. **사이트 관리 > 서버 > 웹 서비스 > 토큰 관리**
2. **추가** 클릭
3. 정보 입력:
   - 사용자: 관리자 또는 특정 사용자
   - 서비스: `Metaphor Log Service`
4. 생성된 토큰을 복사

### 6. Metaphor Log 설정

`api/config.php` 파일에 토큰 입력:

```php
define('MOODLE_URL', 'https://your-moodle-domain.com');
define('MOODLE_TOKEN', 'your_generated_token_here');
```

## 🎓 Moodle 코스에 통합

### 방법 1: iframe 삽입

#### 1.1 HTML 블록 추가

1. 코스 편집 모드 활성화
2. **블록 추가 > HTML**
3. 다음 코드 삽입:

```html
<div class="metaphor-log-container">
    <h3>🌳 로그 학습 - Metaphor Log</h3>
    <iframe
        src="https://your-domain.com/metaphor-log-app/public/?userid={{USER_ID}}&questionid={{QUESTION_ID}}"
        width="100%"
        height="750"
        frameborder="0"
        style="max-width: 400px; margin: 0 auto; display: block; border-radius: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.2);">
    </iframe>
</div>

<style>
.metaphor-log-container {
    text-align: center;
    padding: 20px;
    background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
    border-radius: 10px;
    margin: 20px 0;
}
</style>
```

#### 1.2 변수 치환

Moodle 필터를 사용하여 사용자 ID 자동 삽입:

```html
src="https://your-domain.com/metaphor-log-app/public/?userid={$a->id}"
```

### 방법 2: 외부 도구 (LTI)

#### 2.1 LTI 제공자 등록

1. **사이트 관리 > 플러그인 > 활동 모듈 > 외부 도구 > 도구 관리**
2. **도구 구성** 클릭
3. 정보 입력:
   - 도구 이름: `Metaphor Log`
   - 도구 URL: `https://your-domain.com/metaphor-log-app/public/lti.php`
   - Consumer Key: 생성
   - Shared Secret: 생성

#### 2.2 코스에 활동 추가

1. 코스 편집 모드에서 **활동 또는 리소스 추가**
2. **외부 도구** 선택
3. **Metaphor Log** 도구 선택

### 방법 3: 퀴즈 통합

#### 3.1 사용자 정의 질문 유형

Moodle 퀴즈에 Metaphor Log를 통합:

1. **퀴즈 추가** 또는 기존 퀴즈 편집
2. **질문 추가 > 새 질문**
3. **설명** 유형 선택 (iframe 삽입용)
4. 질문 텍스트에 iframe 코드 삽입:

```html
<div style="margin: 20px 0;">
    <p>다음 시각화를 보고 로그 값을 구하세요:</p>
    <iframe
        id="metaphor-log-frame"
        src="https://your-domain.com/metaphor-log-app/public/?questionid=123"
        width="100%"
        height="750"
        frameborder="0"
        style="max-width: 400px; margin: 0 auto; display: block;">
    </iframe>
</div>

<script>
// 답변 동기화
window.addEventListener('message', function(event) {
    if (event.data.type === 'metaphor_answer') {
        document.querySelector('input[name="answer"]').value = event.data.answer;
    }
});
</script>
```

#### 3.2 자동 채점 설정

답변이 제출되면 자동으로 Moodle 성적부에 기록:

```javascript
// metaphor-log.js에 추가
function syncAnswerToMoodle(answer, isCorrect) {
    if (window.parent !== window) {
        window.parent.postMessage({
            type: 'metaphor_answer',
            answer: answer,
            is_correct: isCorrect
        }, '*');
    }
}
```

## 📊 성적 동기화

### 자동 성적 업데이트

`api/moodle-grade-sync.php` 생성:

```php
<?php
require_once 'config.php';
require_once 'db.php';

/**
 * Sync grade to Moodle gradebook
 */
function syncGradeToMoodle($userId, $courseId, $score, $maxScore) {
    $url = MOODLE_URL . '/webservice/rest/server.php';

    $params = [
        'wstoken' => MOODLE_TOKEN,
        'wsfunction' => 'core_grades_update_grades',
        'moodlewsrestformat' => 'json',
        'source' => 'metaphor_log',
        'courseid' => $courseId,
        'component' => 'mod_quiz',
        'grades' => [
            [
                'userid' => $userId,
                'grade' => $score,
                'rawgrade' => $maxScore
            ]
        ]
    ];

    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($params));

    $response = curl_exec($ch);
    curl_close($ch);

    return json_decode($response, true);
}
```

### 진도 추적

학생의 학습 진도를 Moodle 완료 추적과 동기화:

```javascript
// 문제 완료 시 Moodle에 알림
function notifyCompletion() {
    MoodleIntegration.sendCompletionToMoodle(true);
}
```

## 🔐 보안 설정

### 1. CORS 허용

Moodle 도메인에서만 iframe 접근 허용:

```php
// api/config.php에 추가
$allowed_origins = [
    'https://your-moodle-domain.com',
    'https://moodle.your-school.edu'
];

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin, $allowed_origins)) {
    header("Access-Control-Allow-Origin: $origin");
}
```

### 2. 토큰 검증

Moodle에서 오는 요청만 허용:

```php
function verifyMoodleRequest($token) {
    return $token === MOODLE_TOKEN;
}
```

### 3. SSL/TLS 사용

프로덕션 환경에서는 반드시 HTTPS 사용:

```php
if (!isset($_SERVER['HTTPS']) || $_SERVER['HTTPS'] !== 'on') {
    header('Location: https://' . $_SERVER['HTTP_HOST'] . $_SERVER['REQUEST_URI']);
    exit;
}
```

## 📱 반응형 설정

Moodle 테마에 맞게 반응형 조정:

```css
/* Moodle 테마 통합 CSS */
.metaphor-log-container {
    width: 100%;
    max-width: 400px;
    margin: 0 auto;
}

@media (max-width: 768px) {
    .metaphor-log-container iframe {
        height: 600px;
    }
}

/* Moodle Boost 테마 */
.theme-boost .metaphor-log-container {
    background-color: #f8f9fa;
    border: 1px solid #dee2e6;
    border-radius: 0.25rem;
    padding: 1rem;
}
```

## 🧪 테스트

### 1. 연결 테스트

`test-moodle-connection.php` 생성:

```php
<?php
require_once 'api/config.php';

$url = MOODLE_URL . '/webservice/rest/server.php';
$params = [
    'wstoken' => MOODLE_TOKEN,
    'wsfunction' => 'core_webservice_get_site_info',
    'moodlewsrestformat' => 'json'
];

$ch = curl_init($url . '?' . http_build_query($params));
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$response = curl_exec($ch);
curl_close($ch);

$data = json_decode($response, true);

if (isset($data['sitename'])) {
    echo "✅ Moodle 연결 성공!\n";
    echo "사이트: " . $data['sitename'] . "\n";
    echo "버전: " . $data['version'] . "\n";
} else {
    echo "❌ Moodle 연결 실패\n";
    echo "오류: " . ($data['message'] ?? 'Unknown error') . "\n";
}
```

### 2. 권한 테스트

웹 서비스 기능 접근 권한 확인:

```bash
php test-moodle-connection.php
```

## 📖 사용 시나리오

### 시나리오 1: 퀴즈 활동

1. 교사가 로그 단원 퀴즈 생성
2. 각 문제에 Metaphor Log iframe 삽입
3. 학생이 시각화를 보고 답 입력
4. 자동 채점 및 성적부 기록

### 시나리오 2: 과제 활동

1. 교사가 로그 탐구 과제 생성
2. 학생이 Metaphor Log로 다양한 문제 탐색
3. 학습 시간 및 정답률 자동 추적
4. 선호하는 비유 유형 분석

### 시나리오 3: 개별 학습

1. 학생이 코스 페이지에서 Metaphor Log 접근
2. 자신의 수준에 맞는 문제 자동 제공
3. 진도 자동 저장
4. 약한 부분 반복 학습

## 🐛 문제 해결

### "Invalid token" 오류

**원인**: 토큰이 만료되었거나 잘못됨

**해결**:
1. Moodle에서 새 토큰 생성
2. `config.php` 업데이트
3. 캐시 삭제

### iframe이 로드되지 않음

**원인**: X-Frame-Options 헤더 제한

**해결**:
```php
// api/config.php에 추가
header('X-Frame-Options: ALLOW-FROM https://your-moodle-domain.com');
```

### 성적이 동기화되지 않음

**원인**: 웹 서비스 권한 부족

**해결**:
1. Moodle 웹 서비스에서 `core_grades_update_grades` 권한 확인
2. 사용자 역할에 적절한 권한 부여

## 📚 추가 리소스

- [Moodle Web Services Documentation](https://docs.moodle.org/dev/Web_services)
- [Moodle External Tool (LTI)](https://docs.moodle.org/en/External_tool)
- [Moodle Question Types](https://docs.moodle.org/en/Question_types)

---

**문의**: Moodle 연동 관련 문제는 이슈로 등록해주세요.
