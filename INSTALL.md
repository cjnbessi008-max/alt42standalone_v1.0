# Inclusion Gate 설치 가이드

이 문서는 Inclusion Gate 웹앱을 처음부터 설치하는 방법을 단계별로 안내합니다.

## 목차
1. [사전 요구사항](#사전-요구사항)
2. [데이터베이스 설정](#데이터베이스-설정)
3. [애플리케이션 설정](#애플리케이션-설정)
4. [웹 서버 설정](#웹-서버-설정)
5. [테스트](#테스트)
6. [문제 해결](#문제-해결)

---

## 사전 요구사항

### 필수 소프트웨어
- **PHP**: 7.1.9 이상
- **MySQL**: 5.7 이상
- **웹 서버**: Apache 2.4+ 또는 Nginx 1.14+
- **Moodle**: 3.7 이상 (선택사항, 없으면 샘플 데이터로 동작)

### PHP 확장 확인
```bash
php -m | grep -E 'pdo|pdo_mysql|json'
```

필요한 확장이 없으면 설치:
```bash
# Ubuntu/Debian
sudo apt-get install php7.1-mysql php7.1-json

# CentOS/RHEL
sudo yum install php71-mysql php71-json
```

---

## 데이터베이스 설정

### 1. MySQL 서버 접속
```bash
mysql -u root -p
```

### 2. 데이터베이스 생성

#### 옵션 A: 새 데이터베이스 생성 (Moodle이 없는 경우)
```sql
CREATE DATABASE inclusion_gate CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

#### 옵션 B: 기존 Moodle 데이터베이스 사용
```sql
-- Moodle 데이터베이스 이름 확인
SHOW DATABASES LIKE 'moodle%';
```

### 3. 사용자 생성 및 권한 부여
```sql
-- 새 사용자 생성
CREATE USER 'inclusion_gate'@'localhost' IDENTIFIED BY 'secure_password_123';

-- 권한 부여 (옵션 A: 새 DB)
GRANT ALL PRIVILEGES ON inclusion_gate.* TO 'inclusion_gate'@'localhost';

-- 권한 부여 (옵션 B: Moodle DB)
GRANT SELECT, INSERT, UPDATE ON moodle.* TO 'inclusion_gate'@'localhost';

FLUSH PRIVILEGES;
EXIT;
```

### 4. 스키마 적용
```bash
# 프로젝트 디렉토리로 이동
cd /path/to/alt42standalone_v1.0

# 옵션 A: 새 DB
mysql -u inclusion_gate -p inclusion_gate < database/schema.sql

# 옵션 B: Moodle DB
mysql -u inclusion_gate -p moodle < database/schema.sql
```

### 5. 스키마 확인
```bash
mysql -u inclusion_gate -p -e "SHOW TABLES FROM inclusion_gate;"
```

예상 출력:
```
+---------------------------+
| Tables_in_inclusion_gate   |
+---------------------------+
| inclusion_gate_attempts    |
| inclusion_gate_questions   |
| inclusion_gate_stats       |
+---------------------------+
```

---

## 애플리케이션 설정

### 1. 데이터베이스 설정 파일 생성
```bash
cd src/config
cp database.example.php database.php
```

### 2. 설정 파일 수정
`src/config/database.php`를 열어 아래 값을 수정:

```php
define('DB_HOST', 'localhost');           // MySQL 호스트
define('DB_NAME', 'inclusion_gate');      // 데이터베이스 이름
define('DB_USER', 'inclusion_gate');      // 사용자 이름
define('DB_PASS', 'secure_password_123'); // 비밀번호
```

### 3. 파일 권한 설정
```bash
# 소유자 변경 (웹 서버 사용자로)
sudo chown -R www-data:www-data /path/to/alt42standalone_v1.0

# 또는 nginx 사용 시
sudo chown -R nginx:nginx /path/to/alt42standalone_v1.0

# 권한 설정
chmod -R 755 src/
chmod 600 src/config/database.php
```

---

## 웹 서버 설정

### Apache 설정

#### 1. VirtualHost 설정 파일 생성
```bash
sudo nano /etc/apache2/sites-available/inclusion-gate.conf
```

#### 2. 설정 내용 입력
```apache
<VirtualHost *:80>
    ServerName inclusion-gate.example.com
    ServerAlias www.inclusion-gate.example.com

    DocumentRoot /path/to/alt42standalone_v1.0/src

    <Directory /path/to/alt42standalone_v1.0/src>
        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>

    # PHP 설정
    <FilesMatch \.php$>
        SetHandler "proxy:unix:/run/php/php7.1-fpm.sock|fcgi://localhost"
    </FilesMatch>

    # 로그 설정
    ErrorLog ${APACHE_LOG_DIR}/inclusion-gate-error.log
    CustomLog ${APACHE_LOG_DIR}/inclusion-gate-access.log combined
</VirtualHost>
```

#### 3. 사이트 활성화
```bash
# 필요한 모듈 활성화
sudo a2enmod rewrite
sudo a2enmod proxy_fcgi

# 사이트 활성화
sudo a2ensite inclusion-gate.conf

# Apache 재시작
sudo systemctl restart apache2
```

---

### Nginx 설정

#### 1. 서버 블록 설정 파일 생성
```bash
sudo nano /etc/nginx/sites-available/inclusion-gate
```

#### 2. 설정 내용 입력
```nginx
server {
    listen 80;
    server_name inclusion-gate.example.com www.inclusion-gate.example.com;

    root /path/to/alt42standalone_v1.0/src;
    index index.html index.php;

    # 로그 설정
    access_log /var/log/nginx/inclusion-gate-access.log;
    error_log /var/log/nginx/inclusion-gate-error.log;

    # 정적 파일 처리
    location / {
        try_files $uri $uri/ /index.html;
    }

    # PHP 처리
    location ~ \.php$ {
        include snippets/fastcgi-php.conf;
        fastcgi_pass unix:/run/php/php7.1-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
        include fastcgi_params;
    }

    # 설정 파일 보호
    location ~ /config/ {
        deny all;
        return 404;
    }

    # .git 디렉토리 보호
    location ~ /\.git {
        deny all;
        return 404;
    }
}
```

#### 3. 사이트 활성화
```bash
# 심볼릭 링크 생성
sudo ln -s /etc/nginx/sites-available/inclusion-gate /etc/nginx/sites-enabled/

# 설정 테스트
sudo nginx -t

# Nginx 재시작
sudo systemctl restart nginx
```

---

## 테스트

### 1. PHP 설정 테스트
```bash
# 테스트 파일 생성
echo "<?php phpinfo(); ?>" > /path/to/alt42standalone_v1.0/src/test.php

# 브라우저에서 확인
# http://inclusion-gate.example.com/test.php

# 확인 후 삭제
rm /path/to/alt42standalone_v1.0/src/test.php
```

### 2. 데이터베이스 연결 테스트
```bash
# 브라우저에서 접속
http://inclusion-gate.example.com/api/check-connection.php
```

예상 응답:
```json
{
  "success": true,
  "message": "Moodle 연결 성공",
  "timestamp": 1637123456
}
```

### 3. 메인 애플리케이션 테스트
```bash
# 브라우저에서 접속
http://inclusion-gate.example.com/
```

확인 사항:
- [x] 스마트폰 화면이 우측 하단에 표시됨
- [x] 문제가 로드됨 (샘플 데이터 또는 Moodle 문제)
- [x] 포함/포함X 버튼이 작동함
- [x] 게이트 애니메이션이 재생됨
- [x] 점수가 업데이트됨

### 4. API 엔드포인트 테스트
```bash
# 연결 확인
curl http://inclusion-gate.example.com/api/check-connection.php

# 문제 가져오기
curl http://inclusion-gate.example.com/api/get-question.php

# 답안 제출
curl -X POST http://inclusion-gate.example.com/api/submit-answer.php \
  -H "Content-Type: application/json" \
  -d '{"questionId":1,"isCorrect":true,"score":10}'
```

---

## 문제 해결

### 문제 1: "연결 확인 중..." 계속 표시

**원인**: 데이터베이스 연결 실패

**해결**:
1. MySQL 서비스 실행 확인
   ```bash
   sudo systemctl status mysql
   ```

2. 데이터베이스 설정 확인
   ```bash
   cat src/config/database.php
   ```

3. 직접 연결 테스트
   ```bash
   mysql -h localhost -u inclusion_gate -p inclusion_gate
   ```

4. PHP 에러 로그 확인
   ```bash
   sudo tail -f /var/log/php7.1-fpm.log
   ```

---

### 문제 2: "404 Not Found" 오류

**원인**: 웹 서버 설정 문제

**해결**:
1. DocumentRoot 경로 확인
   ```bash
   # Apache
   sudo apachectl -S | grep DocumentRoot

   # Nginx
   sudo nginx -T | grep root
   ```

2. 파일 권한 확인
   ```bash
   ls -la /path/to/alt42standalone_v1.0/src/
   ```

3. 웹 서버 재시작
   ```bash
   # Apache
   sudo systemctl restart apache2

   # Nginx
   sudo systemctl restart nginx
   ```

---

### 문제 3: PHP 파일이 다운로드됨

**원인**: PHP가 실행되지 않음

**해결**:
1. PHP-FPM 실행 확인
   ```bash
   sudo systemctl status php7.1-fpm
   ```

2. PHP-FPM 소켓 확인
   ```bash
   ls -la /run/php/php7.1-fpm.sock
   ```

3. 웹 서버 PHP 모듈 확인
   ```bash
   # Apache
   apachectl -M | grep php

   # Nginx
   cat /etc/nginx/sites-enabled/inclusion-gate | grep fastcgi
   ```

---

### 문제 4: 게이트 애니메이션이 작동하지 않음

**원인**: JavaScript 오류

**해결**:
1. 브라우저 콘솔 확인 (F12)

2. JavaScript 파일 로드 확인
   ```bash
   curl -I http://inclusion-gate.example.com/js/gate-animation.js
   ```

3. 캐시 삭제 후 새로고침 (Ctrl + Shift + R)

---

### 문제 5: CORS 오류

**원인**: Cross-Origin 요청 차단

**해결**:
API 파일에 CORS 헤더 추가 확인:
```php
header('Access-Control-Allow-Origin: *');
```

또는 특정 도메인만 허용:
```php
header('Access-Control-Allow-Origin: https://yourdomain.com');
```

---

## 추가 설정

### SSL/TLS 설정 (HTTPS)

#### Let's Encrypt 사용
```bash
# Certbot 설치
sudo apt-get install certbot python3-certbot-apache

# 인증서 발급 (Apache)
sudo certbot --apache -d inclusion-gate.example.com

# 또는 Nginx
sudo certbot --nginx -d inclusion-gate.example.com
```

### 성능 최적화

#### PHP-FPM 튜닝
`/etc/php/7.1/fpm/pool.d/www.conf`:
```ini
pm = dynamic
pm.max_children = 50
pm.start_servers = 5
pm.min_spare_servers = 5
pm.max_spare_servers = 35
```

#### Nginx 캐싱
```nginx
location ~* \.(css|js|jpg|jpeg|png|gif|ico)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

---

## 유지보수

### 로그 모니터링
```bash
# 실시간 로그 확인
sudo tail -f /var/log/nginx/inclusion-gate-error.log
sudo tail -f /var/log/php7.1-fpm.log
```

### 데이터베이스 백업
```bash
# 백업
mysqldump -u inclusion_gate -p inclusion_gate > backup_$(date +%Y%m%d).sql

# 복원
mysql -u inclusion_gate -p inclusion_gate < backup_20231118.sql
```

### 업데이트
```bash
cd /path/to/alt42standalone_v1.0
git pull origin main
sudo systemctl reload apache2  # 또는 nginx
```

---

## 도움말

더 자세한 정보는 다음을 참조하세요:
- [README.md](README.md) - 프로젝트 개요 및 사용법
- [Moodle 문서](https://docs.moodle.org/)
- [PHP 문서](https://www.php.net/docs.php)
- [MySQL 문서](https://dev.mysql.com/doc/)

문제가 지속되면 이슈를 등록해 주세요.
