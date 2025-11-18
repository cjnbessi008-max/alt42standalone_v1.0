# Alt42 Standalone 설치 가이드

## 빠른 시작

### 1단계: 환경 확인

다음 소프트웨어가 설치되어 있는지 확인하세요:

```bash
# PHP 버전 확인 (7.1.9 이상)
php -v

# MySQL 버전 확인 (5.7 이상)
mysql --version

# Apache/Nginx 상태 확인
sudo systemctl status apache2
# 또는
sudo systemctl status nginx
```

### 2단계: 프로젝트 다운로드

```bash
git clone https://github.com/your-repo/alt42standalone_v1.0.git
cd alt42standalone_v1.0
```

### 3단계: 데이터베이스 설정

```bash
# MySQL 접속
mysql -u root -p

# 스키마 실행
source database/schema.sql

# 접속 확인
USE alt42_monitor;
SHOW TABLES;
```

### 4단계: PHP 설정 파일 생성

```bash
# database.example.php를 복사
cp src/config/database.example.php src/config/database.php

# 에디터로 열어서 수정
nano src/config/database.php
```

다음 항목을 수정하세요:
- `DB_HOST`: MySQL 서버 주소 (보통 localhost)
- `DB_NAME`: alt42_monitor
- `DB_USER`: MySQL 사용자명
- `DB_PASS`: MySQL 비밀번호

### 5단계: Moodle 연동 설정

#### 5.1 Moodle Web Services 활성화

1. Moodle 관리자 계정으로 로그인
2. **사이트 관리** → **플러그인** → **웹 서비스** → **웹 서비스 관리**
3. 다음 항목 활성화:
   - "웹 서비스 활성화"
   - "REST 프로토콜 활성화"

#### 5.2 토큰 생성

1. **사이트 관리** → **플러그인** → **웹 서비스** → **토큰 관리**
2. "토큰 추가" 버튼 클릭
3. 사용자 및 서비스 선택
4. 생성된 토큰 복사

#### 5.3 데이터베이스에 토큰 저장

```sql
USE alt42_monitor;

UPDATE moodle_config
SET config_value = 'http://your-moodle-site.com'
WHERE config_key = 'moodle_url';

UPDATE moodle_config
SET config_value = 'your_copied_token_here'
WHERE config_key = 'moodle_token';
```

### 6단계: 웹 서버 설정

#### Apache 사용 시

```bash
# 가상 호스트 설정 파일 생성
sudo nano /etc/apache2/sites-available/alt42.conf
```

다음 내용 추가:

```apache
<VirtualHost *:80>
    ServerName alt42.local
    DocumentRoot /var/www/html/alt42standalone_v1.0/src

    <Directory /var/www/html/alt42standalone_v1.0/src>
        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>

    ErrorLog ${APACHE_LOG_DIR}/alt42_error.log
    CustomLog ${APACHE_LOG_DIR}/alt42_access.log combined
</VirtualHost>
```

사이트 활성화:

```bash
sudo a2ensite alt42
sudo systemctl restart apache2
```

#### Nginx 사용 시

```bash
sudo nano /etc/nginx/sites-available/alt42
```

다음 내용 추가:

```nginx
server {
    listen 80;
    server_name alt42.local;
    root /var/www/html/alt42standalone_v1.0/src;
    index index.html index.php;

    location / {
        try_files $uri $uri/ =404;
    }

    location ~ \.php$ {
        include snippets/fastcgi-php.conf;
        fastcgi_pass unix:/var/run/php/php7.1-fpm.sock;
    }

    location ~ /\.ht {
        deny all;
    }

    error_log /var/log/nginx/alt42_error.log;
    access_log /var/log/nginx/alt42_access.log;
}
```

사이트 활성화:

```bash
sudo ln -s /etc/nginx/sites-available/alt42 /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 7단계: hosts 파일 수정 (로컬 테스트용)

```bash
sudo nano /etc/hosts
```

다음 라인 추가:

```
127.0.0.1   alt42.local
```

### 8단계: 접속 테스트

브라우저에서 다음 URL로 접속:

1. **메인 페이지**: http://alt42.local/index.html
2. **API 테스트**: http://alt42.local/api/moodle-connector.php?action=test_connection

정상적으로 작동하면 다음과 같은 화면이 나타납니다:
- 좌측: 학습 활동 모니터 대시보드
- 우측 하단: 가상 스마트폰 화면
- 하단: 테스트 컨트롤 패널

## 문제 해결

### 문제 1: 데이터베이스 연결 오류

**증상**: "Database connection failed" 에러

**해결방법**:
```bash
# MySQL 서비스 상태 확인
sudo systemctl status mysql

# MySQL 재시작
sudo systemctl restart mysql

# PHP PDO 확장 확인
php -m | grep pdo_mysql

# 없다면 설치
sudo apt-get install php7.1-mysql
sudo systemctl restart apache2
```

### 문제 2: Moodle API 연결 실패

**증상**: "Moodle API request failed" 에러

**해결방법**:
1. Moodle Web Services 활성화 확인
2. 토큰 유효성 확인
3. Moodle URL 확인 (http/https)
4. 방화벽 설정 확인

### 문제 3: 애니메이션이 작동하지 않음

**증상**: 로그는 표시되지만 애니메이션 효과 없음

**해결방법**:
1. 브라우저 콘솔에서 JavaScript 오류 확인 (F12)
2. 최신 브라우저 사용 (Chrome, Firefox, Safari, Edge 최신 2개 버전)
3. 캐시 삭제 후 새로고침 (Ctrl + Shift + R)

### 문제 4: PHP 권한 오류

**증상**: "Permission denied" 에러

**해결방법**:
```bash
# 프로젝트 디렉토리 권한 설정
sudo chown -R www-data:www-data /var/www/html/alt42standalone_v1.0
sudo chmod -R 755 /var/www/html/alt42standalone_v1.0

# 로그 디렉토리 생성 및 권한
sudo mkdir -p /var/log/alt42
sudo chown www-data:www-data /var/log/alt42
```

## 프로덕션 배포

프로덕션 환경에 배포할 때는 다음 사항을 추가로 고려하세요:

### 1. HTTPS 설정

```bash
# Let's Encrypt 인증서 설치
sudo apt-get install certbot python3-certbot-apache
sudo certbot --apache -d alt42.yourdomain.com
```

### 2. 보안 설정

```php
// src/config/database.php
define('ENVIRONMENT', 'production');
```

### 3. 성능 최적화

```apache
# Apache에서 gzip 압축 활성화
sudo a2enmod deflate
sudo systemctl restart apache2
```

### 4. 백업 설정

```bash
# 데이터베이스 백업 스크립트
#!/bin/bash
mysqldump -u alt42_user -p alt42_monitor > /backup/alt42_$(date +%Y%m%d).sql
```

cron에 등록:
```bash
0 2 * * * /path/to/backup-script.sh
```

## 다음 단계

설치가 완료되었다면:

1. [사용 가이드](USAGE.md) 참고
2. [API 문서](API.md) 참고
3. [커스터마이징 가이드](CUSTOMIZATION.md) 참고

## 지원

문제가 계속되면:
- GitHub Issues: https://github.com/your-repo/alt42standalone_v1.0/issues
- 이메일: support@alt42.com
