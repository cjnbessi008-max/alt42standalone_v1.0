# 🌊 Peak Smoke - 수학 학습 위젯

**Moodle LMS 연동 · 함수의 극값을 연기 효과로 시각화**

## 📋 프로젝트 개요

Peak Smoke는 Moodle LMS와 연동하여 수학 함수의 극대값과 극소값을 아름다운 연기 효과로 시각화하는 교육용 웹 애플리케이션입니다. 우측 하단에 가상 스마트폰 화면으로 표시되며, 학습자가 직관적으로 극값을 이해할 수 있도록 돕습니다.

## ✨ 주요 기능

### 1. 🎨 실시간 그래프 시각화
- Canvas 기반 고성능 렌더링
- 부드러운 곡선 그래프
- 축, 그리드, 레이블 자동 생성

### 2. 🔍 자동 극값 탐지
- 수치 미분을 통한 정확한 극값 계산
- 극대값 (빨간색) / 극소값 (청록색) 구분
- 전역 최대/최소값 자동 식별

### 3. 💨 연기 파티클 효과
- 극값 지점에서 연기가 피어오르는 애니메이션
- 극대는 빨간 연기, 극소는 청록 연기
- 실시간 파티클 시스템

### 4. 📱 스마트폰 위젯 UI
- iPhone 스타일 프레임 디자인
- 우측 하단 고정 배치
- 반응형 디자인 (모바일 대응)

### 5. 🔗 Moodle LMS 연동
- Moodle 3.7 Web Service API 호출
- 문제 정보 자동 로드
- 학습 진행도 저장 (선택사항)

## 🚀 빠른 시작

### 1. 파일 구조

```
peak-smoke-widget/
├── index.html              # 메인 페이지
├── css/
│   ├── smartphone.css      # 스마트폰 UI 스타일
│   └── smoke-effect.css    # 연기 효과 CSS
├── js/
│   ├── moodle-api.js       # Moodle API 연동
│   ├── peak-detector.js    # 극값 탐지 엔진
│   ├── smoke-animator.js   # 연기 애니메이션
│   └── app.js              # 메인 애플리케이션
└── README.md
```

### 2. 설치 및 실행

```bash
# 1. 웹 서버에 파일 배치
cd /path/to/webserver/htdocs
cp -r peak-smoke-widget .

# 2. 브라우저로 접속
open http://localhost/peak-smoke-widget/index.html
```

또는 간단히 `index.html`을 브라우저로 직접 열어도 됩니다.

### 3. 기본 사용법

#### 3.1 함수 입력
```javascript
// JavaScript 형식으로 입력
x*x - 4*x + 3                    // 이차함수
x*x*x - 6*x*x + 9*x + 1         // 삼차함수
Math.sin(x) + Math.cos(x)       // 삼각함수
```

#### 3.2 범위 설정
- **X 범위 (최소)**: -2
- **X 범위 (최대)**: 6

#### 3.3 그래프 생성
"🚀 그래프 생성 및 극값 찾기" 버튼 클릭

## 🔧 Moodle 연동 설정

### 1. Moodle Web Service 활성화

```bash
# Moodle 관리자 페이지에서
사이트 관리 > 플러그인 > 웹 서비스 > 외부 서비스
- "활성화" 체크
- 프로토콜: REST
```

### 2. API 토큰 생성

```bash
사이트 관리 > 플러그인 > 웹 서비스 > 토큰 관리
- 사용자 선택
- 서비스 선택
- 토큰 생성
```

### 3. JavaScript에서 설정

```javascript
// js/app.js에서 Moodle API 설정
window.moodleAPI.baseUrl = 'https://your-moodle.com';
window.moodleAPI.token = 'your-token-here';

// 또는 UI에서 직접 입력
document.getElementById('moodleUrl').value = 'https://your-moodle.com/webservice/rest/server.php';
document.getElementById('problemId').value = '12345';
```

### 4. 문제 데이터 형식

Moodle 문제 텍스트에 다음 형식으로 함수 정보를 포함:

```
함수 f(x) = x^2 - 4x + 3의 극값을 구하시오.
범위는 [-2, 6]입니다.
```

시스템이 자동으로 파싱하여 그래프를 생성합니다.

## 📚 API 레퍼런스

### PeakDetector

```javascript
// 극값 찾기
const peaks = peakDetector.findPeaks(
    'x*x - 4*x + 3',  // 함수
    -2,                // 최소값
    6,                 // 최대값
    0.01               // 샘플링 간격
);

// 결과
[
    { x: 2.0, y: -1.0, type: 'minimum', curvature: 2.0 }
]
```

### SmokeAnimator

```javascript
// 애니메이션 시작
smokeAnimator.start(graphData, peaks);

// 중지
smokeAnimator.stop();

// 클리어
smokeAnimator.clear();
```

### MoodleAPI

```javascript
// 문제 로드
const problem = await moodleAPI.getProblem('12345');

// 진행도 저장
await moodleAPI.submitProgress(userId, problemId, {
    score: 100,
    peaksFound: 2
});
```

## 🎯 사용 예제

### 예제 1: 이차함수

```javascript
함수: x*x - 4*x + 3
범위: [-2, 6]
극값: 최소값 (2, -1)
```

### 예제 2: 삼차함수

```javascript
함수: x*x*x - 6*x*x + 9*x + 1
범위: [-1, 5]
극값: 최대값 (1, 5), 최소값 (3, 1)
```

### 예제 3: 삼각함수

```javascript
함수: Math.sin(x) + Math.cos(x)
범위: [0, 2*Math.PI]
극값: 최대값 (π/4, √2), 최소값 (5π/4, -√2)
```

## 🛠️ 기술 스택

- **Frontend**: Vanilla JavaScript (ES6+)
- **Canvas API**: 그래프 렌더링
- **CSS3**: 애니메이션 및 스타일
- **Moodle**: 3.7 (PHP 7.1.9, MySQL 5.7)
- **Web Service**: REST API

## 📱 반응형 디자인

| 디바이스 | 화면 크기 | 레이아웃 |
|---------|----------|---------|
| Desktop | > 768px | 우측 하단 고정 |
| Tablet | 481-768px | 우측 하단 축소 |
| Mobile | < 480px | 중앙 배치 |

## 🎨 커스터마이징

### 연기 색상 변경

```css
/* css/smoke-effect.css */
.smoke-particle.maximum {
    background: radial-gradient(circle,
        rgba(255, 107, 107, 0.8) 0%,  /* 빨간색 -> 원하는 색으로 */
        rgba(255, 107, 107, 0) 100%);
}
```

### 스마트폰 크기 조정

```css
/* css/smartphone.css */
.smartphone-frame {
    width: 320px;  /* 원하는 크기로 */
    height: 640px;
}
```

## 🐛 트러블슈팅

### 문제 1: 그래프가 표시되지 않음
- 함수 문법 확인 (JavaScript 형식)
- 범위 값이 유효한지 확인
- 브라우저 콘솔에서 오류 확인

### 문제 2: Moodle 연결 실패
- Web Service가 활성화되어 있는지 확인
- 토큰이 유효한지 확인
- CORS 설정 확인

### 문제 3: 극값이 잘못 표시됨
- 샘플링 간격 조정 (기본 0.01)
- 함수 범위 확인
- 복잡한 함수는 범위를 좁게 설정

## 🔐 보안 고려사항

1. **입력 검증**: 함수 문자열 파싱 시 악의적인 코드 방지
2. **API 토큰**: 클라이언트에 노출되지 않도록 주의
3. **CORS**: 동일 출처 정책 확인
4. **HTTPS**: 프로덕션 환경에서 필수

## 📄 라이선스

MIT License - 자유롭게 사용, 수정, 배포 가능

## 🙏 기여

이슈 및 풀 리퀘스트 환영합니다!

## 📞 문의

문제가 있거나 제안사항이 있으시면 이슈를 등록해주세요.

---

**Made with ❤️ for Mathematics Education**
