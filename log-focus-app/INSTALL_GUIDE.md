# Log Focus 설치 가이드

이 가이드는 Log Focus 웹앱을 처음부터 설치하는 방법을 단계별로 설명합니다.

## 목차

1. [시스템 요구사항](#시스템-요구사항)
2. [사전 준비](#사전-준비)
3. [자동 설치](#자동-설치)
4. [수동 설치](#수동-설치)
5. [Moodle 연동 설정](#moodle-연동-설정)
6. [테스트](#테스트)
7. [문제 해결](#문제-해결)

---

## 시스템 요구사항

### 필수 소프트웨어

- **운영체제**: Ubuntu 18.04+ / Debian 9+ / CentOS 7+
- **웹 서버**: Apache 2.4+ 또는 Nginx 1.14+
- **PHP**: 7.1.9+ (7.4 권장)
- **MySQL**: 5.7+ 또는 MariaDB 10.2+
- **Moodle**: 3.7+

### 필수 PHP 확장

```bash
php7.1-cli
php7.1-mysql
php7.1-pdo
php7.1-json
php7.1-curl
php7.1-mbstring
```

---

## 사전 준비

### 1. Apache 및 PHP 설치

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install apache2 php7.1 php7.1-mysql php7.1-curl php7.1-mbstring php7.1-json

# CentOS
sudo yum install httpd php71 php71-mysql php71-curl php71-mbstring php71-json
```

### 2. MySQL 설치

```bash
# Ubuntu/Debian
sudo apt install mysql-server-5.7

# 보안 설정
sudo mysql_secure_installation
```

### 3. Apache 모듈 활성화

```bash
sudo a2enmod rewrite
sudo a2enmod headers
sudo a2enmod expires
sudo systemctl restart apache2
```

---

## 자동 설치

### 방법 1: 설치 스크립트 사용 (권장)

```bash
# 1. 프로젝트 다운로드
cd /var/www/html
sudo git clone <repository-url> log-focus-app
cd log-focus-app

# 2. 설치 스크립트 실행
sudo ./install.sh
```

설치 스크립트는 다음을 자동으로 수행합니다:
- 데이터베이스 생성 및 사용자 설정
- 테이블 스키마 임포트
- 파일 복사 및 권한 설정
- Apache 설정 업데이트

> ⚠️ **중요**: 설치 완료 후 출력되는 데이터베이스 비밀번호를 반드시 저장하세요!

---

## 수동 설치

자동 설치가 실패하거나 수동으로 설정하고 싶은 경우:

### 1. 데이터베이스 생성

```bash
mysql -u root -p
```

```sql
-- 데이터베이스 생성
CREATE DATABASE log_focus_app CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 사용자 생성 및 권한 부여
CREATE USER 'logfocus'@'localhost' IDENTIFIED BY 'your_secure_password';
GRANT ALL PRIVILEGES ON log_focus_app.* TO 'logfocus'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### 2. 테이블 스키마 임포트

```bash
mysql -u logfocus -p log_focus_app < database/schema.sql
```

### 3. 샘플 데이터 로드 (선택사항)

```bash
mysql -u logfocus -p log_focus_app < database/sample_data.sql
```

### 4. 파일 복사

```bash
sudo cp -r . /var/www/html/log-focus-app/
```

### 5. 권한 설정

```bash
cd /var/www/html/log-focus-app
sudo chown -R www-data:www-data .
sudo find . -type d -exec chmod 755 {} \;
sudo find . -type f -exec chmod 644 {} \;
```

### 6. 설정 파일 편집

**config/database.php** 수정:

```php
define('DB_HOST', 'localhost');
define('DB_NAME', 'log_focus_app');
define('DB_USER', 'logfocus');
define('DB_PASS', 'your_secure_password');
```

---

## Moodle 연동 설정

### 1. Moodle에서 Web Service 활성화

1. Moodle 관리자 계정으로 로그인
2. **사이트 관리** → **고급 기능**으로 이동
3. **웹 서비스 활성화** 체크박스 선택
4. 저장

### 2. 외부 서비스 생성

1. **사이트 관리** → **플러그인** → **웹 서비스** → **외부 서비스**
2. **서비스 추가** 클릭
3. 다음 정보 입력:
   - 이름: `Log Focus Service`
   - 약칭: `log_focus`
   - 활성화: 체크

### 3. 서비스에 함수 추가

"Log Focus Service"에 다음 함수들을 추가:

```
mod_quiz_get_user_attempts
mod_quiz_get_quizzes_by_courses
core_user_get_users_by_field
mod_assign_get_submissions
core_course_get_recent_courses
```

### 4. 토큰 생성

1. **사이트 관리** → **플러그인** → **웹 서비스** → **토큰 관리**
2. **토큰 추가** 클릭
3. 사용자 선택 (관리자 또는 적절한 권한을 가진 사용자)
4. 서비스 선택: `Log Focus Service`
5. 저장하고 생성된 토큰 복사

### 5. Log Focus 설정

**config/moodle.php** 파일 수정:

```php
define('MOODLE_URL', 'http://your-moodle-site.com');
define('MOODLE_TOKEN', 'paste_your_token_here');
define('MOODLE_SERVICE', 'log_focus');
```

### 6. 연결 테스트

```bash
# 테스트 스크립트 실행
php test.php
```

또는 브라우저에서:
```
http://localhost/log-focus-app/test.php
```

---

## 테스트

### 1. 시스템 테스트

```bash
php test.php
```

다음 항목들이 체크됩니다:
- ✅ PHP 버전
- ✅ 필수 PHP 확장
- ✅ 데이터베이스 연결
- ✅ Moodle 설정
- ✅ 파일 권한
- ✅ API 엔드포인트

### 2. 웹 브라우저 테스트

```
http://localhost/log-focus-app/public/
```

예상 결과:
- 좌측에 컨트롤 패널 표시
- 우측 하단에 가상 스마트폰 화면 표시
- 통계 대시보드에 0 또는 샘플 데이터 표시

### 3. Moodle 동기화 테스트

1. Quiz ID 입력 (Moodle에서 확인)
2. "Sync from Moodle" 버튼 클릭
3. 성공 메시지 확인
4. 스마트폰 화면에 로그 표시 확인

---

## 문제 해결

### 문제 1: 데이터베이스 연결 실패

**증상**: "Database connection failed" 에러

**해결방법**:
```bash
# MySQL 서비스 상태 확인
sudo systemctl status mysql

# MySQL 재시작
sudo systemctl restart mysql

# 연결 정보 확인
mysql -u logfocus -p -e "USE log_focus_app; SHOW TABLES;"
```

### 문제 2: 권한 오류

**증상**: "Permission denied" 에러

**해결방법**:
```bash
cd /var/www/html/log-focus-app
sudo chown -R www-data:www-data .
sudo chmod -R 755 .
```

### 문제 3: Moodle 연동 실패

**증상**: "Moodle API Error" 메시지

**해결방법**:
1. Moodle Web Service가 활성화되어 있는지 확인
2. 토큰이 올바른지 확인
3. 서비스에 필요한 함수가 추가되어 있는지 확인
4. 토큰에 만료일이 설정되어 있는지 확인

### 문제 4: 로그가 표시되지 않음

**증상**: 스마트폰 화면에 "No logs available" 표시

**해결방법**:
```bash
# 샘플 데이터 로드
mysql -u logfocus -p log_focus_app < database/sample_data.sql

# 또는 Moodle에서 동기화
# Quiz ID를 입력하고 Sync 버튼 클릭
```

### 문제 5: Apache Rewrite 오류

**증상**: 404 에러 또는 CSS/JS 파일 로드 실패

**해결방법**:
```bash
# mod_rewrite 활성화
sudo a2enmod rewrite

# Apache 설정 확인
sudo nano /etc/apache2/sites-available/000-default.conf
```

다음 내용 추가:
```apache
<Directory /var/www/html/log-focus-app>
    AllowOverride All
    Require all granted
</Directory>
```

```bash
# Apache 재시작
sudo systemctl restart apache2
```

### 문제 6: PHP 버전 문제

**증상**: "PHP version 7.1.0 or higher required"

**해결방법**:
```bash
# 현재 PHP 버전 확인
php -v

# PHP 7.1 또는 상위 버전 설치
sudo apt install php7.4 php7.4-mysql php7.4-curl php7.4-mbstring

# Apache PHP 모듈 활성화
sudo a2enmod php7.4
sudo systemctl restart apache2
```

### 로그 확인

문제가 계속되면 로그 파일을 확인하세요:

```bash
# Apache 에러 로그
sudo tail -f /var/log/apache2/error.log

# PHP 에러 로그
sudo tail -f /var/log/php_errors.log

# MySQL 에러 로그
sudo tail -f /var/log/mysql/error.log
```

---

## 추가 설정

### HTTPS 설정 (권장)

프로덕션 환경에서는 반드시 HTTPS를 사용하세요:

```bash
# Let's Encrypt 인증서 설치
sudo apt install certbot python3-certbot-apache
sudo certbot --apache -d your-domain.com
```

### 방화벽 설정

```bash
# HTTP/HTTPS 포트 허용
sudo ufw allow 'Apache Full'
sudo ufw enable
```

### 성능 최적화

**config/database.php**에 연결 풀링 설정:

```php
define('DB_POOL_SIZE', 10);
```

**config/moodle.php**에 캐시 설정:

```php
define('CACHE_ENABLED', true);
define('CACHE_DURATION', 300); // 5분
```

---

## 지원 및 문의

문제가 해결되지 않으면:
- GitHub Issues: [프로젝트 이슈 페이지]
- 문서: README.md 참조
- 이메일: support@example.com

---

**설치가 완료되었습니다!** 🎉

이제 다음 단계로:
1. 샘플 데이터로 테스트
2. Moodle 연동 확인
3. 실제 사용자에게 배포
