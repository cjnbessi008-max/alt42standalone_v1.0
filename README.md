# 넓이 재조합기 (Area Recombination App)

도형을 찢고 다시 붙여보며 넓이 불변을 느끼는 교육용 웹 애플리케이션

## 📋 목차

- [개요](#개요)
- [주요 기능](#주요-기능)
- [시스템 요구사항](#시스템-요구사항)
- [설치 가이드](#설치-가이드)
- [Moodle 연동](#moodle-연동)
- [사용 방법](#사용-방법)
- [기술 스택](#기술-스택)
- [프로젝트 구조](#프로젝트-구조)
- [API 문서](#api-문서)
- [문제 해결](#문제-해결)
- [라이선스](#라이선스)

## 개요

넓이 재조합기는 학생들이 도형을 자르고 재배열하면서 넓이 불변의 원리를 직접 경험하고 이해할 수 있도록 돕는 상호작용 교육 도구입니다. 우측 하단의 가상 스마트폰 화면에서 실행되며, MySQL, PHP, Moodle LMS와 완벽하게 연동됩니다.

### 특징

- ✨ **직관적인 인터페이스**: 드래그 앤 드롭으로 쉽게 도형을 조작
- 📱 **가상 스마트폰 디스플레이**: 우측 하단에 표시되는 모바일 앱 스타일 UI
- 🎯 **3단계 난이도**: 쉬움, 보통, 어려움 수준의 다양한 도형
- 📊 **학습 진행 추적**: 실시간 성과 분석 및 배지 시스템
- 🔗 **Moodle 통합**: LMS와 완벽한 연동 및 성적 동기화
- 💾 **자동 저장**: 모든 학습 활동 자동 저장

## 주요 기능

### 1. 도형 선택 및 조작

- 다양한 기하학적 도형 (삼각형, 직사각형, 평행사변형, 사다리꼴, 다각형)
- 난이도별 도형 분류 (1-3단계)
- 실시간 도형 자르기 및 이동

### 2. 넓이 보존 검증

- Shoelace 공식을 사용한 정확한 넓이 계산
- 5% 오차 범위 내 검증
- 시각적 피드백 제공

### 3. 학습 진행 관리

- 완료한 도형 수 추적
- 평균 점수 계산
- 최고 난이도 기록
- 학습 시간 측정

### 4. 성취 시스템

- 🎯 첫 도형: 첫 도형 완성
- 🏆 도형 마스터: 10개 도형 완성
- 💯 완벽한 점수: 100점 획득
- ⭐ 난이도 챔피언: 난이도 3 완성
- ⚡ 스피드 데몬: 60초 이내 완성

## 시스템 요구사항

### 서버 요구사항

- **PHP**: 7.1.9 이상
- **MySQL**: 5.7 이상
- **Moodle**: 3.7 이상 (선택사항)
- **Apache/Nginx**: 웹 서버
- **메모리**: 최소 512MB RAM
- **디스크**: 최소 100MB 여유 공간

### 클라이언트 요구사항

- **브라우저**: Chrome 60+, Firefox 55+, Safari 11+, Edge 79+
- **화면 해상도**: 최소 1024x768
- **JavaScript**: 활성화 필수
- **인터넷 연결**: 필수

## 설치 가이드

### 1. 데이터베이스 설정

```bash
# MySQL 데이터베이스 생성
mysql -u root -p

# SQL 스키마 실행
mysql -u root -p < database/schema.sql
```

### 2. PHP 설정

```bash
# 프로젝트 파일을 웹 서버 디렉토리에 복사
cp -r alt42standalone_v1.0 /var/www/html/area-recom

# 로그 디렉토리 생성 및 권한 설정
mkdir -p /var/www/html/area-recom/logs
chmod 755 /var/www/html/area-recom/logs
chown www-data:www-data /var/www/html/area-recom/logs
```

### 3. 설정 파일 수정

`php/config.php` 파일을 열고 데이터베이스 정보를 수정하세요:

```php
define('DB_HOST', 'localhost');
define('DB_NAME', 'area_recombination');
define('DB_USER', 'your_username');
define('DB_PASS', 'your_password');

define('MOODLE_DB_HOST', 'localhost');
define('MOODLE_DB_NAME', 'moodle');
define('MOODLE_DB_USER', 'moodle_user');
define('MOODLE_DB_PASS', 'moodle_password');
```

### 4. 웹 서버 설정

#### Apache

```apache
<VirtualHost *:80>
    ServerName area-recom.example.com
    DocumentRoot /var/www/html/area-recom/public

    <Directory /var/www/html/area-recom/public>
        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>

    ErrorLog ${APACHE_LOG_DIR}/area-recom-error.log
    CustomLog ${APACHE_LOG_DIR}/area-recom-access.log combined
</VirtualHost>
```

#### Nginx

```nginx
server {
    listen 80;
    server_name area-recom.example.com;
    root /var/www/html/area-recom/public;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /php/ {
        try_files $uri =404;
        fastcgi_pass unix:/var/run/php/php7.1-fpm.sock;
        fastcgi_index api.php;
        include fastcgi_params;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
    }

    location ~ /\.ht {
        deny all;
    }
}
```

### 5. 테스트

브라우저에서 다음 URL로 접속하세요:

```
http://area-recom.example.com
```

또는 URL 파라미터로 테스트:

```
http://area-recom.example.com?user_id=1&course_id=1
```

## Moodle 연동

### 1. Moodle 플러그인 설치

```bash
# Moodle 플러그인 디렉토리에 복사
cp -r moodle/mod/arearecom /path/to/moodle/mod/

# 앱 파일을 Moodle 내부에 복사
cp -r public/* /path/to/moodle/mod/arearecom/app/
cp -r php/* /path/to/moodle/mod/arearecom/app/php/
```

### 2. Moodle 관리자 페이지 접속

1. Moodle에 관리자로 로그인
2. **사이트 관리 > 알림**으로 이동
3. 새 플러그인 설치 확인 및 업그레이드 실행

### 3. 활동 추가

1. 코스로 이동
2. **활동 또는 리소스 추가** 클릭
3. **넓이 재조합기** 선택
4. 설정:
   - 활동 이름 입력
   - 난이도 선택 (모든 난이도/쉬움/보통/어려움)
   - 최대 시도 횟수 설정
   - 힌트 및 소리 활성화 여부
   - 통과 점수 설정
5. **저장 후 표시** 클릭

### 4. 성적 동기화

성적은 자동으로 Moodle 성적표에 동기화됩니다:

- 완료 시 자동 성적 업데이트
- 최고 점수 기록
- 진행 상황 추적

## 사용 방법

### 학생 사용 가이드

#### 1. 도형 선택

1. 난이도를 선택합니다 (쉬움/보통/어려움)
2. 학습하고 싶은 도형을 클릭합니다
3. 캔버스 화면으로 자동 이동합니다

#### 2. 도형 자르기

1. **자르기** 모드 선택 (기본값)
2. 도형 위를 드래그하여 자를 선을 그립니다
3. 도형이 자동으로 두 조각으로 분리됩니다

#### 3. 조각 이동

1. **이동** 모드 선택
2. 조각을 터치/클릭하고 드래그합니다
3. 원하는 위치로 조각을 이동합니다

#### 4. 넓이 확인

1. 조각들을 재배열한 후
2. **넓이 확인하기** 버튼 클릭
3. 결과 확인:
   - ✓ 성공: 넓이가 보존됨
   - ✗ 실패: 다시 시도 필요

#### 5. 초기화

언제든지 **초기화** 버튼을 눌러 원래 도형으로 돌아갈 수 있습니다.

### 교사 사용 가이드

#### 진행 상황 모니터링

1. Moodle 코스의 성적표 확인
2. 각 학생의 완료한 도형 수와 점수 확인
3. 학습 시간 및 시도 횟수 분석

#### 난이도 조정

활동 설정에서 난이도를 조정하여 학생 수준에 맞춤:

- **쉬움**: 초등학생, 기본 개념 학습
- **보통**: 중학생, 심화 학습
- **어려움**: 고등학생, 고급 개념

## 기술 스택

### 백엔드

- **PHP 7.1.9**: 서버사이드 로직
- **MySQL 5.7**: 데이터베이스
- **PDO**: 데이터베이스 연결

### 프론트엔드

- **HTML5**: 구조
- **CSS3**: 스타일링 (Flexbox, Grid, Animations)
- **JavaScript (ES6+)**: 인터랙션
- **HTML5 Canvas API**: 도형 그리기 및 조작

### Moodle 통합

- **Moodle 3.7**: LMS 플랫폼
- **Activity Module API**: 활동 모듈 개발
- **Grade API**: 성적 관리

## 프로젝트 구조

```
alt42standalone_v1.0/
├── database/
│   └── schema.sql              # MySQL 데이터베이스 스키마
├── php/
│   ├── config.php              # 설정 파일
│   ├── Database.php            # 데이터베이스 연결 클래스
│   ├── api.php                 # API 컨트롤러
│   ├── ShapeManager.php        # 도형 관리 클래스
│   └── SessionManager.php      # 세션 관리 클래스
├── public/
│   ├── index.html              # 메인 HTML 파일
│   ├── css/
│   │   └── style.css           # 스타일시트
│   └── js/
│       ├── config.js           # 클라이언트 설정
│       ├── api.js              # API 통신 모듈
│       ├── canvas.js           # Canvas 조작 모듈
│       ├── shapes.js           # 도형 관리 모듈
│       └── app.js              # 메인 애플리케이션
├── moodle/
│   └── mod/
│       └── arearecom/          # Moodle 플러그인
│           ├── version.php     # 버전 정보
│           ├── mod_form.php    # 설정 폼
│           ├── view.php        # 뷰 파일
│           ├── lib.php         # 라이브러리 함수
│           ├── db/
│           │   └── install.xml # 데이터베이스 스키마
│           └── lang/
│               ├── en/         # 영어 언어팩
│               └── ko/         # 한국어 언어팩
├── logs/                       # 로그 파일 (자동 생성)
└── README.md                   # 이 파일
```

## API 문서

### 엔드포인트

#### 1. 도형 관리

**GET /php/api.php/shapes**
- 모든 도형 조회

**GET /php/api.php/shapes?difficulty=1**
- 난이도별 도형 조회

**GET /php/api.php/shapes?id=1**
- 특정 도형 조회

#### 2. 세션 관리

**POST /php/api.php/session**
```json
{
  "user_id": 1,
  "course_id": 1,
  "shape_id": 1
}
```
- 새 세션 시작

**GET /php/api.php/session?session_id=1**
- 세션 정보 조회

**PUT /php/api.php/session**
```json
{
  "session_id": 1,
  "session_data": {...}
}
```
- 세션 업데이트

#### 3. 조작 로그

**POST /php/api.php/manipulation**
```json
{
  "session_id": 1,
  "action_type": "tear",
  "action_data": {...},
  "calculated_area": 20000
}
```
- 조작 활동 로깅

#### 4. 넓이 검증

**POST /php/api.php/validate**
```json
{
  "session_id": 1,
  "pieces": [
    {"vertices": [...]},
    {"vertices": [...]}
  ]
}
```
- 넓이 보존 검증

#### 5. 진행 상황

**GET /php/api.php/progress?user_id=1&course_id=1**
- 학생 진행 상황 조회

**GET /php/api.php/statistics?user_id=1&course_id=1**
- 학생 통계 조회

### 응답 형식

모든 API 응답은 JSON 형식입니다:

```json
{
  "success": true,
  "data": {...},
  "message": "Success"
}
```

오류 응답:

```json
{
  "error": "Error message",
  "debug": "Debug info (if APP_DEBUG is true)"
}
```

## 문제 해결

### 일반적인 문제

#### 1. 데이터베이스 연결 오류

**증상**: "Database connection failed" 메시지

**해결방법**:
- `php/config.php`에서 데이터베이스 정보 확인
- MySQL 서비스 실행 확인: `sudo service mysql status`
- 데이터베이스 사용자 권한 확인

```sql
GRANT ALL PRIVILEGES ON area_recombination.* TO 'username'@'localhost';
FLUSH PRIVILEGES;
```

#### 2. API 요청 실패

**증상**: 도형이 로드되지 않음

**해결방법**:
- 브라우저 콘솔에서 오류 확인 (F12)
- `php/config.php`에서 CORS 설정 확인
- 웹 서버 오류 로그 확인

#### 3. Canvas가 표시되지 않음

**증상**: 빈 화면만 표시

**해결방법**:
- JavaScript 오류 확인 (브라우저 콘솔)
- 캐시 삭제 후 새로고침 (Ctrl+Shift+R)
- 브라우저 호환성 확인

#### 4. Moodle 성적 동기화 안 됨

**증상**: 성적이 Moodle에 표시되지 않음

**해결방법**:
- Moodle 플러그인 설치 확인
- 성적표 권한 확인
- Moodle 로그 확인 (`/moodle/admin/tool/log/index.php`)

### 디버그 모드

개발 중 문제를 추적하려면 디버그 모드를 활성화하세요:

`php/config.php`:
```php
define('APP_DEBUG', true);
```

`public/js/config.js`:
브라우저에서 `Ctrl+Shift+D`를 눌러 디버그 정보 출력

### 로그 파일

로그 파일 위치:
- 애플리케이션 로그: `logs/app.log`
- 오류 로그: `logs/error.log`
- Apache 로그: `/var/log/apache2/area-recom-error.log`

## 성능 최적화

### 데이터베이스 최적화

```sql
-- 인덱스 추가
ALTER TABLE student_sessions ADD INDEX idx_user_course (moodle_user_id, moodle_course_id);
ALTER TABLE shape_manipulations ADD INDEX idx_timestamp (timestamp);

-- 쿼리 캐싱 활성화
SET GLOBAL query_cache_type = ON;
SET GLOBAL query_cache_size = 1048576;
```

### PHP 최적화

```php
// php.ini
memory_limit = 256M
max_execution_time = 60
opcache.enable = 1
```

### 클라이언트 최적화

- CSS/JS 파일 최소화
- 이미지 최적화
- 브라우저 캐싱 활용

## 보안 고려사항

### 1. SQL Injection 방지

모든 데이터베이스 쿼리는 PDO prepared statements 사용

### 2. XSS 방지

사용자 입력은 모두 검증 및 이스케이프

### 3. CSRF 보호

Moodle의 sesskey 사용

### 4. 데이터 검증

클라이언트와 서버 양쪽에서 검증

## 기여하기

버그 리포트, 기능 제안, 코드 기여를 환영합니다!

## 라이선스

Copyright © 2024 KAIST Touch Math Academy

GNU GPL v3 or later

## 지원

문제가 있거나 질문이 있으시면:

- 이슈 트래커: [GitHub Issues](https://github.com/yourusername/area-recom/issues)
- 이메일: support@example.com
- 문서: [Wiki](https://github.com/yourusername/area-recom/wiki)

---

**Made with ❤️ by KAIST Touch Math Academy**
