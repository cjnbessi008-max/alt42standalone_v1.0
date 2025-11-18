# Scaling Stream 상세 설정 가이드

이 문서는 Scaling Stream 앱을 처음부터 설정하는 상세한 단계별 가이드를 제공합니다.

## 목차

1. [환경 준비](#환경-준비)
2. [Moodle 설정](#moodle-설정)
3. [데이터베이스 구성](#데이터베이스-구성)
4. [웹 서버 설정](#웹-서버-설정)
5. [애플리케이션 설정](#애플리케이션-설정)
6. [테스트 및 검증](#테스트-및-검증)
7. [고급 설정](#고급-설정)

---

## 환경 준비

### 필수 소프트웨어

1. **PHP 7.1.9 이상**
   ```bash
   php -v  # 버전 확인
   ```

2. **MySQL 5.7**
   ```bash
   mysql --version  # 버전 확인
   ```

3. **웹 서버** (Apache 또는 Nginx)
   ```bash
   apache2 -v  # Apache 버전 확인
   # 또는
   nginx -v    # Nginx 버전 확인
   ```

4. **Moodle 3.7** (이미 설치되어 있어야 함)

### PHP 확장 모듈 확인

다음 PHP 확장 모듈이 활성화되어 있어야 합니다:

```bash
php -m | grep -E 'pdo|pdo_mysql|json|curl|mbstring'
```

필요한 모듈:
- `pdo`
- `pdo_mysql`
- `json`
- `curl`
- `mbstring`

설치되지 않은 경우:

```bash
# Ubuntu/Debian
sudo apt-get install php7.1-mysql php7.1-curl php7.1-mbstring php7.1-json

# CentOS/RHEL
sudo yum install php71-mysqlnd php71-curl php71-mbstring php71-json
```

---

## Moodle 설정

### 1. Moodle 데이터베이스 정보 확인

Moodle 설정 파일에서 데이터베이스 정보를 확인합니다:

```bash
cat /path/to/moodle/config.php | grep -E 'dbhost|dbname|dbuser|dbpass'
```

출력 예시:
```php
$CFG->dbtype    = 'mysqli';
$CFG->dblibrary = 'native';
$CFG->dbhost    = 'localhost';
$CFG->dbname    = 'moodle';
$CFG->dbuser    = 'moodleuser';
$CFG->dbpass    = 'password123';
```

이 정보를 메모해 둡니다.

### 2. Moodle 테이블 접두사 확인

```bash
cat /path/to/moodle/config.php | grep prefix
```

출력 예시:
```php
$CFG->prefix    = 'mdl_';
```

기본값은 `mdl_`이지만, 다를 수 있습니다.

### 3. 웹 서비스 활성화 (선택사항)

Moodle 웹 서비스를 사용하려면:

1. Moodle 관리자로 로그인
2. **사이트 관리 > 플러그인 > 웹 서비스 > 개요**로 이동
3. 다음 단계를 완료:
   - 웹 서비스 활성화
   - 프로토콜 활성화 (REST)
   - 서비스 생성
   - 토큰 생성

생성된 토큰을 메모합니다.

---

## 데이터베이스 구성

### 1. 읽기 전용 사용자 생성 (권장)

보안을 위해 읽기 전용 데이터베이스 사용자를 생성합니다:

```sql
-- MySQL에 로그인
mysql -u root -p

-- 사용자 생성
CREATE USER 'scaling_stream'@'localhost' IDENTIFIED BY 'secure_password_here';

-- Moodle 데이터베이스에 대한 SELECT 권한만 부여
GRANT SELECT ON moodle.* TO 'scaling_stream'@'localhost';

-- 권한 적용
FLUSH PRIVILEGES;

-- 종료
EXIT;
```

### 2. 연결 테스트

```bash
mysql -u scaling_stream -p -h localhost moodle
```

성공하면 MySQL 프롬프트가 나타납니다.

### 3. 필요한 테이블 확인

```sql
-- MySQL에서 실행
USE moodle;

SHOW TABLES LIKE 'mdl_question%';
SHOW TABLES LIKE 'mdl_quiz%';
SHOW TABLES LIKE 'mdl_course%';
```

다음 테이블이 존재해야 합니다:
- `mdl_question`
- `mdl_question_categories`
- `mdl_question_answers`
- `mdl_quiz`
- `mdl_quiz_attempts`
- `mdl_course`

---

## 웹 서버 설정

### Apache 설정

#### 1. 가상 호스트 구성 (선택사항)

`/etc/apache2/sites-available/scaling-stream.conf`:

```apache
<VirtualHost *:80>
    ServerName scaling-stream.example.com
    DocumentRoot /var/www/html/scaling-stream

    <Directory /var/www/html/scaling-stream>
        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>

    ErrorLog ${APACHE_LOG_DIR}/scaling-stream-error.log
    CustomLog ${APACHE_LOG_DIR}/scaling-stream-access.log combined
</VirtualHost>
```

활성화:
```bash
sudo a2ensite scaling-stream
sudo systemctl reload apache2
```

#### 2. .htaccess 생성 (선택사항)

`/var/www/html/scaling-stream/.htaccess`:

```apache
# 디렉토리 리스팅 비활성화
Options -Indexes

# 특정 파일 보호
<FilesMatch "^(config\.php|database\.php)$">
    Require all denied
</FilesMatch>

# PHP 오류 숨기기 (프로덕션)
php_flag display_errors Off
php_flag log_errors On
```

### Nginx 설정

#### 1. 서버 블록 구성

`/etc/nginx/sites-available/scaling-stream`:

```nginx
server {
    listen 80;
    server_name scaling-stream.example.com;
    root /usr/share/nginx/html/scaling-stream;
    index index.html index.php;

    location / {
        try_files $uri $uri/ =404;
    }

    location ~ \.php$ {
        include snippets/fastcgi-php.conf;
        fastcgi_pass unix:/var/run/php/php7.1-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
        include fastcgi_params;
    }

    location ~ /config/ {
        deny all;
        return 404;
    }

    location ~ /\.ht {
        deny all;
    }
}
```

활성화:
```bash
sudo ln -s /etc/nginx/sites-available/scaling-stream /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## 애플리케이션 설정

### 1. 파일 배포

```bash
# 저장소 클론 또는 파일 복사
cd /var/www/html/  # Apache
# 또는
cd /usr/share/nginx/html/  # Nginx

# Scaling Stream 파일 복사
cp -r /path/to/scaling-stream ./

# 권한 설정
sudo chown -R www-data:www-data scaling-stream  # Ubuntu/Debian
# 또는
sudo chown -R nginx:nginx scaling-stream        # Nginx
# 또는
sudo chown -R apache:apache scaling-stream      # CentOS/RHEL

chmod -R 755 scaling-stream
```

### 2. 데이터베이스 설정 파일 편집

`config/database.php`:

```php
<?php
class Database {
    private $host = 'localhost';              // MySQL 호스트
    private $db_name = 'moodle';             // Moodle 데이터베이스 이름
    private $username = 'scaling_stream';     // 생성한 사용자 이름
    private $password = 'secure_password';    // 사용자 비밀번호
    private $charset = 'utf8mb4';
    // ... 나머지 코드
}
?>
```

### 3. 전역 설정 파일 편집

`config/config.php`:

```php
<?php
// Moodle URL
define('MOODLE_URL', 'http://your-moodle-url.com');

// 웹 서비스 토큰 (선택사항)
define('MOODLE_TOKEN', 'your_token_here');

// 데이터베이스 설정
define('DB_HOST', 'localhost');
define('DB_NAME', 'moodle');
define('DB_USER', 'scaling_stream');
define('DB_PASS', 'secure_password');

// 프로덕션 환경에서는 오류 표시 비활성화
error_reporting(E_ALL);
ini_set('display_errors', 1);  // 개발: 1, 프로덕션: 0
?>
```

### 4. Moodle 테이블 접두사 확인

Moodle의 테이블 접두사가 `mdl_`이 아닌 경우, API 파일에서 모든 쿼리를 수정해야 합니다.

예: 접두사가 `m_`인 경우

`api/moodle_connector.php`에서:
```php
// 변경 전
FROM mdl_question q

// 변경 후
FROM m_question q
```

---

## 테스트 및 검증

### 1. API 헬스 체크

브라우저에서 다음 URL로 접속:

```
http://your-server/scaling-stream/api/endpoints.php?action=health_check
```

성공 응답:
```json
{
    "success": true,
    "app": "Scaling Stream",
    "version": "1.0.0",
    "timestamp": 1234567890,
    "status": "operational"
}
```

### 2. 문제 조회 테스트

```
http://your-server/scaling-stream/api/endpoints.php?action=get_questions&limit=5
```

성공 응답:
```json
{
    "success": true,
    "data": [
        {
            "id": "1",
            "name": "Question 1",
            "questiontext": "...",
            ...
        }
    ],
    "count": 5
}
```

### 3. 메인 애플리케이션 테스트

```
http://your-server/scaling-stream/
```

페이지가 로드되고 우측 하단에 스마트폰 UI가 표시되어야 합니다.

### 4. 기능 테스트

1. "문제 불러오기" 버튼 클릭
2. 스마트폰 화면에 문제가 표시되는지 확인
3. "스트리밍 시작" 버튼 클릭
4. 도형이 스케일링되는지 확인

### 5. 브라우저 콘솔 확인

F12를 눌러 개발자 도구를 열고 콘솔 탭에서 오류가 없는지 확인합니다.

---

## 고급 설정

### 1. CORS 설정 조정

다른 도메인에서 API를 호출해야 하는 경우, `config/config.php`:

```php
// 특정 도메인만 허용
header('Access-Control-Allow-Origin: https://allowed-domain.com');

// 또는 모든 도메인 허용 (개발 환경만)
header('Access-Control-Allow-Origin: *');
```

### 2. 캐싱 설정

API 응답을 더 오래 캐싱하려면, `assets/js/api-client.js`:

```javascript
this.cacheExpiry = 10 * 60 * 1000; // 10분으로 변경
```

### 3. 스케일링 범위 조정

`config/config.php`:

```php
define('MAX_SCALE_FACTOR', 20);   // 최대 20배로 증가
define('MIN_SCALE_FACTOR', 0.05); // 최소 0.05배로 감소
```

### 4. 애니메이션 속도 조정

`assets/js/scaling-stream.js`:

```javascript
// 스트림 간격을 50ms에서 100ms로 변경 (더 느리게)
this.streamInterval = setInterval(() => {
    if (!this.isPaused) {
        this.animateScale();
    }
}, 100);  // 50 -> 100
```

### 5. 로깅 활성화

PHP 오류 로그 확인:

```bash
# Ubuntu/Debian
tail -f /var/log/apache2/error.log

# CentOS/RHEL
tail -f /var/log/httpd/error_log
```

JavaScript 콘솔 로그는 브라우저 개발자 도구에서 확인할 수 있습니다.

### 6. 성능 최적화

#### PHP OPcache 활성화

`/etc/php/7.1/apache2/php.ini`:

```ini
opcache.enable=1
opcache.memory_consumption=128
opcache.max_accelerated_files=4000
opcache.revalidate_freq=60
```

#### MySQL 쿼리 최적화

자주 사용되는 필드에 인덱스 추가:

```sql
-- 이미 존재할 수 있음
CREATE INDEX idx_question_parent ON mdl_question(parent);
CREATE INDEX idx_question_category ON mdl_question(category);
```

---

## 문제 해결 체크리스트

### API가 작동하지 않음

- [ ] PHP가 올바르게 설치되었는가?
- [ ] MySQL 서비스가 실행 중인가?
- [ ] 데이터베이스 연결 정보가 정확한가?
- [ ] 웹 서버가 실행 중인가?
- [ ] 파일 권한이 올바른가?
- [ ] PHP 오류 로그를 확인했는가?

### 문제가 로드되지 않음

- [ ] Moodle 데이터베이스에 문제가 있는가?
- [ ] 테이블 접두사가 올바른가?
- [ ] API 엔드포인트가 정상 작동하는가?
- [ ] 브라우저 콘솔에 오류가 있는가?
- [ ] CORS 오류가 발생하는가?

### 스마트폰 UI가 표시되지 않음

- [ ] CSS 파일이 로드되었는가?
- [ ] JavaScript 파일이 로드되었는가?
- [ ] 브라우저가 최신 버전인가?
- [ ] 브라우저 캐시를 삭제했는가?

---

## 프로덕션 배포 체크리스트

배포 전 확인사항:

- [ ] 오류 표시 비활성화 (`display_errors = 0`)
- [ ] 읽기 전용 데이터베이스 사용자 사용
- [ ] HTTPS 설정 (SSL/TLS)
- [ ] 방화벽 규칙 설정
- [ ] 백업 계획 수립
- [ ] 모니터링 설정
- [ ] 로그 로테이션 설정

---

## 지원 및 문의

문제가 계속되면:

1. PHP 오류 로그 확인
2. MySQL 로그 확인
3. 브라우저 개발자 도구 콘솔 확인
4. 이슈 트래커에 문의

---

**설정 완료!** Scaling Stream을 즐기세요! 🎉
