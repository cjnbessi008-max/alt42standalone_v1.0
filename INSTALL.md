# Angle Light 설치 가이드

## 시스템 요구사항

- **PHP**: 7.1.9 이상
- **MySQL**: 5.7 이상
- **Apache**: 2.4 이상 (또는 Nginx)
- **Moodle**: 3.7 (LMS 연동 시)

## 설치 단계

### 1. 파일 배포

```bash
# 웹 서버 루트 디렉토리에 파일 복사
cd /var/www/html
git clone <repository-url> angle-light
cd angle-light
```

### 2. 데이터베이스 설정

#### 2.1 MySQL 데이터베이스 및 사용자 생성

```sql
-- MySQL 관리자로 로그인
mysql -u root -p

-- 데이터베이스 생성
CREATE DATABASE angle_light CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 사용자 생성 및 권한 부여
CREATE USER 'angle_light_user'@'localhost' IDENTIFIED BY 'your_secure_password';
GRANT ALL PRIVILEGES ON angle_light.* TO 'angle_light_user'@'localhost';
FLUSH PRIVILEGES;

EXIT;
```

#### 2.2 스키마 임포트

```bash
mysql -u angle_light_user -p angle_light < database/schema.sql
```

### 3. 설정 파일 구성

#### 3.1 데이터베이스 설정

`config/database.php` 파일을 편집하여 데이터베이스 정보 입력:

```php
<?php
define('DB_HOST', 'localhost');
define('DB_NAME', 'angle_light');
define('DB_USER', 'angle_light_user');
define('DB_PASS', 'your_secure_password');
define('DB_PORT', 3306);
define('DB_CHARSET', 'utf8mb4');
?>
```

#### 3.2 Moodle 연동 설정

`config/moodle.php` 파일을 편집:

```php
<?php
define('MOODLE_URL', 'https://your-moodle-site.com');
define('MOODLE_TOKEN', 'your_webservice_token_here');
?>
```

**Moodle 웹 서비스 토큰 생성 방법:**

1. Moodle 관리자로 로그인
2. **Site administration** → **Plugins** → **Web services** → **Manage protocols**
3. REST protocol 활성화
4. **Site administration** → **Plugins** → **Web services** → **External services**
5. 새 External service 생성 (예: "Angle Light Service")
6. 다음 함수들 추가:
   - `core_course_get_courses`
   - `core_enrol_get_enrolled_users`
   - `core_user_get_users`
   - `mod_quiz_get_quizzes_by_courses`
   - `core_grades_update_grades`
7. **Site administration** → **Plugins** → **Web services** → **Manage tokens**
8. 사용자 및 서비스 선택하여 토큰 생성
9. 생성된 토큰을 복사하여 `config/moodle.php`에 입력

### 4. Apache 설정

#### 4.1 Virtual Host 설정 (선택사항)

`/etc/apache2/sites-available/angle-light.conf`:

```apache
<VirtualHost *:80>
    ServerName angle-light.example.com
    DocumentRoot /var/www/html/angle-light/public

    <Directory /var/www/html/angle-light/public>
        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>

    ErrorLog ${APACHE_LOG_DIR}/angle-light-error.log
    CustomLog ${APACHE_LOG_DIR}/angle-light-access.log combined
</VirtualHost>
```

활성화:

```bash
sudo a2ensite angle-light
sudo a2enmod rewrite
sudo systemctl reload apache2
```

#### 4.2 간단한 설정 (하위 디렉토리)

Apache document root가 `/var/www/html`인 경우:

```bash
# 심볼릭 링크 생성
ln -s /var/www/html/angle-light/public /var/www/html/angle-light-app

# 브라우저에서 http://localhost/angle-light-app 접속
```

### 5. 권한 설정

```bash
# 웹 서버 사용자에게 권한 부여 (Apache의 경우 www-data)
sudo chown -R www-data:www-data /var/www/html/angle-light
sudo chmod -R 755 /var/www/html/angle-light

# 로그 디렉토리 생성 (필요 시)
mkdir -p /var/www/html/angle-light/logs
sudo chown www-data:www-data /var/www/html/angle-light/logs
```

### 6. PHP 확장 모듈 확인

필요한 PHP 확장이 설치되어 있는지 확인:

```bash
php -m | grep -E 'pdo|pdo_mysql|json|curl|mbstring'
```

누락된 모듈 설치:

```bash
sudo apt-get install php7.1-mysql php7.1-curl php7.1-mbstring php7.1-json
sudo systemctl restart apache2
```

### 7. 설치 확인

#### 7.1 PHP 정보 확인

임시로 `public/info.php` 생성:

```php
<?php
phpinfo();
?>
```

브라우저에서 `http://localhost/angle-light-app/info.php` 접속하여 PHP 설정 확인

**보안상 확인 후 즉시 삭제:**

```bash
rm public/info.php
```

#### 7.2 데이터베이스 연결 테스트

`public/test-db.php` 생성:

```php
<?php
require_once '../src/utils/db.php';

try {
    $db = Database::getInstance();
    echo "Database connection successful!";
} catch (Exception $e) {
    echo "Database connection failed: " . $e->getMessage();
}
?>
```

브라우저에서 확인 후 삭제

#### 7.3 API 테스트

```bash
# 문제 목록 조회
curl http://localhost/angle-light-app/src/api/problems.php?student_id=1

# 결과가 JSON 형태로 반환되면 성공
```

### 8. 애플리케이션 접속

브라우저에서 다음 주소로 접속:

```
http://localhost/angle-light-app/
```

또는 Virtual Host 설정 시:

```
http://angle-light.example.com/
```

## 문제 해결

### 문제: "Database connection failed"

**해결:**
- `config/database.php`의 정보가 정확한지 확인
- MySQL 서비스 실행 확인: `sudo systemctl status mysql`
- 방화벽 설정 확인

### 문제: "500 Internal Server Error"

**해결:**
- Apache 에러 로그 확인: `tail -f /var/log/apache2/error.log`
- PHP 에러 로그 확인
- `.htaccess` 파일 권한 확인
- `mod_rewrite` 활성화 확인: `sudo a2enmod rewrite`

### 문제: API 호출 시 404 오류

**해결:**
- `.htaccess`의 RewriteBase 경로 확인
- Apache `AllowOverride` 설정이 `All`인지 확인

### 문제: Moodle 연동 실패

**해결:**
- Moodle 웹 서비스가 활성화되어 있는지 확인
- 토큰이 올바른지 확인
- 필요한 Moodle 함수들이 External Service에 추가되었는지 확인
- Moodle과 Angle Light 서버 간 네트워크 연결 확인

## 프로덕션 배포 체크리스트

- [ ] `config/database.php`에서 에러 표시 비활성화
- [ ] HTTPS 사용 (SSL 인증서 설정)
- [ ] `.htaccess`에서 HTTPS 리다이렉션 활성화
- [ ] 강력한 데이터베이스 비밀번호 사용
- [ ] Moodle 토큰 보안 관리
- [ ] CORS 설정 제한 (특정 도메인만 허용)
- [ ] 파일 업로드 제한 설정
- [ ] 정기적인 데이터베이스 백업 설정
- [ ] 로그 모니터링 시스템 구축
- [ ] 세션 타임아웃 설정

## 지원

문제가 발생하면 다음을 확인하세요:

1. Apache/PHP 에러 로그
2. MySQL 에러 로그
3. 브라우저 개발자 도구의 콘솔
4. Moodle 로그 (LMS 연동 시)

---

**개발**: KAIST Touch Math Academy
**버전**: 1.0
**문서 업데이트**: 2025
