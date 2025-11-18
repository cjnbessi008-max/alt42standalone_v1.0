# 설치 가이드

## 상세 설치 단계

### 1. 시스템 준비

#### 필수 소프트웨어 설치

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install apache2 mysql-server php7.1 php7.1-mysql php7.1-curl php7.1-json
```

**CentOS/RHEL:**
```bash
sudo yum install httpd mysql-server php71 php71-mysql php71-curl php71-json
```

**macOS (Homebrew):**
```bash
brew install php@7.1 mysql
```

### 2. MySQL 데이터베이스 설정

#### MySQL 보안 설정
```bash
sudo mysql_secure_installation
```

#### 데이터베이스 및 사용자 생성
```bash
mysql -u root -p
```

MySQL 프롬프트에서:
```sql
-- 데이터베이스 생성
CREATE DATABASE log_network_map CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 사용자 생성 및 권한 부여
CREATE USER 'lognetwork'@'localhost' IDENTIFIED BY 'your_secure_password';
GRANT ALL PRIVILEGES ON log_network_map.* TO 'lognetwork'@'localhost';
FLUSH PRIVILEGES;

-- 스키마 임포트
USE log_network_map;
SOURCE /path/to/log-network-map/database/schema.sql;

-- 설치 확인
SHOW TABLES;
```

### 3. Apache 웹 서버 설정

#### VirtualHost 설정 생성

`/etc/apache2/sites-available/log-network-map.conf` 파일 생성:

```apache
<VirtualHost *:80>
    ServerName log-network-map.local
    DocumentRoot /var/www/log-network-map/frontend

    <Directory /var/www/log-network-map/frontend>
        Options Indexes FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>

    Alias /backend /var/www/log-network-map/backend
    <Directory /var/www/log-network-map/backend>
        Options Indexes FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>

    ErrorLog ${APACHE_LOG_DIR}/log-network-map-error.log
    CustomLog ${APACHE_LOG_DIR}/log-network-map-access.log combined
</VirtualHost>
```

#### 사이트 활성화

```bash
# 프로젝트 복사
sudo cp -r /path/to/log-network-map /var/www/

# mod_rewrite 활성화
sudo a2enmod rewrite

# 사이트 활성화
sudo a2ensite log-network-map.conf

# Apache 재시작
sudo systemctl restart apache2
```

#### hosts 파일 수정 (로컬 개발용)

`/etc/hosts` 파일에 추가:
```
127.0.0.1    log-network-map.local
```

### 4. PHP 설정

#### php.ini 설정 확인

`/etc/php/7.1/apache2/php.ini`:

```ini
upload_max_filesize = 20M
post_max_size = 20M
max_execution_time = 300
memory_limit = 256M
display_errors = Off  # 프로덕션 환경
error_log = /var/log/php/error.log
```

#### PDO MySQL 확장 확인

```bash
php -m | grep pdo_mysql
```

없으면 설치:
```bash
sudo apt install php7.1-mysql
sudo systemctl restart apache2
```

### 5. 애플리케이션 설정

#### config.php 생성

```bash
cd /var/www/log-network-map
cp config.example.php config.php
nano config.php
```

실제 값으로 수정:
```php
<?php
return [
    'DB_HOST' => 'localhost',
    'DB_NAME' => 'log_network_map',
    'DB_USER' => 'lognetwork',
    'DB_PASS' => 'your_secure_password',

    'MOODLE_URL' => 'http://your-moodle.com',
    'MOODLE_TOKEN' => 'your_moodle_token',

    'APP_ENV' => 'production',
    'DEBUG' => false,
];
```

#### 권한 설정

```bash
# 웹 서버 사용자에게 소유권 부여
sudo chown -R www-data:www-data /var/www/log-network-map

# 적절한 권한 설정
sudo find /var/www/log-network-map -type d -exec chmod 755 {} \;
sudo find /var/www/log-network-map -type f -exec chmod 644 {} \;

# 로그 디렉토리
sudo mkdir -p /var/www/log-network-map/logs
sudo chmod 755 /var/www/log-network-map/logs
sudo chown www-data:www-data /var/www/log-network-map/logs
```

### 6. Moodle 웹 서비스 설정

#### Moodle 관리자 설정

1. **웹 서비스 활성화**
   - 사이트 관리 → 고급 기능
   - "웹 서비스 활성화" 체크

2. **프로토콜 활성화**
   - 사이트 관리 → 플러그인 → 웹 서비스 → 프로토콜 관리
   - REST protocol 활성화

3. **외부 서비스 생성**
   - 사이트 관리 → 플러그인 → 웹 서비스 → 외부 서비스
   - "서비스 추가" 클릭
   - 이름: "Log Network Map Service"
   - 단축명: "lognetworkmap"
   - 활성화: 체크

4. **서비스 함수 추가**
   - 생성한 서비스 → 함수 추가
   - 다음 함수들 추가:
     - `core_user_get_users`
     - `core_course_get_courses`
     - `report_log_get_logs`

5. **전용 사용자 생성**
   - 사이트 관리 → 사용자 → 계정 → 새 사용자 추가
   - 사용자명: `webservice_user`
   - 역할: 적절한 권한 부여

6. **토큰 생성**
   - 사이트 관리 → 플러그인 → 웹 서비스 → 토큰 관리
   - "토큰 추가" 클릭
   - 사용자: 위에서 생성한 사용자 선택
   - 서비스: "Log Network Map Service" 선택
   - 생성된 토큰 복사하여 `config.php`에 입력

### 7. 설치 검증

#### 백엔드 API 테스트

```bash
# 네트워크 데이터 API
curl http://log-network-map.local/backend/api/network.php

# 개념 API
curl http://log-network-map.local/backend/api/concepts.php

# 예상 응답: JSON 형식의 데이터
```

#### 프론트엔드 접속

브라우저에서 `http://log-network-map.local` 접속

#### 체크리스트

- [ ] 데이터베이스 테이블이 생성되었는가?
- [ ] 샘플 데이터가 로드되었는가?
- [ ] API 엔드포인트가 응답하는가?
- [ ] 프론트엔드 페이지가 로드되는가?
- [ ] 네트워크 맵이 표시되는가?
- [ ] Moodle 연동 버튼이 작동하는가?
- [ ] 모바일 미리보기가 표시되는가?

### 8. 프로덕션 배포

#### HTTPS 설정 (Let's Encrypt)

```bash
sudo apt install certbot python3-certbot-apache
sudo certbot --apache -d log-network-map.yourdomain.com
```

#### 보안 강화

1. **config.php 보호**
```apache
<Files "config.php">
    Require all denied
</Files>
```

2. **디렉토리 리스팅 비활성화**
```apache
Options -Indexes
```

3. **PHP 에러 출력 비활성화**
```php
'DEBUG' => false,
```

4. **데이터베이스 백업 자동화**
```bash
# crontab -e
0 2 * * * mysqldump -u lognetwork -p'password' log_network_map > /backup/log_network_map_$(date +\%Y\%m\%d).sql
```

### 9. 모니터링 설정

#### 로그 확인

```bash
# Apache 에러 로그
tail -f /var/log/apache2/log-network-map-error.log

# PHP 에러 로그
tail -f /var/log/php/error.log

# MySQL 로그
tail -f /var/log/mysql/error.log
```

#### 성능 모니터링

```bash
# Apache 상태
sudo systemctl status apache2

# MySQL 상태
sudo systemctl status mysql

# 디스크 사용량
df -h

# 메모리 사용량
free -m
```

## 문제 해결

### 데이터베이스 연결 실패

```bash
# MySQL 서비스 확인
sudo systemctl status mysql

# 포트 확인
netstat -tlnp | grep 3306

# 사용자 권한 확인
mysql -u lognetwork -p
SHOW GRANTS;
```

### Apache 500 에러

```bash
# 에러 로그 확인
tail -f /var/log/apache2/error.log

# PHP 문법 검사
php -l /var/www/log-network-map/backend/api/network.php
```

### CORS 문제

`backend/utils/cors.php`에서 허용 오리진 확인 및 수정

### 파일 업로드 실패

```bash
# 권한 확인
ls -la /var/www/log-network-map/

# 필요시 권한 수정
sudo chown -R www-data:www-data /var/www/log-network-map/
```

## 업데이트

```bash
# Git으로 최신 버전 받기
cd /var/www/log-network-map
git pull origin main

# 데이터베이스 마이그레이션 실행 (있는 경우)
mysql -u lognetwork -p log_network_map < database/migrations/update_v1.1.sql

# 캐시 정리
sudo systemctl restart apache2
```

## 언인스톨

```bash
# Apache 사이트 비활성화
sudo a2dissite log-network-map.conf
sudo systemctl reload apache2

# 데이터베이스 삭제
mysql -u root -p
DROP DATABASE log_network_map;
DROP USER 'lognetwork'@'localhost';

# 파일 삭제
sudo rm -rf /var/www/log-network-map
sudo rm /etc/apache2/sites-available/log-network-map.conf
```
