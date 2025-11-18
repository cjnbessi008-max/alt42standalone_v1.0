# Parabola Glow - 설치 가이드

## 빠른 시작 (Quick Start)

### 1단계: 파일 복사

프로젝트 파일을 웹 서버의 문서 루트에 복사합니다.

```bash
# Apache 기본 경로 예시
cp -r alt42standalone_v1.0/ /var/www/html/parabola-glow/

# 또는 Nginx
cp -r alt42standalone_v1.0/ /usr/share/nginx/html/parabola-glow/
```

### 2단계: 권한 설정

```bash
cd /var/www/html/parabola-glow/
chmod -R 755 .
chown -R www-data:www-data .  # Apache 사용자로 변경
```

### 3단계: 데이터베이스 설정

#### MySQL 데이터베이스 생성

```sql
CREATE DATABASE IF NOT EXISTS moodle CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'moodle_user'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON moodle.* TO 'moodle_user'@'localhost';
FLUSH PRIVILEGES;
```

#### 데이터베이스 설정 파일 수정

`config/database.php` 파일을 편집합니다:

```php
private $host = 'localhost';
private $db_name = 'moodle';
private $username = 'moodle_user';
private $password = 'your_password';
```

### 4단계: Moodle 테이블 구조 (선택사항)

Moodle이 설치되어 있지 않다면, 테스트용 테이블을 생성하세요:

```sql
-- 질문 테이블
CREATE TABLE mdl_question (
    id BIGINT(10) NOT NULL AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    questiontext TEXT NOT NULL,
    qtype VARCHAR(20) DEFAULT 'calculated',
    created BIGINT(10) DEFAULT 0,
    modified BIGINT(10) DEFAULT 0,
    PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 답안 테이블
CREATE TABLE mdl_question_answers (
    id BIGINT(10) NOT NULL AUTO_INCREMENT,
    question BIGINT(10) NOT NULL,
    value TEXT,
    fraction DECIMAL(12,7) NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    KEY question (question)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 시도 테이블
CREATE TABLE mdl_question_attempts (
    id BIGINT(10) NOT NULL AUTO_INCREMENT,
    questionid BIGINT(10) NOT NULL,
    userid BIGINT(10) NOT NULL,
    responsesummary TEXT,
    timemodified BIGINT(10) NOT NULL,
    PRIMARY KEY (id),
    KEY questionid (questionid),
    KEY userid (userid)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

### 5단계: 샘플 데이터 삽입

```sql
-- 예제 문제 1
INSERT INTO mdl_question (name, questiontext, qtype, created, modified)
VALUES ('2차 부등식 예제 1', 'x² - 4x + 3 < 0의 해를 구하시오.', 'calculated', UNIX_TIMESTAMP(), UNIX_TIMESTAMP());

-- 예제 문제 2
INSERT INTO mdl_question (name, questiontext, qtype, created, modified)
VALUES ('2차 부등식 예제 2', 'x² - 4 > 0의 해를 구하시오.', 'calculated', UNIX_TIMESTAMP(), UNIX_TIMESTAMP());

-- 예제 문제 3
INSERT INTO mdl_question (name, questiontext, qtype, created, modified)
VALUES ('2차 부등식 예제 3', '-x² + 2x + 3 ≤ 0의 해를 구하시오.', 'calculated', UNIX_TIMESTAMP(), UNIX_TIMESTAMP());
```

### 6단계: 웹 서버 설정

#### Apache

`/etc/apache2/sites-available/parabola-glow.conf`:

```apache
<VirtualHost *:80>
    ServerName parabola-glow.local
    DocumentRoot /var/www/html/parabola-glow

    <Directory /var/www/html/parabola-glow>
        Options Indexes FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>

    ErrorLog ${APACHE_LOG_DIR}/parabola-glow-error.log
    CustomLog ${APACHE_LOG_DIR}/parabola-glow-access.log combined
</VirtualHost>
```

사이트 활성화:

```bash
sudo a2ensite parabola-glow.conf
sudo a2enmod rewrite
sudo systemctl restart apache2
```

#### Nginx

`/etc/nginx/sites-available/parabola-glow`:

```nginx
server {
    listen 80;
    server_name parabola-glow.local;
    root /usr/share/nginx/html/parabola-glow;
    index public/index.html;

    location / {
        try_files $uri $uri/ /public/index.html;
    }

    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php7.1-fpm.sock;
        fastcgi_index index.php;
        include fastcgi_params;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
    }

    location ~ /\.ht {
        deny all;
    }
}
```

사이트 활성화:

```bash
sudo ln -s /etc/nginx/sites-available/parabola-glow /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 7단계: hosts 파일 수정 (로컬 테스트용)

`/etc/hosts` (Linux/Mac) 또는 `C:\Windows\System32\drivers\etc\hosts` (Windows):

```
127.0.0.1    parabola-glow.local
```

### 8단계: 접속 테스트

브라우저에서 다음 URL로 접속:

- **메인 페이지**: http://parabola-glow.local/public/index.html
- **API 테스트**: http://parabola-glow.local/src/api/moodle_integration.php

## 트러블슈팅

### PHP 에러: "PDO driver not found"

```bash
# Ubuntu/Debian
sudo apt-get install php7.1-mysql
sudo systemctl restart apache2

# CentOS/RHEL
sudo yum install php71-mysqlnd
sudo systemctl restart httpd
```

### 데이터베이스 연결 오류

1. MySQL 서비스 상태 확인:
   ```bash
   sudo systemctl status mysql
   ```

2. 연결 정보 확인:
   ```bash
   mysql -u moodle_user -p
   ```

3. PHP 에러 로그 확인:
   ```bash
   tail -f /var/log/apache2/error.log
   # 또는
   tail -f /var/log/nginx/error.log
   ```

### Canvas가 표시되지 않음

브라우저 개발자 도구 (F12)를 열어 콘솔 에러 확인:

1. JavaScript 파일 경로 확인
2. CORS 에러가 있다면 `.htaccess` 또는 Nginx 설정 확인
3. 브라우저 캐시 삭제 후 새로고침 (Ctrl + Shift + R)

### 파일 권한 문제

```bash
# 전체 파일 권한 재설정
cd /var/www/html/parabola-glow
sudo find . -type f -exec chmod 644 {} \;
sudo find . -type d -exec chmod 755 {} \;
sudo chown -R www-data:www-data .
```

## 프로덕션 배포

### 보안 설정

1. **database.php 파일 보호**:
   ```apache
   <Files "database.php">
       Require all denied
   </Files>
   ```

2. **디버그 모드 비활성화**:
   - `config/database.php`에서 에러 로깅만 유지
   - 상세 에러 메시지 숨김

3. **HTTPS 활성화**:
   ```bash
   sudo certbot --apache -d parabola-glow.example.com
   ```

### 성능 최적화

1. **PHP OPcache 활성화**:
   ```ini
   # /etc/php/7.1/apache2/php.ini
   opcache.enable=1
   opcache.memory_consumption=128
   opcache.max_accelerated_files=4000
   ```

2. **Gzip 압축 활성화** (이미 `.htaccess`에 포함)

3. **브라우저 캐싱** (이미 `.htaccess`에 포함)

## 업데이트

### Git을 통한 업데이트

```bash
cd /var/www/html/parabola-glow
git pull origin main
sudo systemctl restart apache2
```

### 수동 업데이트

1. 백업 생성:
   ```bash
   cp -r /var/www/html/parabola-glow /var/www/html/parabola-glow.backup
   ```

2. 새 파일로 교체 (config 파일 제외)

3. 권한 재설정

## 지원

문제가 발생하면 GitHub Issues에 보고해주세요:
https://github.com/your-repo/parabola-glow/issues
