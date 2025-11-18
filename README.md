# 회전체 생성 시뮬레이션 (Rotational Sweep Animation)

Moodle LMS와 연동되는 3D 회전체 생성 교육용 웹 애플리케이션

## 🎯 개요

이 애플리케이션은 수학 교육을 위한 대화형 3D 시각화 도구로, 함수를 회전축 중심으로 회전시켜 생성되는 회전체를 스파이럴 애니메이션으로 보여줍니다.

### 주요 기능

- 📱 **가상 스마트폰 화면**: 우측 하단에 표시되는 실감나는 모바일 뷰포트
- 🎨 **3D 스파이럴 애니메이션**: Three.js 기반 부드러운 회전체 생성 과정
- 🔗 **Moodle LMS 연동**: 문제 정보 자동 로드 및 학습 진도 추적
- ⚙️ **실시간 매개변수 조정**: 회전 속도, 나선 피치, 세그먼트 수 조절
- 📊 **진도 추적**: 학생 활동 자동 기록 및 LMS 전송

## 🛠️ 기술 스택

### 프론트엔드
- **Three.js** (r128): 3D 그래픽 렌더링
- **Vanilla JavaScript**: 경량화된 순수 자바스크립트
- **HTML5/CSS3**: 반응형 UI 및 스마트폰 프레임

### 백엔드 연동
- **Moodle LMS 3.7+**
- **MySQL 5.7**
- **PHP 7.1.9**
- **Moodle Web Services API**

## 📁 프로젝트 구조

```
alt42standalone_v1.0/
├── index.html                      # 메인 HTML 페이지
├── styles.css                      # 스타일시트 (스마트폰 UI 포함)
├── js/
│   ├── app.js                      # 메인 애플리케이션 컨트롤러
│   ├── rotational-sweep.js         # Three.js 회전체 애니메이션 엔진
│   └── lms-integration.js          # Moodle LMS 연동 모듈
├── tasks/
│   └── 0001-prd-ai-education-pipeline.md
└── README.md
```

## 🚀 설치 및 실행

### 1. 기본 실행 (데모 모드)

```bash
# 프로젝트 클론
git clone <repository-url>
cd alt42standalone_v1.0

# 웹 서버 실행 (Python 3 기준)
python3 -m http.server 8000

# 또는 Node.js http-server 사용
npx http-server -p 8000
```

브라우저에서 `http://localhost:8000` 접속

### 2. Moodle LMS 연동

#### Moodle 웹 서비스 설정

1. **Moodle 관리자 페이지** → 사이트 관리 → 플러그인 → 웹 서비스
2. **웹 서비스 활성화**:
   - 프로토콜 활성화: REST 프로토콜 활성화
   - 외부 서비스 생성: "Rotational Sweep Service"

3. **필요한 함수 추가**:
   ```
   - core_webservice_get_site_info
   - local_rotationalsweep_get_problem
   - local_rotationalsweep_submit_progress
   ```

4. **사용자에게 토큰 발급**

#### URL 매개변수로 연동

```
http://localhost:8000/index.html?token=YOUR_TOKEN&problemid=123&userid=456&lms_url=https://your-moodle-site.com
```

**매개변수 설명**:
- `token`: Moodle 웹 서비스 토큰
- `problemid`: 불러올 문제 ID
- `userid`: 학생 사용자 ID
- `lms_url`: Moodle 사이트 URL (선택사항)

### 3. Moodle 플러그인 개발 (선택사항)

`/local/rotationalsweep/` 디렉토리 구조:

```php
local/rotationalsweep/
├── version.php
├── db/
│   ├── access.php
│   ├── install.xml
│   └── services.php
├── classes/
│   └── external/
│       ├── get_problem.php
│       └── submit_progress.php
└── externallib.php
```

## 🎮 사용 방법

### 기본 조작

1. **애니메이션 시작**: "애니메이션 시작" 버튼 클릭 또는 **Space** 키
2. **리셋**: "리셋" 버튼 클릭 또는 **R** 키
3. **와이어프레임 토글**: "와이어프레임 토글" 버튼 또는 **W** 키

### 매개변수 조정

- **회전 속도**: 애니메이션 재생 속도 조절 (0.5x ~ 5.0x)
- **나선 피치**: 스파이럴 효과 강도 조절 (0.1 ~ 2.0)
- **세그먼트 수**: 3D 메시 정밀도 조절 (16 ~ 128)

### 문제 유형 예시

```javascript
{
    "id": "PROB-001",
    "curveFunction": "x^2",      // 곡선 함수
    "rotationAxis": "x",         // 회전축
    "bounds": {
        "start": 0,              // 시작 범위
        "end": 2                 // 끝 범위
    },
    "parameters": {
        "rotationSpeed": 2.0,
        "spiralPitch": 0.5,
        "segments": 64
    }
}
```

## 📱 스마트폰 디스플레이

우측 하단의 가상 스마트폰 화면은 다음과 같은 특징이 있습니다:

- **해상도**: 320x640 픽셀 (모바일 최적화)
- **프레임**: 현실적인 스마트폰 베젤 및 노치
- **진도 표시**: 하단 진행 바로 애니메이션 진척도 표시
- **반응형**: 작은 화면에서는 상단으로 이동

## 🔧 커스터마이징

### 지원되는 함수

기본 제공 함수 (곡선):
- `x^2` 또는 `x**2`: 포물선
- `sqrt(x)`: 제곱근 함수
- `sin(x)`: 사인 함수
- `x`: 선형 함수
- 상수 값 (예: `2.5`)

### 확장하기

`rotational-sweep.js`의 `parseCurveFunction()` 메서드를 수정하여 더 복잡한 함수 추가:

```javascript
parseCurveFunction(funcString) {
    if (funcString === 'custom') {
        return (x) => Math.exp(-x) * Math.cos(x);
    }
    // ... 기존 코드
}
```

## 📊 LMS 데이터 추적

애플리케이션은 다음 이벤트를 Moodle로 전송합니다:

1. **animation_started**: 애니메이션 시작 시점
2. **animation_completed**: 애니메이션 완료 시점
3. **animation_reset**: 리셋 버튼 클릭
4. **parameter_changed**: 매개변수 변경

### 데이터 구조

```javascript
{
    "event": "animation_completed",
    "problemId": "PROB-001",
    "timestamp": 1700000000000,
    "progress": 1.0,
    "parameters": {
        "rotationSpeed": 2.0,
        "spiralPitch": 0.5,
        "segments": 64
    },
    "completed": true
}
```

## 🎨 UI 컴포넌트

### 스마트폰 프레임 CSS

```css
.smartphone-frame {
    width: 320px;
    height: 640px;
    background: #1a1a1a;
    border-radius: 35px;
    box-shadow: 0 30px 80px rgba(0, 0, 0, 0.5);
}
```

### Three.js 컨테이너

```css
#three-container {
    width: 100%;
    height: calc(100% - 60px);
}
```

## 🔐 보안 고려사항

- **토큰 보안**: Moodle 토큰은 sessionStorage에 저장
- **CORS 설정**: Moodle 서버에서 적절한 CORS 헤더 설정 필요
- **입력 검증**: 모든 매개변수는 클라이언트 측에서 검증

```php
// Moodle CORS 설정 예시 (config.php)
header('Access-Control-Allow-Origin: https://your-app-domain.com');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
```

## 🐛 디버깅

브라우저 콘솔에서 디버그 정보 확인:

```javascript
// LMS 연결 상태 확인
console.log(window.app.lms);

// 현재 문제 정보
console.log(window.app.currentProblem);

// Three.js 씬 정보
console.log(window.app.rotationalSweep.scene);
```

## 📈 성능 최적화

- **세그먼트 수 조절**: 모바일에서는 32 이하 권장
- **프레임 제한**: 60fps 제한으로 배터리 절약
- **텍스처 최적화**: 작은 해상도 텍스처 사용

## 🌐 브라우저 호환성

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+
- ⚠️ IE 11: 지원 안 함 (WebGL 2 필요)

## 📝 라이선스

이 프로젝트는 교육 목적으로 개발되었습니다.

## 🤝 기여

KAIST Touch Math Academy를 위한 프로젝트입니다.

## 📧 문의

문제 발생 시 GitHub Issues를 통해 문의해주세요.

---

## 🔄 업데이트 로그

### v1.0.0 (2025-11-18)
- ✨ 초기 릴리스
- 📱 스마트폰 UI 구현
- 🎨 Three.js 회전체 애니메이션
- 🔗 Moodle LMS 연동
- ⚡ 실시간 매개변수 조정

---

**Made with ❤️ for KAIST Touch Math Academy**
