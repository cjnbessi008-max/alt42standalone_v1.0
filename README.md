# Dual Derivative Sync - 도함수 실시간 동기화 시스템

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![PHP Version](https://img.shields.io/badge/PHP-7.1.9-blue)](https://php.net)
[![MySQL Version](https://img.shields.io/badge/MySQL-5.7-orange)](https://mysql.com)
[![Moodle Version](https://img.shields.io/badge/Moodle-3.7-green)](https://moodle.org)

## 📱 프로젝트 개요

**Dual Derivative Sync**는 Moodle LMS와 연동하여 수학 함수와 그 도함수를 실시간으로 동기화하여 시각화하는 교육용 웹 애플리케이션입니다. 우측 하단의 가상 스마트폰 화면에서 원함수와 도함수 그래프가 동시에 움직이며, 학생들이 미분 개념을 직관적으로 이해할 수 있도록 돕습니다.

### ✨ 주요 기능

- 🎓 **실시간 그래프 동기화**: 원함수 f(x)와 도함수 f'(x)가 동시에 표시
- 📱 **가상 스마트폰 UI**: 우측 하단에 실제 스마트폰처럼 보이는 인터페이스
- 🔗 **Moodle 3.7 연동**: LMS에서 문제 정보를 자동으로 가져오기
- 📊 **대화형 컨트롤**: X 값 조정, 애니메이션 재생/일시정지
- 💾 **학습 데이터 저장**: 학생 상호작용 및 진도 추적
- 🎯 **접선 시각화**: 현재 점에서의 접선과 기울기 표시
- 📈 **다양한 함수 지원**: 다항식, 삼각함수, 지수함수 등

## 🛠️ 기술 스택

### Frontend
- **HTML5** / **CSS3** (Responsive Design)
- **JavaScript ES6+** (Vanilla JS)
- **Chart.js 4.4** (그래프 시각화)
- **MathJax 3** (수학 표기)

### Backend
- **PHP 7.1.9**
- **MySQL 5.7**
- **Moodle 3.7** Web Services API

### 라이브러리
- Chart.js - 실시간 그래프 렌더링
- MathJax - LaTeX 수식 렌더링

## 📦 설치 가이드

### 1. 사전 요구사항

```bash
# 서버 환경
- PHP 7.1.9 이상
- MySQL 5.7 이상
- Apache/Nginx 웹 서버
- Moodle 3.7 설치 (선택사항)

# PHP 확장
- PDO
- PDO_MySQL
- cURL
- JSON
```

### 2. 프로젝트 클론

```bash
git clone https://github.com/yourusername/alt42standalone_v1.0.git
cd alt42standalone_v1.0
```

### 3. 데이터베이스 설정

```bash
# MySQL 접속
mysql -u root -p

# 데이터베이스 생성 및 스키마 적용
mysql -u root -p < sql/schema.sql
```

### 4. 설정 파일 수정

`config/database.php` 파일을 열어 데이터베이스 정보를 수정하세요:

```php
define('DB_HOST', 'localhost');
define('DB_NAME', 'derivative_sync');
define('DB_USER', 'your_username');
define('DB_PASS', 'your_password');

// Moodle 설정 (선택사항)
define('MOODLE_URL', 'https://your-moodle-site.com');
define('MOODLE_WS_TOKEN', 'your_webservice_token');
```

### 5. 디렉토리 권한 설정

```bash
# 로그 디렉토리 생성 및 권한 설정
mkdir logs
chmod 755 logs
chmod 644 config/database.php
```

### 6. 웹 서버 설정

#### Apache (.htaccess)

프로젝트 루트에 `.htaccess` 파일을 생성:

```apache
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteBase /

    # CORS 헤더
    Header set Access-Control-Allow-Origin "*"
    Header set Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS"
    Header set Access-Control-Allow-Headers "Content-Type, Authorization"
</IfModule>
```

#### Nginx

```nginx
location / {
    try_files $uri $uri/ /index.html;
}

location ~ \.php$ {
    fastcgi_pass unix:/var/run/php/php7.1-fpm.sock;
    fastcgi_index index.php;
    include fastcgi_params;
}
```

### 7. 접속

브라우저에서 다음 URL로 접속:

```
http://localhost/alt42standalone_v1.0/
```

## 📚 사용 방법

### 기본 사용법

1. **문제 불러오기**
   - "문제 불러오기" 버튼을 클릭하여 Moodle에서 문제를 가져옵니다
   - 데모 모드에서는 샘플 문제가 자동으로 로드됩니다

2. **함수 입력**
   - 함수 입력 필드에 원하는 함수를 입력 (예: `x^2`, `sin(x)`, `x^3-2*x`)
   - Enter 키를 눌러 적용

3. **그래프 탐색**
   - X 값 슬라이더를 움직여 특정 점 탐색
   - "재생" 버튼으로 애니메이션 시작
   - "일시정지"로 현재 위치에서 멈춤
   - "초기화"로 처음으로 돌아가기

4. **현재 값 확인**
   - 우측 패널에서 현재 X, f(x), f'(x), 기울기 값 확인
   - 가상 스마트폰 화면에서 그래프 동기화 확인

### 지원하는 함수 표기법

```javascript
// 다항식
"x^2"           // x²
"x^3 - 2*x"     // x³ - 2x
"2*x^2 + 3*x"   // 2x² + 3x

// 삼각함수
"sin(x)"        // sin(x)
"cos(x)"        // cos(x)
"tan(x)"        // tan(x)

// 지수/로그
"exp(x)"        // e^x
"log(x)"        // ln(x)

// 복합 함수
"x^2 + sin(x)"  // x² + sin(x)
```

## 🏗️ 프로젝트 구조

```
alt42standalone_v1.0/
├── index.html              # 메인 HTML 파일
├── css/
│   └── style.css          # 스타일시트
├── js/
│   ├── main.js            # 메인 애플리케이션 로직
│   ├── math-engine.js     # 수학 계산 엔진
│   ├── derivative-sync.js # 그래프 동기화 엔진
│   └── moodle-integration.js # Moodle 연동
├── php/
│   └── moodle-api.php     # Moodle API 핸들러
├── config/
│   └── database.php       # 데이터베이스 설정
├── sql/
│   └── schema.sql         # 데이터베이스 스키마
├── logs/                  # 로그 파일
└── README.md             # 이 파일
```

## 🗄️ 데이터베이스 스키마

### 주요 테이블

1. **problems** - 문제 정보 저장
2. **student_sessions** - 학생 세션 추적
3. **student_interactions** - 상호작용 기록
4. **student_answers** - 제출된 답안
5. **student_progress** - 학습 진도
6. **moodle_sync_log** - Moodle 동기화 로그

자세한 스키마는 `sql/schema.sql` 참조

## 🔌 Moodle 연동 설정

### 1. Moodle Web Service 활성화

1. Moodle 관리자로 로그인
2. **사이트 관리 > 플러그인 > 웹 서비스 > 개요**
3. "웹 서비스 활성화" 체크
4. REST 프로토콜 활성화

### 2. 웹 서비스 토큰 생성

1. **사이트 관리 > 플러그인 > 웹 서비스 > 토큰 관리**
2. "토큰 추가" 클릭
3. 사용자 선택 및 서비스 선택
4. 생성된 토큰을 `config/database.php`에 입력

### 3. 필요한 함수 권한 설정

다음 Moodle 함수들이 허용되어야 합니다:
- `core_webservice_get_site_info`
- `mod_quiz_get_quizzes_by_courses`
- `core_course_get_contents`
- `mod_quiz_get_user_attempts`

## 📊 API 엔드포인트

### POST /php/moodle-api.php

#### 문제 불러오기
```json
{
  "action": "get_problem",
  "problem_id": 1
}
```

#### 답안 제출
```json
{
  "action": "submit_answer",
  "problem_id": 1,
  "moodle_user_id": 123,
  "answer": {
    "x_value": 2.5,
    "derivative_value": 5.0
  }
}
```

#### 세션 시작
```json
{
  "action": "start_session",
  "moodle_user_id": 123,
  "student_name": "홍길동",
  "problem_id": 1
}
```

## 🎨 커스터마이징

### 색상 변경

`css/style.css`에서 CSS 변수를 수정:

```css
:root {
    --primary-color: #667eea;
    --secondary-color: #764ba2;
    --success-color: #48bb78;
    --warning-color: #ed8936;
    --error-color: #f56565;
}
```

### 그래프 색상

`js/derivative-sync.js`에서 색상 설정:

```javascript
this.colors = {
    original: 'rgb(102, 126, 234)',
    derivative: 'rgb(237, 137, 54)',
    current: 'rgb(239, 68, 68)',
    tangent: 'rgb(72, 187, 120)'
};
```

## 🐛 문제 해결

### 데이터베이스 연결 오류

```bash
# MySQL 서비스 확인
sudo service mysql status

# 권한 확인
mysql -u root -p
GRANT ALL PRIVILEGES ON derivative_sync.* TO 'your_user'@'localhost';
FLUSH PRIVILEGES;
```

### Moodle 연결 실패

1. Moodle URL이 올바른지 확인
2. 웹 서비스 토큰이 유효한지 확인
3. Moodle에서 REST 프로토콜이 활성화되었는지 확인
4. 방화벽 설정 확인

### 그래프가 표시되지 않음

1. 브라우저 콘솔에서 JavaScript 오류 확인
2. Chart.js가 올바르게 로드되었는지 확인
3. 브라우저 캐시 삭제 후 재시도

## 📈 향후 계획

- [ ] 다중 사용자 동시 접속 지원
- [ ] 모바일 네이티브 앱 버전
- [ ] 더 많은 함수 유형 지원 (역함수, 이계 도함수)
- [ ] AI 기반 학습 분석 및 추천
- [ ] 실시간 협업 기능
- [ ] 다국어 지원 확대

## 🤝 기여하기

기여를 환영합니다! Pull Request를 보내주세요.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다. 자세한 내용은 `LICENSE` 파일을 참조하세요.

## 📧 연락처

- 프로젝트 링크: [https://github.com/yourusername/alt42standalone_v1.0](https://github.com/yourusername/alt42standalone_v1.0)
- 이슈 제보: [Issues](https://github.com/yourusername/alt42standalone_v1.0/issues)

## 🙏 감사의 말

- KAIST Touch Math Academy
- Moodle Community
- Chart.js Team
- MathJax Project

---

**Made with ❤️ for Mathematics Education**
