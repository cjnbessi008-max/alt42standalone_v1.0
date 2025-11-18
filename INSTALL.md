# 설치 가이드 (Installation Guide)

## 빠른 시작 (Quick Start)

### 1단계: 시스템 요구사항 확인

```bash
# PHP 버전 확인
php -v
# PHP 7.1.9 이상이어야 합니다

# MySQL 버전 확인
mysql --version
# MySQL 5.7 이상이어야 합니다
```

### 2단계: 프로젝트 다운로드

```bash
# Git clone (또는 ZIP 다운로드)
git clone <repository-url>
cd alt42standalone_v1.0
```

### 3단계: 데이터베이스 설정

#### 방법 1: 명령줄 사용

```bash
# MySQL 접속
mysql -u root -p

# 아래 SQL 명령어 실행
```

```sql
-- 데이터베이스 생성
CREATE DATABASE condition_verification CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 사용자 생성 (선택사항, 보안을 위해 권장)
CREATE USER 'cvs_user'@'localhost' IDENTIFIED BY 'your_secure_password';
GRANT ALL PRIVILEGES ON condition_verification.* TO 'cvs_user'@'localhost';
FLUSH PRIVILEGES;

-- 데이터베이스 선택
USE condition_verification;

-- 스키마 임포트
SOURCE database/schema.sql;

-- 확인
SHOW TABLES;
```

#### 방법 2: phpMyAdmin 사용

1. phpMyAdmin 접속 (`http://localhost/phpmyadmin`)
2. 새 데이터베이스 생성: `condition_verification`
   - 문자 집합: `utf8mb4`
   - 정렬: `utf8mb4_unicode_ci`
3. 임포트 탭 선택
4. `database/schema.sql` 파일 선택
5. "실행" 클릭

### 4단계: 설정 파일 수정

`config/database.php` 파일을 열어 데이터베이스 접속 정보 수정:

```php
define('DB_HOST', 'localhost');
define('DB_PORT', '3306');
define('DB_NAME', 'condition_verification');
define('DB_USER', 'cvs_user');        // 생성한 사용자명
define('DB_PASS', 'your_secure_password');  // 설정한 비밀번호
```

### 5단계: 권한 설정 (Linux/Mac)

```bash
# Apache 사용자에게 쓰기 권한 부여 (필요시)
sudo chown -R www-data:www-data /path/to/alt42standalone_v1.0
sudo chmod -R 755 /path/to/alt42standalone_v1.0
```

### 6단계: 웹 서버 설정

#### Apache 사용 시

프로젝트 폴더를 웹 루트에 배치하거나 가상 호스트 설정:

```apache
<VirtualHost *:80>
    ServerName cvs.local
    DocumentRoot "/path/to/alt42standalone_v1.0"

    <Directory "/path/to/alt42standalone_v1.0">
        Options Indexes FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>
</VirtualHost>
```

hosts 파일에 추가 (`/etc/hosts` 또는 `C:\Windows\System32\drivers\etc\hosts`):
```
127.0.0.1 cvs.local
```

Apache 재시작:
```bash
# Ubuntu/Debian
sudo service apache2 restart

# CentOS/RHEL
sudo systemctl restart httpd

# macOS
sudo apachectl restart
```

#### Nginx 사용 시

```nginx
server {
    listen 80;
    server_name cvs.local;
    root /path/to/alt42standalone_v1.0;
    index index.php index.html;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php7.1-fpm.sock;
        fastcgi_index index.php;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
        include fastcgi_params;
    }

    location ~ /\. {
        deny all;
    }
}
```

Nginx 재시작:
```bash
sudo service nginx restart
# 또는
sudo systemctl restart nginx
```

### 7단계: 설치 확인

브라우저에서 접속:

1. **메인 페이지**: `http://localhost/` 또는 `http://cvs.local/`
2. **교사 페이지**: `http://localhost/admin/index.php?teacher_id=1`
3. **학생 페이지**: `http://localhost/student/problem_view.php?problem_id=1&student_id=1`

## 문제 해결 (Troubleshooting)

### 데이터베이스 연결 오류

**오류**: "Database connection failed"

**해결 방법**:
1. MySQL 서비스 실행 확인:
   ```bash
   sudo service mysql status
   ```
2. `config/database.php`의 접속 정보 확인
3. MySQL 사용자 권한 확인:
   ```sql
   SHOW GRANTS FOR 'cvs_user'@'localhost';
   ```

### 빈 화면 (Blank Page)

**원인**: PHP 오류

**해결 방법**:
1. PHP 오류 로그 확인:
   ```bash
   # Apache
   tail -f /var/log/apache2/error.log

   # Nginx
   tail -f /var/log/nginx/error.log
   ```
2. `config/database.php`에서 임시로 오류 표시 활성화:
   ```php
   ini_set('display_errors', 1);
   error_reporting(E_ALL);
   ```

### 404 오류

**원인**: mod_rewrite 비활성화

**해결 방법**:
```bash
# Ubuntu/Debian
sudo a2enmod rewrite
sudo service apache2 restart
```

### CSS/JS 로딩 안됨

**원인**: 경로 문제

**해결 방법**:
1. 브라우저 개발자 도구(F12)에서 네트워크 탭 확인
2. 파일 권한 확인:
   ```bash
   chmod 644 assets/css/*.css
   chmod 644 assets/js/*.js
   ```

### PDO 오류

**원인**: PDO MySQL 드라이버 미설치

**해결 방법**:
```bash
# Ubuntu/Debian
sudo apt-get install php7.1-mysql
sudo service apache2 restart

# CentOS/RHEL
sudo yum install php71-mysqlnd
sudo systemctl restart httpd
```

## 프로덕션 배포 체크리스트

프로덕션 환경에 배포하기 전 확인사항:

- [ ] 데이터베이스 사용자 권한 최소화
- [ ] `config/database.php`의 `PASSWORD_SALT` 변경
- [ ] PHP 오류 표시 비활성화 (이미 설정됨)
- [ ] HTTPS 설정
- [ ] 백업 시스템 구축
- [ ] 인증 시스템 구현 (현재는 데모용 URL 파라미터 사용)
- [ ] CSRF 토큰 추가
- [ ] 입력 검증 강화
- [ ] 로그 모니터링 설정
- [ ] 성능 최적화 (캐싱, CDN)

## Docker를 사용한 설치 (선택사항)

Docker Compose 파일 예시:

```yaml
version: '3'

services:
  web:
    image: php:7.1-apache
    ports:
      - "8080:80"
    volumes:
      - ./:/var/www/html
    depends_on:
      - db

  db:
    image: mysql:5.7
    environment:
      MYSQL_DATABASE: condition_verification
      MYSQL_ROOT_PASSWORD: rootpass
      MYSQL_USER: cvs_user
      MYSQL_PASSWORD: cvspass
    volumes:
      - ./database/schema.sql:/docker-entrypoint-initdb.d/schema.sql
      - mysql_data:/var/lib/mysql

volumes:
  mysql_data:
```

실행:
```bash
docker-compose up -d
```

## 개발 환경 설정

개발 시 유용한 설정:

### PHP 디버깅 활성화

`config/database.php`에 추가:
```php
if (getenv('APP_ENV') === 'development') {
    ini_set('display_errors', 1);
    error_reporting(E_ALL);
}
```

### 데이터베이스 초기화 스크립트

```bash
# reset_db.sh
#!/bin/bash
mysql -u root -p -e "DROP DATABASE IF EXISTS condition_verification;"
mysql -u root -p -e "CREATE DATABASE condition_verification CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
mysql -u root -p condition_verification < database/schema.sql
echo "Database reset complete!"
```

## 다음 단계

설치가 완료되었다면:

1. [README.md](README.md)에서 사용 가이드 확인
2. 샘플 문제로 시스템 테스트
3. 새 문제 생성 연습
4. 분석 대시보드 탐색

## 지원

설치 중 문제가 발생하면:
- GitHub Issues 등록
- 문서 재확인
- PHP/MySQL 버전 확인
