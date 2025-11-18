# Inequality Arrow (부등호 화살표 앱)

<div align="center">

![Inequality Arrow](https://img.shields.io/badge/Version-1.0.0-brightgreen)
![License](https://img.shields.io/badge/License-MIT-blue)
![PHP](https://img.shields.io/badge/PHP-7.4+-purple)
![MySQL](https://img.shields.io/badge/MySQL-5.7+-orange)

**수학 부등호 학습을 위한 인터랙티브 웹 애플리케이션**

우측 하단 가상 스마트폰 화면에서 살아 움직이는 화살표로 부등호의 방향을 직관적으로 학습합니다.

</div>

---

## 📋 목차

- [주요 기능](#-주요-기능)
- [시스템 요구사항](#-시스템-요구사항)
- [설치 방법](#-설치-방법)
- [설정](#-설정)
- [Moodle 연동](#-moodle-연동)
- [API 문서](#-api-문서)
- [사용 방법](#-사용-방법)
- [개발](#-개발)
- [문제 해결](#-문제-해결)
- [라이선스](#-라이선스)

---

## 🎯 주요 기능

### 🎨 인터랙티브 학습 경험
- **가상 스마트폰 디스플레이**: 우측 하단에 배치된 가상 스마트폰 화면
- **애니메이션 화살표**: 선택한 부등호에 따라 살아 움직이는 방향 화살표
- **실시간 피드백**: 즉각적인 정답/오답 표시 및 설명

### 📱 스마트 UI/UX
- **반응형 디자인**: 데스크톱, 태블릿, 모바일 모두 지원
- **다크 모드**: 눈의 피로를 줄이는 테마 지원
- **사용자 설정**: 애니메이션 속도, 색상, 소리 효과 커스터마이징

### 🔗 Moodle LMS 완벽 연동
- **자동 성적 동기화**: 학습 결과를 Moodle 성적부에 자동 등록
- **진도율 추적**: 학습 진행 상황 실시간 업데이트
- **SSO 지원**: Moodle 계정으로 원클릭 로그인

### 📊 학습 분석
- **실시간 통계**: 정답률, 문제 풀이 수, 평균 응답 시간
- **세션 기록**: 과거 학습 세션 내역 조회
- **진도 추적**: 개인별 학습 진척도 모니터링

---

## 💻 시스템 요구사항

### 서버 환경
- **PHP**: 7.4 이상 (8.0+ 권장)
- **MySQL**: 5.7 이상 (8.0+ 권장)
- **Apache/Nginx**: mod_rewrite 활성화
- **PHP Extensions**:
  - PDO
  - PDO_MySQL
  - cURL
  - JSON
  - mbstring

### 클라이언트 환경
- **브라우저**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **JavaScript**: ES6+ 지원 필수
- **화면 해상도**: 1024x768 이상 권장

---

## 🚀 설치 방법

### 1. 저장소 클론

```bash
git clone https://github.com/your-repo/inequality-arrow.git
cd inequality-arrow
```

### 2. 데이터베이스 설정

```bash
# MySQL에 로그인
mysql -u root -p

# 데이터베이스 생성 및 스키마 적용
mysql -u root -p < database/schema.sql
```

또는 MySQL Workbench를 사용하여 `database/schema.sql` 파일을 실행하세요.

### 3. 데이터베이스 사용자 생성

```sql
CREATE USER 'inequality_user'@'localhost' IDENTIFIED BY 'your_secure_password';
GRANT ALL PRIVILEGES ON inequality_arrow_db.* TO 'inequality_user'@'localhost';
FLUSH PRIVILEGES;
```

### 4. 환경 설정

`backend/config.php` 파일을 수정하여 데이터베이스 및 Moodle 연동 정보를 입력하세요:

```php
// Database Configuration
define('DB_HOST', 'localhost');
define('DB_NAME', 'inequality_arrow_db');
define('DB_USER', 'inequality_user');
define('DB_PASS', 'your_secure_password');

// Moodle Integration Configuration
define('MOODLE_URL', 'https://your-moodle-site.com');
define('MOODLE_TOKEN', 'your_moodle_webservice_token');
```

### 5. 웹 서버 설정

#### Apache (.htaccess)

```apache
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteBase /

    # Force HTTPS (선택사항)
    # RewriteCond %{HTTPS} off
    # RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

    # API 라우팅
    RewriteRule ^api/(.*)$ backend/api.php [QSA,L]
</IfModule>
```

#### Nginx

```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /path/to/inequality-arrow;
    index frontend/index.html;

    # API 라우팅
    location /api {
        rewrite ^/api/(.*)$ /backend/api.php last;
    }

    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php8.0-fpm.sock;
        fastcgi_index index.php;
        include fastcgi_params;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
    }
}
```

### 6. 권한 설정

```bash
# 웹 서버 사용자에게 필요한 권한 부여
sudo chown -R www-data:www-data /path/to/inequality-arrow
sudo chmod -R 755 /path/to/inequality-arrow
```

### 7. 접속 확인

브라우저에서 `http://your-domain.com/frontend/index.html`로 접속하여 정상 작동을 확인하세요.

---

## ⚙️ 설정

### 애플리케이션 설정

`backend/config.php`에서 다음 설정을 조정할 수 있습니다:

```php
// Application Settings
define('APP_NAME', 'Inequality Arrow');
define('TIMEZONE', 'Asia/Seoul');
define('SESSION_TIMEOUT', 3600); // 초 단위

// API Settings
define('API_RATE_LIMIT', 100); // 분당 요청 수
define('ENABLE_CORS', true);
define('ALLOWED_ORIGINS', ['http://localhost', 'https://your-domain.com']);
```

### 사용자 설정

앱 내에서 다음 설정을 사용자별로 조정할 수 있습니다:

- **애니메이션 속도**: 느림 / 보통 / 빠름
- **화살표 색상**: 사용자 정의 색상 선택
- **소리 효과**: 활성화 / 비활성화
- **진동 효과**: 활성화 / 비활성화 (모바일)
- **테마**: 라이트 / 다크 모드

---

## 🔗 Moodle 연동

### 1. Moodle 웹 서비스 활성화

1. **Moodle 관리자** 로그인
2. **사이트 관리 > 플러그인 > 웹 서비스 > 웹 서비스 관리**로 이동
3. **웹 서비스 활성화** 체크

### 2. 외부 서비스 생성

1. **사이트 관리 > 서버 > 웹 서비스 > 외부 서비스**
2. **서비스 추가** 클릭
3. 다음 정보 입력:
   - 이름: `Inequality Arrow Service`
   - 약칭: `inequality_arrow_service`
   - 활성화: 체크

### 3. 필요한 함수 추가

서비스에 다음 Moodle 웹 서비스 함수를 추가하세요:

- `core_user_get_users_by_field`
- `core_course_get_courses`
- `core_enrol_get_enrolled_users`
- `core_grades_update_grades`
- `core_completion_update_activity_completion_status_manually`

### 4. 토큰 생성

1. **사이트 관리 > 서버 > 웹 서비스 > 토큰 관리**
2. **토큰 추가** 클릭
3. 사용자 및 서비스 선택
4. 생성된 토큰을 `backend/config.php`의 `MOODLE_TOKEN`에 입력

### 5. Moodle 활동 생성

1. 코스에서 **활동 추가 > 외부 도구**
2. 다음 정보 입력:
   - 도구 URL: `https://your-domain.com/frontend/index.html?course_id={course_id}`
   - 성적 동기화 활성화

---

## 📚 API 문서

### 엔드포인트

#### 세션 관리

**POST /api/create_session**
```json
{
  "action": "create_session",
  "user_id": 1,
  "moodle_course_id": 123
}
```

**POST /api/end_session**
```json
{
  "action": "end_session",
  "session_id": "session_abc123"
}
```

#### 문제 관리

**GET /api/get_problem**
```
/api?action=get_problem&difficulty=easy&category=basic_numbers
```

**GET /api/get_problem (특정 문제)**
```
/api?action=get_problem&problem_id=5
```

#### 응답 제출

**POST /api/submit_response**
```json
{
  "action": "submit_response",
  "user_id": 1,
  "problem_id": 5,
  "selected_operator": ">",
  "response_time": 15,
  "session_id": "session_abc123"
}
```

#### 통계 조회

**GET /api/get_progress**
```
/api?action=get_progress&user_id=1
```

**GET /api/get_history**
```
/api?action=get_history&user_id=1&limit=10
```

#### 설정 관리

**GET /api/get_settings**
```
/api?action=get_settings&user_id=1
```

**POST /api/update_settings**
```json
{
  "action": "update_settings",
  "user_id": 1,
  "settings": {
    "animation_speed": "fast",
    "arrow_color": "#FF5722",
    "enable_sound": true,
    "enable_haptics": false
  }
}
```

### Moodle 연동 API

**POST /moodle/sync_user**
```json
{
  "action": "sync_user",
  "moodle_user_id": 456
}
```

**POST /moodle/send_grade**
```json
{
  "action": "send_grade",
  "course_id": 123,
  "user_id": 1,
  "grade": 85.5
}
```

---

## 📖 사용 방법

### 기본 사용법

1. **앱 시작**: 브라우저에서 앱 URL 접속
2. **문제 확인**: 화면 중앙에 표시되는 두 숫자 확인
3. **부등호 선택**: `<`, `=`, `>` 버튼 중 하나 클릭
4. **화살표 확인**: 우측 하단 가상 스마트폰에서 애니메이션 화살표 확인
5. **결과 확인**: 정답/오답 피드백 확인
6. **다음 문제**: 자동으로 다음 문제로 이동

### 키보드 단축키

- **`,` 또는 `<`**: "작다" 선택
- **`=`**: "같다" 선택
- **`.` 또는 `>`**: "크다" 선택
- **`ESC`**: 설정 패널 열기/닫기

### 스마트폰 화면 조작

- **최소화/확대**: 우측 하단의 📱 버튼 클릭
- **위치 이동**: 드래그하여 원하는 위치로 이동 (향후 구현 예정)

---

## 🛠️ 개발

### 프로젝트 구조

```
inequality-arrow/
├── database/
│   └── schema.sql              # 데이터베이스 스키마
├── backend/
│   ├── config.php              # 설정 파일
│   ├── api.php                 # 메인 API
│   └── moodle_integration.php  # Moodle 연동 API
├── frontend/
│   ├── index.html              # 메인 HTML
│   ├── styles.css              # 스타일시트
│   └── app.js                  # JavaScript 로직
├── tasks/
│   └── 0001-prd-ai-education-pipeline.md
└── README.md                   # 이 파일
```

### 기술 스택

#### Frontend
- **HTML5**: 시맨틱 마크업
- **CSS3**: Flexbox, Grid, Animations
- **JavaScript (ES6+)**: Fetch API, Async/Await
- **SVG**: 벡터 기반 화살표 애니메이션

#### Backend
- **PHP 7.4+**: OOP, PDO
- **MySQL 5.7+**: 관계형 데이터베이스
- **RESTful API**: JSON 기반 통신

#### 외부 연동
- **Moodle Web Services**: REST API
- **cURL**: HTTP 통신

### 로컬 개발 환경 설정

```bash
# PHP 내장 서버 사용 (개발용)
cd frontend
php -S localhost:8000

# 브라우저에서 접속
open http://localhost:8000
```

### 디버깅

```javascript
// JavaScript 콘솔에서 앱 상태 확인
console.log(AppState);

// API 응답 확인
console.log('API Response:', data);
```

```php
// PHP 에러 로그 확인
tail -f /var/log/php_errors.log

// API 디버깅
error_log("Debug: " . print_r($data, true));
```

---

## 🐛 문제 해결

### 데이터베이스 연결 오류

**증상**: "Database connection failed" 오류

**해결방법**:
1. MySQL 서비스 실행 확인: `sudo service mysql status`
2. 데이터베이스 자격 증명 확인: `backend/config.php`
3. 방화벽 설정 확인
4. MySQL 사용자 권한 확인

### Moodle 연동 실패

**증상**: "Moodle service exception" 오류

**해결방법**:
1. Moodle 웹 서비스 활성화 확인
2. 토큰 유효성 확인
3. 필요한 함수가 서비스에 추가되었는지 확인
4. CORS 설정 확인

### 화살표 애니메이션 미표시

**증상**: 스마트폰 화면에 화살표가 나타나지 않음

**해결방법**:
1. 브라우저 콘솔에서 JavaScript 오류 확인
2. 캐시 삭제 후 새로고침 (Ctrl + Shift + R)
3. SVG 지원 브라우저 사용
4. JavaScript 활성화 확인

### 성능 문제

**증상**: 앱 반응이 느림

**해결방법**:
1. MySQL 인덱스 최적화
2. PHP OpCache 활성화
3. CDN 사용 (정적 리소스)
4. 데이터베이스 쿼리 최적화

---

## 📄 라이선스

MIT License

Copyright (c) 2025 KAIST Touch Math Academy

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

---

## 👥 기여자

- **개발팀**: KAIST Touch Math Academy Development Team
- **프로젝트 매니저**: [Your Name]
- **디자이너**: [Designer Name]

---

## 📞 지원

- **이슈 리포트**: [GitHub Issues](https://github.com/your-repo/inequality-arrow/issues)
- **이메일**: support@your-domain.com
- **문서**: [Wiki](https://github.com/your-repo/inequality-arrow/wiki)

---

<div align="center">

**Made with ❤️ by KAIST Touch Math Academy**

[⬆ 맨 위로 이동](#inequality-arrow-부등호-화살표-앱)

</div>
