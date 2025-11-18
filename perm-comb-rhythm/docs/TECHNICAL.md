# Perm-Comb Rhythm - 기술 문서

## 아키텍처 개요

```
┌─────────────────────────────────────────────────────────┐
│                    Moodle LMS (PHP)                      │
│  ┌────────────┐  ┌──────────┐  ┌──────────────┐         │
│  │  view.php  │→ │ lib.php  │→ │   MySQL DB   │         │
│  └─────┬──────┘  └──────────┘  └──────────────┘         │
│        │                                                 │
│        ↓ (iframe)                                        │
│  ┌─────────────────────────────────────────┐            │
│  │         Rhythm App (HTML/JS)            │            │
│  │  ┌──────────┐  ┌──────────┐             │            │
│  │  │index.html│→ │  app.js  │             │            │
│  │  └──────────┘  └─────┬────┘             │            │
│  │                      ↓                   │            │
│  │              Canvas + Web Audio          │            │
│  └─────────────────────┬───────────────────┘            │
│                        ↓ (AJAX)                          │
│                  ┌──────────┐                            │
│                  │ api.php  │                            │
│                  └──────────┘                            │
└─────────────────────────────────────────────────────────┘
```

## 핵심 컴포넌트

### 1. Moodle 플러그인 (PHP)

#### version.php
- 플러그인 메타데이터
- Moodle 버전 호환성
- 컴포넌트 이름 정의

#### lib.php
핵심 함수:
- `permcombrhythm_supports()`: 플러그인 기능 선언
- `permcombrhythm_add_instance()`: 활동 생성
- `permcombrhythm_update_instance()`: 활동 수정
- `permcombrhythm_delete_instance()`: 활동 삭제
- `permcombrhythm_generate_problem()`: 문제 생성 로직
- `permcombrhythm_calculate_permutation()`: P(n,r) 계산
- `permcombrhythm_calculate_combination()`: C(n,r) 계산
- `permcombrhythm_save_attempt()`: 시도 저장

#### view.php
- 메인 뷰 렌더링
- 스마트폰 프레임 UI
- iframe으로 앱 임베드

#### api.php
REST API 엔드포인트:
- `GET ?action=getproblem`: 새 문제 생성
- `POST action=submit`: 답안 제출
- `GET ?action=getstats`: 통계 조회

### 2. 웹앱 (HTML/CSS/JS)

#### index.html
UI 구조:
- 헤더: 제목 + 정확도 배지
- 문제 섹션: 문제 표시
- 리듬 섹션: Canvas + 재생 버튼
- 답안 섹션: 입력 폼
- 피드백 섹션: 결과 표시
- 푸터: 범례

#### style.css
스타일링:
- 그라데이션 배경
- 반응형 디자인 (320px+)
- 애니메이션 효과
- 스마트폰 프레임 스타일

#### app.js
앱 로직:

**상태 관리:**
```javascript
let currentProblem = null;
let isPlaying = false;
let startTime = null;
let activityId = null;
```

**주요 함수:**

1. `init()`: 초기화
   - URL에서 activity ID 파싱
   - 이벤트 리스너 등록
   - 초기 문제 로드

2. `loadNextProblem()`: 문제 로드
   - API 호출
   - UI 업데이트
   - Canvas 그리기

3. `drawRhythmPattern(problem)`: 리듬 시각화
   - **순열**: 높이가 다른 파란색 막대
   - **조합**: 높이가 같은 분홍색 막대

4. `playRhythm()`: 리듬 재생
   - 각 비트 하이라이트
   - 사운드 재생
   - 애니메이션

5. `submitAnswer()`: 답안 제출
   - 검증
   - API 전송
   - 피드백 표시

6. `playBeatSound(index, total, isPermutation)`: 사운드
   - Web Audio API 사용
   - **순열**: 올라가는 음계
   - **조합**: 동일한 음

### 3. 데이터베이스

#### mdl_permcombrhythm
```sql
CREATE TABLE mdl_permcombrhythm (
    id INT PRIMARY KEY AUTO_INCREMENT,
    course INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    intro TEXT,
    introformat INT(4) DEFAULT 0,
    timemodified INT DEFAULT 0,
    difficulty INT(2) DEFAULT 1,
    problemtype VARCHAR(20) DEFAULT 'mixed',
    FOREIGN KEY (course) REFERENCES mdl_course(id)
);
```

#### mdl_permcombrhythm_attempts
```sql
CREATE TABLE mdl_permcombrhythm_attempts (
    id INT PRIMARY KEY AUTO_INCREMENT,
    permcombrhythmid INT NOT NULL,
    userid INT NOT NULL,
    problemdata TEXT NOT NULL,
    useranswer INT,
    iscorrect INT(1) DEFAULT 0,
    timespent INT,
    timecreated INT NOT NULL,
    FOREIGN KEY (permcombrhythmid) REFERENCES mdl_permcombrhythm(id),
    FOREIGN KEY (userid) REFERENCES mdl_user(id),
    INDEX idx_userid (userid)
);
```

## 알고리즘

### 문제 생성 알고리즘

```php
function permcombrhythm_generate_problem($permcombrhythmid) {
    // 1. 활동 설정 조회
    $activity = DB->get_record('permcombrhythm', ['id' => $id]);

    // 2. 문제 유형 결정
    $type = $activity->problemtype;
    if ($type == 'mixed') {
        $type = rand(0, 1) ? 'permutation' : 'combination';
    }

    // 3. 난이도에 따른 n, r 결정
    $difficulty = $activity->difficulty;
    $n = rand(3 + $difficulty, 6 + $difficulty);
    $r = rand(2, min($n, 3 + floor($difficulty / 2)));

    // 4. 정답 계산
    if ($type == 'permutation') {
        $answer = P(n, r);  // n!/(n-r)!
    } else {
        $answer = C(n, r);  // n!/(r!(n-r)!)
    }

    return ['type' => $type, 'n' => $n, 'r' => $r, 'answer' => $answer];
}
```

### 순열 계산

```php
function permcombrhythm_calculate_permutation($n, $r) {
    // P(n,r) = n × (n-1) × ... × (n-r+1)
    $result = 1;
    for ($i = 0; $i < $r; $i++) {
        $result *= ($n - $i);
    }
    return $result;
}
```

예: P(5,3) = 5 × 4 × 3 = 60

### 조합 계산

```php
function permcombrhythm_calculate_combination($n, $r) {
    // C(n,r) = P(n,r) / r!
    $perm = permcombrhythm_calculate_permutation($n, $r);
    $r_factorial = 1;
    for ($i = 1; $i <= $r; $i++) {
        $r_factorial *= $i;
    }
    return $perm / $r_factorial;
}
```

예: C(5,3) = P(5,3) / 3! = 60 / 6 = 10

## 리듬 시각화 알고리즘

### Canvas 렌더링

```javascript
function drawRhythmPattern(problem) {
    const canvas = document.getElementById('rhythmCanvas');
    const ctx = canvas.getContext('2d');

    const n = problem.n;
    const r = problem.r;
    const isPermutation = (problem.type === 'permutation');

    const centerY = canvas.height / 2;
    const spacing = canvas.width / (r + 1);

    if (isPermutation) {
        // 순열: 높이가 다른 막대
        for (let i = 0; i < r; i++) {
            const x = spacing * (i + 1);
            const height = 30 + (i * 15) % 50;  // 변화하는 높이

            // 그라데이션
            const gradient = ctx.createLinearGradient(
                x - 10, centerY - height,
                x - 10, centerY
            );
            gradient.addColorStop(0, '#667eea');
            gradient.addColorStop(1, '#8b9df7');

            ctx.fillStyle = gradient;
            ctx.fillRect(x - 10, centerY - height, 20, height);

            // 번호 레이블
            ctx.fillText(`#${i + 1}`, x, centerY + 20);
        }
    } else {
        // 조합: 높이가 같은 막대
        const uniformHeight = 40;

        for (let i = 0; i < r; i++) {
            const x = spacing * (i + 1);

            // 그라데이션
            const gradient = ctx.createLinearGradient(
                x - 10, centerY - uniformHeight,
                x - 10, centerY
            );
            gradient.addColorStop(0, '#f5576c');
            gradient.addColorStop(1, '#ff8fa3');

            ctx.fillStyle = gradient;
            ctx.fillRect(x - 10, centerY - uniformHeight, 20, uniformHeight);

            // 원 마커
            ctx.fillStyle = '#fff';
            ctx.arc(x, centerY - uniformHeight/2, 6, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}
```

### 애니메이션 로직

```javascript
async function playRhythm() {
    const r = currentProblem.r;

    for (let i = 0; i < r; i++) {
        // 1. 비트 하이라이트
        await highlightBeat(i);

        // 2. 사운드 재생
        playBeatSound(i, r, isPermutation);

        // 3. 대기
        await sleep(400);  // 400ms per beat
    }

    // 원래 패턴으로 복원
    drawRhythmPattern(currentProblem);
}
```

### Web Audio 사운드

```javascript
function playBeatSound(index, total, isPermutation) {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    if (isPermutation) {
        // 순열: 올라가는 음계
        oscillator.frequency.value = 440 + (index * 100);
        // A4(440), B4(540), C#5(640)...
    } else {
        // 조합: 동일한 음
        oscillator.frequency.value = 523.25;  // C5
    }

    oscillator.type = isPermutation ? 'square' : 'sine';

    // ADSR 엔벨로프
    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.2);
}
```

## API 명세

### 엔드포인트 1: 문제 생성

**요청:**
```http
GET /mod/permcombrhythm/api.php?action=getproblem&id=123
```

**응답:**
```json
{
  "success": true,
  "problem": {
    "type": "permutation",
    "n": 5,
    "r": 3,
    "answer": 60,
    "difficulty": 2
  }
}
```

### 엔드포인트 2: 답안 제출

**요청:**
```http
POST /mod/permcombrhythm/api.php
Content-Type: application/x-www-form-urlencoded

action=submit&id=123&answer=60&problemdata={"type":"permutation","n":5,"r":3,"answer":60}&timespent=45
```

**응답:**
```json
{
  "success": true,
  "correct": true,
  "correctanswer": 60,
  "attemptid": 456
}
```

### 엔드포인트 3: 통계 조회

**요청:**
```http
GET /mod/permcombrhythm/api.php?action=getstats&id=123
```

**응답:**
```json
{
  "success": true,
  "stats": {
    "total": 10,
    "correct": 7,
    "accuracy": 70.0,
    "recent": [
      {
        "id": 456,
        "iscorrect": 1,
        "timespent": 45,
        "timecreated": 1700000000
      }
    ]
  }
}
```

## 성능 최적화

### 1. Canvas 렌더링 최적화

```javascript
// 더블 버퍼링으로 깜빡임 방지
const offscreenCanvas = document.createElement('canvas');
const offscreenCtx = offscreenCanvas.getContext('2d');

// 오프스크린 캔버스에 그리기
drawToOffscreen(offscreenCtx);

// 한 번에 온스크린 캔버스로 복사
ctx.drawImage(offscreenCanvas, 0, 0);
```

### 2. API 호출 최적화

```javascript
// 디바운싱으로 중복 호출 방지
const debouncedSubmit = debounce(submitAnswer, 300);

// 캐싱으로 중복 요청 방지
const problemCache = new Map();
```

### 3. 데이터베이스 쿼리 최적화

```sql
-- 인덱스 활용
CREATE INDEX idx_userid_time ON mdl_permcombrhythm_attempts(userid, timecreated DESC);

-- 최근 시도만 조회
SELECT * FROM mdl_permcombrhythm_attempts
WHERE userid = ? AND permcombrhythmid = ?
ORDER BY timecreated DESC
LIMIT 10;
```

## 보안 고려사항

### 1. 입력 검증

```php
// api.php
$answer = required_param('answer', PARAM_INT);  // 정수만 허용
$id = required_param('id', PARAM_INT);
$problemdata = required_param('problemdata', PARAM_RAW);

// JSON 검증
$problemdata = json_decode($problemdata, true);
if (!$problemdata || !isset($problemdata['answer'])) {
    throw new Exception('Invalid problem data');
}
```

### 2. SQL 인젝션 방지

```php
// Moodle DML 사용 (자동 파라미터화)
$DB->get_record('permcombrhythm', array('id' => $id));
$DB->insert_record('permcombrhythm_attempts', $attempt);
```

### 3. XSS 방지

```php
// HTML 출력 시 이스케이프
echo format_string($permcombrhythm->name);
echo format_text($permcombrhythm->intro);
```

### 4. CSRF 방지

```php
// Moodle 세션 검증 (자동)
require_login($course, true, $cm);
require_capability('mod/permcombrhythm:submit', $context);
```

## 테스트

### 단위 테스트 (PHPUnit)

```php
// tests/lib_test.php
class mod_permcombrhythm_lib_testcase extends advanced_testcase {
    public function test_calculate_permutation() {
        $this->assertEquals(60, permcombrhythm_calculate_permutation(5, 3));
        $this->assertEquals(120, permcombrhythm_calculate_permutation(5, 5));
    }

    public function test_calculate_combination() {
        $this->assertEquals(10, permcombrhythm_calculate_combination(5, 3));
        $this->assertEquals(1, permcombrhythm_calculate_combination(5, 5));
    }
}
```

### 통합 테스트

```bash
# Moodle PHPUnit 실행
php admin/tool/phpunit/cli/init.php
vendor/bin/phpunit mod/permcombrhythm/tests/
```

### E2E 테스트 (Playwright)

```javascript
// tests/e2e/rhythm.spec.js
test('should play rhythm and submit answer', async ({ page }) => {
    await page.goto('/mod/permcombrhythm/view.php?id=1');

    // 리듬 재생
    await page.click('#playButton');
    await page.waitForTimeout(2000);

    // 답 입력
    await page.fill('#answerInput', '60');
    await page.click('#submitButton');

    // 피드백 확인
    await expect(page.locator('#feedbackSection')).toBeVisible();
});
```

## 확장성

### 1. 다국어 지원

```php
// lang/ko/permcombrhythm.php
$string['modulename'] = '순열조합 리듬';

// lang/en/permcombrhythm.php
$string['modulename'] = 'Perm-Comb Rhythm';
```

### 2. 테마 커스터마이징

```javascript
// app.js CONFIG 수정
const CONFIG = {
    PERM_COLOR: '#667eea',      // 파란색
    COMB_COLOR: '#f5576c',      // 분홍색
    BEAT_DURATION: 400,
};
```

### 3. 플러그인 확장

```php
// classes/event/problem_generated.php
class problem_generated extends \core\event\base {
    // 커스텀 이벤트 발생
    // 다른 플러그인이 후킹 가능
}
```

## 참고 자료

- [Moodle Plugin Development](https://docs.moodle.org/dev/)
- [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
- [Canvas API](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API)
- [순열과 조합](https://ko.wikipedia.org/wiki/순열과_조합)

---

© 2025 KAIST Touch Math Academy
