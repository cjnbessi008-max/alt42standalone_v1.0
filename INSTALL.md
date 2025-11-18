# Installation Guide

## 빠른 설치 (Quick Install)

### 1. 사전 요구사항 확인

```bash
# PHP 버전 확인 (7.1.9 이상)
php -v

# MySQL 확인
mysql --version

# Apache/Nginx 확인
apache2 -v
# 또는
nginx -v
```

### 2. 프로젝트 다운로드

```bash
# Git clone
git clone <repository-url> alt42standalone_v1.0
cd alt42standalone_v1.0
```

### 3. 환경 설정

```bash
# .env 파일 생성
cp .env.example .env

# .env 파일 편집
nano .env
```

**필수 설정:**
```env
DB_HOST=localhost
DB_NAME=incorrect_solutions
DB_USER=your_db_user
DB_PASS=your_db_password

ANTHROPIC_API_KEY=your_claude_api_key
```

### 4. 데이터베이스 설정

```bash
# MySQL 접속
mysql -u root -p

# 데이터베이스 생성
CREATE DATABASE incorrect_solutions CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# 권한 부여
GRANT ALL PRIVILEGES ON incorrect_solutions.* TO 'your_db_user'@'localhost';
FLUSH PRIVILEGES;
exit;

# 스키마 적용
mysql -u your_db_user -p incorrect_solutions < database/schema.sql

# 샘플 데이터 추가 (선택사항)
mysql -u your_db_user -p incorrect_solutions < database/sample_data.sql
```

### 5. 웹 서버 설정

#### Apache 설정

```bash
# DocumentRoot를 프로젝트 디렉토리로 설정
sudo nano /etc/apache2/sites-available/000-default.conf
```

```apache
<VirtualHost *:80>
    ServerName localhost
    DocumentRoot /path/to/alt42standalone_v1.0

    <Directory /path/to/alt42standalone_v1.0>
        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>

    ErrorLog ${APACHE_LOG_DIR}/error.log
    CustomLog ${APACHE_LOG_DIR}/access.log combined
</VirtualHost>
```

```bash
# mod_rewrite 활성화
sudo a2enmod rewrite
sudo a2enmod headers

# Apache 재시작
sudo service apache2 restart
```

#### Nginx 설정

```bash
sudo nano /etc/nginx/sites-available/incorrect-solutions
```

```nginx
server {
    listen 80;
    server_name localhost;
    root /path/to/alt42standalone_v1.0/public;
    index index.html;

    # Public directory
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API routes
    location /api {
        rewrite ^/api/(.*)$ /api/index.php last;
    }

    # PHP processing
    location ~ \.php$ {
        include snippets/fastcgi-php.conf;
        fastcgi_pass unix:/var/run/php/php7.1-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
        include fastcgi_params;
    }

    # Deny access to hidden files
    location ~ /\. {
        deny all;
    }
}
```

```bash
# 심볼릭 링크 생성
sudo ln -s /etc/nginx/sites-available/incorrect-solutions /etc/nginx/sites-enabled/

# Nginx 테스트 및 재시작
sudo nginx -t
sudo service nginx restart
```

### 6. 권한 설정

```bash
# 로그 디렉토리 생성
mkdir -p logs

# 권한 설정
chmod -R 755 .
chmod -R 777 logs
chmod -R 777 public/uploads  # 업로드가 필요한 경우

# 소유자 설정 (Apache/Nginx 사용자)
sudo chown -R www-data:www-data .
# 또는 nginx의 경우
# sudo chown -R nginx:nginx .
```

### 7. 설치 확인

```bash
# 브라우저에서 접속
http://localhost

# API 헬스 체크
curl http://localhost/api/health
```

예상 응답:
```json
{
    "status": "healthy",
    "timestamp": "2025-11-18 12:00:00",
    "version": "1.0.0"
}
```

## Moodle 연동 (선택사항)

### 1. Moodle Web Services 활성화

1. Moodle 관리자로 로그인
2. **사이트 관리** → **고급 기능** → "웹 서비스 활성화" 체크
3. **사이트 관리** → **플러그인** → **웹 서비스** → **프로토콜 관리**
4. "REST 프로토콜" 활성화

### 2. 서비스 생성

1. **웹 서비스** → **외부 서비스** → "서비스 추가"
2. 이름: "Incorrect Solutions Integration"
3. 약칭: "incorrect_solutions"
4. "활성화" 체크

### 3. 함수 추가

서비스에 다음 함수들을 추가:
- `mod_assign_save_grade`
- `core_user_get_users_by_field`
- `core_course_get_courses`
- `core_enrol_get_enrolled_users`

### 4. 토큰 생성

1. **웹 서비스** → **토큰 관리** → "토큰 추가"
2. 사용자 선택
3. 서비스: "Incorrect Solutions Integration"
4. 생성된 토큰 복사

### 5. .env 파일 업데이트

```env
MOODLE_URL=http://your-moodle-site.com
MOODLE_TOKEN=your_generated_token_here
MOODLE_SYNC_ENABLED=true
```

### 6. Moodle 외부 도구 추가

1. Moodle 코스에서 "활동 또는 리소스 추가"
2. "외부 도구" 선택
3. URL: `http://your-domain.com/?course_id={course_id}&activity_id={activity_id}`

## 문제 해결

### PHP 확장 모듈 누락

```bash
# PHP 필수 확장 설치
sudo apt-get install php7.1-mysql php7.1-curl php7.1-json php7.1-mbstring

# Apache의 경우
sudo service apache2 restart

# Nginx의 경우
sudo service php7.1-fpm restart
```

### 데이터베이스 연결 오류

1. MySQL 서비스 확인:
```bash
sudo service mysql status
```

2. 데이터베이스 권한 확인:
```sql
SHOW GRANTS FOR 'your_db_user'@'localhost';
```

3. .env 파일의 DB 설정 재확인

### API 404 오류

1. .htaccess 파일 확인
2. mod_rewrite 활성화 확인:
```bash
apache2ctl -M | grep rewrite
```

3. AllowOverride 설정 확인 (Apache)

### CORS 오류

public/.htaccess 또는 Nginx 설정에서 CORS 헤더 추가:

```apache
# Apache
Header set Access-Control-Allow-Origin "*"
Header set Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS"
```

```nginx
# Nginx
add_header Access-Control-Allow-Origin *;
add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS";
```

## 업데이트

```bash
# Git pull
git pull origin main

# 데이터베이스 마이그레이션 (있는 경우)
mysql -u your_db_user -p incorrect_solutions < database/migrations/xxx.sql

# 캐시 클리어 (해당하는 경우)
rm -rf cache/*
```

## 백업

### 데이터베이스 백업

```bash
# 덤프 생성
mysqldump -u your_db_user -p incorrect_solutions > backup_$(date +%Y%m%d).sql

# 압축
gzip backup_$(date +%Y%m%d).sql
```

### 복원

```bash
# 압축 해제
gunzip backup_20251118.sql.gz

# 복원
mysql -u your_db_user -p incorrect_solutions < backup_20251118.sql
```

## 지원

문제가 발생하면 다음을 확인하세요:
1. 로그 파일: `logs/` 디렉토리
2. Apache/Nginx 로그
3. MySQL 로그
4. PHP 에러 로그

기술 지원: support@example.com
