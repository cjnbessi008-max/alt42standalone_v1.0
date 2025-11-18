# LMS Integration Layer
# LMS 통합 레이어

이 디렉토리에는 외부 LMS 시스템과 통합하기 위한 어댑터와 SDK가 포함되어 있습니다.

## 지원 LMS

- Canvas LMS
- Moodle
- Blackboard
- Google Classroom
- 커스텀 LMS

## 통합 방법

### 1. LTI (Learning Tools Interoperability) 표준

LTI 1.3 표준을 사용하여 대부분의 LMS와 통합할 수 있습니다.

### 2. REST API

각 LMS의 REST API를 사용한 직접 통합

### 3. JavaScript SDK

웹앱에 임베드할 수 있는 JavaScript SDK 제공

## 사용 예시

### JavaScript SDK 사용

```html
<!-- LMS 페이지에 추가 -->
<script src="https://your-domain.com/lms-time-tracking-sdk.js"></script>
<script>
  // SDK 초기화
  const tracker = LMSTimeTracking.init({
    apiUrl: 'https://your-api.com',
    studentId: 'student_001',
  });

  // 문제 시작
  tracker.startProblem('problem_math_001');

  // 제출
  tracker.submitAnswer('problem_math_001', true, { answer: '5' });
</script>
```

### REST API 직접 호출

```javascript
// 문제 시도 시작
fetch('https://your-api.com/api/time-tracking/start', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    student_id: 'student_001',
    problem_id: 'problem_math_001'
  })
});
```

## 설정

각 LMS별 상세 설정 방법은 해당 디렉토리의 README를 참조하세요.

- [Canvas LMS 통합](./canvas/README.md)
- [Moodle 통합](./moodle/README.md)
- [Google Classroom 통합](./google-classroom/README.md)
