# 🚀 Breathing Curve 설치 가이드

## 목차

1. [시스템 요구사항](#시스템-요구사항)
2. [빠른 시작 (독립형 데모)](#빠른-시작-독립형-데모)
3. [Moodle 플러그인 설치](#moodle-플러그인-설치)
4. [설정 및 구성](#설정-및-구성)
5. [문제 해결](#문제-해결)

---

## 시스템 요구사항

### 최소 요구사항

- **웹 서버**: Apache 2.4+ 또는 Nginx 1.18+
- **PHP**: 7.1.9 이상 (7.4+ 권장)
- **MySQL**: 5.7 이상 (8.0+ 권장)
- **Moodle**: 3.5 이상 (3.7 권장)
- **브라우저**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+

### 권장 사양

- PHP 7.4 또는 8.0
- MySQL 8.0
- Moodle 3.11 LTS
- 최신 버전의 모던 브라우저

---

## 빠른 시작 (독립형 데모)

가장 빠르게 Breathing Curve를 체험할 수 있는 방법입니다.

### 방법 1: 브라우저에서 직접 열기

```bash
# 파일 다운로드
git clone https://github.com/your-repo/alt42standalone_v1.0.git
cd alt42standalone_v1.0

# 브라우저로 열기 (macOS)
open breathing-curve-demo.html

# 브라우저로 열기 (Linux)
xdg-open breathing-curve-demo.html

# 브라우저로 열기 (Windows)
start breathing-curve-demo.html
```

### 방법 2: 로컬 웹 서버 사용

#### Python 사용

```bash
cd alt42standalone_v1.0

# Python 3
python3 -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000
```

브라우저에서 접속: `http://localhost:8000/breathing-curve-demo.html`

#### PHP 사용

```bash
cd alt42standalone_v1.0
php -S localhost:8000
```

브라우저에서 접속: `http://localhost:8000/breathing-curve-demo.html`

#### Node.js 사용

```bash
# http-server 설치 (전역)
npm install -g http-server

# 서버 실행
cd alt42standalone_v1.0
http-server -p 8000
```

브라우저에서 접속: `http://localhost:8000/breathing-curve-demo.html`

---

## Moodle 플러그인 설치

### 1단계: 파일 복사

#### 방법 A: Git 사용

```bash
cd /path/to/moodle/local/
git clone https://github.com/your-repo/alt42standalone_v1.0.git breathing_curve
cd breathing_curve
mv moodle-integration/* .
```

#### 방법 B: 수동 복사

```bash
# 플러그인 디렉토리 생성
cd /path/to/moodle
mkdir -p local/breathing_curve

# 파일 복사
cp -r /path/to/alt42standalone_v1.0/moodle-integration/* local/breathing_curve/
```

### 2단계: 파일 구조 확인

설치 후 다음과 같은 구조여야 합니다:

```
/path/to/moodle/local/breathing_curve/
├── version.php
├── view.php
├── settings.php
├── db/
│   ├── access.php
│   └── install.xml
├── api/
│   └── get_problem.php
├── js/
│   └── breathing-curve.js
└── lang/
    ├── en/
    │   └── local_breathing_curve.php
    └── ko/
        └── local_breathing_curve.php
```

### 3단계: 권한 설정

```bash
# Moodle 디렉토리로 이동
cd /path/to/moodle

# 웹 서버 사용자에게 소유권 부여 (Apache)
sudo chown -R www-data:www-data local/breathing_curve

# 또는 (Nginx)
sudo chown -R nginx:nginx local/breathing_curve

# 또는 (macOS MAMP)
sudo chown -R _www:_www local/breathing_curve

# 권한 설정
chmod -R 755 local/breathing_curve
chmod 644 local/breathing_curve/version.php
chmod 644 local/breathing_curve/view.php
chmod 644 local/breathing_curve/api/get_problem.php
```

### 4단계: Moodle 데이터베이스 업그레이드

1. **Moodle 관리자로 로그인**

2. **알림 페이지 접속**
   - URL: `https://your-moodle.com/admin/index.php`
   - 또는 메뉴: `사이트 관리 > 알림`

3. **데이터베이스 업그레이드 실행**
   - "데이터베이스 업그레이드" 버튼 클릭
   - Breathing Curve 플러그인이 목록에 나타남
   - "업그레이드 계속" 클릭

4. **설치 완료 확인**
   - 성공 메시지 확인
   - 오류가 없는지 확인

### 5단계: 플러그인 설정

1. **설정 페이지 접속**
   ```
   사이트 관리 > 플러그인 > 로컬 플러그인 > Breathing Curve
   ```

2. **기본 설정 조정**
   - **애니메이션 속도**: 1.0 (기본값)
   - **힌트 표시**: 체크 (기본값)
   - **극값 표시**: 체크 (기본값)
   - **기본 함수 유형**: 2차 함수 (기본값)

3. **변경 사항 저장**

---

## 설정 및 구성

### MySQL 데이터베이스 확인

Breathing Curve는 Moodle의 기존 데이터베이스를 사용하며, 다음 테이블을 추가합니다:

```sql
-- 활동 로그 테이블
mdl_breathing_curve_logs

-- 진도 추적 테이블
mdl_breathing_curve_progress

-- 설정 테이블
mdl_breathing_curve_settings
```

#### 테이블이 제대로 생성되었는지 확인:

```bash
mysql -u moodle_user -p moodle_database
```

```sql
SHOW TABLES LIKE 'mdl_breathing_curve%';

-- 결과:
-- +------------------------------------------+
-- | Tables_in_moodle (mdl_breathing_curve%) |
-- +------------------------------------------+
-- | mdl_breathing_curve_logs                |
-- | mdl_breathing_curve_progress            |
-- | mdl_breathing_curve_settings            |
-- +------------------------------------------+
```

### PHP 설정 확인

`php.ini` 파일에서 다음 설정을 확인:

```ini
; 최소 메모리
memory_limit = 256M

; 파일 업로드 크기
upload_max_filesize = 64M
post_max_size = 64M

; 실행 시간
max_execution_time = 300

; JSON 확장 활성화
extension=json
```

PHP 설정 확인:

```bash
php -i | grep -E "memory_limit|upload_max_filesize|max_execution_time"
```

### 웹 서버 설정

#### Apache (.htaccess)

`/path/to/moodle/local/breathing_curve/.htaccess` 파일 생성:

```apache
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteBase /local/breathing_curve/

    # API 요청 처리
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteRule ^api/(.*)$ api/$1.php [L,QSA]
</IfModule>

# CORS 헤더 (필요시)
<IfModule mod_headers.c>
    Header set Access-Control-Allow-Origin "*"
    Header set Access-Control-Allow-Methods "GET, POST, OPTIONS"
    Header set Access-Control-Allow-Headers "Content-Type"
</IfModule>
```

#### Nginx

`/etc/nginx/sites-available/moodle` 파일에 추가:

```nginx
location ~ ^/local/breathing_curve/api/ {
    try_files $uri $uri/ /local/breathing_curve/api/get_problem.php?$args;

    # CORS 헤더 (필요시)
    add_header Access-Control-Allow-Origin *;
    add_header Access-Control-Allow-Methods "GET, POST, OPTIONS";
    add_header Access-Control-Allow-Headers "Content-Type";

    # PHP 처리
    fastcgi_pass unix:/var/run/php/php7.4-fpm.sock;
    fastcgi_index index.php;
    include fastcgi_params;
    fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
}
```

설정 재로드:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

---

## 사용 방법

### 1. 과정에 Breathing Curve 추가

#### 옵션 A: 활동으로 추가 (Moodle 블록)

1. 과정 편집 모드 활성화
2. "활동 또는 리소스 추가" 클릭
3. "Breathing Curve" 선택
4. 문제 ID 입력

#### 옵션 B: URL로 직접 링크

```
https://your-moodle.com/local/breathing_curve/view.php?qid=123&courseid=456
```

- `qid`: Moodle 문제 ID
- `courseid`: 과정 ID

#### 옵션 C: iframe으로 임베드

```html
<iframe
    src="https://your-moodle.com/local/breathing_curve/view.php?qid=123&courseid=456"
    width="400"
    height="700"
    style="border: none; border-radius: 40px;"
></iframe>
```

### 2. 문제 데이터 형식

Moodle 문제 텍스트에 다음 형식으로 작성:

```
다음 함수의 증가/감소 구간을 관찰하세요.

f(x) = -0.5(x - 3)² + 4

이 함수는 2차 함수입니다.
```

**키워드 감지:**
- `2차`, `quadratic`, `x²`, `x^2` → 2차 함수
- `3차`, `cubic`, `x³`, `x^3` → 3차 함수
- `sin`, `cos`, `tan`, `삼각` → 삼각 함수

---

## 문제 해결

### 문제 1: 플러그인이 Moodle에 나타나지 않음

**원인:**
- 파일이 잘못된 위치에 있음
- 권한 문제

**해결:**

```bash
# 파일 위치 확인
ls -la /path/to/moodle/local/breathing_curve/version.php

# 권한 확인
ls -la /path/to/moodle/local/breathing_curve/

# 권한 재설정
sudo chown -R www-data:www-data /path/to/moodle/local/breathing_curve/
chmod -R 755 /path/to/moodle/local/breathing_curve/

# Moodle 캐시 삭제
rm -rf /path/to/moodle/cache/*
```

### 문제 2: "Permission denied" 오류

**원인:**
- PHP 파일 실행 권한 없음
- SELinux 설정 (CentOS/RHEL)

**해결 (일반):**

```bash
chmod 755 /path/to/moodle/local/breathing_curve/
chmod 644 /path/to/moodle/local/breathing_curve/api/get_problem.php
```

**해결 (SELinux):**

```bash
# SELinux 상태 확인
getenforce

# 권한 부여
chcon -R -t httpd_sys_content_t /path/to/moodle/local/breathing_curve/
semanage fcontext -a -t httpd_sys_content_t "/path/to/moodle/local/breathing_curve(/.*)?"
restorecon -R /path/to/moodle/local/breathing_curve/
```

### 문제 3: 애니메이션이 보이지 않음

**원인:**
- JavaScript 파일이 로드되지 않음
- 브라우저 콘솔 에러

**해결:**

1. **브라우저 콘솔 확인** (F12)
   ```
   Canvas element not found
   Failed to load resource: the server responded with a status of 404
   ```

2. **JavaScript 경로 확인**
   ```bash
   # 파일 존재 확인
   ls -la /path/to/moodle/local/breathing_curve/js/breathing-curve.js

   # 브라우저에서 직접 접근
   https://your-moodle.com/local/breathing_curve/js/breathing-curve.js
   ```

3. **캐시 삭제**
   - 브라우저: Ctrl+Shift+Del
   - Moodle: `사이트 관리 > 개발 > 캐시 삭제`

### 문제 4: API가 404 오류 반환

**원인:**
- API 파일 경로 잘못됨
- 웹 서버 rewrite 규칙 문제

**해결:**

```bash
# API 파일 존재 확인
ls -la /path/to/moodle/local/breathing_curve/api/get_problem.php

# 직접 접근 테스트
curl https://your-moodle.com/local/breathing_curve/api/get_problem.php?qid=0

# 예상 응답:
# {"success":true,"problem":{...}}
```

### 문제 5: 데이터베이스 오류

**원인:**
- 테이블이 생성되지 않음
- 데이터베이스 권한 부족

**해결:**

```bash
mysql -u moodle_user -p moodle_database
```

```sql
-- 테이블 확인
SHOW TABLES LIKE 'mdl_breathing_curve%';

-- 수동 테이블 생성 (필요시)
SOURCE /path/to/moodle/local/breathing_curve/db/install.sql;

-- 권한 확인
SHOW GRANTS FOR 'moodle_user'@'localhost';
```

### 문제 6: CORS 오류 (다른 도메인에서 접근)

**원인:**
- 크로스 오리진 요청 차단

**해결 (PHP):**

`api/get_problem.php` 상단에 추가:

```php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
```

**해결 (Apache):**

`.htaccess`에 추가:

```apache
Header set Access-Control-Allow-Origin "*"
```

**해결 (Nginx):**

```nginx
add_header Access-Control-Allow-Origin *;
```

---

## 성능 최적화

### 1. PHP OpCache 활성화

`php.ini`:

```ini
opcache.enable=1
opcache.memory_consumption=128
opcache.max_accelerated_files=10000
opcache.revalidate_freq=2
```

### 2. Moodle 캐싱 설정

```
사이트 관리 > 플러그인 > 캐싱 > 설정
```

- **애플리케이션 캐시**: 파일 시스템
- **세션 캐시**: Redis (권장)

### 3. 브라우저 캐싱

`.htaccess`:

```apache
<IfModule mod_expires.c>
    ExpiresActive On
    ExpiresByType text/javascript "access plus 1 month"
    ExpiresByType application/javascript "access plus 1 month"
    ExpiresByType text/css "access plus 1 month"
</IfModule>
```

---

## 업그레이드

```bash
# 백업
cp -r /path/to/moodle/local/breathing_curve /path/to/backup/

# 새 버전 다운로드
cd /path/to/moodle/local/breathing_curve
git pull origin main

# 또는 수동 복사
cp -r /path/to/new/version/* /path/to/moodle/local/breathing_curve/

# Moodle 업그레이드 실행
# 브라우저: https://your-moodle.com/admin/index.php
```

---

## 제거

```bash
# 1. Moodle에서 플러그인 제거
# 사이트 관리 > 플러그인 > 플러그인 개요 > Breathing Curve > 제거

# 2. 파일 삭제
rm -rf /path/to/moodle/local/breathing_curve/

# 3. 데이터베이스 정리 (선택)
mysql -u moodle_user -p moodle_database
```

```sql
DROP TABLE IF EXISTS mdl_breathing_curve_logs;
DROP TABLE IF EXISTS mdl_breathing_curve_progress;
DROP TABLE IF EXISTS mdl_breathing_curve_settings;
```

---

## 지원 및 문의

- **GitHub Issues**: https://github.com/your-repo/alt42standalone_v1.0/issues
- **문서**: https://github.com/your-repo/alt42standalone_v1.0/wiki
- **이메일**: support@kaist-touchmath.edu

---

**설치에 성공하셨나요?** ⭐ GitHub 저장소에 Star를 눌러주세요!
