# 📦 설치 가이드

Moodle 3.7 LMS 사고력 패턴 분석 시스템의 상세 설치 가이드입니다.

## 목차
1. [사전 준비](#사전-준비)
2. [MySQL 데이터베이스 설정](#mysql-데이터베이스-설정)
3. [PHP 환경 설정](#php-환경-설정)
4. [Moodle Web Service 설정](#moodle-web-service-설정)
5. [애플리케이션 설치](#애플리케이션-설치)
6. [웹 서버 설정](#웹-서버-설정)
7. [검증 및 테스트](#검증-및-테스트)

## 사전 준비

### 시스템 요구사항 확인

```bash
# PHP 버전 확인 (7.1.9 이상 필요)
php -v

# MySQL 버전 확인 (5.7 이상 필요)
mysql --version

# 필수 PHP 확장 모듈 확인
php -m | grep -E "pdo|mysql|curl|json|mbstring"
```

### 필수 소프트웨어 설치 (Ubuntu/Debian 기준)

```bash
# 시스템 업데이트
sudo apt update && sudo apt upgrade -y

# PHP 7.1 및 필수 확장 설치
sudo apt install -y php7.1 php7.1-cli php7.1-mysql php7.1-curl \
                    php7.1-json php7.1-mbstring php7.1-xml

# MySQL 5.7 설치
sudo apt install -y mysql-server-5.7

# Apache 웹 서버 설치
sudo apt install -y apache2 libapache2-mod-php7.1

# Git 설치
sudo apt install -y git
```

## MySQL 데이터베이스 설정

### 1. MySQL 보안 설정

```bash
sudo mysql_secure_installation
```

프롬프트에 따라 설정:
- root 패스워드 설정
- 익명 사용자 제거
- 원격 root 로그인 비활성화
- 테스트 데이터베이스 제거

### 2. 데이터베이스 및 사용자 생성

```bash
# MySQL 접속
sudo mysql -u root -p
```

MySQL 프롬프트에서:

```sql
-- 데이터베이스 생성
CREATE DATABASE thinking_patterns
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

-- 전용 사용자 생성
CREATE USER 'thinking_user'@'localhost'
  IDENTIFIED BY 'your_strong_password_here';

-- 권한 부여
GRANT ALL PRIVILEGES ON thinking_patterns.*
  TO 'thinking_user'@'localhost';

GRANT SELECT, INSERT, UPDATE ON thinking_patterns.*
  TO 'thinking_user'@'localhost';

-- 권한 적용
FLUSH PRIVILEGES;

-- 생성 확인
SHOW DATABASES LIKE 'thinking%';
SELECT User, Host FROM mysql.user WHERE User = 'thinking_user';

EXIT;
```

### 3. 스키마 적용

```bash
# 프로젝트 디렉토리로 이동
cd /var/www/html/alt42standalone_v1.0

# 스키마 파일 적용
mysql -u thinking_user -p thinking_patterns < src/database/schema_thinking_patterns.sql

# 적용 확인
mysql -u thinking_user -p thinking_patterns -e "SHOW TABLES;"
```

예상 출력:
```
+--------------------------------+
| Tables_in_thinking_patterns    |
+--------------------------------+
| interaction_events              |
| learning_activities             |
| learning_sessions               |
| moodle_integration_config       |
| thinking_metrics                |
| thinking_pattern_analysis       |
+--------------------------------+
```

## PHP 환경 설정

### 1. PHP 설정 파일 편집

```bash
# php.ini 파일 위치 확인
php --ini

# php.ini 편집 (경로는 환경에 따라 다를 수 있음)
sudo nano /etc/php/7.1/apache2/php.ini
```

권장 설정:

```ini
; 기본 설정
max_execution_time = 300
max_input_time = 300
memory_limit = 256M
post_max_size = 50M
upload_max_filesize = 50M

; 오류 보고 (개발 환경)
error_reporting = E_ALL
display_errors = On
log_errors = On
error_log = /var/log/php/error.log

; 날짜/시간대 설정
date.timezone = Asia/Seoul

; MySQL 설정
mysqli.default_socket = /var/run/mysqld/mysqld.sock
pdo_mysql.default_socket = /var/run/mysqld/mysqld.sock
```

### 2. PHP 오류 로그 디렉토리 생성

```bash
sudo mkdir -p /var/log/php
sudo chown www-data:www-data /var/log/php
sudo chmod 755 /var/log/php
```

### 3. Apache 재시작

```bash
sudo systemctl restart apache2
```

## Moodle Web Service 설정

### 1. Moodle 웹 서비스 활성화

1. Moodle 사이트에 관리자로 로그인
2. **사이트 관리 > 고급 기능**으로 이동
3. "웹 서비스 활성화" 체크박스 선택
4. 변경사항 저장

### 2. REST 프로토콜 활성화

1. **사이트 관리 > 플러그인 > 웹 서비스 > 프로토콜 관리**
2. REST 프로토콜 활성화 (눈 아이콘 클릭)

### 3. 외부 서비스 생성

1. **사이트 관리 > 플러그인 > 웹 서비스 > 외부 서비스**
2. "사용자 정의 서비스 추가" 클릭
3. 다음 정보 입력:
   - **이름**: Thinking Pattern Analysis Service
   - **짧은 이름**: thinking_patterns
   - **활성화**: 예
   - **승인된 사용자만**: 아니오 (또는 예, 보안 정책에 따라)

### 4. 웹 서비스 함수 추가

외부 서비스 페이지에서 "함수" 링크 클릭 후 다음 함수들을 추가:

**필수 함수:**
- `core_webservice_get_site_info` - 사이트 정보 조회
- `core_user_get_users_by_field` - 사용자 정보 조회
- `core_course_get_courses` - 코스 정보 조회
- `core_course_get_contents` - 코스 콘텐츠 조회
- `core_enrol_get_users_courses` - 사용자 등록 코스 조회
- `mod_quiz_get_quizzes_by_courses` - 퀴즈 목록 조회
- `mod_quiz_get_user_attempts` - 퀴즈 시도 기록 조회
- `mod_assign_get_assignments` - 과제 목록 조회
- `mod_assign_get_submissions` - 과제 제출 조회
- `gradereport_user_get_grade_items` - 성적 정보 조회

### 5. 전용 사용자 계정 생성

1. **사이트 관리 > 사용자 > 계정 > 새 사용자 추가**
2. 다음 정보로 계정 생성:
   - **사용자 이름**: webservice_thinking
   - **비밀번호**: (강력한 비밀번호 설정)
   - **이름**: Web Service
   - **성**: Thinking Patterns
   - **이메일**: webservice@yourdomain.com

### 6. 토큰 생성

1. **사이트 관리 > 플러그인 > 웹 서비스 > 토큰 관리**
2. "토큰 생성" 클릭
3. 설정:
   - **사용자**: webservice_thinking (방금 생성한 사용자)
   - **서비스**: Thinking Pattern Analysis Service
   - **IP 제한**: (필요시 애플리케이션 서버 IP 입력)
4. 토큰 생성 후 **토큰 값을 안전하게 복사 및 저장**

### 7. 사용자에게 서비스 접근 권한 부여

1. **사이트 관리 > 플러그인 > 웹 서비스 > 외부 서비스**
2. "Thinking Pattern Analysis Service" 옆의 "승인된 사용자" 클릭
3. `webservice_thinking` 사용자 추가

## 애플리케이션 설치

### 1. 저장소 클론

```bash
# 웹 루트로 이동
cd /var/www/html

# 저장소 클론
sudo git clone https://github.com/your-org/alt42standalone_v1.0.git
cd alt42standalone_v1.0

# 권한 설정
sudo chown -R www-data:www-data .
sudo chmod -R 755 .
```

### 2. 환경 설정 파일 생성

```bash
# .env 파일 생성
cp .env.example .env

# .env 파일 편집
nano .env
```

**.env 파일 내용:**

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_NAME=thinking_patterns
DB_USER=thinking_user
DB_PASS=your_strong_password_here

# Moodle Configuration
MOODLE_URL=http://your-moodle-site.com
MOODLE_TOKEN=your_generated_token_here
MOODLE_WS_USER=webservice_thinking

# Application Settings
APP_ENV=production
APP_DEBUG=false
APP_URL=http://your-app-domain.com

# Logging
LOG_LEVEL=info
LOG_FILE=/var/log/thinking-patterns/app.log

# API Settings
API_BASE_URL=http://your-app-domain.com/api
```

### 3. 로그 디렉토리 생성

```bash
sudo mkdir -p /var/log/thinking-patterns
sudo chown www-data:www-data /var/log/thinking-patterns
sudo chmod 755 /var/log/thinking-patterns
```

### 4. 설정 파일 권한 설정

```bash
# .env 파일 보안 설정
chmod 640 .env
chown www-data:www-data .env

# config 디렉토리 권한
chmod -R 640 config/
chown -R www-data:www-data config/
```

## 웹 서버 설정

### Apache 설정

#### 1. Virtual Host 설정

```bash
# Virtual Host 파일 생성
sudo nano /etc/apache2/sites-available/thinking-patterns.conf
```

**thinking-patterns.conf 내용:**

```apache
<VirtualHost *:80>
    ServerName thinking-patterns.yourdomain.com
    ServerAdmin admin@yourdomain.com

    DocumentRoot /var/www/html/alt42standalone_v1.0

    <Directory /var/www/html/alt42standalone_v1.0>
        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>

    # API 경로 설정
    <Directory /var/www/html/alt42standalone_v1.0/src/api>
        Options -Indexes
        AllowOverride None
        Require all granted
    </Directory>

    # 로그 설정
    ErrorLog ${APACHE_LOG_DIR}/thinking-patterns-error.log
    CustomLog ${APACHE_LOG_DIR}/thinking-patterns-access.log combined

    # PHP 설정
    php_value max_execution_time 300
    php_value memory_limit 256M
</VirtualHost>
```

#### 2. .htaccess 파일 생성

```bash
nano /var/www/html/alt42standalone_v1.0/.htaccess
```

**.htaccess 내용:**

```apache
# Rewrite 엔진 활성화
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteBase /

    # API 경로 처리
    RewriteRule ^api/(.*)$ src/api/ThinkingPatternAPI.php [L,QSA]

    # .env 파일 접근 차단
    RewriteRule ^\.env$ - [F,L]
</IfModule>

# 디렉토리 인덱스 비활성화
Options -Indexes

# PHP 보안 설정
<IfModule mod_php7.c>
    php_flag display_errors Off
    php_flag log_errors On
    php_value error_log /var/log/thinking-patterns/php-error.log
</IfModule>

# CORS 헤더 (필요시)
<IfModule mod_headers.c>
    Header set Access-Control-Allow-Origin "*"
    Header set Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS"
    Header set Access-Control-Allow-Headers "Content-Type, Authorization"
</IfModule>
```

#### 3. Apache 모듈 활성화 및 사이트 활성화

```bash
# 필수 모듈 활성화
sudo a2enmod rewrite
sudo a2enmod headers

# 사이트 활성화
sudo a2ensite thinking-patterns.conf

# Apache 설정 테스트
sudo apache2ctl configtest

# Apache 재시작
sudo systemctl restart apache2
```

### Nginx 설정 (선택사항)

Nginx를 사용하는 경우:

```bash
sudo nano /etc/nginx/sites-available/thinking-patterns
```

**thinking-patterns 내용:**

```nginx
server {
    listen 80;
    server_name thinking-patterns.yourdomain.com;

    root /var/www/html/alt42standalone_v1.0;
    index index.php index.html;

    access_log /var/log/nginx/thinking-patterns-access.log;
    error_log /var/log/nginx/thinking-patterns-error.log;

    # API 경로
    location /api/ {
        rewrite ^/api/(.*)$ /src/api/ThinkingPatternAPI.php last;
    }

    # PHP 처리
    location ~ \.php$ {
        include snippets/fastcgi-php.conf;
        fastcgi_pass unix:/var/run/php/php7.1-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
        include fastcgi_params;
    }

    # .env 파일 접근 차단
    location ~ /\.env {
        deny all;
    }

    # 정적 파일 캐싱
    location ~* \.(jpg|jpeg|png|gif|ico|css|js)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

```bash
# 사이트 활성화
sudo ln -s /etc/nginx/sites-available/thinking-patterns /etc/nginx/sites-enabled/

# Nginx 설정 테스트
sudo nginx -t

# Nginx 재시작
sudo systemctl restart nginx
```

## 검증 및 테스트

### 1. 데이터베이스 연결 테스트

```bash
# PHP 테스트 스크립트 생성
cat > /var/www/html/alt42standalone_v1.0/test_db.php << 'EOF'
<?php
require_once __DIR__ . '/src/database/DatabaseConnection.php';

try {
    $db = DatabaseConnection::getInstance();
    echo "✅ Database connection successful!\n";

    // 테이블 확인
    $stmt = $db->query("SHOW TABLES");
    $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);

    echo "Tables found: " . count($tables) . "\n";
    foreach ($tables as $table) {
        echo "  - $table\n";
    }
} catch (Exception $e) {
    echo "❌ Database connection failed: " . $e->getMessage() . "\n";
}
EOF

# 실행
php test_db.php
```

### 2. Moodle 연결 테스트

```bash
cat > /var/www/html/alt42standalone_v1.0/test_moodle.php << 'EOF'
<?php
require_once __DIR__ . '/src/moodle-integration/MoodleClient.php';

// .env에서 설정 로드
$moodleUrl = getenv('MOODLE_URL');
$moodleToken = getenv('MOODLE_TOKEN');

try {
    $client = new MoodleClient($moodleUrl, $moodleToken);

    if ($client->testConnection()) {
        echo "✅ Moodle connection successful!\n";

        $siteInfo = $client->getSiteInfo();
        echo "Site: " . $siteInfo['sitename'] . "\n";
        echo "Version: " . $siteInfo['release'] . "\n";
    } else {
        echo "❌ Moodle connection failed\n";
    }
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
}
EOF

# 실행
php test_moodle.php
```

### 3. API 엔드포인트 테스트

```bash
# API 테스트 (curl 사용)
curl -X GET "http://localhost/api/summary/1?start_date=2024-01-01&end_date=2024-01-31"
```

### 4. 전체 시스템 테스트

```bash
# 종합 테스트 스크립트
cat > /var/www/html/alt42standalone_v1.0/test_all.php << 'EOF'
<?php
echo "=== Thinking Pattern Analysis System Test ===\n\n";

// 1. PHP 환경
echo "1. PHP Environment:\n";
echo "   Version: " . phpversion() . "\n";
echo "   Extensions: " . (extension_loaded('pdo_mysql') ? '✅' : '❌') . " PDO MySQL\n";
echo "   " . (extension_loaded('curl') ? '✅' : '❌') . " cURL\n";
echo "   " . (extension_loaded('json') ? '✅' : '❌') . " JSON\n\n";

// 2. 데이터베이스
echo "2. Database:\n";
require_once __DIR__ . '/src/database/DatabaseConnection.php';
try {
    $db = DatabaseConnection::getInstance();
    echo "   ✅ Connection successful\n\n";
} catch (Exception $e) {
    echo "   ❌ Connection failed: " . $e->getMessage() . "\n\n";
}

// 3. Moodle
echo "3. Moodle Integration:\n";
require_once __DIR__ . '/src/moodle-integration/MoodleClient.php';
try {
    $client = new MoodleClient(getenv('MOODLE_URL'), getenv('MOODLE_TOKEN'));
    echo "   " . ($client->testConnection() ? '✅' : '❌') . " Connection\n\n";
} catch (Exception $e) {
    echo "   ❌ Error: " . $e->getMessage() . "\n\n";
}

echo "=== Test Complete ===\n";
EOF

php test_all.php
```

### 5. 보안 체크리스트

```bash
# 파일 권한 확인
ls -la .env
ls -la config/

# 웹에서 접근 불가능한 파일 확인
curl -I http://localhost/.env  # Should return 403 Forbidden

# 디렉토리 리스팅 비활성화 확인
curl http://localhost/config/  # Should not list files
```

## 문제 해결

### MySQL 연결 오류

```bash
# MySQL 서비스 상태 확인
sudo systemctl status mysql

# MySQL 로그 확인
sudo tail -f /var/log/mysql/error.log

# 권한 재설정
mysql -u root -p
GRANT ALL PRIVILEGES ON thinking_patterns.* TO 'thinking_user'@'localhost';
FLUSH PRIVILEGES;
```

### Apache 500 오류

```bash
# Apache 오류 로그 확인
sudo tail -f /var/log/apache2/error.log

# PHP 오류 로그 확인
sudo tail -f /var/log/php/error.log

# 권한 문제 해결
sudo chown -R www-data:www-data /var/www/html/alt42standalone_v1.0
```

### Moodle 토큰 오류

1. Moodle 사이트에서 토큰 재생성
2. 웹 서비스 함수 권한 확인
3. IP 제한 확인
4. 사용자 계정 활성화 확인

## 다음 단계

설치가 완료되면:
1. [사용 가이드](./USAGE_GUIDE.md) 참조
2. 샘플 데이터로 테스트 실행
3. 프로덕션 환경 배포 전 보안 점검
4. 백업 전략 수립

## 지원

문제가 발생하면:
- GitHub Issues에 문의
- 문서의 문제 해결 섹션 참조
- 커뮤니티 포럼 확인
