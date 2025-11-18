# Drag-to-Slope Interactive Math App

**KAIST Touch Math Academy** - 미분 학습을 위한 인터랙티브 웹 애플리케이션

## 기능

- **드래그-투-슬로프**: 함수 그래프를 손가락으로 터치/드래그하면 실시간으로 접선(미분선)이 표시됩니다
- **다양한 함수 지원**: 다항함수, 삼각함수, 지수함수, 분수함수 등
- **Moodle LMS 연동**: URL 파라미터와 postMessage API를 통한 완벽한 연동
- **모바일 최적화**: 스마트폰 터치 인터페이스 완벽 지원
- **학습 추적**: 학생의 인터랙션 데이터 수집 및 분석

## 기술 스택

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite
- **Math Engine**: Math.js (함수 파싱 및 미분 계산)
- **Graphics**: HTML5 Canvas API
- **LMS Integration**: postMessage API

## 설치 및 실행

### 1. 의존성 설치

```bash
npm install
```

### 2. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 http://localhost:3000 접속

### 3. 프로덕션 빌드

```bash
npm run build
```

빌드된 파일은 `dist/` 디렉토리에 생성됩니다.

## Moodle 연동 방법

### iframe 임베드

Moodle 페이지에 다음과 같이 iframe을 추가합니다:

```html
<iframe
  src="https://your-domain.com/?problemId=001&function=x%5E2&xMin=-10&xMax=10&yMin=-10&yMax=10"
  width="100%"
  height="600px"
  style="border: none;"
></iframe>
```

### URL 파라미터

| 파라미터 | 설명 | 예시 |
|---------|------|------|
| `problemId` | 문제 ID (필수) | `001` |
| `function` | 함수 표현식 (필수, URL 인코딩) | `x^2` → `x%5E2` |
| `xMin` | X축 최소값 | `-10` |
| `xMax` | X축 최대값 | `10` |
| `yMin` | Y축 최소값 | `-10` |
| `yMax` | Y축 최대값 | `10` |
| `title` | 문제 제목 (선택) | `미분%20연습` |
| `instructions` | 안내 메시지 (선택) | `접선을%20찾아보세요` |

### postMessage 통신

#### 앱 → Moodle

```javascript
// 앱이 준비되었을 때
{
  type: 'DRAG_TO_SLOPE_READY',
  timestamp: 1234567890
}

// 학습 진행 상황
{
  type: 'DRAG_TO_SLOPE_PROGRESS',
  progress: 50, // 0-100
  timestamp: 1234567890
}

// 학습 완료
{
  type: 'DRAG_TO_SLOPE_RESPONSE',
  data: {
    problemId: '001',
    timestamp: 1234567890,
    interactions: [
      { x: 2.5, y: 6.25, slope: 5.0, time: 1234567890 }
    ],
    completed: true
  }
}
```

#### Moodle → 앱

```javascript
// Moodle에서 명령 전송
window.frames[0].postMessage({
  type: 'MOODLE_COMMAND',
  payload: {
    action: 'reset' // 또는 다른 명령
  }
}, '*');
```

### PHP 연동 예시 (Moodle 3.7)

```php
<?php
// Moodle 활동 모듈에서 iframe 생성
$problem_id = required_param('id', PARAM_INT);
$function = 'x^2 + 2*x - 1'; // DB에서 가져온 함수

$iframe_url = "https://your-domain.com/?" . http_build_query([
    'problemId' => $problem_id,
    'function' => $function,
    'xMin' => -10,
    'xMax' => 10,
    'yMin' => -10,
    'yMax' => 10
]);

echo html_writer::tag('iframe', '', [
    'src' => $iframe_url,
    'width' => '100%',
    'height' => '600px',
    'style' => 'border: none;'
]);
?>

<script>
// 학습 결과 수신
window.addEventListener('message', function(event) {
    if (event.data.type === 'DRAG_TO_SLOPE_RESPONSE') {
        // AJAX로 Moodle DB에 저장
        fetch('/local/dragslope/save_response.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(event.data.data)
        });
    }
});
</script>
```

## 사용 방법

1. **함수 선택**: 우측 상단 메뉴 버튼(☰)을 눌러 함수를 선택하거나 직접 입력
2. **드래그**: 그래프 위를 터치하거나 드래그하여 접선 확인
3. **학습**: 다양한 지점에서 접선의 기울기(미분값) 관찰
4. **완료**: 충분히 학습한 후 "완료" 버튼으로 결과 제출

## 지원 함수 문법

Math.js 문법을 사용합니다:

- **기본 연산**: `+`, `-`, `*`, `/`
- **거듭제곱**: `x^2`, `x^3`
- **삼각함수**: `sin(x)`, `cos(x)`, `tan(x)`
- **지수/로그**: `e^x`, `exp(x)`, `log(x)`, `ln(x)`
- **괄호**: `(2*x + 1)^2`

### 예시

```
x^2 + 2*x - 1
sin(x) + cos(x)
x^3 - 3*x^2 + 2
e^x * x
1/x
sqrt(x)
```

## 시스템 요구사항

### 서버
- Node.js 16+ (빌드용)
- 정적 파일 호스팅 (Nginx, Apache 등)

### Moodle
- Moodle 3.7+
- PHP 7.1.9+
- MySQL 5.7+

### 클라이언트
- 모던 브라우저 (Chrome, Safari, Firefox, Edge)
- JavaScript 활성화
- Canvas API 지원
- 터치스크린 (모바일) 또는 마우스

## 라이선스

MIT License

## 개발자

KAIST Touch Math Academy

## 지원

문의사항은 이슈 트래커를 이용해주세요.
