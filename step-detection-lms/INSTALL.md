# Step Detection LMS - 설치 가이드

## 시스템 요구사항

### 필수 소프트웨어
- **PHP**: 7.1.9 이상
- **MySQL**: 5.7 이상
- **Apache** 또는 **Nginx** 웹 서버
- **mod_rewrite** 활성화 (Apache의 경우)

### 권장 사양
- CPU: 2 core 이상
- RAM: 4GB 이상
- 디스크: 10GB 이상 여유 공간

## 설치 단계

### 1. 저장소 클론 또는 다운로드

```bash
cd /var/www/html
git clone <repository-url> step-detection-lms
cd step-detection-lms
```

### 2. 데이터베이스 생성

MySQL에 접속하여 데이터베이스를 생성합니다:

```bash
mysql -u root -p
```

```sql
CREATE DATABASE step_detection_lms CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'stepdetection'@'localhost' IDENTIFIED BY 'your_secure_password';
GRANT ALL PRIVILEGES ON step_detection_lms.* TO 'stepdetection'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### 3. 스키마 적용

```bash
mysql -u stepdetection -p step_detection_lms < database/schema.sql
```

### 4. 샘플 데이터 로드 (선택사항)

테스트 및 데모를 위해 샘플 데이터를 로드할 수 있습니다:

```bash
mysql -u stepdetection -p step_detection_lms < database/sample_data.sql
```

### 5. 환경 변수 설정

`.env` 파일을 생성하고 설정합니다:

```bash
cp .env.example .env
nano .env
```

`.env` 파일 내용:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_NAME=step_detection_lms
DB_USER=stepdetection
DB_PASS=your_secure_password

# Application
APP_ENV=production
JWT_SECRET=your_random_secret_key_here

# Moodle Integration (선택사항)
MOODLE_ENABLED=false
MOODLE_URL=https://your-moodle-site.com
MOODLE_TOKEN=your_moodle_webservice_token
```

### 6. Apache 설정

#### Apache VirtualHost 설정

`/etc/apache2/sites-available/step-detection-lms.conf` 파일 생성:

```apache
<VirtualHost *:80>
    ServerName stepdetection.yourdomain.com
    DocumentRoot /var/www/html/step-detection-lms/public

    <Directory /var/www/html/step-detection-lms/public>
        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>

    ErrorLog ${APACHE_LOG_DIR}/step-detection-error.log
    CustomLog ${APACHE_LOG_DIR}/step-detection-access.log combined
</VirtualHost>
```

#### mod_rewrite 활성화 및 사이트 활성화

```bash
sudo a2enmod rewrite
sudo a2ensite step-detection-lms.conf
sudo systemctl restart apache2
```

#### .htaccess 파일 생성

`public/.htaccess`:

```apache
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteBase /

    # Redirect to index.php
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteRule ^(.*)$ index.php [QSA,L]
</IfModule>
```

### 7. Nginx 설정 (Apache 대신 사용하는 경우)

`/etc/nginx/sites-available/step-detection-lms`:

```nginx
server {
    listen 80;
    server_name stepdetection.yourdomain.com;
    root /var/www/html/step-detection-lms/public;
    index index.php index.html;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location ~ \.php$ {
        include snippets/fastcgi-php.conf;
        fastcgi_pass unix:/var/run/php/php7.1-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
        include fastcgi_params;
    }

    location ~ /\.ht {
        deny all;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/step-detection-lms /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 8. 권한 설정

```bash
sudo chown -R www-data:www-data /var/www/html/step-detection-lms
sudo chmod -R 755 /var/www/html/step-detection-lms
```

### 9. PHP 설정 확인

`php.ini`에서 다음 설정을 확인합니다:

```ini
upload_max_filesize = 20M
post_max_size = 20M
max_execution_time = 300
memory_limit = 256M
```

```bash
sudo systemctl restart apache2  # 또는 sudo systemctl restart php7.1-fpm
```

## 접속 확인

브라우저에서 다음 URL로 접속:

- **학생 인터페이스**: `http://stepdetection.yourdomain.com/`
- **교사 대시보드**: `http://stepdetection.yourdomain.com/teacher`
- **API 테스트**: `http://stepdetection.yourdomain.com/api/v1/problems`

## Moodle 연동 설정 (선택사항)

### 1. Moodle Web Service 활성화

Moodle 관리자 패널에서:

1. **사이트 관리 > 플러그인 > 웹 서비스 > 개요** 이동
2. 다음 항목들을 활성화:
   - 웹 서비스 활성화
   - REST 프로토콜 활성화

### 2. 웹 서비스 토큰 생성

1. **사이트 관리 > 플러그인 > 웹 서비스 > 토큰 관리**
2. "토큰 추가" 클릭
3. 사용자 선택 및 서비스 선택
4. 생성된 토큰을 `.env` 파일의 `MOODLE_TOKEN`에 입력

### 3. 필요한 웹 서비스 함수 권한 부여

다음 함수들에 대한 권한이 필요합니다:

- `core_user_get_users_by_field`
- `mod_quiz_save_attempt`
- `core_log_create_log_entry`

## 문제 해결

### API가 404 오류를 반환하는 경우

- `mod_rewrite`가 활성화되었는지 확인
- `.htaccess` 파일이 존재하는지 확인
- Apache VirtualHost 설정에서 `AllowOverride All`이 설정되었는지 확인

### 데이터베이스 연결 실패

- MySQL 서비스가 실행 중인지 확인: `sudo systemctl status mysql`
- `.env` 파일의 데이터베이스 자격 증명 확인
- 데이터베이스 사용자 권한 확인

### 빈 화면 또는 500 오류

- PHP 오류 로그 확인: `/var/log/apache2/error.log` 또는 `/var/log/nginx/error.log`
- PHP 오류 표시 활성화 (개발 환경):
  ```php
  // config/config.php에서
  error_reporting(E_ALL);
  ini_set('display_errors', 1);
  ```

### 권한 오류

```bash
sudo chown -R www-data:www-data /var/www/html/step-detection-lms
sudo chmod -R 755 /var/www/html/step-detection-lms
```

## 보안 권장사항

### 프로덕션 환경

1. **HTTPS 활성화**:
   ```bash
   sudo apt install certbot python3-certbot-apache
   sudo certbot --apache -d stepdetection.yourdomain.com
   ```

2. **오류 표시 비활성화**:
   ```php
   // config/config.php
   error_reporting(0);
   ini_set('display_errors', 0);
   ```

3. **데이터베이스 백업 자동화**:
   ```bash
   # Cron job 추가
   0 2 * * * mysqldump -u stepdetection -p'password' step_detection_lms > /backup/step_detection_$(date +\%Y\%m\%d).sql
   ```

4. **강력한 JWT Secret 사용**:
   ```bash
   # 랜덤 키 생성
   openssl rand -base64 32
   ```

5. **방화벽 설정**:
   ```bash
   sudo ufw allow 80/tcp
   sudo ufw allow 443/tcp
   sudo ufw enable
   ```

## 업데이트

시스템 업데이트 시:

```bash
cd /var/www/html/step-detection-lms
git pull origin main

# 데이터베이스 마이그레이션 적용 (있는 경우)
mysql -u stepdetection -p step_detection_lms < database/migrations/YYYYMMDD_migration.sql

# 캐시 정리
sudo systemctl restart apache2
```

## 지원 및 문의

- 문제 발생 시: GitHub Issues
- 문서: README.md 참조
- 이메일: support@example.com

---

설치 완료 후 샘플 계정으로 로그인하여 테스트할 수 있습니다:

- **학생**: student001 / student001@school.kr
- **교사**: teacher_kim / kim@kaist.ac.kr

(샘플 데이터 로드 시)
