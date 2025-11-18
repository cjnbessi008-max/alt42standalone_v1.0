# LMS 통합 가이드

이 문서는 기존 LMS 시스템에 시간 추적 기능을 통합하는 방법을 설명합니다.

## 통합 방법 개요

1. **JavaScript SDK 사용** (가장 간단)
2. **REST API 직접 호출**
3. **LTI 1.3 표준 통합**
4. **React 컴포넌트 임베딩**

---

## 방법 1: JavaScript SDK 사용 (권장)

가장 간단하고 빠른 통합 방법입니다.

### 단계 1: SDK 로드

LMS의 문제 페이지 HTML에 다음 스크립트를 추가합니다:

```html
<script src="https://your-domain.com/lms-time-tracking-sdk.js"></script>
```

### 단계 2: SDK 초기화

```javascript
const tracker = LMSTimeTracking.init({
  apiUrl: 'https://your-api-server.com/api',
  studentId: '<?= $student_id ?>', // LMS에서 학생 ID 가져오기
  autoTrack: true,
  debug: false
});
```

### 단계 3: 문제 시작 추적

```javascript
// 문제 페이지 로드시
document.addEventListener('DOMContentLoaded', async () => {
  const problemId = '<?= $problem_id ?>'; // LMS에서 문제 ID 가져오기
  await tracker.startProblem(problemId);
});
```

### 단계 4: 제출 처리

```javascript
// 기존 제출 버튼 핸들러에 추가
async function submitAnswer() {
  const answer = getStudentAnswer(); // 학생 답안 가져오기
  const isCorrect = checkAnswer(answer); // 정답 확인

  // 시간 추적 완료
  const result = await tracker.submitAnswer(
    problemId,
    isCorrect,
    { answer: answer }
  );

  console.log('Time spent:', result.time_spent_seconds, 'seconds');

  // 기존 LMS 제출 로직...
}
```

### 완전한 예시

```html
<!DOCTYPE html>
<html>
<head>
  <title>수학 문제</title>
</head>
<body>
  <h1>문제: 5 + 3 = ?</h1>
  <input type="text" id="answer" />
  <button onclick="submitAnswer()">제출</button>

  <div id="timer" style="position: fixed; top: 10px; right: 10px;">
    Time: <span id="time-display">00:00:00</span>
  </div>

  <!-- SDK 로드 -->
  <script src="https://your-domain.com/lms-time-tracking-sdk.js"></script>

  <script>
    let tracker;
    const problemId = 'math_problem_001';
    const studentId = 'student_123'; // LMS에서 가져오기
    let timerInterval;

    // 초기화
    document.addEventListener('DOMContentLoaded', async () => {
      // SDK 초기화
      tracker = LMSTimeTracking.init({
        apiUrl: 'https://your-api.com/api',
        studentId: studentId,
        autoTrack: true
      });

      // 문제 시작
      await tracker.startProblem(problemId);

      // 타이머 시작
      timerInterval = setInterval(() => {
        const elapsed = tracker.getElapsedTime(problemId);
        const hours = Math.floor(elapsed / 3600);
        const minutes = Math.floor((elapsed % 3600) / 60);
        const seconds = elapsed % 60;

        document.getElementById('time-display').textContent =
          `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
      }, 1000);
    });

    // 제출
    async function submitAnswer() {
      const answer = document.getElementById('answer').value;
      const isCorrect = answer === '8';

      // 시간 추적 완료
      const result = await tracker.submitAnswer(problemId, isCorrect, {
        answer: answer
      });

      // 타이머 정지
      clearInterval(timerInterval);

      // 결과 표시
      alert(isCorrect ? '정답!' : '오답!');
      console.log('소요 시간:', result.time_spent_seconds, '초');
    }
  </script>
</body>
</html>
```

---

## 방법 2: REST API 직접 호출

JavaScript SDK를 사용하지 않고 직접 API를 호출할 수 있습니다.

### 문제 시작

```javascript
const response = await fetch('https://your-api.com/api/time-tracking/start', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    student_id: 'student_123',
    problem_id: 'problem_001'
  })
});

const data = await response.json();
const attemptId = data.data.id; // 저장 필요
```

### 이벤트 기록

```javascript
await fetch('https://your-api.com/api/time-tracking/event', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    attempt_id: attemptId,
    event_type: 'interaction',
    event_data: { action: 'click' }
  })
});
```

### 완료

```javascript
const response = await fetch('https://your-api.com/api/time-tracking/complete', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    attempt_id: attemptId,
    is_correct: true,
    answer_data: { answer: '42' }
  })
});

const result = await response.json();
console.log('Time spent:', result.data.time_spent_seconds);
```

---

## 방법 3: Canvas LMS 통합

### Canvas의 Custom JavaScript 사용

1. Canvas 관리자 페이지 → Theme Editor
2. JavaScript 섹션에 다음 추가:

```javascript
// SDK 로드
(function() {
  const script = document.createElement('script');
  script.src = 'https://your-domain.com/lms-time-tracking-sdk.js';
  script.onload = initTimeTracking;
  document.head.appendChild(script);
})();

function initTimeTracking() {
  // Canvas에서 학생 ID 가져오기
  const studentId = ENV.current_user_id;

  // 퀴즈 페이지인지 확인
  if (window.location.pathname.includes('/quizzes/')) {
    const tracker = LMSTimeTracking.init({
      apiUrl: 'https://your-api.com/api',
      studentId: studentId,
      autoTrack: true
    });

    // 퀴즈 ID 가져오기
    const quizId = window.location.pathname.match(/quizzes\\/([0-9]+)/)[1];

    // 퀴즈 시작
    tracker.startProblem('canvas_quiz_' + quizId);

    // 제출 버튼 후킹
    const originalSubmit = $('.submit_quiz_button').click;
    $('.submit_quiz_button').click = function() {
      tracker.submitAnswer('canvas_quiz_' + quizId, true, {
        quiz_id: quizId
      });
      originalSubmit.call(this);
    };
  }
}
```

---

## 방법 4: Moodle 통합

### Moodle HTML 블록 사용

1. Moodle 과정 페이지에서 "Add a block" → "HTML"
2. HTML 블록에 다음 추가:

```html
<script src="https://your-domain.com/lms-time-tracking-sdk.js"></script>
<script>
  (function() {
    // Moodle 사용자 ID (PHP에서 삽입)
    const userId = '<?php echo $USER->id; ?>';

    const tracker = LMSTimeTracking.init({
      apiUrl: 'https://your-api.com/api',
      studentId: 'moodle_' + userId,
      autoTrack: true
    });

    // 퀴즈 페이지 감지
    if (document.querySelector('.que')) {
      const attemptId = new URLSearchParams(window.location.search).get('attempt');
      tracker.startProblem('moodle_attempt_' + attemptId);
    }
  })();
</script>
```

---

## 서버 측 통합 (PHP 예시)

LMS 서버 측에서 학생과 문제 정보를 등록할 수 있습니다.

```php
<?php
// 학생 등록/업데이트
function registerStudent($studentId, $name, $email) {
  $data = array(
    'student_id' => $studentId,
    'name' => $name,
    'email' => $email
  );

  $options = array(
    'http' => array(
      'method' => 'POST',
      'header' => 'Content-Type: application/json',
      'content' => json_encode($data)
    )
  );

  $context = stream_context_create($options);
  $result = file_get_contents('https://your-api.com/api/students', false, $context);
  return json_decode($result, true);
}

// 문제 등록/업데이트
function registerProblem($problemId, $moduleId, $title, $description = null) {
  $data = array(
    'problem_id' => $problemId,
    'module_id' => $moduleId,
    'title' => $title,
    'description' => $description
  );

  $options = array(
    'http' => array(
      'method' => 'POST',
      'header' => 'Content-Type: application/json',
      'content' => json_encode($data)
    )
  );

  $context = stream_context_create($options);
  $result = file_get_contents('https://your-api.com/api/problems', false, $context);
  return json_decode($result, true);
}

// 사용 예시
registerStudent('student_001', 'Hong Gildong', 'hong@example.com');
registerProblem('math_001', 'module_math', 'Basic Addition', '2 + 2 = ?');
?>
```

---

## 통계 데이터 조회

### 학생별 시도 기록

```javascript
// 특정 학생의 모든 시도
const attempts = await fetch(
  'https://your-api.com/api/time-tracking/attempts/student_001'
).then(r => r.json());

// 특정 문제의 시도만
const problemAttempts = await fetch(
  'https://your-api.com/api/time-tracking/attempts/student_001?problem_id=problem_001'
).then(r => r.json());
```

### 문제별 통계

```javascript
const stats = await fetch(
  'https://your-api.com/api/time-tracking/statistics/problem_001'
).then(r => r.json());

console.log('Average time:', stats.data.avg_time_seconds);
console.log('Success rate:', stats.data.success_rate, '%');
```

---

## 보안 고려사항

### API 키 인증 (선택사항)

백엔드에 API 키 검증을 추가할 수 있습니다:

```javascript
// 클라이언트
const tracker = LMSTimeTracking.init({
  apiUrl: 'https://your-api.com/api',
  studentId: 'student_001',
  apiKey: 'your-api-key-here' // 추가
});
```

### CORS 설정

백엔드 .env 파일:
```
CORS_ORIGIN=https://your-lms-domain.com
```

---

## 문제 해결

### SDK 로딩 실패

```javascript
// 로딩 확인
if (typeof LMSTimeTracking === 'undefined') {
  console.error('SDK failed to load');
} else {
  console.log('SDK version:', LMSTimeTracking.version);
}
```

### CORS 오류

서버의 CORS 설정을 확인하고 올바른 도메인을 허용했는지 확인합니다.

### 네트워크 오류

```javascript
try {
  await tracker.startProblem(problemId);
} catch (error) {
  console.error('Failed to start tracking:', error);
  // Fallback 로직...
}
```

---

## 추가 자료

- [API 문서](README.md#api-사용법)
- [Canvas 통합 예시](lms-integration/examples/canvas-integration.html)
- [React 컴포넌트 문서](README.md#react-컴포넌트-사용)
