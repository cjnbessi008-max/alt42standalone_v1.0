# 🫁 Breathing Curve - 숨쉬는 함수 그래프

함수의 증가/감소를 숨결처럼 부드럽게 표현하는 웹 기반 수학 교육 앱

## 📱 개요

**Breathing Curve**는 Moodle LMS와 연동되어 동작하는 인터랙티브 수학 시각화 도구입니다. 우측 하단에 가상 스마트폰 화면 형태로 표시되며, 함수 그래프가 숨쉬듯이 부드럽게 움직이는 애니메이션을 제공합니다.

### 주요 특징

- ✅ **Breathing 애니메이션**: 함수의 증가/감소 구간이 숨결처럼 부드럽게 표현
- ✅ **스마트폰 UI**: 우측 하단 가상 모바일 디바이스 화면
- ✅ **Moodle 연동**: LMS에서 문제 정보를 받아 동작
- ✅ **다양한 함수 지원**: 2차, 3차, 삼각 함수 등
- ✅ **실시간 시각화**: Canvas 기반 부드러운 애니메이션

## 🛠 기술 스택

- **Frontend**: HTML5, JavaScript (Canvas API)
- **Backend**: PHP 7.1.9+
- **Database**: MySQL 5.7
- **LMS**: Moodle 3.7+

## 📂 프로젝트 구조

```
alt42standalone_v1.0/
├── breathing-curve-demo.html          # 독립형 데모 버전
├── moodle-integration/                # Moodle 플러그인
│   ├── version.php                    # 플러그인 버전 정보
│   ├── view.php                       # 메인 뷰 페이지
│   ├── db/
│   │   └── access.php                 # 권한 설정
│   ├── api/
│   │   └── get_problem.php            # 문제 데이터 API
│   └── js/
│       └── breathing-curve.js         # 애니메이션 엔진
└── README-BreathingCurve.md           # 이 파일
```

## 🚀 설치 방법

### 1. 독립형 데모 실행

가장 빠르게 테스트할 수 있는 방법:

```bash
# 웹 브라우저로 파일 열기
open breathing-curve-demo.html
```

또는 로컬 웹 서버 실행:

```bash
# Python 3
python3 -m http.server 8000

# PHP
php -S localhost:8000
```

그리고 브라우저에서 `http://localhost:8000/breathing-curve-demo.html` 접속

### 2. Moodle 플러그인 설치

#### 요구사항
- Moodle 3.5 이상 (3.7 권장)
- PHP 7.1.9 이상
- MySQL 5.7 이상

#### 설치 단계

1. **플러그인 파일 복사**

```bash
# Moodle 설치 디렉토리로 이동
cd /path/to/moodle

# breathing_curve 플러그인 디렉토리 생성
mkdir -p local/breathing_curve

# 파일 복사
cp -r /path/to/alt42standalone_v1.0/moodle-integration/* local/breathing_curve/
```

2. **권한 설정**

```bash
# Moodle 웹 서버 사용자에게 권한 부여 (예: www-data)
chown -R www-data:www-data local/breathing_curve
chmod -R 755 local/breathing_curve
```

3. **Moodle 관리자 페이지에서 설치**

- Moodle 관리자로 로그인
- `사이트 관리 > 알림` 페이지로 이동
- "데이터베이스 업그레이드" 버튼 클릭
- Breathing Curve 플러그인이 설치됨을 확인

4. **플러그인 설정**

- `사이트 관리 > 플러그인 > 로컬 플러그인 > Breathing Curve`로 이동
- 필요한 설정 조정

## 📖 사용 방법

### 독립형 버전

1. `breathing-curve-demo.html` 파일을 브라우저로 엽니다
2. 버튼을 클릭하여 다양한 함수 유형을 선택합니다
3. 그래프가 숨쉬듯이 움직이는 애니메이션을 관찰합니다

**Breathing 효과 이해하기:**
- **파란색 (증가 구간)**: 함수가 증가하는 부분이 확장됨
- **빨간색 (감소 구간)**: 함수가 감소하는 부분이 수축됨
- **초록/노란 점**: 극댓값/극솟값 표시

### Moodle 연동 버전

#### 1. 과정에 Breathing Curve 추가

```php
// Moodle 과정 페이지에서 활동 추가
// "활동 또는 리소스 추가" > "Breathing Curve" 선택
```

#### 2. URL 파라미터로 문제 지정

```
https://your-moodle.com/local/breathing_curve/view.php?qid=123&courseid=456
```

- `qid`: Moodle 문제 ID
- `courseid`: 과정 ID

#### 3. JavaScript API로 프로그래매틱 제어

```javascript
// 문제 데이터 전달
receiveProblemFromLMS({
    type: 'quadratic',
    title: '2차 함수의 특성',
    equation: 'f(x) = -0.5(x - 3)² + 4',
    description: '증가/감소 구간을 관찰하세요'
});

// 애니메이션 제어
pauseBreathingAnimation();   // 일시정지
resumeBreathingAnimation();  // 재개
changeFunction('sine');      // 함수 변경
```

## 🔌 API 사용법

### GET /api/get_problem.php

문제 데이터를 Moodle에서 가져옵니다.

**요청:**
```http
GET /local/breathing_curve/api/get_problem.php?qid=123&courseid=456
```

**응답:**
```json
{
    "success": true,
    "problem": {
        "id": 123,
        "type": "quadratic",
        "title": "2차 함수의 특성",
        "description": "다음 함수의 증가/감소 구간을 관찰하세요",
        "equation": "f(x) = -0.5(x - 3)² + 4",
        "difficulty": "medium",
        "hints": [
            "극값을 찾아보세요",
            "도함수를 구해보세요"
        ]
    },
    "metadata": {
        "course_id": 456,
        "question_id": 123,
        "timestamp": 1700000000,
        "version": "1.0"
    }
}
```

## 🎨 커스터마이징

### 함수 추가하기

`js/breathing-curve.js` 파일의 `functions` 객체에 새로운 함수를 추가:

```javascript
const functions = {
    // ... 기존 함수들 ...

    exponential: {
        name: '지수 함수',
        func: (x) => Math.exp(x / 3),
        derivative: (x) => Math.exp(x / 3) / 3,
        range: { min: -2, max: 5 },
        yRange: { min: -1, max: 5 }
    }
};
```

### 애니메이션 속도 조정

```javascript
// breathing-curve.js의 animate() 함수 내부
breathPhase += 0.03; // 이 값을 조정 (크게 = 빠르게, 작게 = 느리게)
```

### 색상 테마 변경

```javascript
// getColorForDerivative() 함수 수정
function getColorForDerivative(derivative, breathPhase) {
    // 증가 구간 색상
    if (derivative > 0) {
        return { color: 'rgba(YOUR_R, YOUR_G, YOUR_B, alpha)' };
    }
    // 감소 구간 색상
    else {
        return { color: 'rgba(YOUR_R, YOUR_G, YOUR_B, alpha)' };
    }
}
```

## 🧪 테스트

### 브라우저 콘솔에서 테스트

```javascript
// 함수 변경 테스트
changeFunction('sine');
changeFunction('cubic');
changeFunction('quadratic');

// LMS 데이터 수신 테스트
receiveProblemFromLMS({
    type: 'sine',
    title: '삼각 함수 문제',
    equation: 'f(x) = 3sin(x/2) + 2'
});

// 애니메이션 제어 테스트
pauseBreathingAnimation();
setTimeout(() => resumeBreathingAnimation(), 3000); // 3초 후 재개
```

## 🔧 문제 해결

### 문제: 애니메이션이 보이지 않음

**해결:**
1. 브라우저 콘솔에서 에러 확인
2. Canvas 요소가 제대로 로드되었는지 확인
3. JavaScript 파일 경로 확인

### 문제: Moodle에서 "Permission denied" 오류

**해결:**
1. 파일 권한 확인: `chmod 755 local/breathing_curve`
2. Moodle 사용자 권한 확인: `사이트 관리 > 사용자 > 권한`
3. `db/access.php` 설정 확인

### 문제: API가 404 오류 반환

**해결:**
1. Moodle config.php의 `$CFG->wwwroot` 확인
2. API 파일 경로 확인: `/local/breathing_curve/api/get_problem.php`
3. .htaccess 또는 nginx 설정 확인

## 📊 지원하는 함수 유형

| 유형 | 함수 예시 | 특징 |
|------|----------|------|
| 2차 함수 (quadratic) | f(x) = -0.5(x-3)² + 4 | 포물선, 1개의 극값 |
| 3차 함수 (cubic) | f(x) = 0.1(x-3)³ - 0.5(x-3) + 2 | 변곡점, 최대 2개의 극값 |
| 삼각 함수 (sine) | f(x) = 3sin(x/2) + 2 | 주기적 증가/감소 |

## 🤝 기여하기

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 라이선스

GNU GPL v3 or later

## 👥 제작

**KAIST Touch Math Academy**
- Copyright 2024

## 📞 문의

문제가 발생하거나 개선 사항이 있으면 GitHub Issues를 통해 알려주세요.

---

Made with ❤️ for better math education
