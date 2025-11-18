# Symmetry Shine - 설치 가이드

## 빠른 시작 (Quick Start)

### 1단계: 파일 복사

웹 서버의 Document Root에 `symmetry-shine` 폴더를 복사합니다.

```bash
# Apache 예시
sudo cp -r symmetry-shine /var/www/html/

# Nginx 예시
sudo cp -r symmetry-shine /usr/share/nginx/html/
```

### 2단계: 데이터베이스 설정

```bash
# MySQL 접속
mysql -u root -p

# 데이터베이스 및 사용자 생성
CREATE DATABASE moodle CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'moodle_user'@'localhost' IDENTIFIED BY 'your_secure_password';
GRANT SELECT, INSERT, UPDATE ON moodle.* TO 'moodle_user'@'localhost';
FLUSH PRIVILEGES;

# 스키마 적용
USE moodle;
source /path/to/symmetry-shine/database/schema.sql;
```

### 3단계: 설정 파일 생성

```bash
cd /var/www/html/symmetry-shine/api
cp config.php.example config.php  # 또는 직접 생성
nano config.php
```

`config.php` 내용 수정:

```php
<?php
// 데이터베이스 정보 입력
define('DB_HOST', 'localhost');
define('DB_NAME', 'moodle');
define('DB_USER', 'moodle_user');
define('DB_PASS', 'your_secure_password');

// Moodle 정보 (선택사항)
define('MOODLE_URL', 'http://your-moodle-site.com');
define('MOODLE_TOKEN', 'your_webservice_token_here');
?>
```

### 4단계: 권한 설정

```bash
# 파일 소유권 설정
sudo chown -R www-data:www-data /var/www/html/symmetry-shine

# 권한 설정
sudo chmod -R 755 /var/www/html/symmetry-shine
sudo chmod 600 /var/www/html/symmetry-shine/api/config.php
```

### 5단계: 웹 서버 재시작

```bash
# Apache
sudo systemctl restart apache2

# Nginx
sudo systemctl restart nginx
sudo systemctl restart php7.1-fpm
```

### 6단계: 접속 테스트

브라우저에서 다음 URL로 접속:

```
http://localhost/symmetry-shine/public/index.html
```

성공적으로 로드되면 우측 하단에 가상 스마트폰 화면이 표시됩니다!

---

## 상세 설치 가이드

### 시스템 요구사항

#### 필수
- **운영체제**: Linux (Ubuntu 18.04+, CentOS 7+) 또는 Windows Server
- **웹 서버**: Apache 2.4+ 또는 Nginx 1.14+
- **PHP**: 7.1.9 이상 (7.4 권장)
- **MySQL**: 5.7 이상 (8.0 권장)
- **디스크 공간**: 최소 100MB

#### PHP 확장 모듈
```bash
# Ubuntu/Debian
sudo apt-get install php7.4 php7.4-mysql php7.4-curl php7.4-json php7.4-mbstring

# CentOS/RHEL
sudo yum install php74 php74-mysqlnd php74-curl php74-json php74-mbstring
```

### Apache 설정

#### mod_rewrite 활성화
```bash
sudo a2enmod rewrite
sudo systemctl restart apache2
```

#### VirtualHost 설정 (선택사항)
```apache
<VirtualHost *:80>
    ServerName symmetry.example.com
    DocumentRoot /var/www/html/symmetry-shine/public

    <Directory /var/www/html/symmetry-shine/public>
        AllowOverride All
        Require all granted
    </Directory>

    Alias /api /var/www/html/symmetry-shine/api
    <Directory /var/www/html/symmetry-shine/api>
        AllowOverride None
        Require all granted
    </Directory>

    ErrorLog ${APACHE_LOG_DIR}/symmetry_error.log
    CustomLog ${APACHE_LOG_DIR}/symmetry_access.log combined
</VirtualHost>
```

### Nginx 설정

```nginx
server {
    listen 80;
    server_name symmetry.example.com;
    root /var/www/html/symmetry-shine/public;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        alias /var/www/html/symmetry-shine/api;
        location ~ \.php$ {
            fastcgi_pass unix:/var/run/php/php7.4-fpm.sock;
            fastcgi_index index.php;
            fastcgi_param SCRIPT_FILENAME $request_filename;
            include fastcgi_params;
        }
    }

    access_log /var/log/nginx/symmetry_access.log;
    error_log /var/log/nginx/symmetry_error.log;
}
```

### MySQL 튜닝 (선택사항)

`/etc/mysql/mysql.conf.d/mysqld.cnf` 또는 `/etc/my.cnf`:

```ini
[mysqld]
# 성능 최적화
innodb_buffer_pool_size = 256M
max_connections = 100
query_cache_type = 1
query_cache_size = 16M

# 문자 인코딩
character-set-server = utf8mb4
collation-server = utf8mb4_unicode_ci

# 타임존
default-time-zone = '+09:00'
```

---

## Moodle 연동 설정

### Moodle Web Services 활성화

1. **관리자로 Moodle 로그인**

2. **웹 서비스 활성화**
   - `사이트 관리` > `고급 기능`
   - "웹 서비스 활성화" 체크
   - 저장

3. **REST 프로토콜 활성화**
   - `사이트 관리` > `플러그인` > `웹 서비스` > `프로토콜 관리`
   - REST 프로토콜 "눈" 아이콘 클릭 (활성화)

4. **외부 서비스 생성**
   - `사이트 관리` > `플러그인` > `웹 서비스` > `외부 서비스`
   - "서비스 추가" 클릭
   - 이름: "Symmetry Shine API"
   - 약식 이름: "symmetry_shine"
   - 활성화됨: 체크
   - 저장

5. **함수 추가**
   - 생성한 서비스 옆 "함수" 링크 클릭
   - 다음 함수들 추가:
     - `core_user_get_users_by_field`
     - `core_course_get_courses`
     - `core_grades_update_grades` (선택사항)

6. **사용자에게 서비스 할당**
   - `사이트 관리` > `플러그인` > `웹 서비스` > `외부 서비스`
   - "Symmetry Shine API" 옆 "인가된 사용자" 클릭
   - 사용자 추가

7. **토큰 생성**
   - `사이트 관리` > `플러그인` > `웹 서비스` > `토큰 관리`
   - "토큰 추가" 클릭
   - 사용자 선택
   - 서비스: "Symmetry Shine API"
   - 저장하고 토큰 복사

8. **config.php에 토큰 입력**
   ```php
   define('MOODLE_TOKEN', '복사한_토큰_여기에_붙여넣기');
   ```

### 토큰 테스트

```bash
curl "http://your-moodle-site.com/webservice/rest/server.php?wstoken=YOUR_TOKEN&wsfunction=core_webservice_get_site_info&moodlewsrestformat=json"
```

성공 응답 예시:
```json
{
  "sitename": "My Moodle Site",
  "username": "admin",
  "firstname": "Admin",
  ...
}
```

---

## 문제 해결 (Troubleshooting)

### 1. "Database connection error"

**원인**: MySQL 연결 실패

**해결방법**:
```bash
# MySQL 서비스 확인
sudo systemctl status mysql

# MySQL 재시작
sudo systemctl restart mysql

# 사용자 권한 확인
mysql -u moodle_user -p
SHOW GRANTS;
```

### 2. "404 Not Found" on API calls

**원인**: mod_rewrite 미활성화 또는 .htaccess 무시

**해결방법**:
```bash
# Apache
sudo a2enmod rewrite
sudo nano /etc/apache2/apache2.conf
# <Directory /var/www/> 섹션에서 AllowOverride All 확인
sudo systemctl restart apache2
```

### 3. Canvas가 표시되지 않음

**원인**: JavaScript 오류

**해결방법**:
- 브라우저 개발자 도구 콘솔 확인 (F12)
- `public/app.js` 파일 권한 확인
- 브라우저 캐시 삭제

### 4. Moodle 연동 실패

**원인**: 토큰 또는 권한 문제

**해결방법**:
- 토큰 유효성 확인
- Moodle 웹 서비스 활성화 상태 확인
- 네트워크 방화벽 확인
- 데모 모드로 작동하는지 확인 (연동 실패 시 자동 전환)

### 5. "Permission denied" 오류

**원인**: 파일 권한 문제

**해결방법**:
```bash
sudo chown -R www-data:www-data /var/www/html/symmetry-shine
sudo chmod -R 755 /var/www/html/symmetry-shine
sudo chmod 600 /var/www/html/symmetry-shine/api/config.php
```

---

## 보안 체크리스트

- [ ] `config.php` 권한이 600인지 확인
- [ ] 데이터베이스 사용자가 필요한 최소 권한만 가지는지 확인
- [ ] Moodle 토큰이 안전하게 저장되었는지 확인
- [ ] `.htaccess`가 제대로 작동하는지 확인
- [ ] HTTPS 사용 (프로덕션 환경)
- [ ] 방화벽 설정 확인

---

## 성능 테스트

### Apache Bench로 부하 테스트

```bash
# 100명의 동시 사용자, 1000개 요청
ab -n 1000 -c 100 http://localhost/symmetry-shine/api/get_problem.php
```

### MySQL 쿼리 성능 확인

```sql
-- Slow query log 활성화
SET GLOBAL slow_query_log = 'ON';
SET GLOBAL long_query_time = 2;

-- 쿼리 분석
EXPLAIN SELECT * FROM symmetry_problems WHERE is_active = 1 ORDER BY RAND() LIMIT 1;
```

---

## 업데이트 및 마이그레이션

### 데이터베이스 백업

```bash
mysqldump -u moodle_user -p moodle > backup_$(date +%Y%m%d).sql
```

### 애플리케이션 업데이트

```bash
# 백업
cp -r /var/www/html/symmetry-shine /var/www/html/symmetry-shine.backup

# 새 버전 다운로드/복사
# ...

# 설정 파일 복원
cp /var/www/html/symmetry-shine.backup/api/config.php /var/www/html/symmetry-shine/api/

# 권한 재설정
sudo chown -R www-data:www-data /var/www/html/symmetry-shine
```

---

## 프로덕션 배포 체크리스트

- [ ] HTTPS 인증서 설치 (Let's Encrypt)
- [ ] `config.php`에서 에러 디스플레이 비활성화
- [ ] 데이터베이스 정기 백업 설정
- [ ] 로그 로테이션 설정
- [ ] 모니터링 도구 설정 (선택사항)
- [ ] 성능 테스트 완료
- [ ] 보안 감사 완료

---

## 지원 및 문의

설치 중 문제가 발생하면:
1. `error.log` 확인
2. MySQL 로그 확인: `/var/log/mysql/error.log`
3. PHP 오류 로그 확인: `/var/log/apache2/error.log` 또는 `/var/log/nginx/error.log`
4. 이슈 제기: [GitHub Issues]

---

**성공적인 설치를 기원합니다!** 🎉
