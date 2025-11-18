# Linear Stairs - 등차수열 계단 시각화 웹앱

등차수열을 계단 형태로 시각화하는 독립형 웹 애플리케이션입니다. Moodle LMS와 연동하여 문제 정보를 받아 동작하며, 모바일 스마트폰 화면에 최적화되어 있습니다.

## 주요 기능

- 📊 **등차수열 시각화**: 등차수열을 직관적인 계단 형태로 표현
- 📱 **모바일 최적화**: 스마트폰 화면에 최적화된 UI/UX
- 🔗 **Moodle 연동**: URL 파라미터 및 postMessage API를 통한 LMS 연동
- ✨ **애니메이션**: 계단이 단계별로 생성되는 애니메이션 효과
- 🎨 **인터랙티브**: 실시간으로 파라미터를 조정하여 시각화 확인

## 기술 스택

- **Frontend**: HTML5, CSS3, Vanilla JavaScript (ES6+)
- **Canvas API**: 계단 시각화
- **LMS 연동**: Moodle 3.7 (PHP 7.1.9, MySQL 5.7)

## 파일 구조

```
linear-stairs/
├── index.html              # 메인 HTML 파일
├── css/
│   └── style.css          # 스타일시트 (모바일 최적화)
├── js/
│   ├── app.js             # 메인 애플리케이션 로직
│   └── moodle-connector.js # Moodle 연동 모듈
└── README.md              # 문서 (현재 파일)
```

## 사용 방법

### 1. 독립 실행 (Standalone)

웹 브라우저에서 `index.html`을 직접 열기:

```bash
# 로컬 웹 서버 실행 (Python)
cd linear-stairs
python -m http.server 8000

# 브라우저에서 접속
# http://localhost:8000
```

### 2. Moodle 연동

#### 방법 A: URL 파라미터

Moodle에서 URL 파라미터를 통해 문제 정보 전달:

```
http://your-domain.com/linear-stairs/index.html?a1=3&d=5&n=7&moodle=1
```

**파라미터 설명:**
- `a1`: 첫째항 (default: 1)
- `d`: 공차 (default: 2)
- `n`: 항의 개수 (default: 5)
- `moodle`: Moodle 연동 플래그

#### 방법 B: iframe 임베딩

Moodle 활동/리소스에 iframe으로 삽입:

```html
<iframe
    src="http://your-domain.com/linear-stairs/index.html?a1=2&d=3&n=6&moodle=1"
    width="100%"
    height="900px"
    frameborder="0"
    style="max-width: 375px; margin: 0 auto; display: block;">
</iframe>
```

#### 방법 C: Moodle REST API

Moodle Web Services를 활성화하고 토큰을 발급받은 후:

```
http://your-domain.com/linear-stairs/index.html?moodle_url=https://your-moodle.com&token=YOUR_TOKEN&question_id=123&user_id=456
```

### 3. Moodle 플러그인으로 설치 (선택사항)

#### 3.1. Moodle 활동 모듈로 설치

```bash
# Moodle 플러그인 디렉토리에 복사
cp -r linear-stairs /path/to/moodle/mod/linearstairs

# Moodle 관리자 페이지에서 플러그인 설치
# Site administration > Notifications
```

#### 3.2. 필요한 Moodle 파일

Moodle 플러그인으로 사용하려면 추가 파일이 필요합니다:

- `version.php`: 플러그인 메타데이터
- `lib.php`: Moodle 인터페이스 함수
- `view.php`: 활동 보기 페이지
- `db/install.xml`: 데이터베이스 스키마
- `lang/en/linearstairs.php`: 언어 파일

## API 문서

### JavaScript API

#### LinearStairs 클래스

메인 애플리케이션 클래스:

```javascript
// 인스턴스 접근
const app = window.linearStairsApp;

// 시각화 업데이트
app.updateVisualization();

// 애니메이션 재생
app.animateStairs();

// 특정 항 계산
const term = app.calculateTerm(5); // 5번째 항
```

#### MoodleConnector 클래스

Moodle 연동 클래스:

```javascript
// 인스턴스 접근
const connector = window.moodleConnector;

// 문제 데이터 가져오기
await connector.fetchProblemData();

// 답안 제출
await connector.submitAnswer({
    firstTerm: 1,
    commonDiff: 2,
    termCount: 5
});

// 연결 테스트
await connector.testConnection();
```

### postMessage API

부모 창(Moodle)과 통신:

```javascript
// Linear Stairs → Moodle (부모 창으로 메시지 전송)
window.parent.postMessage({
    type: 'answer_submit',
    questionId: 123,
    userId: 456,
    answer: { firstTerm: 3, commonDiff: 5, termCount: 7 }
}, '*');

// Moodle → Linear Stairs (iframe에서 메시지 수신)
window.addEventListener('message', (event) => {
    if (event.data.type === 'problem_data') {
        // 문제 데이터 처리
        console.log(event.data);
    }
});
```

## Moodle 연동 예제

### PHP 예제 (Moodle 플러그인)

```php
<?php
// view.php - Moodle 활동 보기 페이지

require_once('../../config.php');

$id = required_param('id', PARAM_INT); // Course Module ID
$cm = get_coursemodule_from_id('linearstairs', $id, 0, false, MUST_EXIST);
$course = $DB->get_record('course', array('id' => $cm->course), '*', MUST_EXIST);

require_login($course, true, $cm);

// 문제 파라미터 (데이터베이스에서 가져오기)
$linearstairs = $DB->get_record('linearstairs', array('id' => $cm->instance), '*', MUST_EXIST);

$PAGE->set_url('/mod/linearstairs/view.php', array('id' => $cm->id));
$PAGE->set_title(format_string($linearstairs->name));
$PAGE->set_heading(format_string($course->fullname));

echo $OUTPUT->header();

// Linear Stairs 앱 임베딩
$app_url = new moodle_url('/mod/linearstairs/app/index.html', array(
    'a1' => $linearstairs->firstterm,
    'd' => $linearstairs->commondiff,
    'n' => $linearstairs->termcount,
    'moodle' => 1,
    'question_id' => $linearstairs->id,
    'user_id' => $USER->id
));

echo html_writer::tag('iframe', '', array(
    'src' => $app_url->out(false),
    'width' => '100%',
    'height' => '900px',
    'frameborder' => '0',
    'style' => 'max-width: 375px; margin: 0 auto; display: block;'
));

echo $OUTPUT->footer();
?>
```

### MySQL 데이터베이스 스키마

```sql
-- Moodle 플러그인용 테이블
CREATE TABLE mdl_linearstairs (
    id BIGINT(10) NOT NULL AUTO_INCREMENT,
    course BIGINT(10) NOT NULL DEFAULT 0,
    name VARCHAR(255) NOT NULL DEFAULT '',
    intro TEXT,
    introformat SMALLINT(4) NOT NULL DEFAULT 0,
    firstterm INT(11) NOT NULL DEFAULT 1,
    commondiff INT(11) NOT NULL DEFAULT 2,
    termcount INT(11) NOT NULL DEFAULT 5,
    timecreated BIGINT(10) NOT NULL DEFAULT 0,
    timemodified BIGINT(10) NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    KEY course (course)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 학생 답안 기록 테이블
CREATE TABLE mdl_linearstairs_attempts (
    id BIGINT(10) NOT NULL AUTO_INCREMENT,
    linearstairsid BIGINT(10) NOT NULL DEFAULT 0,
    userid BIGINT(10) NOT NULL DEFAULT 0,
    firstterm INT(11) NOT NULL,
    commondiff INT(11) NOT NULL,
    termcount INT(11) NOT NULL,
    timecreated BIGINT(10) NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    KEY linearstairsid (linearstairsid),
    KEY userid (userid)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

## 수학적 배경

### 등차수열 (Arithmetic Sequence)

첫째항이 a₁이고 공차가 d인 등차수열의 일반항:

```
aₙ = a₁ + (n-1)d
```

**예시:**
- a₁ = 3, d = 5인 경우
- a₁ = 3
- a₂ = 3 + 5 = 8
- a₃ = 3 + 10 = 13
- a₄ = 3 + 15 = 18
- ...

### 시각화 방법

등차수열의 각 항을 계단의 높이로 표현:
- X축: 항 번호 (n)
- Y축: 항의 값 (aₙ)
- 각 항은 막대로 표현
- 공차(d)는 화살표로 표시

## 커스터마이징

### 색상 변경

`css/style.css`에서 색상 변경:

```css
/* 메인 그라디언트 색상 */
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);

/* 계단 색상 */
gradient.addColorStop(0, '#667eea');
gradient.addColorStop(1, '#764ba2');
```

### 스마트폰 크기 조정

```css
.smartphone-container {
    max-width: 375px;  /* iPhone X/11 크기 */
    height: 812px;
}
```

다른 디바이스 크기:
- iPhone SE: 320px × 568px
- iPhone 8: 375px × 667px
- iPhone 14 Pro: 393px × 852px
- Samsung Galaxy S21: 360px × 800px

## 브라우저 호환성

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+
- ✅ Mobile Safari (iOS 14+)
- ✅ Chrome Mobile (Android 10+)

## 라이선스

MIT License

## 시스템 요구사항

### Moodle 환경
- **Moodle**: 3.7 이상
- **PHP**: 7.1.9 이상
- **MySQL**: 5.7 이상
- **Apache/Nginx**: 최신 버전

### 클라이언트
- 모던 웹 브라우저 (HTML5, Canvas 지원)
- JavaScript 활성화 필수

## 문제 해결

### 앱이 로드되지 않는 경우

1. 브라우저 콘솔에서 오류 확인
2. JavaScript가 활성화되어 있는지 확인
3. CORS 정책 확인 (iframe 사용 시)

### Moodle 연동이 작동하지 않는 경우

1. URL 파라미터가 올바른지 확인
2. Moodle Web Services가 활성화되어 있는지 확인
3. 토큰이 유효한지 확인
4. 브라우저 콘솔에서 네트워크 오류 확인

### Canvas가 표시되지 않는 경우

1. 브라우저가 Canvas API를 지원하는지 확인
2. CSS가 올바르게 로드되었는지 확인
3. 창 크기를 조정하여 리사이즈 이벤트 트리거

## 향후 개선 사항

- [ ] 터치 제스처 지원 (스와이프, 핀치 줌)
- [ ] 다크 모드 지원
- [ ] 등차수열 합 공식 시각화
- [ ] 다국어 지원 (영어, 중국어 등)
- [ ] 문제 은행 기능
- [ ] 학습 진도 추적
- [ ] 소셜 공유 기능

## 개발자 정보

이 프로젝트는 교육용 수학 시각화 도구로 개발되었습니다.

## 기여하기

Pull Request와 Issue를 환영합니다!

---

**만든 날짜**: 2025-11-18
**버전**: 1.0.0
