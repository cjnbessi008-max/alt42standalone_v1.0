# 접선 경사도 색감 시각화 - Gradient Color

Moodle LMS와 연동되는 수학 시각화 웹 애플리케이션으로, 함수의 접선 경사도를 직관적인 색상 변화로 표현합니다.

## 주요 기능

### 1. 접선 경사도 색상 매핑 (Gradient Color)
- **경사도에 따른 자동 색상 변화**
  - 급격한 하강(음수 경사) → 파란색
  - 평평한 구간(0에 가까운 경사) → 초록/노란색
  - 급격한 상승(양수 경사) → 빨간색

### 2. 가상 스마트폰 화면
- 우측 하단에 실제 스마트폰 UI 재현
- 터치 인터페이스 시뮬레이션
- 반응형 디자인 지원

### 3. Moodle LMS 연동
- MySQL 5.7 데이터베이스 연결
- PHP 7.1.9 백엔드 API
- Moodle 3.7 WebService API 통합
- 실시간 문제 불러오기 및 답안 제출

### 4. 다양한 함수 지원
- 이차함수 (y = x²)
- 삼차함수 (y = x³ - 2x)
- 사인함수 (y = sin(x))
- 지수함수 (y = eˣ)
- 사용자 정의 함수

## 기술 스택

### 프론트엔드
- **HTML5** - 시맨틱 마크업
- **CSS3** - 그라디언트, 애니메이션, Flexbox
- **JavaScript (ES6+)** - Canvas API를 이용한 그래프 렌더링

### 백엔드
- **PHP 7.1.9** - 서버사이드 로직
- **MySQL 5.7** - Moodle 데이터베이스

### 외부 연동
- **Moodle 3.7** - LMS 플랫폼
- **Moodle Web Services** - REST API

## 프로젝트 구조

```
alt42standalone_v1.0/
├── public/                 # 프론트엔드 파일
│   ├── index.html         # 메인 HTML
│   ├── css/
│   │   └── style.css      # 스타일시트
│   ├── js/
│   │   ├── gradient-color.js  # 경사도→색상 매핑 모듈
│   │   └── graph.js           # 그래프 시각화 엔진
│   └── assets/            # 리소스 파일
├── api/                   # 백엔드 API
│   ├── config.php         # 데이터베이스 설정
│   └── moodle-connector.php  # Moodle API 커넥터
└── README.md
```

## 설치 및 실행

### 1. 요구사항
- PHP 7.1.9 이상
- MySQL 5.7 이상
- Apache 또는 Nginx 웹 서버
- Moodle 3.7 설치 (선택사항)

### 2. 설정

#### 데이터베이스 설정
`api/config.php` 파일을 편집하여 데이터베이스 정보를 입력하세요:

```php
define('DB_HOST', 'localhost');
define('DB_NAME', 'moodle');
define('DB_USER', 'your_username');
define('DB_PASS', 'your_password');
```

#### Moodle 연동 설정
Moodle WebService 토큰을 생성하고 설정하세요:

```php
define('MOODLE_URL', 'http://your-moodle-site.com');
define('MOODLE_TOKEN', 'your_webservice_token');
```

#### 개발 모드
실제 데이터베이스 없이 테스트하려면:

```php
define('DEV_MODE', true);
```

### 3. 실행

#### 로컬 개발 서버 (PHP 내장)
```bash
cd public
php -S localhost:8000
```

브라우저에서 `http://localhost:8000` 접속

#### Apache 설정
DocumentRoot를 `public/` 디렉토리로 설정:

```apache
<VirtualHost *:80>
    ServerName gradient-color.local
    DocumentRoot /path/to/alt42standalone_v1.0/public

    <Directory /path/to/alt42standalone_v1.0/public>
        AllowOverride All
        Require all granted
    </Directory>
</VirtualHost>
```

## 사용 방법

### 1. 기본 사용
1. 브라우저에서 애플리케이션 접속
2. 좌측 패널에서 함수 선택
3. 슬라이더를 움직여 접선의 위치 조정
4. 우측 스마트폰 화면에서 실시간 시각화 확인

### 2. Moodle 문제 불러오기
1. "Moodle 문제 불러오기" 버튼 클릭
2. LMS에서 문제 정보 자동 로드
3. 문제에 맞는 그래프 자동 설정

### 3. 색상 범례 읽기
- **파란색**: 급격한 하강 (경사도 < -2)
- **청록색**: 완만한 하강 (-2 < 경사도 < 0)
- **초록/노란색**: 평평한 구간 (경사도 ≈ 0)
- **주황색**: 완만한 상승 (0 < 경사도 < 2)
- **빨간색**: 급격한 상승 (경사도 > 2)

## 핵심 알고리즘

### 경사도 → 색상 변환

```javascript
// 경사도를 각도로 변환
const angle = Math.atan(slope) * (180 / Math.PI);

// 각도를 Hue 값으로 매핑 (-90° → 240, +90° → 0)
const normalizedAngle = (angle + 90) / 180;  // 0 ~ 1
const hue = 240 - (normalizedAngle * 240);   // 240 ~ 0

// HSL 색상 생성
const color = `hsl(${hue}, 80%, 50%)`;
```

### 접선 방정식 계산

```javascript
// 주어진 점 (x, y)에서의 접선
// y - y₀ = f'(x₀)(x - x₀)

const slope = derivative(x);  // 미분값 = 경사도
const y = func(x);            // 함수값
const b = y - slope * x;      // y절편

// 접선: y = slope * x + b
```

## API 명세

### 문제 정보 가져오기
```
POST /api/moodle-connector.php
Content-Type: application/json

{
  "action": "get_problem",
  "problem_id": 1  // 선택사항
}
```

**응답:**
```json
{
  "success": true,
  "problem": {
    "id": 1,
    "title": "이차함수의 접선",
    "function_type": "quadratic",
    "x_point": 2,
    "show_tangent": true,
    "answer": 4
  }
}
```

### 답안 제출
```
POST /api/moodle-connector.php
Content-Type: application/json

{
  "action": "submit_answer",
  "problem_id": 1,
  "answer": 4.0,
  "user_id": 123
}
```

**응답:**
```json
{
  "success": true,
  "correct": true,
  "user_answer": 4.0,
  "correct_answer": 4.0,
  "message": "정답입니다!"
}
```

## 브라우저 지원

- Chrome 60+
- Firefox 55+
- Safari 11+
- Edge 79+

## 개발 모드

개발 모드에서는 실제 데이터베이스 연결 없이 샘플 데이터로 동작합니다:

- 샘플 문제 4개 제공
- 답안 제출 시뮬레이션
- 콘솔 로그로 디버깅 정보 출력

## 문제 해결

### CORS 오류
Apache에서 CORS 헤더를 활성화하세요:

```apache
Header set Access-Control-Allow-Origin "*"
Header set Access-Control-Allow-Methods "GET, POST, OPTIONS"
```

### PHP 버전 확인
```bash
php -v
```

### MySQL 연결 테스트
```bash
mysql -u moodle_user -p moodle
```

## 라이선스

MIT License

## 기여자

KAIST Touch Math Academy

## 업데이트 내역

### v1.0 (2025-01-18)
- 초기 릴리스
- 접선 경사도 색상 매핑 기능
- Moodle LMS 연동
- 가상 스마트폰 UI
- 다양한 함수 지원
