# 설치 가이드 (Installation Guide)

## 개념 회피 감지 시스템 설치 상세 가이드

이 문서는 개념 회피 감지 시스템을 처음부터 설치하는 상세한 단계를 제공합니다.

---

## 📋 사전 준비

### 1. 시스템 요구사항 확인

```bash
# PHP 버전 확인
php -v
# 필요: PHP 7.1.9 이상

# MySQL 버전 확인
mysql --version
# 필요: MySQL 5.7 이상

# Apache 버전 확인
apache2 -v
# 또는 Nginx
nginx -v
```

### 2. PHP 확장 모듈 확인

```bash
# 필수 PHP 확장 확인
php -m | grep -E "pdo|pdo_mysql|json|mbstring"

# 출력 예시:
# json
# mbstring
# pdo_mysql
# PDO
```

만약 필수 확장이 없다면:

```bash
# Ubuntu/Debian
sudo apt-get install php7.1-mysql php7.1-json php7.1-mbstring

# CentOS/RHEL
sudo yum install php71-mysqlnd php71-json php71-mbstring
```

---

## 🗄️ 데이터베이스 설정

### Step 1: MySQL 접속

```bash
mysql -u root -p
```

### Step 2: 독립형 데이터베이스 사용자 생성

```sql
-- 애플리케이션 전용 사용자 생성
CREATE USER 'cad_user'@'localhost' IDENTIFIED BY 'secure_password_here';

-- 데이터베이스 생성 권한 부여
GRANT ALL PRIVILEGES ON concept_avoidance.* TO 'cad_user'@'localhost';

-- 변경사항 적용
FLUSH PRIVILEGES;
```

### Step 3: Moodle 읽기 전용 사용자 생성

```sql
-- Moodle 데이터베이스 읽기 전용 사용자
CREATE USER 'moodle_readonly'@'localhost' IDENTIFIED BY 'readonly_password';

-- SELECT 권한만 부여
GRANT SELECT ON moodle.* TO 'moodle_readonly'@'localhost';

-- 변경사항 적용
FLUSH PRIVILEGES;

-- 종료
EXIT;
```

### Step 4: 스키마 생성

```bash
# 프로젝트 디렉토리로 이동
cd /path/to/alt42standalone_v1.0

# 스키마 SQL 실행
mysql -u cad_user -p < src/db/schema.sql

# 비밀번호 입력 프롬프트에서 위에서 설정한 'secure_password_here' 입력
```

### Step 5: 데이터베이스 생성 확인

```bash
mysql -u cad_user -p concept_avoidance

# MySQL 프롬프트에서:
SHOW TABLES;

# 다음 테이블들이 보여야 함:
# - concepts
# - concept_mappings
# - student_analysis
# - avoidance_patterns
# - sync_log
# - system_settings
# - detection_rules
```

---

## ⚙️ 애플리케이션 설정

### Step 1: 설정 파일 수정

```bash
# 설정 파일 편집
nano src/config/config.php

# 또는
vi src/config/config.php
```

다음 항목들을 수정:

```php
// 독립형 앱 데이터베이스
define('DB_HOST', 'localhost');              // MySQL 호스트
define('DB_NAME', 'concept_avoidance');      // DB 이름
define('DB_USER', 'cad_user');               // 위에서 만든 사용자
define('DB_PASS', 'secure_password_here');   // 사용자 비밀번호
define('DB_CHARSET', 'utf8mb4');

// Moodle 데이터베이스 (읽기 전용)
define('MOODLE_DB_HOST', 'localhost');            // Moodle MySQL 호스트
define('MOODLE_DB_NAME', 'moodle');               // Moodle DB 이름
define('MOODLE_DB_USER', 'moodle_readonly');      // 읽기 전용 사용자
define('MOODLE_DB_PASS', 'readonly_password');    // 읽기 전용 비밀번호
define('MOODLE_DB_PREFIX', 'mdl_');               // Moodle 테이블 접두사
define('MOODLE_DB_CHARSET', 'utf8mb4');
```

### Step 2: 로그 디렉토리 생성 및 권한 설정

```bash
# 로그 디렉토리 생성
mkdir -p logs

# 권한 설정 (웹 서버가 쓸 수 있도록)
chmod 777 logs

# 또는 웹 서버 사용자에게만 권한 부여 (더 안전)
sudo chown -R www-data:www-data logs
chmod 755 logs
```

---

## 🌐 웹 서버 설정

### Option A: Apache 설정

#### 1. 가상 호스트 설정

```bash
sudo nano /etc/apache2/sites-available/concept-avoidance.conf
```

다음 내용 추가:

```apache
<VirtualHost *:80>
    ServerName concept-avoidance.local
    DocumentRoot /path/to/alt42standalone_v1.0

    <Directory /path/to/alt42standalone_v1.0>
        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>

    # API 리다이렉션
    <Directory /path/to/alt42standalone_v1.0/src/api>
        Options -Indexes
        AllowOverride None
        Require all granted

        RewriteEngine On
        RewriteCond %{REQUEST_FILENAME} !-f
        RewriteCond %{REQUEST_FILENAME} !-d
        RewriteRule ^(.*)$ index.php/$1 [L,QSA]
    </Directory>

    # 민감한 파일 보호
    <FilesMatch "^\.">
        Require all denied
    </FilesMatch>

    <FilesMatch "(config\.php|\.sql)$">
        Require all denied
    </FilesMatch>

    ErrorLog ${APACHE_LOG_DIR}/concept-avoidance-error.log
    CustomLog ${APACHE_LOG_DIR}/concept-avoidance-access.log combined
</VirtualHost>
```

#### 2. 사이트 활성화

```bash
# 사이트 활성화
sudo a2ensite concept-avoidance.conf

# mod_rewrite 활성화
sudo a2enmod rewrite
sudo a2enmod headers

# Apache 재시작
sudo systemctl restart apache2
```

#### 3. hosts 파일 수정 (로컬 개발용)

```bash
sudo nano /etc/hosts

# 다음 줄 추가
127.0.0.1   concept-avoidance.local
```

### Option B: Nginx 설정

#### 1. 서버 블록 설정

```bash
sudo nano /etc/nginx/sites-available/concept-avoidance
```

다음 내용 추가:

```nginx
server {
    listen 80;
    server_name concept-avoidance.local;
    root /path/to/alt42standalone_v1.0;

    index index.html index.php;

    location / {
        try_files $uri $uri/ =404;
    }

    # API 처리
    location /api {
        try_files $uri $uri/ /src/api/index.php?$query_string;
    }

    # PHP 파일 처리
    location ~ \.php$ {
        include snippets/fastcgi-php.conf;
        fastcgi_pass unix:/var/run/php/php7.1-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
        include fastcgi_params;
    }

    # 민감한 파일 보호
    location ~ /\.(?!well-known) {
        deny all;
    }

    location ~ (config\.php|\.sql)$ {
        deny all;
    }

    # 로깅
    access_log /var/log/nginx/concept-avoidance-access.log;
    error_log /var/log/nginx/concept-avoidance-error.log;
}
```

#### 2. 사이트 활성화

```bash
# 심볼릭 링크 생성
sudo ln -s /etc/nginx/sites-available/concept-avoidance /etc/nginx/sites-enabled/

# 설정 테스트
sudo nginx -t

# Nginx 재시작
sudo systemctl restart nginx
```

---

## 🧪 설치 검증

### 1. 데이터베이스 연결 테스트

프로젝트 루트에 `test_db.php` 파일 생성:

```php
<?php
require_once 'src/config/config.php';
require_once 'src/lib/Database.php';

try {
    $db = Database::getInstance();
    echo "✓ Database connection successful!\n";

    // Test Moodle connection
    $moodle_conn = $db->getMoodleConnection();
    if ($moodle_conn) {
        echo "✓ Moodle database connection successful!\n";
    } else {
        echo "✗ Moodle database connection failed\n";
    }

    // Test query
    $result = $db->fetchAll("SELECT COUNT(*) as count FROM concepts");
    echo "✓ Sample query successful! Found " . $result[0]['count'] . " concepts.\n";

} catch (Exception $e) {
    echo "✗ Error: " . $e->getMessage() . "\n";
}
```

실행:

```bash
php test_db.php
```

### 2. API 테스트

```bash
# Health check
curl http://concept-avoidance.local/api/health

# 예상 출력:
# {
#   "success": true,
#   "data": {
#     "status": "healthy",
#     "version": "1.0.0",
#     "timestamp": "2025-01-15 12:34:56"
#   }
# }
```

### 3. 웹 인터페이스 테스트

브라우저에서 접속:

```
http://concept-avoidance.local/src/web/index.html
```

대시보드가 로드되고 통계 카드가 표시되어야 합니다.

---

## 🔄 초기 데이터 설정

### 1. Moodle 데이터 동기화

웹 대시보드에서:
1. "동기화" 버튼 클릭
2. 동기화 완료 대기
3. 처리된 레코드 수 확인

또는 API를 통해:

```bash
curl -X POST http://concept-avoidance.local/api/sync \
  -H "Content-Type: application/json" \
  -d '{"type": "quiz_attempts", "limit": 100}'
```

### 2. 문제-개념 매핑 추가

샘플 매핑 추가 (예시):

```bash
curl -X POST http://concept-avoidance.local/api/concepts \
  -H "Content-Type: application/json" \
  -d '{
    "concept_code": "FRAC_ADD_BASIC",
    "concept_name": "Basic Fraction Addition",
    "concept_name_ko": "기초 분수 덧셈",
    "difficulty_level": 2,
    "subject": "mathematics",
    "grade_level": "elementary"
  }'
```

### 3. 회피 패턴 감지 실행

```bash
curl -X POST http://concept-avoidance.local/api/detection/run
```

---

## 🔐 보안 강화 (프로덕션 환경)

### 1. 디버그 모드 비활성화

`src/config/config.php` 수정:

```php
define('ENABLE_DEBUG', false);  // true에서 false로 변경
```

### 2. 파일 권한 강화

```bash
# 모든 파일을 읽기 전용으로
chmod -R 644 src/

# 디렉토리만 실행 가능하게
find src/ -type d -exec chmod 755 {} \;

# PHP 파일만 실행 가능하게
find src/ -name "*.php" -exec chmod 644 {} \;

# 로그 디렉토리만 쓰기 가능
chmod 755 logs/
```

### 3. SSL/TLS 설정 (HTTPS)

Apache에서 Let's Encrypt 사용:

```bash
sudo apt-get install certbot python3-certbot-apache
sudo certbot --apache -d concept-avoidance.yourdomain.com
```

---

## 🚀 자동화 설정

### Cron을 통한 자동 동기화

```bash
# Crontab 편집
crontab -e

# 매 30분마다 동기화
*/30 * * * * curl -X POST http://concept-avoidance.local/api/sync > /dev/null 2>&1

# 매일 새벽 2시에 전체 감지 실행
0 2 * * * curl -X POST http://concept-avoidance.local/api/detection/run > /dev/null 2>&1
```

---

## 📊 모니터링

### 로그 모니터링

```bash
# 실시간 로그 확인
tail -f logs/$(date +%Y-%m-%d).log

# 에러만 확인
grep ERROR logs/*.log
```

### MySQL 성능 모니터링

```bash
# 슬로우 쿼리 활성화
sudo nano /etc/mysql/my.cnf

# 추가:
[mysqld]
slow_query_log = 1
slow_query_log_file = /var/log/mysql/slow.log
long_query_time = 2
```

---

## ❓ 문제 해결

### 일반적인 문제들

#### 1. "Database connection failed"

```bash
# MySQL 서비스 확인
sudo systemctl status mysql

# 사용자 권한 확인
mysql -u cad_user -p
```

#### 2. "Permission denied" 오류

```bash
# 웹 서버 사용자 확인
ps aux | grep apache2
# 또는
ps aux | grep nginx

# 소유권 변경
sudo chown -R www-data:www-data /path/to/alt42standalone_v1.0
```

#### 3. API가 404 오류 반환

```bash
# Apache mod_rewrite 확인
sudo a2enmod rewrite
sudo systemctl restart apache2

# .htaccess 파일 권한 확인
ls -la .htaccess
```

---

## ✅ 설치 완료 체크리스트

- [ ] PHP 7.1.9+ 설치됨
- [ ] MySQL 5.7+ 설치됨
- [ ] 데이터베이스 사용자 생성됨
- [ ] 스키마 생성 완료
- [ ] 설정 파일 수정됨
- [ ] 웹 서버 설정 완료
- [ ] 로그 디렉토리 생성 및 권한 설정
- [ ] API 연결 테스트 성공
- [ ] 웹 인터페이스 접속 가능
- [ ] Moodle 데이터 동기화 성공
- [ ] 회피 패턴 감지 실행 성공

---

설치가 완료되었습니다! 🎉

문제가 있으시면 로그 파일을 확인하거나 이슈를 등록해주세요.
