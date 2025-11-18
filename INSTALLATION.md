# 설치 가이드 (Installation Guide)

## 빠른 시작 (Quick Start)

### 1. 시스템 요구사항 확인
- PHP 7.1.9+
- MySQL 5.7+
- Apache/Nginx 웹 서버
- Moodle 3.7+ (Web Services 활성화)

### 2. 파일 설치
```bash
# 프로젝트 클론
git clone <repository-url>
cd alt42standalone_v1.0

# 필요한 디렉토리 생성
mkdir -p logs storage storage/uploads storage/cache
chmod 777 logs storage
```

### 3. 데이터베이스 설정
```bash
# MySQL 접속
mysql -u root -p

# 데이터베이스 생성
CREATE DATABASE cognitive_recovery CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'cognitive_user'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON cognitive_recovery.* TO 'cognitive_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### 4. 환경 설정
```bash
# .env 파일 생성
cp config/.env.example config/.env

# .env 파일 편집
nano config/.env
```

**.env 파일 내용**:
```env
DB_HOST=localhost
DB_NAME=cognitive_recovery
DB_USER=cognitive_user
DB_PASS=your_password

MOODLE_URL=http://your-moodle-site.com
MOODLE_TOKEN=your_webservice_token

APP_ENV=production
APP_DEBUG=false

JWT_SECRET=your_random_secret_here
```

### 5. 데이터베이스 초기화
```bash
# 스키마 설치
php install.php

# 샘플 문제 추가
mysql -u cognitive_user -p cognitive_recovery < database/sample_questions.sql
```

### 6. 웹 서버 설정

#### Apache 설정
```apache
<VirtualHost *:80>
    ServerName cognitive.example.com
    DocumentRoot /var/www/alt42standalone_v1.0/public

    <Directory /var/www/alt42standalone_v1.0/public>
        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>

    ErrorLog ${APACHE_LOG_DIR}/cognitive_error.log
    CustomLog ${APACHE_LOG_DIR}/cognitive_access.log combined
</VirtualHost>
```

```bash
# Apache 모듈 활성화
sudo a2enmod rewrite
sudo systemctl restart apache2
```

#### Nginx 설정
```nginx
server {
    listen 80;
    server_name cognitive.example.com;
    root /var/www/alt42standalone_v1.0/public;
    index dashboard.html index.php;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php7.1-fpm.sock;
        fastcgi_index index.php;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
        include fastcgi_params;
    }

    location ~ /\.(?!well-known).* {
        deny all;
    }
}
```

```bash
# Nginx 재시작
sudo systemctl restart nginx
sudo systemctl restart php7.1-fpm
```

### 7. 테스트
```bash
# API 테스트 실행
php test_api.php

# 브라우저에서 접속
http://cognitive.example.com/dashboard.html
http://cognitive.example.com/api/status
```

## Moodle 설정

### 1. Web Services 활성화
1. Moodle 관리자로 로그인
2. **사이트 관리 > 고급 기능** (Site administration > Advanced features)
3. "웹 서비스 활성화" (Enable web services) 체크
4. 저장

### 2. 외부 서비스 생성
1. **사이트 관리 > 플러그인 > 웹 서비스 > 외부 서비스**
   (Site administration > Plugins > Web services > External services)
2. "서비스 추가" (Add) 클릭
3. 다음 정보 입력:
   - 이름: Cognitive Recovery System
   - 약어: cognitive_recovery
   - 활성화 체크
4. 저장 후 "함수" (Functions) 클릭
5. 다음 함수들 추가:
   - core_user_get_users_by_field
   - core_user_get_users
   - core_course_get_courses
   - core_enrol_get_enrolled_users
   - core_enrol_get_users_courses
   - core_webservice_get_site_info

### 3. 토큰 생성
1. **사이트 관리 > 플러그인 > 웹 서비스 > 토큰 관리**
   (Site administration > Plugins > Web services > Manage tokens)
2. "토큰 생성" (Create token) 클릭
3. 다음 정보 선택:
   - 사용자: 관리자 또는 적절한 권한을 가진 사용자
   - 서비스: Cognitive Recovery System
4. 저장
5. 생성된 토큰 복사
6. `.env` 파일의 `MOODLE_TOKEN`에 붙여넣기

### 4. 연결 테스트
```bash
# API를 통해 Moodle 연결 테스트
curl http://cognitive.example.com/api/moodle/test
```

응답 예시:
```json
{
    "success": true,
    "connected": true,
    "moodle_url": "http://your-moodle-site.com"
}
```

## 문제 해결 (Troubleshooting)

### 데이터베이스 연결 오류
```bash
# MySQL 서비스 확인
sudo systemctl status mysql

# 권한 확인
mysql -u cognitive_user -p
SHOW GRANTS;
```

### PHP 오류
```bash
# PHP 버전 확인
php -v

# 필요한 확장 모듈 확인
php -m | grep -E 'pdo|mysql|json|curl'

# 확장 모듈 설치 (Ubuntu/Debian)
sudo apt-get install php7.1-mysql php7.1-curl php7.1-json php7.1-mbstring
```

### 권한 오류
```bash
# 디렉토리 권한 설정
sudo chown -R www-data:www-data /var/www/alt42standalone_v1.0
sudo chmod -R 755 /var/www/alt42standalone_v1.0
sudo chmod -R 777 /var/www/alt42standalone_v1.0/logs
sudo chmod -R 777 /var/www/alt42standalone_v1.0/storage
```

### Moodle 연결 오류
1. Moodle Web Services가 활성화되어 있는지 확인
2. 토큰이 올바른지 확인
3. 방화벽 설정 확인
4. Moodle 로그 확인: **사이트 관리 > 보고서 > 로그**

### API 404 오류
```bash
# Apache mod_rewrite 확인
sudo a2enmod rewrite
sudo systemctl restart apache2

# .htaccess 파일 존재 확인
ls -la public/.htaccess

# AllowOverride 설정 확인 (Apache 설정)
```

## 보안 권장사항

### 프로덕션 환경
```env
# .env 파일
APP_ENV=production
APP_DEBUG=false

# 강력한 비밀번호 사용
DB_PASS=strong_random_password_here
JWT_SECRET=long_random_string_here
```

### HTTPS 설정
```bash
# Let's Encrypt SSL 인증서 설치
sudo apt-get install certbot python3-certbot-apache
sudo certbot --apache -d cognitive.example.com
```

### 파일 권한
```bash
# .env 파일 보호
chmod 600 config/.env

# 업로드 디렉토리 실행 금지
echo "php_flag engine off" > storage/.htaccess
```

## 성능 최적화

### MySQL 최적화
```sql
-- 인덱스 확인
SHOW INDEX FROM cognitive_assessments;
SHOW INDEX FROM recovery_metrics;

-- 쿼리 성능 분석
EXPLAIN SELECT * FROM cognitive_assessments WHERE user_id = 1;
```

### PHP 최적화
```ini
; php.ini
memory_limit = 256M
max_execution_time = 60
upload_max_filesize = 10M
post_max_size = 10M

; OPcache 활성화
opcache.enable=1
opcache.memory_consumption=128
```

## 백업

### 데이터베이스 백업
```bash
# 백업 생성
mysqldump -u cognitive_user -p cognitive_recovery > backup_$(date +%Y%m%d).sql

# 백업 복원
mysql -u cognitive_user -p cognitive_recovery < backup_20251118.sql
```

### 파일 백업
```bash
# 전체 백업
tar -czf cognitive_backup_$(date +%Y%m%d).tar.gz /var/www/alt42standalone_v1.0

# 설정 파일만 백업
tar -czf cognitive_config_$(date +%Y%m%d).tar.gz config/.env
```

## 업데이트

### 시스템 업데이트
```bash
# Git pull
git pull origin main

# 데이터베이스 마이그레이션 (있을 경우)
php migrate.php

# 캐시 정리
rm -rf storage/cache/*
```

## 지원

문제가 발생하면:
1. 로그 파일 확인: `logs/`
2. PHP 에러 로그 확인: `/var/log/apache2/error.log` 또는 `/var/log/nginx/error.log`
3. MySQL 로그 확인: `/var/log/mysql/error.log`
4. 이슈 등록: GitHub Issues
