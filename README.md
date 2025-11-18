# Extrema Blink - 극값 시각화 학습 앱

함수의 극값(극대, 극소)을 찾아 반짝이는 애니메이션과 함께 표시하는 수학 학습 웹 애플리케이션입니다. Moodle LMS와 연동하여 학생들의 학습 진행도를 추적합니다.

## 주요 기능

### 1. 극값 계산 및 시각화
- 수학 함수를 입력하면 자동으로 극값 계산
- 수치 미분을 이용한 정확한 극값 탐색
- Newton-Raphson 방법으로 임계점 계산

### 2. Extrema Blink 애니메이션
- 극값이 발견되면 반짝이는 애니메이션 효과
- 극대점(녹색)과 극소점(빨간색) 구분 표시
- 순차적으로 나타나는 시각적 효과

### 3. 가상 스마트폰 화면
- 우측 하단에 고정된 스마트폰 UI
- 반응형 디자인으로 다양한 화면 크기 지원
- 실제 스마트폰처럼 노치와 홈 버튼 포함

### 4. Moodle LMS 연동
- MySQL 데이터베이스를 통한 문제 관리
- 학생 답안 제출 및 자동 채점
- 학습 진행도 추적

## 기술 스택

### Frontend
- **HTML5/CSS3**: 반응형 UI
- **JavaScript (ES6+)**: 모듈화된 코드 구조
- **Plotly.js**: 고성능 그래프 렌더링
- **Web Audio API**: 사운드 효과

### Backend
- **PHP 7.1.9**: 서버 사이드 로직
- **MySQL 5.7**: 데이터베이스
- **PDO**: 안전한 데이터베이스 연결

### LMS
- **Moodle 3.7**: 학습 관리 시스템 연동

## 프로젝트 구조

```
alt42standalone_v1.0/
├── public/                    # 웹 애플리케이션 루트
│   ├── index.html            # 메인 HTML
│   ├── css/
│   │   └── style.css         # 스타일시트
│   └── js/
│       ├── app.js            # 메인 앱 로직
│       ├── math-renderer.js  # 그래프 렌더링
│       ├── extrema-calculator.js  # 극값 계산
│       └── animation.js      # 블링크 애니메이션
├── api/                      # PHP 백엔드 API
│   ├── config.php            # 데이터베이스 설정
│   ├── get-problems.php      # 문제 조회 API
│   ├── submit-answer.php     # 답안 제출 API
│   └── schema.sql            # 데이터베이스 스키마
└── README.md                 # 프로젝트 문서
```

## 설치 방법

### 1. 시스템 요구사항
- Apache/Nginx 웹 서버
- PHP 7.1.9 이상
- MySQL 5.7 이상
- Moodle 3.7 (선택사항)

### 2. 데이터베이스 설정

```bash
# MySQL 접속
mysql -u root -p

# 데이터베이스 생성
CREATE DATABASE moodle CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# 스키마 임포트
mysql -u root -p moodle < api/schema.sql
```

### 3. PHP 설정

`api/config.php` 파일에서 데이터베이스 연결 정보를 수정하세요:

```php
define('DB_HOST', 'localhost');
define('DB_NAME', 'moodle');
define('DB_USER', 'your_username');
define('DB_PASS', 'your_password');
```

### 4. 웹 서버 설정

#### Apache (.htaccess)

```apache
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteBase /
    RewriteRule ^index\.html$ - [L]
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteRule . /index.html [L]
</IfModule>
```

#### Nginx

```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /path/to/alt42standalone_v1.0/public;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        try_files $uri $uri/ =404;
        fastcgi_pass unix:/var/run/php/php7.1-fpm.sock;
        fastcgi_index index.php;
        include fastcgi_params;
    }
}
```

### 5. 권한 설정

```bash
# 웹 서버가 읽을 수 있도록 권한 설정
chmod -R 755 public/
chmod -R 755 api/
```

## 사용 방법

### 기본 사용

1. 브라우저에서 `http://localhost/` 접속
2. 함수 입력 (예: `x^2 - 4*x + 3`)
3. X 범위 설정 (예: -5 ~ 5)
4. "그래프 그리기" 버튼 클릭
5. "극값 표시" 버튼 클릭하여 애니메이션 확인

### 지원하는 함수 형식

```javascript
// 기본 연산
x^2 - 4*x + 3          // 이차함수
x^3 - 3*x^2 - 9*x      // 삼차함수
2*x^4 - 8*x^2          // 사차함수

// 삼각함수
sin(x)
cos(x)
tan(x)
sin(x) + 0.5*cos(2*x)

// 지수/로그 함수
exp(x)                 // e^x
log(x)                 // ln(x)
sqrt(x)                // √x
```

### Moodle 연동

#### 문제 불러오기

```javascript
// JavaScript에서 호출
app.loadProblemFromMoodle(1); // 문제 ID = 1
```

#### API 직접 호출

```bash
# 문제 조회
curl http://localhost/api/get-problems.php?id=1

# 답안 제출
curl -X POST http://localhost/api/submit-answer.php \
  -H "Content-Type: application/json" \
  -d '{
    "problemId": 1,
    "userId": 1001,
    "answers": [
      {"x": 2, "y": -1, "type": "minimum"}
    ]
  }'
```

## 극값 계산 알고리즘

### 1. 수치 미분 (중앙 차분법)

```
f'(x) ≈ [f(x + ε) - f(x - ε)] / (2ε)
```

### 2. 임계점 탐색

- 그리드 샘플링으로 도함수 부호 변화 지점 탐지
- Newton-Raphson 방법으로 정확한 위치 계산

### 3. 극값 판별 (2차 도함수 테스트)

```
f''(x) > 0  →  극소 (minimum)
f''(x) < 0  →  극대 (maximum)
f''(x) = 0  →  변곡점 (inflection point)
```

## 커스터마이징

### 애니메이션 속도 조정

```javascript
// js/animation.js
extremaAnimator.setAnimationDelay(500); // 500ms 지연
```

### 블링크 효과 변경

```css
/* css/style.css */
@keyframes blink-pulse {
    /* 애니메이션 키프레임 수정 */
}
```

### 색상 테마 변경

```css
/* css/style.css */
:root {
    --primary-color: #667eea;
    --maximum-color: #52c41a;
    --minimum-color: #ff4d4f;
}
```

## 문제 해결

### 그래프가 그려지지 않는 경우

1. 브라우저 콘솔에서 오류 확인
2. Plotly.js 로드 확인
3. 수식 문법 확인 (예: `^` 대신 `**` 사용 가능)

### 극값이 발견되지 않는 경우

1. X 범위를 넓게 설정
2. 샘플링 개수 증가 (`extrema-calculator.js`의 `samples` 파라미터)
3. 함수가 실제로 극값을 가지는지 확인

### PHP API 연결 오류

1. `api/config.php`의 데이터베이스 정보 확인
2. MySQL 서비스 실행 여부 확인
3. PHP 오류 로그 확인 (`error_log`)

## 개발 로드맵

### Phase 1: 기본 기능 ✅
- [x] 함수 그래프 렌더링
- [x] 극값 계산 알고리즘
- [x] Extrema Blink 애니메이션
- [x] 스마트폰 UI 디자인

### Phase 2: LMS 연동 ✅
- [x] MySQL 데이터베이스 스키마
- [x] PHP API 구현
- [x] 답안 제출 및 채점
- [x] 학습 진행도 추적

### Phase 3: 향상 기능 (예정)
- [ ] 실시간 협업 학습
- [ ] AI 힌트 시스템
- [ ] 다국어 지원
- [ ] 모바일 앱 버전

## 라이선스

이 프로젝트는 교육 목적으로 개발되었습니다.

## 기여

버그 리포트나 기능 제안은 이슈로 등록해주세요.

## 참고 자료

- [Plotly.js Documentation](https://plotly.com/javascript/)
- [Moodle Developer Documentation](https://docs.moodle.org/dev/)
- [Numerical Differentiation](https://en.wikipedia.org/wiki/Numerical_differentiation)
- [Newton-Raphson Method](https://en.wikipedia.org/wiki/Newton%27s_method)
