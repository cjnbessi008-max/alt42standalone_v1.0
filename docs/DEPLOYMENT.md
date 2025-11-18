# 배포 가이드

개념-문제 매칭 시각화 시스템의 배포 절차 및 가이드입니다.

## 목차

- [환경 준비](#환경-준비)
- [로컬 개발 환경](#로컬-개발-환경)
- [프로덕션 배포](#프로덕션-배포)
- [Docker 배포](#docker-배포)
- [보안 설정](#보안-설정)
- [성능 최적화](#성능-최적화)

## 환경 준비

### 시스템 요구사항

- **OS**: Ubuntu 20.04 LTS, CentOS 8, Windows Server 2019
- **PHP**: 7.1.9 이상 (7.4 권장)
- **MySQL**: 5.7 이상 (8.0 권장)
- **웹 서버**: Apache 2.4 또는 Nginx 1.18
- **메모리**: 최소 2GB RAM (4GB 권장)
- **디스크**: 최소 10GB 여유 공간

### PHP 확장 모듈

필요한 PHP 확장:

```bash
# Ubuntu/Debian
sudo apt-get install php7.4-mysql php7.4-mbstring php7.4-json php7.4-xml

# CentOS/RHEL
sudo yum install php74-mysql php74-mbstring php74-json php74-xml
```

확인:
```bash
php -m | grep -E 'pdo|mysql|mbstring|json'
```

## 로컬 개발 환경

### 1. XAMPP 사용 (Windows/Mac/Linux)

1. **XAMPP 설치**: https://www.apachefriends.org/download.html

2. **프로젝트 배치**:
```bash
# Windows
C:\xampp\htdocs\concept-matching\

# Linux/Mac
/opt/lampp/htdocs/concept-matching/
```

3. **가상 호스트 설정** (`httpd-vhosts.conf`):
```apache
<VirtualHost *:80>
    ServerName concept-matching.local
    DocumentRoot "C:/xampp/htdocs/concept-matching/src/frontend"

    <Directory "C:/xampp/htdocs/concept-matching">
        Options Indexes FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>

    # API 라우팅
    Alias /api "C:/xampp/htdocs/concept-matching/src/backend/api"
</VirtualHost>
```

4. **hosts 파일 수정**:
```
# Windows: C:\Windows\System32\drivers\etc\hosts
# Linux/Mac: /etc/hosts

127.0.0.1  concept-matching.local
```

5. **Apache 재시작**:
```bash
# XAMPP Control Panel에서 Apache 재시작
# 또는 명령어
sudo /opt/lampp/lampp restartapache
```

### 2. MAMP 사용 (Mac)

1. MAMP 설치 및 실행
2. Document Root를 프로젝트 폴더로 설정
3. MySQL 시작 및 데이터베이스 생성
4. `http://localhost:8888`로 접속

## 프로덕션 배포

### Apache 배포

#### 1. 프로젝트 복사

```bash
# 프로젝트를 웹 루트로 복사
sudo cp -r /path/to/alt42standalone_v1.0 /var/www/html/concept-matching
sudo chown -R www-data:www-data /var/www/html/concept-matching
sudo chmod -R 755 /var/www/html/concept-matching
```

#### 2. Apache 가상 호스트 설정

`/etc/apache2/sites-available/concept-matching.conf` 생성:

```apache
<VirtualHost *:80>
    ServerName concept-matching.yourdomain.com
    ServerAdmin admin@yourdomain.com

    DocumentRoot /var/www/html/concept-matching/src/frontend

    <Directory /var/www/html/concept-matching>
        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>

    # API 라우팅
    Alias /api /var/www/html/concept-matching/src/backend/api

    <Directory /var/www/html/concept-matching/src/backend/api>
        Options -Indexes
        AllowOverride All
        Require all granted
    </Directory>

    # 로그
    ErrorLog ${APACHE_LOG_DIR}/concept-matching-error.log
    CustomLog ${APACHE_LOG_DIR}/concept-matching-access.log combined

    # 보안 헤더
    Header always set X-Frame-Options "SAMEORIGIN"
    Header always set X-Content-Type-Options "nosniff"
    Header always set X-XSS-Protection "1; mode=block"
</VirtualHost>
```

#### 3. 사이트 활성화

```bash
sudo a2ensite concept-matching.conf
sudo a2enmod rewrite headers
sudo systemctl restart apache2
```

### Nginx 배포

#### 1. Nginx 설정

`/etc/nginx/sites-available/concept-matching` 생성:

```nginx
server {
    listen 80;
    server_name concept-matching.yourdomain.com;

    root /var/www/html/concept-matching/src/frontend;
    index index.html;

    # 로그
    access_log /var/log/nginx/concept-matching-access.log;
    error_log /var/log/nginx/concept-matching-error.log;

    # 정적 파일
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API 프록시
    location /api/ {
        rewrite ^/api/(.*)$ /src/backend/api/api.php/$1 break;

        fastcgi_pass unix:/var/run/php/php7.4-fpm.sock;
        fastcgi_index api.php;
        fastcgi_param SCRIPT_FILENAME /var/www/html/concept-matching/src/backend/api/api.php;
        include fastcgi_params;
    }

    # PHP 처리
    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php7.4-fpm.sock;
        fastcgi_index index.php;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
        include fastcgi_params;
    }

    # 보안: 중요 파일 접근 차단
    location ~ /\. {
        deny all;
    }

    location ~* \.(sql|log|md)$ {
        deny all;
    }

    # 보안 헤더
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
```

#### 2. 사이트 활성화

```bash
sudo ln -s /etc/nginx/sites-available/concept-matching /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
sudo systemctl restart php7.4-fpm
```

## Docker 배포

### Dockerfile

`Dockerfile` 생성:

```dockerfile
FROM php:7.4-apache

# PHP 확장 설치
RUN docker-php-ext-install pdo pdo_mysql mysqli

# Apache 모듈 활성화
RUN a2enmod rewrite headers

# 프로젝트 파일 복사
COPY . /var/www/html/

# 권한 설정
RUN chown -R www-data:www-data /var/www/html \
    && chmod -R 755 /var/www/html

# 로그 디렉토리
RUN mkdir -p /var/www/html/logs \
    && chown www-data:www-data /var/www/html/logs

# Apache 설정
COPY docker/apache-config.conf /etc/apache2/sites-available/000-default.conf

EXPOSE 80

CMD ["apache2-foreground"]
```

### docker-compose.yml

```yaml
version: '3.8'

services:
  web:
    build: .
    ports:
      - "8080:80"
    volumes:
      - ./src:/var/www/html/src
      - ./config:/var/www/html/config
      - ./logs:/var/www/html/logs
    depends_on:
      - db
    environment:
      - DB_HOST=db
      - DB_NAME=concept_problem_matching
      - DB_USER=root
      - DB_PASS=rootpassword

  db:
    image: mysql:5.7
    ports:
      - "3306:3306"
    environment:
      MYSQL_ROOT_PASSWORD: rootpassword
      MYSQL_DATABASE: concept_problem_matching
    volumes:
      - db_data:/var/lib/mysql
      - ./src/database/schema.sql:/docker-entrypoint-initdb.d/schema.sql

volumes:
  db_data:
```

### 실행

```bash
# 빌드 및 실행
docker-compose up -d

# 로그 확인
docker-compose logs -f

# 중지
docker-compose down
```

## 보안 설정

### 1. 파일 권한

```bash
# 소유자 설정
sudo chown -R www-data:www-data /var/www/html/concept-matching

# 디렉토리: 755, 파일: 644
sudo find /var/www/html/concept-matching -type d -exec chmod 755 {} \;
sudo find /var/www/html/concept-matching -type f -exec chmod 644 {} \;

# 로그 디렉토리: 쓰기 권한
sudo chmod 775 /var/www/html/concept-matching/logs
```

### 2. 설정 파일 보호

```bash
# config.php 외부 접근 차단
sudo chmod 640 /var/www/html/concept-matching/config/config.php
```

Apache `.htaccess`:
```apache
<Files "config.php">
    Require all denied
</Files>
```

### 3. SQL Injection 방지

- PDO Prepared Statements 사용 (이미 구현됨)
- 입력 검증 강화

### 4. XSS 방지

- `htmlspecialchars()` 사용
- Content Security Policy 헤더 추가

### 5. HTTPS 설정 (Let's Encrypt)

```bash
# Certbot 설치
sudo apt-get install certbot python3-certbot-apache

# SSL 인증서 발급
sudo certbot --apache -d concept-matching.yourdomain.com

# 자동 갱신 설정
sudo systemctl enable certbot.timer
```

## 성능 최적화

### 1. PHP 최적화

`php.ini` 설정:

```ini
# 메모리 제한
memory_limit = 256M

# 실행 시간
max_execution_time = 60

# OPcache 활성화
opcache.enable=1
opcache.memory_consumption=128
opcache.max_accelerated_files=10000
opcache.revalidate_freq=2
```

### 2. MySQL 최적화

`my.cnf` 설정:

```ini
[mysqld]
# InnoDB 버퍼 풀
innodb_buffer_pool_size = 1G

# 쿼리 캐시
query_cache_type = 1
query_cache_size = 64M

# 연결 수
max_connections = 200
```

인덱스 추가:
```sql
-- 이미 schema.sql에 포함됨
CREATE INDEX idx_concept_category ON concepts(category);
CREATE INDEX idx_problem_difficulty ON problems(difficulty_level);
```

### 3. 캐싱

PHP에서 Redis 캐싱 구현 (선택사항):

```php
// Redis 연결
$redis = new Redis();
$redis->connect('127.0.0.1', 6379);

// 캐시 확인
$cacheKey = 'graph_data_' . md5(json_encode($filters));
$cachedData = $redis->get($cacheKey);

if ($cachedData) {
    return json_decode($cachedData, true);
}

// 데이터 조회 및 캐싱
$data = fetchDataFromDB();
$redis->setex($cacheKey, 300, json_encode($data)); // 5분 캐시
```

### 4. 프론트엔드 최적화

- JavaScript/CSS 압축 (Minify)
- 이미지 최적화
- CDN 사용 (D3.js, jQuery)
- Gzip 압축 활성화

Apache:
```apache
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css text/javascript application/javascript
</IfModule>
```

## 모니터링

### 1. 로그 모니터링

```bash
# Apache 로그
tail -f /var/log/apache2/concept-matching-error.log

# 애플리케이션 로그
tail -f /var/www/html/concept-matching/logs/$(date +%Y-%m-%d).log
```

### 2. 성능 모니터링

- **New Relic**: PHP 애플리케이션 모니터링
- **Prometheus + Grafana**: 시스템 메트릭
- **MySQL Slow Query Log**: 느린 쿼리 분석

## 백업

### 데이터베이스 백업

```bash
#!/bin/bash
# backup.sh

BACKUP_DIR="/var/backups/concept-matching"
DATE=$(date +%Y%m%d_%H%M%S)

# DB 백업
mysqldump -u root -p concept_problem_matching > "$BACKUP_DIR/db_$DATE.sql"

# 7일 이상 된 백업 삭제
find $BACKUP_DIR -name "db_*.sql" -mtime +7 -delete
```

Cron 설정:
```bash
# 매일 새벽 2시 백업
0 2 * * * /path/to/backup.sh
```

## 트러블슈팅

### 일반적인 문제

1. **500 Internal Server Error**
   - PHP 에러 로그 확인
   - 파일 권한 확인
   - Apache/Nginx 설정 검증

2. **Database Connection Failed**
   - MySQL 서비스 상태 확인
   - `config.php` 설정 확인
   - 방화벽 규칙 확인

3. **API 404 Error**
   - Rewrite 모듈 활성화 확인
   - `.htaccess` 파일 확인
   - URL 경로 확인

---

**문의**: 배포 관련 문의사항은 GitHub Issues에 등록해 주세요.
